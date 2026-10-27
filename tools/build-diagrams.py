#!/usr/bin/env python3
"""Compile solution diagrams. Each diagrams/src/<ID>.tex holds one tikzpicture (tkz-euclide).
Writes diagrams/<ID>.pdf (for the PDF solutions) and diagrams/<ID>.svg (for the website).

    python tools/build-diagrams.py                 every diagram
    python tools/build-diagrams.py EB1-19 K1-9     just these
    python tools/build-diagrams.py --src DIR --out DIR [IDs]   other folders (used while drafting)
    add --png to also write a PNG preview next to each SVG
"""
import os, sys, subprocess, tempfile, shutil

PRE = r"""\documentclass[border=6pt]{standalone}
\usepackage{amsmath,amssymb}
\usepackage{tkz-euclide}
\usetikzlibrary{arrows.meta,calc,patterns,decorations.pathreplacing,angles,quotes}
\tikzset{every picture/.style={line cap=round,line join=round,font=\small},
  key/.style={draw=blue!55!black,line width=0.9pt},
  aux/.style={draw=black!45,dashed,line width=0.6pt},
  fillkey/.style={fill=blue!12},
  fillalt/.style={fill=orange!18}}
\begin{document}
"""
POST = "\n\\end{document}\n"

def build(src_dir, out_dir, ids, png):
    os.makedirs(out_dir, exist_ok=True); bad = []
    for i in ids:
        body = open(os.path.join(src_dir, i + '.tex'), encoding='utf-8').read()
        tmp = tempfile.mkdtemp()
        try:
            open(os.path.join(tmp, 'd.tex'), 'w', encoding='utf-8').write(PRE + body + POST)
            r = subprocess.run(['pdflatex', '-interaction=nonstopmode', '-halt-on-error', 'd.tex'], cwd=tmp, capture_output=True, text=True)
            if r.returncode != 0:
                bad.append(i); print(i + ': FAILED\n' + '\n'.join(l for l in r.stdout.splitlines() if l.startswith('!') or 'error' in l.lower())[:800]); continue
            shutil.copy(os.path.join(tmp, 'd.pdf'), os.path.join(out_dir, i + '.pdf'))
            subprocess.run(['pdftocairo', '-svg', os.path.join(tmp, 'd.pdf'), os.path.join(out_dir, i + '.svg')], check=True)
            if png: subprocess.run(['pdftocairo', '-png', '-r', '150', '-singlefile', os.path.join(tmp, 'd.pdf'), os.path.join(out_dir, i)], check=True)
            print(i + ': ok')
        finally: shutil.rmtree(tmp, ignore_errors=True)
    return bad

if __name__ == '__main__':
    a = sys.argv[1:]; root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src = os.path.join(root, 'diagrams', 'src'); out = os.path.join(root, 'diagrams'); png = '--png' in a
    if '--src' in a: src = a[a.index('--src') + 1]
    if '--out' in a: out = a[a.index('--out') + 1]
    skip = {x for k in ('--src', '--out') if k in a for x in (k, a[a.index(k) + 1])} | {'--png'}
    ids = [x for x in a if x not in skip] or sorted(f[:-4] for f in os.listdir(src) if f.endswith('.tex'))
    bad = build(src, out, ids, png)
    print('\n%d built, %d failed' % (len(ids) - len(bad), len(bad))); sys.exit(1 if bad else 0)

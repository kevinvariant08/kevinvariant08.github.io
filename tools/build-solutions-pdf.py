#!/usr/bin/env python3
"""Build a worked-solutions PDF for one paper from the site's question data, with tkz-euclide diagrams.

    python tools/build-solutions-pdf.py ESAT EA1          ESAT Set A Mathematics 1, from esat-questions.js
    python tools/build-solutions-pdf.py ESAT ECP          ESAT Set C Physics
    python tools/build-solutions-pdf.py TMUA B1           TMUA Set B Paper 1, from questions.js
    python tools/build-solutions-pdf.py TMUA K1 --json questions.json --out K1_solutions.pdf
                                                           any paper from a JSON list of questions
    python tools/build-solutions-pdf.py TMUA B1 --paper    the question paper instead of the solutions

Both use the Kevinvariant handout format in tools/kvformat/kevinvariant.sty.

Diagrams: a solution containing <figure class="sol-fig"> for question <ID> gets diagrams/<ID>.pdf
(or the PDF in --figs DIR). The output is watermarked afterwards with tools/watermark-pdfs.py.
"""
import html, json, os, re, shutil, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def load(kind, paper, path=None):
    if path: qs = json.load(open(path, encoding='utf-8'))
    else:
        f, pat = (('esat-questions.js', r'window\.HU_ESAT=(\[.*\]);') if kind == 'ESAT' else ('questions.js', r'window\.HU_QUESTIONS=(\[.*?\]);'))
        qs = json.loads(re.search(pat, open(os.path.join(ROOT, f), encoding='utf-8').read(), re.S).group(1))
    qs = sorted([q for q in qs if q['paper'] == paper], key=lambda q: q['n'])
    if not qs: sys.exit('No questions for paper ' + paper)
    return qs

def tex(s, figs):
    def figure(m):
        i = re.search(r'data-id="([A-Za-z0-9\-]+)"|diagrams/([A-Za-z0-9\-]+)\.svg', m.group(0))   # data-id: locked papers embed the SVG
        if not i: return ''
        p = os.path.abspath(os.path.join(figs, (i.group(1) or i.group(2)) + '.pdf'))
        return ('\n\n\\begin{center}\\includegraphics[max width=0.8\\linewidth,max height=8.5cm]{%s}\\end{center}\n\n' % p) if os.path.exists(p) else ''
    s = re.sub(r'<figure class="sol-fig"[^>]*>.*?</figure>', figure, s, flags=re.S)
    s = s.replace('\\"', '"')
    s = re.sub(r'<ol class="stmts" type="I">', r'\\begin{enumerate}[label=\\Roman*.,leftmargin=2.2em,itemsep=2pt,topsep=4pt]', s)
    s = re.sub(r'<ol[^>]*>', r'\\begin{enumerate}[itemsep=2pt,topsep=4pt]', s)
    s = s.replace('</ol>', r'\end{enumerate}').replace('<li>', r'\item ').replace('</li>', '')
    s = re.sub(r'<div class="c">(.*?)</div>', r'\n\n\\begin{center}\1\\end{center}\n\n', s, flags=re.S)
    s = re.sub(r'<span class="blank">.*?</span>', r'\\rule{2.5cm}{0.4pt}', s, flags=re.S)
    s = re.sub(r'<(em)>(.*?)</\1>', r'\\emph{\2}', s, flags=re.S)
    s = re.sub(r'<(strong|b)>(.*?)</\1>', r'\\textbf{\2}', s, flags=re.S)
    s = re.sub(r'<br\s*/?>', r'\\\\ ', s)
    s = re.sub(r'</?p>', '\n\n', s)
    s = re.sub(r'</?(div|span)[^>]*>', '', s)
    s = html.unescape(s)
    s = s.replace('\u2019', "'").replace('\u2018', '`').replace('\u201c', '``').replace('\u201d', "''").replace('\u2003', r'\quad ').replace('\u00a0', '~')
    s = re.sub(r'(?<!\\)%', r'\\%', s)
    s = re.sub(r'_{4,}', r'\\rule{2.5cm}{0.4pt}', s)
    s = re.sub(r'(\n\s*){3,}', '\n\n', s)
    s = re.sub(r'^\s*\\\\\s*', '', s, flags=re.M)        # a line break at the start of a paragraph is an error in LaTeX
    return s.strip()

STY = os.path.join(ROOT, 'tools', 'kvformat')
META = json.load(open(os.path.join(STY, 'mock-meta.json'), encoding='utf-8'))
PRE = r"""\documentclass[11pt,a4paper]{article}
\usepackage{kevinvariant}
\usepackage{colortbl}\arrayrulecolor{kvgrey}
\kvset{%(series)s}{%(head)s}{}
\begin{document}
"""

def grid(ans, n=None):
    n = n or len(ans); rows = []
    for start in range(1, n + 1, 10):
        cells = list(range(start, start + 10))
        qs = ' & '.join(str(i) if i <= n else '' for i in cells)
        an = ' & '.join((ans[i - 1] if ans else '') if i <= n else '' for i in cells)
        rows.append('\\begin{tabular}{|>{\\sffamily\\bfseries\\small\\color{kvink}}c|*{10}{>{\\centering\\arraybackslash}p{0.85cm}|}}\\hline\n'
                    '\\rowcolor{kvintrobg}Q & ' + ''.join('\\sffamily\\small ' + c + ' & ' for c in qs.split(' & '))[:-3] + ' \\\\ \\hline\n'
                    'Ans & ' + an + ' \\\\ \\hline\n\\end{tabular}')
    return '\\begin{center}\\renewcommand{\\arraystretch}{1.55}\n' + '\\\\[6pt]\n'.join(rows) + '\\end{center}\n'

def names(kind, paper):
    s, n = paper[-2], paper[-1]
    if kind == 'ESAT':
        mod = {'P': 'Physics', 'C': 'Chemistry', 'B': 'Biology'}.get(n, 'Mathematics ' + n)
        return 'ESAT Mock Set %s' % s, mod, 'Engineering and Science Admissions Test', 'ESAT Mocks'
    return 'TMUA Mock Set %s' % s, 'Paper ' + n, 'TMUA $\\cdot$ ' + (
        'Applications of Mathematical Knowledge' if n == '1' else 'Mathematical Reasoning'), 'TMUA Mocks'

def plain(t):
    return re.sub(r'\\[a-zA-Z]+|[{}$^_\\]', '', t)

def options(opts, figs):
    o = [tex(x, figs) for x in opts]; L = 'ABCDEFGHIJ'
    w = max(len(plain(x)) for x in o)
    cols = 3 if w <= 24 and len(o) % 2 == 0 or w <= 24 and len(o) > 4 else 2 if w <= 48 else 1
    cell = lambda k: '{\\sffamily\\bfseries\\color{kvgreen}%s}\\enspace %s' % (L[k], o[k])
    if cols == 1:
        return '\\begin{enumerate}[label={\\sffamily\\bfseries\\color{kvgreen}\\Alph*},leftmargin=2em,itemsep=3pt,topsep=4pt]\n' + ''.join('\\item ' + x + '\n' for x in o) + '\\end{enumerate}\n'
    rows = [' & '.join(cell(k) if k < len(o) else '' for k in range(r, r + cols)) for r in range(0, len(o), cols)]
    return '\\par\\smallskip\\noindent\\begin{tabularx}{\\linewidth}{@{}' + 'X' * cols + '@{}}\n' + ' \\\\[5pt]\n'.join(rows) + '\n\\end{tabularx}\\par\n'

def compile_tex(body, out, paper):
    tmp = tempfile.mkdtemp()
    try:
        shutil.copy(os.path.join(STY, 'kevinvariant.sty'), tmp)
        shutil.copy(os.path.join(ROOT, 'apple-touch-icon.png'), os.path.join(tmp, 'kv-logo.png'))
        open(os.path.join(tmp, 's.tex'), 'w', encoding='utf-8').write(body)
        for _ in range(2):
            r = subprocess.run(['pdflatex', '-interaction=nonstopmode', '-halt-on-error', 's.tex'], cwd=tmp, capture_output=True, text=True, timeout=300)
        if r.returncode != 0:
            print('\n'.join(l for l in r.stdout.splitlines()[-40:])); sys.exit('LaTeX failed for ' + paper)
        shutil.copy(os.path.join(tmp, 's.pdf'), out)
        if os.environ.get('KV_KEEP_TEX'): shutil.copy(os.path.join(tmp, 's.tex'), out[:-4] + '.tex')
    finally: shutil.rmtree(tmp, ignore_errors=True)

def build(kind, paper, out, figs, path=None, date=None):
    qs = load(kind, paper, path); title, part, test, series = names(kind, paper)
    m = META.get(paper, {}); date = date or m.get('date', '')
    body = PRE % {'series': series, 'head': title + ' $\\cdot$ ' + part + ' $\\cdot$ Solutions'}
    body += '\\kvtitle{KEVINVARIANT}{%s, %s}{Worked solutions}{%s}{%s}\n' % (title, part, test, date)
    body += '\\begin{kvintro}\\kvminihead{Answer key}\\vspace{-4pt}' + grid([q['ans'] for q in qs])
    body += 'Each solution gives an intended route and names the trap the question was built around. Diagrams show the configuration each solution works with.\\end{kvintro}\n'
    for q in qs:
        body += '\\par\\needspace{4\\baselineskip}\\bigskip\\noindent\\kvq{%d}\\ \\ {\\sffamily\\small\\color{kvgrey}Answer} {\\sffamily\\bfseries %s}\\par\n%s\n' % (q['n'], q['ans'], tex(q['sol'], figs))
    body += '\\end{document}\n'
    compile_tex(body, out, paper)
    print('%s: %s (%d questions, %d diagrams)' % (paper, out, len(qs), sum('sol-fig' in q['sol'] for q in qs)))

def build_paper(kind, paper, out, figs, path=None, date=None):
    qs = load(kind, paper, path); title, part, test, series = names(kind, paper)
    m = META.get(paper, {}); date = date or m.get('date', ''); n = len(qs)
    mins = 75 if kind == 'TMUA' else 40
    body = PRE % {'series': series, 'head': title + ' $\\cdot$ ' + part}
    body += '\\kvtitle{KEVINVARIANT}{%s, %s}{Question paper}{%s}{%s}\n' % (title, part, test, date)
    body += ('\\begin{kvintro}\\normalsize\\begin{tabular}{@{}>{\\sffamily\\small\\color{kvgrey}}l@{\\quad}l@{\\qquad\\qquad}>{\\sffamily\\small\\color{kvgrey}}l@{\\quad}l@{}}'
             'Time allowed & %d minutes & Name & \\rule{4.2cm}{0.4pt}\\\\[6pt]Questions & %d multiple choice & Date sat & \\rule{4.2cm}{0.4pt}\\\\[6pt]'
             'Calculators & not permitted & Score & \\rule{1.6cm}{0.4pt}\\ / %d\\end{tabular}\\end{kvintro}\n') % (mins, n, n)
    body += '\\kvminihead{Instructions}\n' + m.get('instr', '') + '\n' + grid(None, n) + '\n\\newpage\n'
    for q in qs:
        body += '\\par\\needspace{7\\baselineskip}\\bigskip\\noindent\\kvq{%d}\\ \\ %s\n%s' % (q['n'], tex(q['q'], figs), options(q['opts'], figs))
    body += '\\vfill\\begin{center}{\\sffamily\\small\\color{kvgrey}End of paper. Solutions are in the matching Worked solutions PDF.}\\end{center}\n\\end{document}\n'
    compile_tex(body, out, paper)
    print('%s: %s (%d questions)' % (paper, out, n))

if __name__ == '__main__':
    a = sys.argv[1:]
    if len(a) < 2: sys.exit(__doc__)
    kind, paper = a[0].upper(), a[1]
    opt = lambda k, d=None: a[a.index(k) + 1] if k in a else d
    default = ('HU_Collection_ESAT_Set%s_Maths%s_Solutions.pdf' if kind == 'ESAT' else 'HU_Collection_TMUA_Set%s_Paper%s_Solutions.pdf') % (paper[-2], paper[-1])
    if kind == 'ESAT' and paper[-1] in 'PCB': default = 'HU_Collection_ESAT_Set%s_%s_Solutions.pdf' % (paper[-2], {'P': 'Physics', 'C': 'Chemistry', 'B': 'Biology'}[paper[-1]])
    if '--paper' in a: default = default.replace('_Solutions', '')
    (build_paper if '--paper' in a else build)(kind, paper, opt('--out', os.path.join(ROOT, default)), opt('--figs', os.path.join(ROOT, 'diagrams')), opt('--json'), opt('--date'))

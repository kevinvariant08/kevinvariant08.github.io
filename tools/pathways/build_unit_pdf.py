#!/usr/bin/env python3
"""Build the PDF handout for a Pathways unit straight from units/<ID>.json.

Usage (from the repo folder):
    python3 tools/pathways/build_unit_pdf.py L5-AL3 [L5-AL2 ...]
    python3 tools/pathways/build_unit_pdf.py --all

Writes units/<ID>.pdf (watermarked, like every other unit PDF). Needs pdflatex with mathpazo,
helvet, tcolorbox, titlesec, enumitem, plus rsvg-convert for unit diagrams, and pypdf + reportlab
for the watermark. The JSON is the source of truth, so editing a unit means editing its JSON
(or its source in tools/pathways/src/) and running this script.
"""
import html as htmllib, json, os, re, shutil, subprocess, sys, tempfile, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.dirname(HERE))


def path_data():
    s = open(os.path.join(ROOT, 'pathways-data.js'), encoding='utf-8').read()
    return json.loads(s[s.index('=') + 1:s.rstrip().rindex(';')])


# ---------- HTML (as stored in the unit JSON) to LaTeX ----------
MATH = re.compile(r'\\\[.*?\\\]|\$[^$]+\$', re.S)
TOK = re.compile(r'<[^>]+>|[^<]+', re.S)
SPECIAL = {'\\': r'\textbackslash{}', '&': r'\&', '%': r'\%', '#': r'\#', '_': r'\_', '{': r'\{', '}': r'\}',
           '~': r'\textasciitilde{}', '^': r'\textasciicircum{}'}


def text_tex(s):
    s = htmllib.unescape(s)
    s = ''.join(SPECIAL.get(ch, ch) for ch in s)
    s = re.sub(r'"([^"]*)"', r"``\1''", s)
    return s.replace('\u2019', "'").replace('\u2018', '`')


def math_tex(m):
    return htmllib.unescape(m).replace('\u2212', '-')


def html_tex(h, figdir=None):
    out, pos = [], 0
    parts = []
    for m in MATH.finditer(h):
        parts.append(('h', h[pos:m.start()])); parts.append(('m', m.group(0))); pos = m.end()
    parts.append(('h', h[pos:]))
    stack = []
    for kind, s in parts:
        if kind == 'm':
            out.append(math_tex(s)); continue
        for t in TOK.findall(s):
            if not t.startswith('<'):
                out.append(text_tex(t) if t.strip() else (' ' if t else '')); continue
            tag = re.match(r'</?(\w+)', t).group(1).lower(); close = t.startswith('</')
            cls = (re.search(r'class="([^"]*)"', t) or [None, ''])[1]
            if tag == 'p':
                out.append('\n\n' if not close else '\n\n')
            elif tag == 'strong': out.append('}' if close else r'\textbf{')
            elif tag == 'em': out.append('}' if close else r'\emph{')
            elif tag == 'h3': out.append('}\n' if close else '\n\\subsection{')
            elif tag == 'br': out.append('\\\\\n')
            elif tag in ('ul', 'ol'):
                env = 'itemize' if tag == 'ul' else 'enumerate'
                out.append('\n\\end{%s}\n' % env if close else '\n\\begin{%s}\n' % env)
            elif tag == 'li': out.append('' if close else '\\item ')
            elif tag == 'div':
                if close:
                    out.append('\n\\end{%s}\n' % stack.pop() if stack and stack[-1] else '\n'); stack and not stack[-1] and stack.pop()
                else:
                    env = {'key': 'keybox', 'eg': 'egbox', 'warn': 'warnbox'}.get(cls)
                    if cls == 'egs':
                        out.append('\n\n\\emph{Solution.}\n\n'); stack.append(None)
                    else:
                        stack.append(env); out.append('\n\\begin{%s}\n' % env if env else '\n')
            elif tag == 'img' and figdir:
                src = re.search(r'src="([^"?]+)', t).group(1)
                svg = os.path.join(ROOT, src); pdf = os.path.join(figdir, os.path.basename(src)[:-4] + '.pdf')
                subprocess.run(['rsvg-convert', '-f', 'pdf', '-o', pdf, svg], check=True)
                out.append('\\begin{center}\\includegraphics[width=0.55\\linewidth]{%s}\\end{center}\n' % pdf)
            # figure, span and anything else: drop the tag, keep the content
    tex = ''.join(out)
    return re.sub(r'\n{3,}', '\n\n', tex)


def stars(n):
    return r'{\color{kvstar}\,' + r'$\star$' * n + '}'


PRE = r'''\documentclass[10.5pt,a4paper]{article}
\usepackage[a4paper,margin=2.1cm,top=2.3cm,bottom=2.4cm,headsep=0.7cm]{geometry}
\usepackage[T1]{fontenc}
\usepackage{mathpazo}
\usepackage[scaled=0.92]{helvet}
\usepackage{amsmath,amssymb,graphicx,xcolor}
\usepackage[most]{tcolorbox}
\usepackage{titlesec,fancyhdr,enumitem,lastpage,microtype}
\usepackage[hidelinks]{hyperref}
\definecolor{kvink}{HTML}{1B1E33}\definecolor{kvgreen}{HTML}{2A7A54}\definecolor{kvgrey}{HTML}{6B7084}
\definecolor{kvstar}{HTML}{3F49B0}\definecolor{kvlink}{HTML}{2F3FA8}
\definecolor{c7C82C8}{HTML}{7C82C8}\definecolor{cB4D0C3}{HTML}{B4D0C3}\definecolor{cB8BCE0}{HTML}{B8BCE0}\definecolor{cC9677F}{HTML}{C9677F}\definecolor{cDDDEE5}{HTML}{DDDEE5}\definecolor{cE8B7C4}{HTML}{E8B7C4}\definecolor{cF2F7F5}{HTML}{F2F7F5}\definecolor{cF7F7FC}{HTML}{F7F7FC}\definecolor{cF8F8F9}{HTML}{F8F8F9}\definecolor{cFCF6F8}{HTML}{FCF6F8}
\linespread{1.05}\setlength{\parindent}{0pt}\setlength{\parskip}{0.55em}
\setlist{itemsep=0.25em,topsep=0.3em}
\newtcolorbox{keybox}{enhanced,breakable,colback=cF2F7F5,colframe=cB4D0C3,boxrule=0.4pt,leftrule=2.6pt,arc=0pt,
  left=8pt,right=8pt,top=5pt,bottom=5pt,before skip=0.9em,after skip=0.9em,borderline west={2.6pt}{0pt}{kvgreen}}
\newtcolorbox{egbox}{enhanced,breakable,colback=cF7F7FC,colframe=cB8BCE0,boxrule=0.4pt,leftrule=2.6pt,arc=0pt,
  left=8pt,right=8pt,top=5pt,bottom=5pt,before skip=0.9em,after skip=0.9em,borderline west={2.6pt}{0pt}c7C82C8}
\newtcolorbox{warnbox}{enhanced,breakable,colback=cFCF6F8,colframe=cE8B7C4,boxrule=0.4pt,leftrule=2.6pt,arc=0pt,
  left=8pt,right=8pt,top=5pt,bottom=5pt,before skip=0.9em,after skip=0.9em,borderline west={2.6pt}{0pt}cC9677F}
\newtcolorbox{sumbox}{enhanced,colback=cF8F8F9,colframe=cDDDEE5,boxrule=0.4pt,arc=0pt,left=10pt,right=10pt,top=7pt,bottom=7pt}
\titleformat{\section}{\sffamily\large\bfseries\color{kvink}}{\colorbox{kvgreen}{\makebox[1.1em]{\color{white}\thesection}}}{0.6em}{}[\vspace{1pt}{\color{kvgreen}\titlerule[0.6pt]}]
\titleformat{\subsection}{\sffamily\normalsize\bfseries\color{kvink}}{\color{kvgreen}\thesubsection}{0.6em}{}
\titlespacing*{\section}{0pt}{1.6em}{0.8em}\titlespacing*{\subsection}{0pt}{1.2em}{0.4em}
\pagestyle{fancy}\fancyhf{}
\renewcommand{\headrulewidth}{0.5pt}\renewcommand{\headrule}{{\color{kvink}\hrule height 0.5pt}}
\fancyhead[L]{\small\sffamily{\color{kvgreen}\textbf{HU Collection}}\color{kvgrey}\ $\cdot$ Kevinvariant Pathways}
\fancyhead[R]{\small\sffamily\color{kvgrey}<<LEVEL>> $\cdot$ <<STRAND>>}
\fancyfoot[L]{\scriptsize\sffamily\color{kvgrey}<<ID>> $\cdot$ \copyright\ <<YEAR>> Kevin Hu $\cdot$ kevinvariant08.github.io $\cdot$ CC BY-NC-ND 4.0}
\fancyfoot[R]{\scriptsize\sffamily\color{kvgrey}\thepage\,/\,\pageref{LastPage}}
\fancypagestyle{first}{\fancyhf{}\renewcommand{\headrulewidth}{0pt}\renewcommand{\headrule}{}
\fancyfoot[L]{\scriptsize\sffamily\color{kvgrey}\copyright\ <<YEAR>> Kevin Hu $\cdot$ kevinvariant08.github.io $\cdot$ CC BY-NC-ND 4.0}
\fancyfoot[R]{\scriptsize\sffamily\color{kvgrey}\thepage\,/\,\pageref{LastPage}}}
\begin{document}
'''


def build(uid, out_dir=None):
    D = path_data()
    u = json.load(open(os.path.join(ROOT, 'units', uid + '.json'), encoding='utf-8'))
    level = next(L for L in D['levels'] if L['n'] == u['level'])
    titles = {x['id']: x['title'] for L in D['levels'] for x in L['units']}
    extra = any(x['id'] == uid and x.get('extra') for x in level['units'])
    strand = D['strands'][u['strand']]
    now = datetime.date.today()
    tmp = tempfile.mkdtemp()
    pre = (PRE.replace('<<LEVEL>>', 'Level %d %s' % (u['level'], level['name'])).replace('<<STRAND>>', strand)
           .replace('<<ID>>', uid).replace('<<YEAR>>', str(now.year)))
    outc = '; '.join(o[0].lower() + o[1:] for o in u['outcomes'])
    pre_names = ', '.join('%s (%s)' % (titles.get(p, p), p) for p in u['prereqs']) or 'none'
    chip = 'Level %d %s $\\cdot$ %s' % (u['level'], level['name'], strand) + (' $\\cdot$ Beyond the textbook' if extra else '')
    logo = os.path.join(ROOT, 'apple-touch-icon.png')
    t = [pre, r'\thispagestyle{first}',
         r'\noindent\begin{minipage}[t]{0.7\linewidth}\vspace{0pt}{\scriptsize\sffamily\color{kvgreen}\textbf{HU COLLECTION}\color{kvgrey}\ $\cdot$ KEVINVARIANT PATHWAYS}\\[12pt]'
         r'{\raggedright\sffamily\fontsize{20}{25}\selectfont\bfseries\color{kvink} %s\par}\vspace{6pt}'
         r'{\scriptsize\sffamily\colorbox{kvink}{\color{white}\,%s\,}\ \ \color{kvgrey}%s}\end{minipage}\hfill'
         r'\begin{minipage}[t]{0.25\linewidth}\vspace{0pt}\raggedleft\includegraphics[width=1.25cm]{%s}\\[5pt]{\small Kevin Hu}\\{\small\color{kvgrey}%s}\end{minipage}\par\vspace{14pt}'
         % (text_tex(u['title']), uid, chip, logo, now.strftime('%B %Y')),
         r'\begin{sumbox}\small %s\par\textbf{By the end you can} %s.\par\textbf{Prerequisites:} %s.\quad \textbf{Contests:} %s.\quad \textbf{Time:} about %d minutes.\end{sumbox}'
         % (text_tex(u['blurb']), html_tex(outc), text_tex(pre_names), text_tex(', '.join(u['contests'])), u['minutes']),
         r'\section{Lesson}', html_tex(u['lesson'], tmp),
         r'\section{Practice problems}',
         r'The problems are roughly in order of difficulty, from %s to %s. Hints are in Section 4 and full solutions in Section 5.'
         % (stars(min(p['stars'] for p in u['practice'])), stars(max(p['stars'] for p in u['practice'])))]
    for i, p in enumerate(u['practice'], 1):
        t.append(r'\par\medskip{\sffamily\bfseries Problem %d}%s\quad %s' % (i, stars(p['stars']), html_tex(p['q']).strip()))
    t += [r'\section{Contest ladder}',
          r'Real past problems on the ideas of this unit, easiest first. Each source is a link to the official paper or the AoPS wiki; the note under it says where to start, not how to finish.',
          r'\begin{enumerate}[itemsep=0.6em]']
    for l in u['ladder']:
        t.append(r'\item \href{%s}{\textbf{\color{kvlink}%s}}%s\\ {\small\itshape\color{kvgrey}%s}' % (l['url'].replace('%', r'\%').replace('#', r'\#'), text_tex(l['src']), stars(l['stars']), html_tex(l['note']).strip()))
    t += [r'\end{enumerate}', r'\section{Hints}', r'\begin{enumerate}[label=\textbf{\arabic*.}]']
    t += [r'\item ' + html_tex(p['hint']).strip() for p in u['practice']]
    t += [r'\end{enumerate}', r'\section{Solutions}']
    for i, p in enumerate(u['practice'], 1):
        t.append(r'\subsection*{Problem %d}{\itshape %s}' % (i, html_tex(p['q']).strip()))
        t.append(html_tex(p['sol'], tmp))
    t.append(r'\end{document}')
    tex = '\n'.join(t)
    f = os.path.join(tmp, uid + '.tex'); open(f, 'w', encoding='utf-8').write(tex)
    for _ in range(2):
        r = subprocess.run(['pdflatex', '-interaction=nonstopmode', '-halt-on-error', uid + '.tex'], cwd=tmp, capture_output=True, text=True)
    if r.returncode:
        log = open(os.path.join(tmp, uid + '.log'), encoding='latin-1').read()
        i = log.find('\n!'); raise SystemExit('LaTeX failed for %s:\n%s\n(tex kept at %s)' % (uid, log[i:i + 900], f))
    out = os.path.join(out_dir or os.path.join(ROOT, 'units'), uid + '.pdf')
    shutil.copy(os.path.join(tmp, uid + '.pdf'), out)
    import importlib.util
    spec = importlib.util.spec_from_file_location('wm', os.path.join(ROOT, 'tools', 'watermark-pdfs.py'))
    wm = importlib.util.module_from_spec(spec); spec.loader.exec_module(wm)
    wm.watermark(out) if hasattr(wm, 'watermark') else subprocess.run([sys.executable, os.path.join(ROOT, 'tools', 'watermark-pdfs.py'), out], check=True)
    print('%s: %s' % (uid, out)); return out, f


if __name__ == '__main__':
    ids = sys.argv[1:]
    if ids == ['--all']:
        ids = [x['id'] for L in path_data()['levels'] for x in L['units'] if x['status'] == 'ready']
    for uid in ids: build(uid)

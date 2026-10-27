#!/usr/bin/env python3
"""Put solution diagrams into the site's question data. For every diagrams/<ID>.svg, the solution of
question <ID> gets a figure at the top, in questions.js, drill.html and esat-questions.js.
Idempotent: a solution that already has its figure is left alone. Alt texts come from diagrams/alt.json.

    python tools/build-diagrams.py && python tools/add-diagrams.py
"""
import json, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.join(ROOT, 'diagrams')
ALT = json.load(open(os.path.join(D, 'alt.json'), encoding='utf-8')) if os.path.exists(os.path.join(D, 'alt.json')) else {}
HAVE = {f[:-4] for f in os.listdir(D) if f.endswith('.svg')}

def fig(i):
    a = ALT.get(i, {}).get('alt', 'Diagram for the solution').replace('"', '&quot;')
    return '<figure class="sol-fig"><img src="diagrams/%s.svg?v=1" alt="%s" loading="lazy"></figure>' % (i, a)

def patch(qs):
    n = 0
    for q in qs:
        i = q.get('id')
        if i in HAVE and 'class="sol-fig"' not in q.get('sol', ''):
            pre = ALT.get(i, {}).get('refers', '')
            q['sol'] = fig(i) + ('<p>%s</p>' % pre if pre else '') + q['sol']; n += 1
    return n

def rewrite(path, pattern):
    s = open(path, encoding='utf-8').read()
    m = re.search(pattern, s, re.S)
    qs = json.loads(m.group(2)); n = patch(qs)
    if n:
        body = json.dumps(qs, ensure_ascii=False).replace('</', '<\\/')
        s = s[:m.start(2)] + body + s[m.end(2):]
        open(path, 'w', encoding='utf-8').write(s)
    print('%s: %d solutions given a diagram' % (os.path.basename(path), n))

rewrite(os.path.join(ROOT, 'questions.js'), r'(window\.HU_QUESTIONS=)(\[.*?\])(;)')
rewrite(os.path.join(ROOT, 'drill.html'), r'(var QUESTIONS = )(\[.*?\])(;)')
rewrite(os.path.join(ROOT, 'esat-questions.js'), r'(window\.HU_ESAT=)(\[.*\])(;)')

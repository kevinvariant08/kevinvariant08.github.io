#!/usr/bin/env python3
"""Turn a unit source in tools/pathways/src/<ID>.py into units/<ID>.json, list the unit in
pathways-data.js (after the last unit of the same level and strand, or updating its entry), and
build the PDF.

Usage (from the repo folder):  python3 tools/pathways/make_unit.py L5-AL3 [--version 20261117a]
"""
import importlib.util, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
import build_unit_pdf


def words(html):
    return len(re.sub(r'<[^>]+>', ' ', html).split())


def main():
    uid = sys.argv[1]
    ver = sys.argv[sys.argv.index('--version') + 1] if '--version' in sys.argv else None
    spec = importlib.util.spec_from_file_location('src', os.path.join(HERE, 'src', uid + '.py'))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); U = m.UNIT
    pj = os.path.join(ROOT, 'pathways-data.js'); s = open(pj, encoding='utf-8').read()
    head = s[:s.index('=') + 1]; D = json.loads(s[s.index('=') + 1:s.rstrip().rindex(';')])
    ver = ver or D['version']
    out = dict(id=uid, level=U['level'], strand=U['strand'], title=U['title'], blurb=U['blurb'], minutes=U['minutes'],
               prereqs=U['prereqs'], outcomes=U['outcomes'], contests=U['contests'], lesson=U['lesson'],
               practice=[dict(stars=p['stars'], q=p['q'], hint=p['hint'], ans=p.get('ans'), sol=p['sol']) for p in U['practice']],
               ladder=U['ladder'], pdf='units/%s.pdf?v=%s' % (uid, ver))
    json.dump(out, open(os.path.join(ROOT, 'units', uid + '.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    L = next(l for l in D['levels'] if l['n'] == U['level'])
    entry = dict(id=uid, strand=U['strand'], title=U['title'], blurb=U['blurb'], minutes=U['minutes'], status='ready',
                 np=len(U['practice']), nl=len(U['ladder']), extra=bool(U.get('extra')))
    ids = [x['id'] for x in L['units']]
    if uid in ids:
        L['units'][ids.index(uid)] = entry
    else:
        same = [i for i, x in enumerate(L['units']) if x['strand'] == U['strand'] and bool(x.get('extra')) == entry['extra']]
        L['units'].insert((same[-1] + 1) if same else len(L['units']), entry)
    D['version'] = ver
    open(pj, 'w', encoding='utf-8').write(head + json.dumps(D, ensure_ascii=False) + ';\n')
    print('%s: lesson %d words, %d practice, %d ladder' % (uid, words(U['lesson']), len(U['practice']), len(U['ladder'])))
    build_unit_pdf.build(uid)


if __name__ == '__main__':
    main()

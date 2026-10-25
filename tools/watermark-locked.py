#!/usr/bin/env python3
"""Watermark locked papers in place, in the private Supabase bucket: download each paper.pdf and
solutions.pdf, add the Kevinvariant watermark (tools/watermark-pdfs.py), and upload it back.
Files that already carry the watermark are left alone, so it is safe to run again.

In PowerShell, from the repo folder:
    pip install pypdf reportlab
    $env:SUPABASE_SERVICE_KEY="your secret key"
    python tools/watermark-locked.py I1 I2 J1 J2 L1 L2
"""
import os, re, sys, socket, tempfile, time, urllib.request, urllib.error, importlib.util

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
spec = importlib.util.spec_from_file_location('wm', os.path.join(HERE, 'watermark-pdfs.py'))
wm = importlib.util.module_from_spec(spec); spec.loader.exec_module(wm)

# prefer IPv4: some home networks advertise IPv6 but cannot route it
_orig = socket.getaddrinfo
socket.getaddrinfo = lambda *a, **k: sorted(_orig(*a, **k), key=lambda r: r[0] != socket.AF_INET)

url = re.search(r'url:\s*"([^"]+)"', open(os.path.join(ROOT, 'auth-config.js'), encoding='utf-8').read()).group(1)
key = os.environ.get('SUPABASE_SERVICE_KEY', '').strip()
if not key: sys.exit('Set SUPABASE_SERVICE_KEY first. In PowerShell:  $env:SUPABASE_SERVICE_KEY="your-secret-key"')
papers = sys.argv[1:] or sys.exit('Name the papers, for example:  python tools/watermark-locked.py I1 I2 J1 J2')

def call(method, path, body=None, ctype=None):
    h = {'apikey': key}
    if key.startswith('eyJ'): h['Authorization'] = 'Bearer ' + key
    if ctype: h.update({'Content-Type': ctype, 'x-upsert': 'true', 'cache-control': 'max-age=300'})
    for attempt in range(1, 6):
        try:
            req = urllib.request.Request(url + '/storage/v1/object/' + path, data=body, headers=h, method=method)
            with urllib.request.urlopen(req, timeout=120) as r: return r.read()
        except urllib.error.HTTPError as e:
            if e.code < 500: raise RuntimeError('%s %s' % (e.code, e.read()[:200].decode('utf-8', 'replace')))
            err = 'HTTP %d' % e.code
        except Exception as e: err = str(e)
        if attempt < 5: print('  retrying %s (%s), attempt %d of 5' % (path, err, attempt + 1)); time.sleep(2 * attempt)
    raise RuntimeError(err)

bad = 0
for p in papers:
    for kind in ('paper', 'solutions'):
        path = 'locked/%s/%s.pdf' % (p, kind)
        try:
            data = call('GET', path)
            fd, tmp = tempfile.mkstemp(suffix='.pdf'); os.write(fd, data); os.close(fd)
            result = wm.watermark(tmp)
            if result.startswith('watermarked'):
                call('POST', path, open(tmp, 'rb').read(), 'application/pdf'); print('%s: %s and uploaded' % (path, result))
            else: print('%s: %s' % (path, result))
            os.remove(tmp)
        except Exception as e: bad += 1; print('FAILED %s: %s' % (path, e))
print('\nSome files failed; fix the error above and run again (it is safe to repeat).' if bad else '\nDone. Browsers may show the old copy for up to an hour while the storage cache expires.')

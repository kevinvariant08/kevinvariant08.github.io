"""Download the shared answers for calibration.

    KV_CALIBRATION_KEY=... python calibration/export.py attempts.json

Uses the site's public Supabase URL and key (from auth-config.js) plus the secret calibration key, which only the
export function accepts (see attempts.sql). Never commit the output: it holds the raw anonymous answers.
"""
import json, os, re, sys, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGE = 10000


def config():
    t = open(os.path.join(ROOT, 'auth-config.js'), encoding='utf-8').read()
    url = re.search(r'url:\s*"([^"]+)"', t).group(1).rstrip('/')
    key = re.search(r'anonKey:\s*"([^"]+)"', t).group(1)
    return url, key


def main():
    if len(sys.argv) != 2:
        sys.exit('usage: python calibration/export.py <output.json>')
    secret = os.environ.get('KV_CALIBRATION_KEY', '').strip()
    if not secret:
        sys.exit('Set KV_CALIBRATION_KEY first.')
    url, key = config()
    rows, after = [], 0
    while True:
        req = urllib.request.Request(url + '/rest/v1/rpc/hu_export_attempts', method='POST',
                                     data=json.dumps({'p_key': secret, 'p_after': after, 'p_limit': PAGE}).encode(),
                                     headers={'apikey': key, 'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=60) as r:
            page = json.load(r)
        if page is None:
            sys.exit('The calibration key was refused.')
        rows += page
        if len(page) < PAGE:
            break
        after = page[-1]['id']
    with open(sys.argv[1], 'w', encoding='utf-8') as f:
        json.dump(rows, f)
    print(f'{len(rows)} answers -> {sys.argv[1]}')


if __name__ == '__main__':
    main()

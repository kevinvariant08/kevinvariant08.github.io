#!/usr/bin/env python3
"""Watermark Kevinvariant PDFs: a faint trefoil knot in the middle of every page and a small
logo with the label "Kevinvariant" in the bottom-right corner.

Usage (from the repo folder):
    python tools/watermark-pdfs.py                 every PDF in the site's top folder
    python tools/watermark-pdfs.py paper.pdf ...   just these files

Already-watermarked files are skipped (they carry /KVWatermark in their metadata), so it is safe to
run again after adding new papers. Needs: pip install pypdf reportlab
"""
import io, os, sys, glob
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
KNOT = ImageReader(os.path.join(HERE, 'watermark', 'knot_wm.png'))
TILE = ImageReader(os.path.join(HERE, 'watermark', 'tile_small.png'))
LABEL = 'Kevinvariant'
SITE = 'kevinvariant08.github.io'
_cache = {}

def overlay(w, h):
    key = (round(w, 1), round(h, 1))
    if key in _cache: return _cache[key]
    buf = io.BytesIO(); c = canvas.Canvas(buf, pagesize=(w, h))
    kw = 0.46 * min(w, h); kh = kw * 880 / 920          # centred knot, about half the page width
    c.drawImage(KNOT, (w - kw) / 2, (h - kh) / 2, kw, kh, mask='auto')
    s = 11; m = 22                                     # footer: small tile and label, bottom right
    c.setFont('Helvetica-Bold', 7.5); tw = c.stringWidth(LABEL, 'Helvetica-Bold', 7.5)
    c.setFont('Helvetica', 6.5); sw = c.stringWidth(SITE, 'Helvetica', 6.5)
    x = w - m - max(tw, sw); y = 14
    c.drawImage(TILE, x - s - 4, y - 1, s, s, mask='auto')
    c.setFillColorRGB(0.11, 0.12, 0.2); c.setFont('Helvetica-Bold', 7.5); c.drawString(x, y + 4.2, LABEL)
    c.setFillColorRGB(0.42, 0.44, 0.52); c.setFont('Helvetica', 6.5); c.drawString(x, y - 2.8, SITE)
    c.showPage(); c.save()
    page = PdfReader(io.BytesIO(buf.getvalue())).pages[0]
    _cache[key] = page; return page

def watermark(path):
    r = PdfReader(path)
    meta = r.metadata or {}
    if meta.get('/KVWatermark'): return 'skipped (already watermarked)'
    wr = PdfWriter(clone_from=r)
    for p in wr.pages:
        box = p.mediabox; w, h = float(box.width), float(box.height)
        rot = (p.get('/Rotate') or 0) % 360
        if rot in (90, 270): p.transfer_rotation_to_content(); box = p.mediabox; w, h = float(box.width), float(box.height)
        ov = overlay(w, h)
        p.merge_translated_page(ov, float(box.left), float(box.bottom), over=True)
    for p in wr.pages: p.compress_content_streams()
    wr.compress_identical_objects(remove_identicals=True, remove_orphans=True)   # one copy of the logo, not one per page
    wr.add_metadata({**{k: v for k, v in meta.items() if isinstance(v, str)}, '/KVWatermark': 'trefoil-v1'})
    tmp = path + '.tmp'
    with open(tmp, 'wb') as f: wr.write(f)
    os.replace(tmp, path)
    return 'watermarked (%d pages)' % len(wr.pages)

if __name__ == '__main__':
    files = sys.argv[1:] or sorted(glob.glob(os.path.join(ROOT, '*.pdf')))
    for f in files:
        try: print(os.path.basename(f) + ': ' + watermark(f))
        except Exception as e: print(os.path.basename(f) + ': FAILED ' + str(e))

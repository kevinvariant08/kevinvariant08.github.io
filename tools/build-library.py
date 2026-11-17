#!/usr/bin/env python3
"""Build library.html: one searchable index of every mock paper, set of notes,
solution write-up and handout on the site.

The hub pages (tmua.html, esat.html, olympiad.html) stay the source of truth.
Re-run this after adding a paper or a handout to any of them:

    python3 tools/build-library.py
"""
import html, os, re
from bs4 import BeautifulSoup

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def soup(name):
    with open(os.path.join(ROOT, name), encoding="utf-8") as f:
        return BeautifulSoup(f.read(), "html.parser")


def text_of(tag):
    return re.sub(r"\s+", " ", tag.get_text(" ", strip=True)).lower()


def from_rows(page, section_id, exam, kind, src):
    """Copy the .row entries of one section of a hub page."""
    out = []
    sec = page.find("section", id=section_id)
    for row in sec.select(".rows > .row"):
        free = "1" if row.select_one(".chip.free") or not row.select_one(".chip.locked") else "0"
        if kind != "mock":
            free = "1"
        rid = row.get("id", "")
        attrs = f'data-exam="{exam}" data-type="{kind}" data-free="{free}" data-q="{html.escape(text_of(row))}"'
        inner = "".join(str(c) for c in row.contents)
        link = f'<a class="lib-src" href="{src}#{rid}">On the {exam_name(exam)} page</a>' if rid else ""
        out.append(f'<div class="row" {attrs}>{inner}{link}</div>')
    return out


def from_cards(page, section_id, exam):
    """Turn the topic-note cards into rows, keeping their groups."""
    groups = []
    sec = page.find("section", id=section_id)
    for label in sec.select("p.notes-grp"):
        box = label.find_next_sibling("div")
        rows = []
        for a in box.select("a.tool"):
            title = a.find("h3").get_text(strip=True)
            desc = a.find("p").decode_contents()
            q = html.escape(text_of(a) + " notes handout " + label.get_text(" ").lower())
            rows.append(
                f'<div class="row" data-exam="{exam}" data-type="notes" data-free="1" data-q="{q}">'
                f'<div><h3>{html.escape(title)}</h3><div class="chips"><span class="chip free">Free</span><span class="chip">Notes</span></div>'
                f'<p class="desc">{desc}</p></div>'
                f'<div class="files"><div class="grp"><a href="{a["href"]}" target="_blank" rel="noopener">Notes (PDF)</a></div></div></div>'
            )
        groups.append((label.get_text(strip=True), rows))
    return groups


def exam_name(e):
    return {"tmua": "TMUA", "esat": "ESAT", "olympiad": "Olympiad"}[e]


def block(sid, title, intro, rows, sub=None):
    body = ""
    if sub:
        for lab, rs in sub:
            body += f'<p class="lib-grp">{html.escape(lab)}</p><div class="rows">' + "\n".join(rs) + "</div>"
    else:
        body = '<div class="rows">' + "\n".join(rows) + "</div>"
    return (f'<section class="lib-sec" id="{sid}" aria-labelledby="{sid}-h">\n'
            f'<h2 id="{sid}-h">{title}</h2>\n<p class="sub-intro">{intro}</p>\n{body}\n</section>\n')


tm, es, ol = soup("tmua.html"), soup("esat.html"), soup("olympiad.html")
tm_mocks = from_rows(tm, "sets", "tmua", "mock", "tmua.html")
tm_notes = from_cards(tm, "notes", "tmua")
es_mocks = from_rows(es, "sets", "esat", "mock", "esat.html")
ol_mocks = from_rows(ol, "mocks", "olympiad", "mock", "olympiad.html")
ol_sols = from_rows(ol, "solutions", "olympiad", "solutions", "olympiad.html")
ol_hu = from_rows(ol, "hu", "olympiad", "notes", "olympiad.html")

n_notes = sum(len(r) for _, r in tm_notes)
sections = [
    ("tmua-mocks", "TMUA mock papers",
     f'{len(tm_mocks)} sets, newest first. Sets A to D are free, and later sets unlock with a code or with coins. The numbers are <a href="how-it-works.html#difficulty">difficulty ratings</a> on the 4.5 to 9.0 scale.',
     tm_mocks, None),
    ("tmua-notes", "TMUA topic notes",
     f'{n_notes} sets of notes, each with worked examples, harder questions and seventeen practice problems with full solutions.',
     None, tm_notes),
    ("esat-mocks", "ESAT mock papers",
     f'{len(es_mocks)} sets, newest first, all free. Each paper is a full module of 27 questions in 40 minutes.',
     es_mocks, None),
    ("oly-mocks", "Olympiad mock papers",
     "Original mocks to sit under the stated time limit.", ol_mocks, None),
    ("oly-solutions", "Solutions to official competitions",
     "Original write-ups of real competition papers. Try the official problems first, then compare.", ol_sols, None),
    ("hu-collection", "The HU Collection handouts",
     'Problem sets and handouts at olympiad level. The <a href="pathways.html">Pathways course</a> has a further handout for every unit, sorted by level.', ol_hu, None),
]

jump = "".join(f'<li><a href="#{sid}">{t}</a></li>' for sid, t, *_ in sections)
body = "".join(block(sid, t, intro, rows, sub) for sid, t, intro, rows, sub in sections)
total = len(tm_mocks) + n_notes + len(es_mocks) + len(ol_mocks) + len(ol_sols) + len(ol_hu)

PAGE = f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Library | Kevinvariant</title>
  <meta name="description" content="Every mock paper, set of topic notes, solution write-up and handout on Kevinvariant in one searchable list: TMUA, ESAT and olympiad.">
  <link rel="icon" href="/favicon.ico?v=4" sizes="32x32">
  <link rel="icon" href="/favicon.svg?v=4" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=4">
  <link rel="manifest" href="/site.webmanifest?v=5">
  <meta name="theme-color" content="#FFFFFF">
  <link rel="stylesheet" href="style.css?v=20261111a">
  <script>try{{if(localStorage.getItem('kv_mode')==='dark')document.documentElement.setAttribute('data-mode','dark')}}catch(e){{}}</script>
  <style>
    .lockline{{color:var(--ink-faint);font-size:.9rem}}
    .lib-sec [hidden],.lib-sec[hidden],.lib-none[hidden]{{display:none!important}}
    .lib-ctl{{padding:.8rem 0 .6rem;background:var(--bg,var(--surface));border-bottom:1px solid var(--line-soft);display:flex;flex-wrap:wrap;gap:.6rem 1rem;align-items:center}}
    .lib-ctl input[type=search]{{flex:1 1 16rem;min-height:40px;padding:.4rem .8rem;border:1px solid var(--line);border-radius:var(--r-md);background:var(--surface);color:var(--ink);font-size:1rem}}
    .lib-seg{{display:flex;flex-wrap:wrap;gap:.3rem}}
    .lib-seg button{{min-height:36px;padding:.25rem .8rem;border:1px solid var(--line);border-radius:var(--r-md);background:transparent;color:var(--ink-soft);font-size:.9rem;cursor:pointer}}
    .lib-seg button[aria-pressed=true]{{border-color:var(--accent,var(--ink));color:var(--ink);background:var(--surface);font-weight:600}}
    .lib-free{{display:inline-flex;align-items:center;gap:.4rem;font-size:.92rem;color:var(--ink-soft)}}
    .lib-count{{font-size:.88rem;color:var(--ink-faint);margin:.6rem 0 0}}
    .lib-grp{{font-family:var(--display);font-size:.8rem;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-faint);margin:1.4rem 0 0}}
    .lib-src{{grid-column:1/-1;font-size:.84rem;color:var(--ink-faint)}}
    .lib-none{{padding:2rem 0;color:var(--ink-soft)}}
    @media (min-width:761px){{.page .row .lib-src{{grid-column:1}}.lib-ctl{{position:sticky;top:0;z-index:5}}}}
  </style>
</head>
<body data-theme-v2>
  <nav id="sitenav"><div class="nav-links"><a href="index.html">Home</a> <a href="tmua.html">TMUA</a> <a href="esat.html">ESAT</a> <a href="olympiad.html">Olympiad</a> <a href="library.html">Library</a> <a href="compete.html">Practise and compete</a> <a href="book.html">Book</a></div></nav>

  <main class="page" data-sec="book">
    <header class="hub-head">
      <h1>Library</h1>
      <p class="lede">Every mock paper, set of topic notes, solution write-up and handout on the site, {total} entries in one list. Search by name or topic, or narrow the list by exam and type.</p>
      <ul class="jump">{jump}</ul>
    </header>

    <div class="lib-ctl" role="search">
      <input type="search" id="lib-q" placeholder="Search, for example: Set K, trigonometry, AMC, geometry" aria-label="Search the library">
      <div class="lib-seg" role="group" aria-label="Exam" data-key="exam"><button type="button" data-v="all" aria-pressed="true">All exams</button><button type="button" data-v="tmua" aria-pressed="false">TMUA</button><button type="button" data-v="esat" aria-pressed="false">ESAT</button><button type="button" data-v="olympiad" aria-pressed="false">Olympiad</button></div>
      <div class="lib-seg" role="group" aria-label="Type" data-key="type"><button type="button" data-v="all" aria-pressed="true">All types</button><button type="button" data-v="mock" aria-pressed="false">Mock papers</button><button type="button" data-v="notes" aria-pressed="false">Notes and handouts</button><button type="button" data-v="solutions" aria-pressed="false">Solutions</button></div>
      <label class="lib-free"><input type="checkbox" id="lib-free"> Free only</label>
    </div>
    <p class="lib-count" id="lib-count" aria-live="polite"></p>

{body}
    <p class="lib-none" id="lib-none" hidden>Nothing matches. Try a shorter search, or set the filters back to all.</p>
    <p style="margin-top:1.2rem">Have a code for a locked paper? <a href="unlock.html">Redeem a code</a>.</p>
  </main>

<script src="site.js?v=20261114a"></script>
<script src="locks.js?v=20260929"></script>
<script>
/* Flip locked entries to "Unlocked" for accounts that have redeemed them. */
(async function(){{ if(!window.HU_LOCKS) return; var sc=[]; try{{ sc=await HU_LOCKS.scopes(); }}catch(e){{ return; }}
  document.querySelectorAll('[data-lock]').forEach(function(a){{ var p=a.dataset.lock; if(sc.indexOf('*')<0&&sc.indexOf(p)<0) return;
    a.textContent='Sit it timed'; a.href='drill.html?paper='+p;
    document.querySelectorAll('[data-badge="'+p+'"]').forEach(function(b){{ b.textContent='Unlocked'; b.classList.remove('locked'); b.classList.add('open'); }});
    document.querySelectorAll('[data-lockline="'+p+'"]').forEach(function(l){{ l.innerHTML='<a href="unlock.html?paper='+p+'">Question paper and solutions</a>'; }}); }}); }})();
/* Search and filters. The state is kept in the address, so a filtered list can be shared. */
(function(){{
  var st={{exam:'all',type:'all',q:'',free:false}}, rows=[].slice.call(document.querySelectorAll('.lib-sec .row'));
  var qi=document.getElementById('lib-q'), fr=document.getElementById('lib-free');
  try{{ var u=new URLSearchParams(location.search); ['exam','type'].forEach(function(k){{ if(u.get(k)) st[k]=u.get(k); }}); st.q=u.get('q')||''; st.free=u.get('free')==='1'; }}catch(e){{}}
  qi.value=st.q; fr.checked=st.free;
  function paint(){{
    document.querySelectorAll('.lib-seg').forEach(function(g){{ g.querySelectorAll('button').forEach(function(b){{ b.setAttribute('aria-pressed',String(b.dataset.v===st[g.dataset.key])); }}); }});
    var words=st.q.toLowerCase().split(/\\s+/).filter(Boolean), shown=0;
    rows.forEach(function(r){{ var d=r.dataset, ok=(st.exam==='all'||d.exam===st.exam)&&(st.type==='all'||d.type===st.type)&&(!st.free||d.free==='1')&&words.every(function(w){{return d.q.indexOf(w)>=0;}});
      r.hidden=!ok; if(ok) shown++; }});
    document.querySelectorAll('.lib-sec').forEach(function(s){{ s.hidden=!s.querySelector('.row:not([hidden])');
      s.querySelectorAll('.lib-grp').forEach(function(g){{ var box=g.nextElementSibling; var vis=box&&box.querySelector('.row:not([hidden])'); g.hidden=!vis; if(box) box.hidden=!vis; }}); }});
    document.getElementById('lib-none').hidden=shown>0;
    document.getElementById('lib-count').textContent=shown===rows.length?'Showing all '+rows.length+' entries.':'Showing '+shown+' of '+rows.length+' entries.';
    try{{ var p=new URLSearchParams(); if(st.exam!=='all')p.set('exam',st.exam); if(st.type!=='all')p.set('type',st.type); if(st.q)p.set('q',st.q); if(st.free)p.set('free','1');
      var s=p.toString(); history.replaceState(null,'',location.pathname+(s?'?'+s:'')+location.hash); }}catch(e){{}}
  }}
  document.querySelectorAll('.lib-seg').forEach(function(g){{ g.addEventListener('click',function(e){{ var b=e.target.closest('button'); if(!b) return; st[g.dataset.key]=b.dataset.v; paint(); }}); }});
  qi.addEventListener('input',function(){{ st.q=qi.value.trim(); paint(); }});
  fr.addEventListener('change',function(){{ st.free=fr.checked; paint(); }});
  paint();
}})();
</script>
</body>
</html>
'''

with open(os.path.join(ROOT, "library.html"), "w", encoding="utf-8") as f:
    f.write(PAGE)
print(f"library.html: {total} entries "
      f"(TMUA {len(tm_mocks)} sets, {n_notes} notes; ESAT {len(es_mocks)}; "
      f"olympiad {len(ol_mocks)} mocks, {len(ol_sols)} solutions, {len(ol_hu)} handouts)")

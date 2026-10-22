# Kevinvariant redesign plan

Status: **implemented, merged into `main` and live since 21 October 2026.** See "Implementation notes" at the end.

Scope: structure, navigation and UI only. Every existing page URL, PDF URL, tool and
`drill.html?paper=XX` deep link keeps working. Long-form content (paper blurbs, book text,
solutions) is moved, not rewritten. No build step, no new libraries.

---

## 1. Audit findings

### 1.1 Broken or placeholder links

| # | Where | Problem | Proposed fix |
|---|---|---|---|
| 1 | `index.html`, Set B row | **Set B Paper 2 and Paper 2 solutions are 404s on the live site.** The page links `HU_Collection_TMUA_SetB_Paper2.pdf` and `..._Solutions.pdf`, but the files in the repo are named `... (1).pdf`. | `git mv` the two files to the names the page expects. Nothing links the `(1)` names. |
| 2 | `index.html`, SMC 2026 | "Read the solutions" is `href="#"`. A script swaps in a one-hour signed Supabase URL on click. Without JS, or if the Supabase CDN fails, the button does nothing. The copy says "no code or account needed". | Preferred: the solutions are released and free, so serve the PDF as a normal static file (needs the PDF from you). Fallback: keep the signed URL but render it as a `<button>`, not a fake link, with a visible error state. |
| 3 | `index.html`, book | "Buy the paperback" and "Buy the Kindle edition" both go to `amazon.co.uk/dp/B0HCDN9VFL`. A `B0…` ASIN is normally the Kindle edition. | Need the paperback URL. Until then: one "Buy on Amazon" button, since the Amazon page offers both formats. |
| 4 | `index.html`, locked sets | "Set H, Set G and earlier sets are in the archive below" links `#archive`. The anchor **does exist**, but the section is headed "Papers and solutions", mixes in olympiad material, and isn't "below" in any obvious sense. | Moves to the TMUA page as "All mock sets", with matching wording. Old `index.html#archive` redirects there (see 2.4). |
| 5 | `index.html`, hero | Primary CTA "Sit the newest mock" goes to `drill.html?paper=J1`, which is **locked**. A first-time visitor's first click ends at the unlock page. | Primary CTAs go to the TMUA and Olympiad hubs. The newest free set (H) gets its own "Sit Set H Paper 1" link. |
| 6 | `index.html`, question bank | Says "All 360 questions". `questions.js` holds 280 (Sets B–H). The other 80 are Sets I and J, locked and not in the bank. | "280 questions, plus 80 more in the locked Sets I and J." |
| 7 | `index.html`, "Mock SMC and S(A)MC" row | Link text "Mock UKMT SMC" opens a PDF titled **Mock S(A)MC**. `S(A)MC_Solutions.pdf` contains the solutions to that same mock. The blurb promises "AMC, AIME and more", which aren't there. | Relabel: "Mock S(A)MC: paper / solutions". Purple Comet moves to "Solutions to official competitions". |
| 8 | `unlock.html` | "Challenges are posted on …" is hidden because `SOCIAL.url` is empty. So the site says "win a code in one of my challenges" with nowhere to find a challenge. | Need your answer (Q2). The access explainer will at least say that Set I can also be unlocked with coins. |
| 9 | `geometry.html` | Doesn't load `site.js`, so it shows the old flat nav ("Mathematics, Geometry Lab, …") with no account menu. It's the only page like this. | Add `site.js` like every other page. |
| 10 | `book.md` | "Buy the Paperback" links to the literal placeholder `your-amazon-link`. Shown as the repo README's book page on GitHub. | Same real URL as #3. |
| 11 | `drill.html` and 6 others | The no-JS fallback nav hardcodes `https://kevinvariant08.github.io/...`. Harmless live, but local previews jump to the live site. | Make them relative. |
| 12 | `drill.html`, `sandbox.html` | Load `mathjax@3` (floating). Other pages pin `mathjax@3.2.2`. | Pin to 3.2.2 everywhere. |

`auth.html#signin/#signup/#forgot` and `games.html#factor` etc. are JS-routed views, not broken.

### 1.2 Duplicate entry points on the homepage today

| Destination | Entry points |
|---|---|
| Arena | nav, hero "Race the bot", Practise feature card |
| Drill | nav, hero "Sit the newest mock", Practise card, 16 "Sit Paper N timed" links |
| Rewards / Shop | nav, Practise feature card, and the Shop also sells the book chapter, a third book entry point |
| Book | Book section, Rewards card copy, Shop vault |

Rule for the redesign: **each tool appears once in the nav and once in the body of its section.**
Contextual deep links (for example "Sit timed" on a paper card) are fine; duplicate tool cards are not.

### 1.3 Naming inconsistencies

| Today | Problem | Proposed convention |
|---|---|---|
| Set / Paper / mock / "HU Collection TMUA Set" | Used interchangeably | **Set** = a pair of TMUA papers. **Paper** = one sitting. Always "Set H, Paper 1". The code `H1` stays internal. |
| "HU Collection" | Brands the TMUA PDFs, the two problem booklets, Purple Comet and the unlock page ("New HU Collection papers") | On the site, only the two booklets are called "The HU Collection". PDF filenames and covers stay as they are. |
| "Mock BMO" (file) / "Kevin's Mathematical Olympiad" (site) / "KMO" (solutions) | Three names for one paper | "Kevin's Mathematical Olympiad, Round 1 (BMO1-style)". Filenames unchanged. See Q5. |
| "Practise" menu in nav vs "Practise" section on home | Contain different things | Replaced by the four groups below. |
| "Labs" (nav) vs "minigames" (shop) | Same thing | "Labs (maths minigames)". |
| Difficulty "out of 9" (sets) vs "4.5 to 9.0" (bank) | Look like two scales | It is **one** scale. See 1.4. |

### 1.4 The difficulty scale is one scale, never explained

I checked the data in `drill.html` (`PAPER_RATING`). Every question has a rating from 4.5 to 9.0.
A paper's rating is the average of two numbers: its mean question rating and the mean of its
five hardest questions. For example, B1: mean 6.5, hardest five 8.0, rating (6.5 + 8.0) / 2 ≈ 7.3.
This holds for all 18 papers, to rounding. The bank already names three bands:
**4.5–5.9 solid, 6.0–7.4 hard, 7.5–9.0 severe.** So the explanation is one short paragraph and a scale bar, and every rating on the site can link to it.

Data-derived "where to start" order: Sets D, E, F (6.1–6.3) → C, B (6.9–7.5) → J (7.2–7.4) → H, I, G (7.7–8.0).
Set A is unrated (described as "a gentler entry point") and isn't in Drill.

### 1.5 The access model, as the code actually implements it

| Tier | What | How |
|---|---|---|
| Free, no account | Sets A–H (PDFs and Drill), question bank, Arena, duels, problem of the week, all geometry tools, olympiad PDFs, SMC 2026 solutions | Nothing needed. Progress stays in the browser. |
| Free account | Sync across devices, leaderboards, redeem codes, spend coins | Sign up (Supabase). |
| Locked papers | Sets I and J (`locks.js`) | (a) A code won in a challenge: one paper, occasionally all; some codes are single-claim or first-few. (b) **Coins: Set I papers are 3,000 coins each in the Shop.** Set J is code-only. |
| Coins only | *Beyond the Incenter* Chapter 1 (6,000) and the full book (24,000), plus cosmetics | Coins come from solving problems. |

None of this appears in one place today, and tier (b) is mentioned only inside the Shop.

### 1.6 Other inventory

- **23 HTML pages.** Shell consistency:
  - 8 still load the old IBM Plex Sans font: drill, interviews, marker, progress, results, sandbox, techniques, mock-interview-2.
  - `drill.html`, `results.html` and `unlock.html` have no media queries. Drill uses fluid grids and likely copes; I'll verify at phone width.
  - Only `index.html` has a footer.
- **Orphans** (in the repo, linked from nowhere, but still publicly downloadable):
  - `mock-interview-2.html`: superseded; its problem now lives in `interviews.html`.
  - `KGO.pdf`: "KGO 1st Edition", 25 pages, Chapter 1 Angle Chasing. **This may be an early version of the Chapter 1 the Shop sells for 6,000 coins.** See Q4.
  - `files (1).zip`, `files (3).zip`, `rewards_update.zip`, `social_update.zip`: old deploy bundles. I checked: they contain no Set I/J content.
  - Six byte-identical `* (1).png/.ico/.svg` icon duplicates.
  - `setup.sql`, `admin.sql`, `shop.sql`: database schema, publicly served.
- **`cover-mockup.png` is 747 KB** and is the heaviest thing on the homepage.

### 1.7 Not part of the redesign, but you should know

**The locked papers are readable in the public Git history.** Commit `6d22e68` (2026-09-29) has the full
questions **and solutions** for Sets I and J in `questions.js`. `cff3f4c` (2026-09-27) has Set I. Both are on
github.com. Anyone can open those commits, so the locks only stop casual users. Fixing this means
rewriting history and force-pushing, which is destructive, can't hide copies people already have, and is your call.
I haven't touched it.

---

## 2. Proposed information architecture

Organised by what a student is trying to do. Four destinations, each with its own hub page,
plus one shared explainer page.

```
Home (index.html)                     front door: choose a path, what's new, how it works
│
├── TMUA (tmua.html)                  NEW hub
│   ├── Newest sets: J, I (locked)
│   ├── All mock sets: H → A, with difficulty and access chips    ← old "archive"
│   └── Tools: Drill · Question bank · Technique index · Review mistakes · Results · Mock interviews
│
├── Olympiad (olympiad.html)          NEW hub
│   ├── Original mock papers: Kevin's Mathematical Olympiad R1 · Mock S(A)MC
│   ├── Solutions to official competitions: UKMT SMC 2026 · Purple Comet 2026 HS · BMO2 2011 · ISL 2025 G1–G3
│   ├── The HU Collection: Part 1 · Part 2
│   └── Tools: Geometry Lab · Conjecture sandbox · Proof marker
│
├── Practise and compete (compete.html)   NEW hub
│   ├── Compete: Arena · Friend duel · Problem of the week
│   └── Rewards: Rewards · Shop · Labs · My progress
│
├── Book (book.html)                  NEW page: Beyond the Incenter, kept separate from the free tools
│   └── About · sample chapter · buy · errata · "earn it in the Shop"
│
└── How it works (how-it-works.html)  NEW, the single explainer
    ├── #difficulty   the scale, bands, how paper ratings are computed, where to start
    ├── #access       free / free account / locked (code or coins) / coins-only
    └── #privacy      what stays in your browser, what an account syncs
```

All existing tool pages keep their filenames. Only the five pages above are new.

### 2.1 Navigation (`site.js`, so every page updates at once)

| Top level | Menu items |
|---|---|
| **TMUA** | TMUA home · Drill · Question bank · Technique index · Review mistakes · Results · Mock interviews · Unlock a paper |
| **Olympiad** | Olympiad home · Geometry Lab · Conjecture sandbox · Proof marker |
| **Practise & compete** | Hub · Arena · Friend duel · Problem of the week · Rewards · Shop · Labs |
| **Book** | link |
| *(right)* account | Sign in / account menu, as now. "My progress" stays here. |

The logo goes home. "How it works" lives in the footer and is linked from every difficulty and lock chip, rather than taking a top-level slot.
On mobile, the existing slide-down sheet stays, now with four short groups instead of three long ones.

### 2.2 Homepage section order

1. **Hero.** H1 "Kevinvariant", one line: "Free TMUA and olympiad preparation: original papers, full solutions, and tools to practise them." Two buttons: **TMUA preparation** / **Olympiad preparation**. The draggable incircle figure stays, since it's the brand.
2. **Choose your path.** Four equal cards (TMUA, Olympiad, Practise and compete, New here? How it works). Each card has three or four key links. This replaces the Practise grid.
3. **New this term.** Two compact cards: UKMT SMC 2026 solutions (free) and Set J (locked, with "How to unlock").
4. **How it works, in brief.** A difficulty scale bar with the three bands, and the access tiers in three lines. Links to the full page.
5. **The book.** One clearly separate band: cover thumbnail, two sentences, "About the book". The full text moves to `book.html`.
6. **Recommended elsewhere.** Arolf Math as a single small row at the bottom, out of the free-tools area.
7. **Footer** (on every page): the four sections, How it works, Book, Errata, privacy line.

### 2.3 Paper card: one component everywhere

```
┌───────────────────────────────────────────────┐
│ Set H, Paper 1                        [Free]  │
│ Difficulty 7.9 · hardest question 8.4  (?)    │  ← (?) links to how-it-works#difficulty
│ A circle that turns out to be tangent, …      │
│ [Sit it timed]   Paper PDF · Solutions PDF    │
└───────────────────────────────────────────────┘
```
The access chip is Free, Locked (linked to `#access`) or Unlocked. The existing `locks.js` script that flips locked to unlocked is kept as it is.

### 2.4 Old URLs keep working

- All tool pages and PDFs: unchanged.
- `index.html#archive` → `tmua.html#sets`, `#book` → `book.html`, `#friends` → bottom of home. Done with a three-line hash redirect on the homepage.

---

## 3. Visual design direction

Keep the identity, which is distinctive and already in `style.css`: indigo slate, the three pigments
from the logo's triangle, Bricolage Grotesque for UI and IBM Plex Serif for mathematical prose.
The problem is inconsistency, not identity.

- **Calmer surfaces.** Drop the large multicolour gradient panels (`.setc`) in favour of flat `--surface`
  cards with one accent line. Colour signals meaning, not decoration.
- **Section colour coding**, using the existing pigments: TMUA = aqua, Olympiad = saffron,
  Practise and compete = rose, Book = mint. Each appears as a top rule on its hub's header, a dot on nav items and an edge on cards.
- **Chips, not prose,** for difficulty and access. Same shape everywhere, always linked to the explainer.
- **Type scale:** keep the existing `h1/h2/h3` clamps. Paper and solution descriptions in Plex Serif, everything else in Bricolage.
- **One page shell:** `site.js` already injects the nav. It will also inject the footer, so all 20 public pages get the same header and footer. The 8 pages still on IBM Plex Sans switch to the shared fonts in their `<head>` only.
- **Tool internals are not restyled.** Drill, Arena, sandbox and the rest keep their own UI. This avoids breaking them, and it's out of scope.
- **Mobile first:**
  - One column below 760px.
  - Paper actions wrap into full-width buttons.
  - Tap targets at least 44px (already the button minimum).
  - No horizontal scroll at 360px.
  - I'll check every hub and the five most-used tools at 360px and 768px in a real browser.
- **Speed:** no framework, no build step, no new requests.
  - A resized ~600px-wide WebP of the book cover (about 60–90 KB, original kept) with `loading="lazy"`.
  - Hub pages are plain HTML using `style.css`.
  - MathJax stays only on the pages that already use it.

---

## 4. Implementation order (after your approval)

1. Fix the broken links: Set B rename, geometry nav, relative fallback navs, MathJax pin, labels. Small, safe commits.
2. Shared components in `style.css` (chips, paper card, hub header, footer), plus new nav groups and footer in `site.js`.
3. `how-it-works.html`, then `tmua.html`, `olympiad.html`, `compete.html`, `book.html`, moving the existing content into them.
4. Rebuild `index.html` as the front door, with hash redirects.
5. Shell consistency pass on the remaining pages (fonts, footer).
6. Check every internal link with the audit script, then check in a browser at desktop and phone widths, light on JS errors.
7. Show you the local preview. No push, no merge.

Local preview: `python -m http.server 8000` in the repo, then open http://localhost:8000.
Sign-in may not work on localhost if Supabase only allows the live domain as a redirect URL. Locked/unlocked states are only visible when signed in.

---

## 5. Decisions I need from you

1. **Paperback link.** What is the paperback URL? If you don't have one, I'll use a single "Buy on Amazon" button.
2. **Challenges.** Where are challenges posted? Give me a URL for `unlock.html`, or I'll reword to "Codes are given out in occasional challenges; Set I can also be unlocked with coins."
3. **SMC 2026 solutions.** May I serve them as a plain static PDF? You'd add the file, or tell me to download it from the bucket. Otherwise I'll keep the signed-URL button.
4. **`KGO.pdf`.** Is this the Chapter 1 sold in the Shop? If so, it's publicly downloadable now. Delete it, keep it unlinked, or list it on the Olympiad page?
5. **Naming.** OK with "Kevin's Mathematical Olympiad, Round 1 (BMO1-style)" and with limiting "HU Collection" to the two booklets? You placed the HU Collection under Olympiad, but its own blurb says "TMUA, MAT and interview preparation". Olympiad or TMUA?
6. **Mock interviews.** I've put them under TMUA, since they're university admissions practice. OK?
7. **Clean-up.** May I delete the four stray zips, the six `(1)` icon duplicates and `mock-interview-2.html` from the branch? They're publicly downloadable, and deleting them doesn't affect any page.
8. **Git history (1.7).** Do you want to deal with this? It's separate from this branch and would need a force-push. I'd only do it with your explicit go-ahead.

---

## Implementation notes (21 October 2026)

Decisions from the owner:

- **Book.** B0HCDN9VFL is the paperback. No separate Kindle listing was found, so there is a single "Buy on Amazon" button. `book.md` placeholder fixed.
- **Challenges.** Posted on Instagram, [@kevinvariant](https://www.instagram.com/kevinvariant/). Filled in on `unlock.html`, and every "win a code" line links there.
- **SMC 2026 solutions.** Now a static file, `UKMT_SMC_2026_Solutions.pdf` (10 pages), fetched from the bucket after release. The time-lock script is removed.
- **`KGO.pdf`.** Deleted. It is a separate 50-problem collection, not Chapter 1. It remains in Git history, like the Set I/J data in 1.7.
- **Clean-up.** The four zips and the byte-identical `(1)` icon copies are deleted. The two Set B Paper 2 `(1)` PDFs were the only copies, so they were **renamed** to the names the site links to, not deleted.
- **Q5 and Q6.** Not answered, so the defaults above are used: "Kevin's Mathematical Olympiad, Round 1"; HU Collection on the Olympiad page; Mock interviews under TMUA. Each is a one-line change if you want it different.
- **Q8 (Git history).** Not touched.

Deviations from the plan:

- **Nav breakpoint.** The nav switches to the Menu button at 1020px, not 860px. "Practise & compete" plus the signed-in rewards badges overflowed between 860px and 1020px. Between 1021px and 1180px the label shortens to "Practise".
- **CSS scoping.** All new components are scoped under `.page`. The tool pages already use `.row`, `.chip`, `.tools`, etc. with different meanings, so global rules would have changed them.
- **Phone fixes on tool pages.** One-line CSS fixes for horizontal scrolling at 360px on bank (filters), techniques (layout and tables), interviews (mode select) and shop (card grids). These overflows predate the redesign.
- **Fonts.** Seven pages no longer request IBM Plex Sans/Serif twice. Bricolage was already their first choice. Sandbox keeps Plex Mono.

Verified locally (Chrome):

- **Phone width.** Every public page checked at 360px: no horizontal scroll, new nav and footer present, no JS errors.
- **Nav widths.** Fits on one line at 880, 1040, 1120 and 1200px, signed in.
- **Links.** All 83 local links on the new and changed pages return 200.
- **Old links and deep links.** `index.html#archive` redirects to `tmua.html#sets`. `drill.html?paper=B2` still opens with its rating.
- **Locks.** The unlocked state flips correctly for a signed-in account.

Not changed: `mock-interview-2.html` (orphan, kept), the `.sql` files, and the internals and visual style of every tool page.

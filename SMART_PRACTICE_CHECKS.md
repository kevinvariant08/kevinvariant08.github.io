# Manual checks before every deploy

Run the automated tests first, then click through this list on a phone-sized window and a desktop window.

```
node tools/test_item_bank.js
node tools/test_telemetry.js
node tools/test_smart.js
cd tools && npm install && cd .. && node tools/test_attempts_sql.mjs
```

## Existing site (must behave exactly as before)
1. Home, TMUA hub, Olympiad, Practise and compete and Book pages load with no console errors; nav and footer render.
2. TMUA hub: free sets B to D show "Sit it timed" and PDFs; locked sets show "Locked" and "Unlock with a code".
3. Drill: sit a free paper (B1) timed, answer a few, submit; score table shows; Results logging still works.
4. Drill: technique drill and weakest-first queue run and show solutions after each answer.
5. Question bank: filter by paper and technique; answer a question; the right/wrong mark appears.
6. Review mistakes: a wrong answer from Drill appears in the queue.
7. Rewards: daily challenge answers and the coin/XP pill update; Shop lists items and prices.
8. Unlock: redeem flow asks to sign in when signed out; signed in, a bad code shows an error.
9. Signed in with an unlocked paper: it opens in Drill; a locked paper you have not unlocked does not.
10. Arena, Duel and Problem of the week still accept answers.
11. Dark mode toggle still works and is remembered.

## Sharing and privacy
12. Fresh browser (private window): answering a question shows the sharing notice; nothing is sent
    (DevTools > Network shows no request to /rpc/hu_log_attempts).
13. "Keep on this device": notice disappears; further answers send nothing.
14. "Share anonymously": the next answers are sent in one request within a few seconds; the request has only
    apikey and Content-Type headers (no Authorization), and the body has p_anon and rows with q, c, ok, s, t, m.
15. Signed in and sharing: same request shape; no user id or token anywhere in it.
16. Privacy page: status shows on/off correctly; switching works; "Delete what this browser shared" reports a count.
17. Footer shows the Privacy link on every page.

## Smart Practice
18. Signed out: only Sets B to D appear; no request for any locked paper's files.
19. Signed in without unlocks: same as 18.
20. Signed in with an unlocked paper: its questions can appear; others still cannot.
21. Paper 1, Paper 2 and mixed each serve only that paper type.
22. Session of 10: feedback and worked solution after each answer; summary shows an ability band, topic strengths
    and a suggested next topic; the TMUA figure is labelled as a rough estimate.
23. Keyboard only: options selectable with A to F / 1 to 6 and Enter; focus is visible.
24. Progress chart shows previous sessions after a reload.

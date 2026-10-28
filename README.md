# Sweet Stack
Candy falling-trio puzzle (static HTML/JS/CSS, no build step, Vercel-ready).
- Play: serve the folder (`python3 -m http.server 8124`) and open http://localhost:8124/
- Tests: `node tests/logic.test.js`; browser smoke: `npm i && node tests/smoke.mjs` (needs Chrome at /usr/bin/google-chrome or `CHROME=`).
- Debug: `?debug=1` shows a panel (Time Run level jump, force cabinet, launch each secret). `?debug=1&level=N` starts Time Run at level N; `?debug=1&secret=brick|pong|ice` launches a secret game.
- Secret arcade: a 5-chain cascade makes a flickering cabinet appear for 5 s; tap it. Games rotate Brick Blitz → Paddle Duel → Ice Plains Run; their bonus is added to your score.

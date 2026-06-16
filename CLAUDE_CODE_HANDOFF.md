# Claude Code Handoff: 101 Future

อ่านไฟล์นี้ก่อนเริ่มทำงานใน Claude Code

## Project

- Site: https://www.101future.com
- Local path: `/Users/m4-ai/Documents/Codex/2026-05-29/domain-edtech`
- GitHub repo: https://github.com/mankungp/101future-academy
- Current product: EdTech for primary students ป.1-ป.6
- First learning focus: English ป.1, animation-first missions

## Must Read First

1. `OPEN_THIS_FIRST.md`
2. `PROJECT_STATUS.md`
3. `EDTECH_10_PHASES.md`
4. `ENGLISH_P1_UNIT1.md`

Treat those files as the source of truth. Do not rely on old chat history.

## Important Collaboration Rules

- Do not revert user or Codex changes.
- The working tree is intentionally dirty because many files are project artifacts not committed in local git.
- Keep edits small and scoped.
- Run `npm run check` before saying a change is ready.
- For frontend changes, verify on mobile width around `390x844`.
- Avoid showing internal costs, KBank status, cache, token, or phase details on public pages.
- Do not put secrets into GitHub. Use Render env vars for real keys.

## Latest State As Of 2026-05-31

Mission 1 is live here:

```text
https://www.101future.com/mission/school-bag?reset=1&real=v2prod
```

Recent updates:

- Mission 1 (`Pack My School Bag`) now has 20 picture-word rounds.
- `/mission/lab` redirects back to Mission 1.
- Mission pages lock zoom and vertical scrolling for young children.
- Correct answers show a popup and then automatically read the next prompt.
- Wrong answers tell the child what they tapped and what the prompt asked for.
- `pencil`, `pen`, and `crayon` now use cropped Canva PNG assets:
  - `assets/school-bag/real-pencil.png`
  - `assets/school-bag/real-pen.png`
  - `assets/school-bag/real-crayon.png`
- Other Mission 1 objects were polished toward a more realistic/3D look using local SVG assets.
- Cache/version marker currently used by Mission 1:

```js
const assetVersion = "20260531-real-objects-v2";
```

Important note about Canva:

- Canva works better when generating one object at a time.
- Canva failed when asked to generate a 20-object sheet; it produced posters, labels, and wrong objects.
- Do not use Canva output directly unless each object is inspected and cropped cleanly.

## Key Files

Mission 1:

- `mission-school-bag.html`
- `mission-school-bag.js`
- `styles.css`
- `assets/school-bag/*`

Mission 2:

- `mission-this-is.html`
- `mission-this-is.js`

Learning portal:

- `learn.html`
- `learn.js`

Backend/payment/LINE:

- `server.js`
- `admin.html`
- `admin.js`
- `pay.html`
- `pay.js`

Docs:

- `PROJECT_STATUS.md`
- `OPEN_THIS_FIRST.md`
- `EDTECH_10_PHASES.md`
- `ENGLISH_P1_UNIT1.md`

## Commands

Check:

```bash
npm run check
```

Run locally:

```bash
npm start
```

Publish selected files:

```bash
GITHUB_TOKEN=$(cat /Users/m4-ai/.openclaw/shop/.secrets/github-token) node scripts/push-github.js <files>
```

Publish all whitelisted project files:

```bash
GITHUB_TOKEN=$(cat /Users/m4-ai/.openclaw/shop/.secrets/github-token) node scripts/push-github.js
```

## Suggested First Tasks For Claude

1. QA Mission 1 on production mobile:
   - Open `/mission/school-bag?reset=1&real=v2prod`.
   - Confirm no horizontal overflow, no vertical scroll during play, and Start Mission works.
   - Click through several rounds and check that object images are clear and not repeated too badly.

2. Improve the learning product next:
   - Build English ป.1 Mission 3 for speaking practice:
     - Target sentence: `This is a/an ...`
     - Start scripted first; do not require real-time AI yet.
     - Record attempt locally first, then later connect to server-side progress.

3. Make Mission 2 visually consistent:
   - Reuse the newer Mission 1 asset style where possible.
   - Keep mobile one-screen behavior.

4. Prepare parent summary:
   - Convert local `101future.learningAttempts` into a parent-friendly summary on `/learn`.
   - Keep child mission screen playful and parent summary separate.

## Current Blockers

- KBank production service approval is still pending.
- KBank credentials are not yet available.
- Final human TTS voice is not selected.
- Durable DB is not implemented; storage is still JSON files.

## Do Not Do Yet

- Do not build real-time AI voice conversation yet.
- Do not add wallet/top-up system.
- Do not expose internal roadmap/cost/payment-provider details on public pages.
- Do not replace all learning with video; current direction is animation-first interactive missions.

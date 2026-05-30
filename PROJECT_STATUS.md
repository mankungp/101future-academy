# 101 Future Project Status

Last updated: 2026-05-30

## Current Product Direction

101 Future starts with primary school courses for ป.1-ป.6.

Public positioning:

- Students can choose the first subject themselves: Math, Science, English, or Thai.
- Lessons follow Thai curriculum needs and use AI to summarize what each child should practice next.
- Monthly pricing starts at 299 THB / 30 days per subject.
- No wallet in the first version.
- LINE Login is the main path. Access code remains as a fallback.
- While KBank payment is pending, the site collects LINE interests so leads are not lost.
- Learning direction is animation-first for young learners. Start with English ป.1 as interactive missions, not video-heavy lessons.
- First prototype mission: `Pack My School Bag` / `My School Bag`, where children tap or drag school items, hear/read words, answer tiny exercises, and receive a parent-friendly summary.

## Live Site

- Domain: https://www.101future.com
- Repo: https://github.com/mankungp/101future-academy
- Local path: `/Users/m4-ai/Documents/Codex/2026-05-29/domain-edtech`

## Current Implementation

Done:

- Public landing page for primary ป.1-ป.6.
- Mobile hero/nav cleaned up and verified on production.
- Public copy hides internal terms such as KBank approval, cost, cache, tokens, and phase details.
- Packages API:
  - Math ป.1-ป.6: 299 THB / 30 days
  - Science ป.1-ป.6: 299 THB / 30 days
  - English ป.1-ป.6: 299 THB / 30 days
  - Thai ป.1-ป.6: 299 THB / 30 days
  - Primary 4-subject bundle: 599 THB / 30 days, coming soon
- LINE Login backend and production callback.
- `/learn?package=...` saves LINE interest to the account after login.
- Admin has a LINE Interest panel showing interested accounts by subject.
- Admin can create a pending payment order from an interest.
- Payment order, parent payment link, KBank QR adapter scaffold, and entitlement unlock structure exist.
- `/pay?order=...` page exists for parent payment links.
- Access-code fallback login exists.
- English sample lesson exists on `/learn`:
  - `English Skill Starter สำหรับ ป.1-ป.6`
  - Story: `My School Bag`
  - Vocabulary: school bag, book, pencil, ruler
  - 3-question exercise
  - Mock result summary after completion
- English Mission 1 now opens as a full-screen mission at `/mission/school-bag`, separate from `/learn`.
- Mission object visuals are local SVG assets, not CSS-only shapes, so book, pencil, ruler, and eraser are easier for young learners to recognize.
- Wrong-answer feedback now tells the child what they tapped and what the prompt asked for.
- Correct answers now show a short animated popup and the next prompt is read automatically, while the Listen button remains for replay.
- Mission speech now uses more natural classroom phrases: wrong answers say "No, this is a/an ...", correct answers say "Yes, correct", and restart reads the first prompt again.

## Learning UX References

LingoAce-inspired notes to keep:

- Use a story world or mission context before drilling vocabulary.
- Put the child into one clear action at a time: listen, choose/tap/drag, then get immediate feedback.
- Use bright, concrete object art and character-like reactions instead of text-heavy instruction.
- Keep parent-facing summaries separate from the child mission screen.
- Do not build the first version like a tutor classroom page; build it like guided skill practice.

## Not Yet Done

Payment:

- KBank app is created in KBank API Portal.
- KBank API exercise/test is complete: 15/15 passed.
- KBank production service approval and credentials are still pending.
- Need KBank API key/token from KBank API Portal after service approval.
- Need exact KBank QR create endpoint from KBank API Portal.
- Need callback verification details from KBank.
- Need real Thai QR payment test.

Learning product:

- Need a real grade-by-grade curriculum map, starting with English ป.1.
- Current English sample lesson is a prototype, not the final ป.1 lesson design.
- Need more animation polish: bag open/close, stronger success reward, and completion badge.
- Need first real lessons for English ป.1, then expand grade by grade.
- Need first real lessons for Math, Science, and Thai later.
- Need progress tracking.
- Need speaking/answer attempt records.
- Need AI feedback pipeline.
- Need parent/student dashboard.

Infrastructure:

- Current storage is JSON files.
- Before real paid users, move to durable DB or confirm Render disk persistence.
- Need backup plan.
- Need production env audit.

## Required Production Env

Payment:

```text
PAYMENT_PROVIDER=kbank
PAYMENT_PROVIDER_API_KEY=...
PAYMENT_WEBHOOK_SECRET=...
KBANK_QR_CREATE_URL=...
KBANK_MERCHANT_ID=...
KBANK_TERMINAL_ID=...
KBANK_BRANCH_ID=...
SITE_ORIGIN=https://www.101future.com
```

LINE Login:

```text
LINE_CHANNEL_ID=2010237394
LINE_CHANNEL_SECRET=...
LINE_CALLBACK_URL=https://www.101future.com/auth/line/callback
```

## Next Steps

1. Wait for KBank service approval, then add production KBank credentials to Render.
2. Test real LINE Login: choose a package, login with LINE, confirm it appears in Admin LINE Interest.
3. From Admin, create a payment order from a LINE interest.
4. Test parent payment page with that order link.
5. Test KBank callback unlocks learning access.
6. Design English ป.1 curriculum map from Thai indicators: classroom commands, letters/sounds, concrete vocabulary, picture matching, short sentences, listening and speaking.
7. Polish animation-first English Mission 1: `Pack My School Bag`.
8. Add progress tracking for mission completion and score.
9. Add AI feedback pipeline later, after scripted missions are stable.
10. Build first real ป.1 lessons for other subjects later.
11. Add parent/student dashboard.
12. Move JSON storage to a durable database before real paid users.

## Rule For Future Codex Chats

When returning to this project, open this file first:

```text
/Users/m4-ai/Documents/Codex/2026-05-29/domain-edtech/PROJECT_STATUS.md
```

Then open:

```text
/Users/m4-ai/Documents/Codex/2026-05-29/domain-edtech/EDTECH_10_PHASES.md
```

Do not infer project state from old chat history. Treat these files as the source of truth.

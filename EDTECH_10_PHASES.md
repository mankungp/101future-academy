# 101 Future Ed-Tech 10 Phases

This roadmap is the working spine for 101future.com. Build in phase order unless a later phase is needed to unblock an earlier one.

## Phase 0.5: Product and Data Foundation

Goal: Prepare the core system before scaling subjects or grade levels.

Status: In progress

- Website, enrollment form, package API, order creation, and learning gate exist.
- Landing copy now states the system model: lesson cache + speaking prompt cache + AI correction.
- Monthly payment model is selected: KBank Dynamic Thai QR, auto verification callback, and 30-day entitlement unlock.
- Needs real lesson schema, progress records, speaking attempts, and weakness tags.

## Phase 1: English ป.1 Animation-First MVP

Goal: Launch the first sellable product direction: English for primary learners, starting at ป.1 with interactive missions.

Status: In progress

- Domain and hosting are live.
- Landing page now positions 101 Future as skill-building for primary school core subjects.
- English is the first learning product to make real.
- ป.1 lessons should not start with long video or text. Use animation-first missions.
- Mission pattern:
  - Explore a visual scene.
  - Tap or drag objects.
  - Hear/read one word or one short sentence.
  - Get immediate feedback: bounce, shake, star, badge.
  - Finish with a parent-friendly summary.
- First prototype: `Pack My School Bag` / `My School Bag`.
- Needs grade-by-grade English curriculum map starting from ป.1 indicators.
- Needs animation MVP: school bag, book, pencil, ruler, tap/drag, stars, completion badge.

## Phase 2: Paid Beta and English Full System

Goal: Turn English ป.1 mission MVP into a paid beta with repeatable learning loops.

Status: In progress

- Enrollment ID and access code are generated after signup.
- Package and order APIs exist.
- KBank QR API adapter scaffold exists and is configured through `PAYMENT_PROVIDER=kbank`.
- Payment webhook verification supports callback token/HMAC-style headers and amount/order matching.
- EasySlip-compatible slip verification remains available as fallback.
- `/learn` unlocks only after paid status.
- Needs production KBank API Portal credentials, actual QR create endpoint, callback token/signature details, and real Thai QR test.
- Needs a set of English ป.1 missions, progress tracking, speaking attempts, and parent report.

## Phase 3: Add Math M.1-M.3

Goal: Add Math as the first subject add-on after English is stable.

Status: Prototype

- Planned bundle: English + Math at 399 THB / 30 days.
- Math should start with cached explanations, fixed quizzes, step feedback, and weakness detection.
- Avoid open-ended AI math generation until answer checking is reliable.

## Phase 4: Add Science M.1-M.3

Goal: Add Science with controlled content and low hallucination risk.

Status: Not started

- Planned bundle: English + Math + Science at 499 THB / 30 days.
- Use cached diagrams, explanations, quizzes, and short AI clarification.

## Phase 5: Add Thai and Core M.1-M.3 Bundle

Goal: Complete the lower-secondary core subject set.

Status: Not started

- Planned bundle: All M.1-M.3 at 599 THB / 30 days.
- Thai should focus on reading comprehension, grammar, paragraph writing, and AI writing feedback.

## Phase 6: Expand to P.4-P.6

Goal: Move down to upper primary once content operations are stable.

Status: Not started

- Reuse English, Math, Science, Thai engines with shorter lessons, more visuals, and simpler language.

## Phase 7: Expand to M.4-M.6 and Exam Prep

Goal: Add high-value exam and upper-secondary courses.

Status: Not started

- Add Advanced Math, Physics, Chemistry, Biology, TGAT, A-Level, and exam plans.
- Exam pricing can move to 799-1,200 THB / 30 days.

## Phase 8: Add Social Studies and History

Goal: Add content-heavy subjects after retrieval/content QA is mature.

Status: Not started

- Requires stronger content source control and retrieval because hallucination risk is higher.

## Phase 9: Expand to P.1-P.3

Goal: Support younger learners with more voice, visuals, and games.

Status: Not started

- Lessons become shorter and more parent-guided.
- AI use should remain constrained and scripted.

## Phase 10: Kindergarten and School Platform

Goal: Add voice-first/story-based kindergarten modules and school-facing operations.

Status: Not started

- Kindergarten requires strict scripted flows, parent control, and high safety.
- School platform adds classrooms, teacher dashboards, homework, reports, roles, audit logs, monitoring, backups, and durable database storage.

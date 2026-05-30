# 101 Future Ed-Tech 10 Phases

This roadmap is the working spine for 101future.com. Build in phase order unless a later phase is needed to unblock an earlier one.

## Phase 0.5: Product and Data Foundation

Goal: Prepare the core system before scaling subjects or grade levels.

Status: In progress

- Website, enrollment form, package API, order creation, and learning gate exist.
- Landing copy now states the system model: lesson cache + speaking prompt cache + AI correction.
- Monthly payment model is selected: KBank Dynamic Thai QR, auto verification callback, and 30-day entitlement unlock.
- Needs real lesson schema, progress records, speaking attempts, and weakness tags.

## Phase 1: English Speaking MVP

Goal: Launch the first sellable product: English Speaking + Grammar for M.1-M.3.

Status: In progress

- Domain and hosting are live.
- Landing page now focuses on English Monthly at 299 THB / 30 days.
- Product uses cached lessons, cached speaking prompts, push-to-talk, STT, AI correction, and weakness tracking.
- Target operating cost is around 5 THB per 60-minute learning session.
- Needs final teacher/team details and local Roi Et proof.

## Phase 2: Paid Beta and English Full System

Goal: Turn English MVP into a paid beta with repeatable learning loops.

Status: In progress

- Enrollment ID and access code are generated after signup.
- Package and order APIs exist.
- KBank QR API adapter scaffold exists and is configured through `PAYMENT_PROVIDER=kbank`.
- Payment webhook verification supports callback token/HMAC-style headers and amount/order matching.
- EasySlip-compatible slip verification remains available as fallback.
- `/learn` unlocks only after paid status.
- Needs production KBank API Portal credentials, actual QR create endpoint, callback token/signature details, and real Thai QR test.
- Needs 30-50 English lessons, quiz flow, speaking attempts, progress tracking, and parent report.

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

# 101 Future Ed-Tech 10 Phases

This roadmap is the working spine for 101future.com. Build in phase order unless a later phase is needed to unblock an earlier one.

## Phase 1: Brand, Landing, and Course Positioning

Goal: Make 101 Future Academy understandable and trustworthy in the first visit.

Status: In progress

- Domain and hosting are live.
- Landing page, programs, and enrollment form exist.
- Needs final copy, course prices, teacher/team details, and local Roi Et proof.

## Phase 2: Enrollment and Payment Gate

Goal: Let a student apply, pay, verify payment, and unlock learning without manual admin work.

Status: In progress

- Enrollment ID and access code are generated after signup.
- Slip upload flow exists.
- EasySlip-compatible server verification is wired.
- `/learn` unlocks only after paid status.
- Needs production `EASYSLIP_API_KEY`, course prices, receiver-account matching, and real slip test.

## Phase 3: Student Learning Portal

Goal: Give paid students a clean place to access course content.

Status: Prototype

- `/learn` exists.
- Course lesson cards exist.
- Needs real modules, videos/files, progress tracking, and completion state.

## Phase 4: Course Content System

Goal: Manage lessons, modules, worksheets, quizzes, and projects without editing code each time.

Status: Not started

- Move course content from hardcoded server data into structured storage.
- Add lesson ordering, content types, attachments, and preview mode.

## Phase 5: Assessment and Project Submission

Goal: Let students submit work and receive feedback.

Status: Not started

- Add assignments, uploads/links, rubric, review status, and teacher comments.

## Phase 6: Teacher/Admin Operations

Goal: Help staff manage students, payments, content, and support cases efficiently.

Status: Basic admin only

- Admin dashboard exists for enrollments and exception cases.
- Needs student search, filters, content management, support notes, and role separation.

## Phase 7: Notifications and Communication

Goal: Reduce manual follow-up while keeping students informed.

Status: Not started

- Add email/LINE notifications for signup, payment success, rejected slip, unlocked lessons, and deadlines.

## Phase 8: Cohorts, Schedules, and Live Classes

Goal: Support real class operations, not only self-paced access.

Status: Not started

- Add cohorts, class dates, seat limits, attendance, and calendar links.

## Phase 9: Analytics and Growth

Goal: Know what converts and where students get stuck.

Status: Not started

- Track funnel metrics, payment conversion, lesson progress, completion, and campaign sources.

## Phase 10: Scale, Security, and Reliability

Goal: Make the platform reliable enough for real paid usage.

Status: Not started

- Move storage to a durable database.
- Add backups, audit logs, rate limits, stronger auth, monitoring, and staging/prod separation.

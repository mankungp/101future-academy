# 101 Future — โปรเจกต์เดียวของ session นี้

> session นี้ทำ **101future อย่างเดียว** (เว็บเรียนออนไลน์ ป.1-6) — ไม่ยุ่งกับ istatus/kerd (คนละเรื่อง คนละโฟลเดอร์)
> เปิด session นี้ด้วย `claude` ในโฟลเดอร์นี้ · อ่าน **OPEN_THIS_FIRST.md** + **PROJECT_STATUS.md** ก่อนเริ่มงานทุกครั้ง
> 🧠 **ความรู้กลางทั้งระบบ** (เครื่องมือ/infra/NAS/tunnel/R2/สถานะทุกโปรเจกต์) = `/Users/m4-ai/Documents/Codex/HQ/STATE-INDEX.md` — อ่านเวลาต้องใช้ทรัพยากรร่วม หรือไม่แน่ใจว่ามีเครื่องมืออะไร/ของอยู่ไหน · ปรึกษา/วางแผนภาพรวม = แชท PLANNER (claude-code)

## โปรเจกต์คืออะไร
เว็บ **101future.com** — คอร์สเรียนออนไลน์ประถม ป.1-6 (คณิต/วิทย์/อังกฤษ/ไทย) · หลักสูตรไทยแกนกลาง + AI ช่วยสรุปว่าควรซ้อมอะไรต่อ · **gamified/สนุกแบบ LingoAce·Duolingo** (มาสคอต, mission, animation-first) เด็กเรียนต้องสนุก · รายเดือน 299 บาท/วิชา · login = LINE

## สถานะ (อัปเดต ~7-8 มิ.ย.)
- **LIVE: https://www.101future.com** (repo github.com/mankungp/101future-academy · deploy ผ่าน Codex/push-github.js · Render + Cloudflare)
- เสร็จ: landing ป.1-6, mobile ตรวจแล้ว, LINE Login backend พร้อม, LINE Interest (เก็บ lead รอ KBank), packages API, iPad game-first layout, audio queue fix
- prototype mission แรก: **Pack My School Bag** (อังกฤษ ป.1) — แตะ/ลากของใส่กระเป๋า ฟัง/อ่านคำ ตอบ แล้วสรุปให้ผู้ปกครอง
- ค้าง: รอ KBank approval/credentials → ใส่ Render → เทสจ่ายเงิน/เปิดสิทธิ์ 30 วัน · ทำบทเรียนจริง 4 วิชา · progress tracking · AI feedback · dashboard นักเรียน/ผู้ปกครอง

## เอกสารในโฟลเดอร์ (อ่านตามนี้)
- `OPEN_THIS_FIRST.md` — สรุปกำลังทำอะไร + ค้างอะไร (อ่านก่อน)
- `PROJECT_STATUS.md` — สถานะละเอียด + live/repo/path
- `CLAUDE_CODE_HANDOFF.md` · `CODEX_WORK_ORDERS.md` · `EDTECH_10_PHASES.md` · `ENGLISH_P1_UNIT1.md` · `VOICE_SELECTION.md`

## กฎสำคัญ (อยู่ใน memory ด้วย — ดู memory/)
- **ต้นทุน AI:** ห้ามใช้ Anthropic API key ที่ metered · ใช้ Claude ผ่าน Claude Code ได้ · งาน bulk (gen รูป/เสียง/3D) route ไปตัวถูก (Gemini Flash/DeepSeek/Web Speech) — ดู `cost-guard-agents`
- **3D/ตัวละคร:** Meshy = tool หลัก (image→3D rig พร้อม ~฿20/ตัว) · ล็อกตัวละครนิ่งด้วยการ edit จากรูปเดี่ยว ไม่ gen ใหม่ (`character-lock-formula`, `3d-tooling-meshy`, `production-pipeline`)
- **บั๊ก visual/render (GPU/สี/ฟอนต์):** Claude headless มองไม่เห็น → แคบจุดแล้วโยน Codex เครื่องจริง GPU-on หรือขอ screenshot (`render-bugs-need-real-gpu`)
- **ประสานงาน:** coordinate ผ่าน agent-room (.agent-room ในโฟลเดอร์นี้) · ก่อน dispatch AI อื่นเช็คไม่ชน Codex (`coordination-safety-rules`) · งานวิจัย/ค้นโยน sub-agent (`delegate-research-to-subagents`)
- **อันตราย (ต้องถามเจ้าของ):** deploy production จริง/DNS/แตะ secret/เงิน/KBank — ถามก่อนเสมอ

## หมายเหตุ
- session นี้แยกจาก session istatus โดยสิ้นเชิง (คนละ memory คนละโฟลเดอร์) — ความรู้ 101future + กฎเจ้าของถูกคัดมาให้ครบใน memory/ แล้ว · ของ istatus ไม่ได้เอามาปน (ตั้งใจ)

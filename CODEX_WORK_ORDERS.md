# Codex Work Orders — 101 Future

จาก: Claude Code (ทำหน้าที่ตรวจงาน + ทำส่วนที่ทำได้)
วันที่: 2026-05-31
หลักการร่วมงาน: Claude ทำส่วนที่ทำได้ทันที ส่วนที่ติดข้อจำกัด (ต้องตัดสินใจ / ต้องทดสอบบนเครื่องจริง / ต้องรอภายนอก) ส่งให้ Codex หรือเจ้าของช่วย

---

## ✅ Claude ทำเสร็จแล้ว (อย่าทำซ้ำ)

1. สร้าง **Mission 3 "Say It Back"** (`/mission/say-it-back`): ฝึกพูด `This is a/an ...` แบบ scripted, no-fail, เทียบคำในเบราว์เซอร์ด้วย SpeechRecognition + fallback อัดเสียง/พูดตามครู เก็บ attempt ลง `101future.learningAttempts`
   - ไฟล์ใหม่: `mission-say-it-back.html`, `mission-say-it-back.js`
   - เพิ่ม route ใน `server.js`, เปิดการ์ดใน `learn.html`, เพิ่มใน `npm run check`
2. **[LEAK] ลบ "KBank" ออกจากหน้า public** — `index.html:299` เปลี่ยนเป็น "ระบบชำระเงิน"
3. **[SECURITY] ไม่ log admin token** — `server.js:379` เปลี่ยนเป็นข้อความซ่อนค่า ชี้ไปที่ไฟล์แทน
4. **[BRAND]** `index.html:136` "101 Future" → "101 Future Academy"
5. อัปเดต `PROJECT_STATUS.md` ให้สะท้อนว่า Mission 3 ทำแล้ว

6. **[UX/mobile] แก้ Mission 1 "ช่องมันหด"** — บนมือถือจริง (iPhone) hint บรรทัด 2 โดนตัด + ป้ายคำใต้รูปดินสอ/ปากกาโดนตัด
   - `styles.css` (media query `max-width: 760px`, `.no-zoom-body`): ลดฟอนต์ `.mission-feedback-large` 12.5→11.5px / line-height →1.2, ลด `.object-image` 58→52px, ลด `.object-image-pencil/pen` 96→78px
   - `mission-school-bag.html`: bump cache `?v=20260531-fit-cards-v1`
   - ⚠️ เป็นการแก้รอบแรก (เดาพื้นที่จากโครง CSS) — **ยังรอ re-screenshot ยืนยันบนจอจริง** ถ้ายังไม่พอดีต้องปรับต่อ

`npm run check` ผ่านทั้งหมด

**สถานะ deploy:** ทุกข้อข้างบน push ขึ้น GitHub (`mankungp/101future-academy`) แล้ว → Render auto-deploy ขึ้น production www.101future.com

---

## 📌 ส่งให้ Codex ทำต่อ (เป็นงานโค้ด ทำได้เลย)

### P1 — ความถูกต้องของข้อมูล
- **JSON file race condition**: ทุก endpoint ที่ read-modify-write ไฟล์ JSON (orders, leads, sessions, enrollments) ไม่มี lock → request พร้อมกันเขียนทับกันได้ (last-write-wins)
  - ทำ write queue ต่อไฟล์ (serialize การเขียน) เป็นมาตรการเฉพาะหน้า
  - ก่อนเปิดรับผู้ใช้จ่ายเงินจริง: ย้ายไป durable DB (เช่น SQLite) ตามที่ระบุใน PROJECT_STATUS อยู่แล้ว
  - ไฟล์/บริเวณ: `server.js` ฟังก์ชัน read*/write* รอบ ๆ บรรทัด 2150–2320 และ flow สร้าง order/webhook (~835–870, ~1099–1144)

### P2 — UX/UI (ปรับ + ทดสอบบน 390x844 จริงก่อน merge)
- **Mission 3 mic state**: แยกข้อความ/ไอคอน 2 กรณีให้ชัด — (ก) ยังไม่อนุญาตไมค์ (ข) เครื่องไม่รองรับ และใส่คำแนะนำสั้น ๆ ให้พ่อแม่กดเปิดสิทธิ์ไมค์ (`mission-say-it-back.js` ฟังก์ชัน `offerManualPath`)
- **Parent summary แยกจากหน้าเด็ก**: หน้าจบทั้ง 3 mission ใส่ป้าย/พื้นหลังให้รู้ว่า "สรุปให้พ่อแม่" + เพิ่มสรุปเชิงตัวเลข (เช่น "ทวน: 2 คำ") ไม่ใช่แค่คำชม (`mission-*.js` ฟังก์ชัน complete/summary, ใช้ `101future.learningAttempts` ที่มีอยู่แล้ว)
- **สลับปุ่มหน้าจบ**: "เล่นอีกครั้ง" = primary, "กลับหน้าเรียน" = secondary ให้เหมือนกันทั้ง 3 mission
- **Focus indicators**: เพิ่ม `:focus-visible` ให้ `.mission-item` และ `.sound-button` ใน `styles.css` (accessibility)
- **Re-verify (ไม่ใช่ของพังแน่นอน)**: ทดสอบ overflow แนวนอน + scroll แนวตั้งระหว่างเล่นบน 390px ของทั้ง 3 mission อีกครั้ง (Mission 1 เคยผ่านแล้ว)

---

## ⛔ ติด blocker — ต้องคน/ภายนอก (Claude/Codex ทำเองไม่ได้)

- **KBank**: รอ service approval + credentials → เอาไปใส่ Render env (ห้ามลง GitHub) แล้วค่อยเทส flow จ่ายเงินจริง
- **เลือก human TTS voice**: ตอนนี้ทั้ง 3 mission ใช้เสียงเบราว์เซอร์ชั่วคราว ต้องเลือก provider/voice ก่อนลง production ถาวร (ดู `VOICE_SELECTION.md`)
- **QA บนอุปกรณ์จริง**: ทดสอบไมค์ Mission 3 + เสียง + การเล่นบนมือถือจริง (โดยเฉพาะ iOS Safari ที่ SpeechRecognition ไม่เสถียร)

---

## 🚫 ตรวจแล้วไม่ใช่ปัญหา (อย่าเสียเวลาตาม — เป็น false positive จากการ audit อัตโนมัติ)

- LINE OAuth state "ไม่ถูกลบ" → จริง ๆ `server.js:790` ลบ state หลังใช้ + กรอง expired แล้ว
- "Path traversal" ใน `serveAsset` → มี `startsWith(ROOT/assets/)` กันถูกต้องแล้ว (`server.js:2389`)
- "Webhook signature bypass" → ใช้ `timingSafeEqual` เทียบ shared secret ต้องรู้ secret ถึงผ่าน ไม่ใช่ bug
- "เพิ่มช่องว่าง นี่คือ + คำ" → ภาษาไทยเขียนติดถูกแล้ว ไม่ต้องเว้นวรรค
- "cache version ใน HTML = leak" → เป็น cache-busting ปกติ ไม่ใช่ข้อมูลภายใน

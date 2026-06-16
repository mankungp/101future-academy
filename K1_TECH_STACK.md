# เครื่องมือทำเกม K1 — สรุปวิจัย + คำแนะนำ (9 มิ.ย. 2026)

## 🎯 ข้อสรุป: stack เดิม "ถูกแล้ว" — เติม Rive + Capacitor
เกมเรา content-bound ไม่ใช่ graphics-bound (แตะ/ลาก/จับคู่+เสียง+JSON ไม่มี physics) → คอขวด=ทำคอนเทนต์เร็ว+โหลดเบาบนมือถือถูก ไม่ใช่ FPS → ยิ่งเบายิ่งดี ไม่ต้องย้าย engine

| ชั้น | ใช้ | ทำไม |
|---|---|---|
| เอนจินเกม | ✅ vanilla HTML/CSS/JS + JSON | เบาสุด, AI เขียนเก่งสุด, data-driven แล้ว |
| **มาสคอต+juice** | ➕ **Rive** | ที่ Duolingo ใช้จริง (ยืนยันบล็อก) · .riv จิ๋ว · state machine · web+iOS+Android |
| ห่อแอป | ➕ Capacitor | ห่อเว็บเดิม โค้ดเดียว ไม่เขียนใหม่ |
| escape hatch | PixiJS เฉพาะเกม sprite เยอะ (อนาคต) | อย่าเอามาทั้งแอป |

## ไม่เลือก: Phaser/Pixi (หนัก, อืดบน Android ถูก) · Construct/GDevelop (ชน JSON model) · Unity/Godot (WebGL หนัก) · RN/Flutter (เขียนใหม่หมด)
## มาสคอต: Rive⭐(interactive,จิ๋ว,Duolingo) · Lottie(ประดับ) · Spine(เกินตัว)
## ยืนยัน: Duolingo=React/RN+Rive · Khan=React Native

## 🚦 ยกระดับคุณภาพ (2 ทาง)
- **A) Rive มาสคอต** = jump ใหญ่สุด (Duolingo-level) — ต้องทำไฟล์ .riv ใน Rive editor (คน/จ้าง)
- **B) code juice (ทำได้ทันที):** animation สปริง/ยืดหด · มาสคอตรีแอคถี่ขึ้น+หลายท่า · sound design (SFX) · transition เนียน · celebration อลังขึ้น
> เกี่ยว memory `production-pipeline` (เคยโน้ต Rive)

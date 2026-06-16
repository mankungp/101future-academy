# Audio Script — อนุบาล 1 (ElevenLabs)

> เสียงมาสคอต "น้องฟิว" — **เสียงเดียวทั้งแอป** (consistency สำคัญกับ immersion)
> ป้อน ElevenLabs ได้เลย · ทำขนานระหว่างรอ build · อัปเดต 8 มิ.ย. 2026

## ตั้งค่าเสียงแนะนำ (ElevenLabs)
- **Voice:** เลือกเสียงอบอุ่น-สดใส **native English** (อเมริกันชัดสุดสำหรับผู้เริ่ม เช่น "Sarah"/"Rachel" หรือเสียงตัวการ์ตูนสดใส) — ฟังหลายตัวแล้วล็อก **ตัวเดียว** ใช้ตลอด
- **Model:** Multilingual v2 หรือ v3 (เสียงเป็นธรรมชาติสุด)
- **Stability:** ~50-60 (สม่ำเสมอ ไม่เพี้ยน)
- **Similarity/Clarity:** สูง (~75)
- **Speed:** ช้าลงนิด (~0.9) — เด็กเล็กต้องได้ยินชัด แยกเสียงทัน
- ออกเสียง **ชัดทุกตัวสะกดท้าย** (เด็กไทยมักตกตัวสะกด: doG, fisH, reD)

## โครงสร้างไฟล์เสียง (naming convention — ให้ตรงเป๊ะ เพื่อให้โค้ดเรียกได้)
```
audio/words/<word>.mp3          เช่น  audio/words/dog.mp3
audio/phrases/<key>.mp3
audio/praise/<key>.mp3
```

---

## 1) คำเดี่ยว (200 คำ) — 1 คำ = 1 ไฟล์
ทำตามรายการใน **`k1/word-bank.md`** ทุกคำ (200 ไฟล์)
- ไฟล์ละ "คำนั้นคำเดียว" ออกเสียงชัด เช่น *"dog."* · *"red."* · *"apple."*
- ตั้งชื่อไฟล์ = ตัวคำ (พิมพ์เล็ก, เว้นวรรค→ขีด: `ice cream`→`ice-cream.mp3`, `wake up`→`wake-up.mp3`)

## 2) ประโยคคำสั่งในเกม (phrases) — แม่แบบ ทำทุกคำที่ใช้ในมิชชันนั้น
> อัดเป็นประโยคเต็ม เพื่อความเป็นธรรมชาติ (ไม่ต่อคำทีละท่อน)

| key | ข้อความที่อัด | ใช้ตอน |
|---|---|---|
| tap-X | "Tap the **red** balloon!" (ทำทุกสี/ของในเกมนั้น) | เกมแตะ |
| where-X | "Where is the **dog**?" | เกมหา |
| find-X | "Find the **apple**!" | เกมหา |
| whatis | "What is it?" | เกมทาย |
| howmany | "How many?" | เกมนับ |
| itsa-X | "It's a **dog**!" / "It's **red**!" | เฉลย/ยืนยัน |
| count-1..10 | "one… two… three…" (อัดทีละเลข + แบบนับต่อเนื่อง) | เกมนับ |

## 3) คำชม / ให้กำลังใจ (praise) — อัดหลายเวอร์ชันให้สุ่มเล่น ไม่ซ้ำจำเจ
- correct: "Yes!" · "Great job!" · "Well done!" · "You did it!" · "Wow!" · "Perfect!"
- retry (ไม่มีคำว่าผิด): "Try again!" · "Almost!" · "Good try!" · "One more time!"
- start: "Let's play!" · "Are you ready?" · "Here we go!"
- win: "You're amazing!" · "Hooray!" · "High five!"

## 4) คำทักทาย (greeting)
"Hello!" · "Hi, friend!" · "Good morning!" · "Bye bye!" · "See you!"

---

## เช็กลิสต์ทำเสียง
- [ ] เลือก + ล็อกเสียงมาสคอต 1 ตัว
- [ ] 200 คำเดี่ยว (จาก word-bank.md)
- [ ] ประโยคคำสั่งของหน่วยต้นแบบที่จะทำก่อน (สี หรือ สัตว์)
- [ ] คำชม/start/win หลายเวอร์ชัน
- [ ] ส่งไฟล์เข้าโฟลเดอร์ `k1/audio/...` ตาม naming ด้านบน

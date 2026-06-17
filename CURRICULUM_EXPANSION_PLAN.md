# 101future — แผนขยายหลักสูตรอนุบาล (K1) → ครบวิชา

> ตัดสินใจ 16 มิ.ย. 2569: **"ลึกอังกฤษ + ขยายวิชาอื่นด้วย"**
> กลยุทธ์แกน = **CLIL / immersion** — สอนทุกวิชา *ผ่านภาษาอังกฤษ* → ได้ทั้งลึกอังกฤษ + เพิ่มวิชา ในเกมเดียว ไม่ทิ้งจุดต่าง (อังกฤษ immersion ที่หลักสูตรไทยไม่บังคับ)
> อิงงานวิจัย [[k1-curriculum-gaps]] (มฐ.ปฐมวัย 2560 + benchmark Khan Kids/Lingokids)

## หลักการ
- เด็ก 3-6 ขวบ · no-text / no-fail / เกมนำ · ภาษาอังกฤษล้วนฝั่งเด็ก · พ่อแม่ดูภาษาไทย
- **reuse engine + asset เดิมก่อนเสมอ** (cost-guard) — gen รูป/เสียงใหม่เฉพาะที่จำเป็น
- 1 หน่วย = data-driven JSON (content/<id>.json) + ลงทะเบียน home.html UNITS + engine STICKERS/UNIT_ORDER

## mechanic ที่ engine มีแล้ว (ใช้ต่อได้เลย)
free-explore · listen-and-tap · listen-and-choose · match · count · sort(จัดกลุ่มสี) · size(ใหญ่/เล็ก) · trace · first-letter · rhyme · song(ทำนอง) · tap-part

## strand วิชา + ลำดับสร้าง

| # | วิชา (subject) | หน่วยที่จะทำ | มฐ.2560 | mechanic | asset |
|---|---|---|---|---|---|
| **P1 — quick win (ของพร้อมแล้ว)** |
| 1 | ตรรกะ/จัดหมวด (คณิต) | **Sort Colors** | มฐ.10 | sort ✅มี | reuse สี ✅ |
| 2 | ดนตรี/จังหวะ | **Color Song** | มฐ.4 | song ✅มี | reuse สี ✅ |
| **P2 — คณิตให้ลึก (table-stake ที่ตื้นสุด)** |
| 3 | นับ 11-20 | Count More | มฐ.10 | count ✅ (balloon ไม่ต้องรูป) | เสียงเลข 11-20 (TTS เล็ก) |
| 4 | จับคู่จำนวน-ตัวเลข | Match Numbers | มฐ.10 | match ✅ | ตัวเลขเป็น hex/emoji |
| 5 | แพตเทิร์น (อะไรมาต่อ) | Patterns | มฐ.10 | **pattern (mechanic ใหม่)** | reuse สี/รูปทรง |
| 6 | วัด/เทียบ (ยาว-สั้น มาก-น้อย) | Compare | มฐ.10 | size/match | reuse |
| **P3 — วิทยาศาสตร์/สำรวจ (ผ่านอังกฤษ)** |
| 7 | สิ่งมีชีวิต-ไม่มีชีวิต | Living or Not | มฐ.10,12 | sort/match (ต่อยอด sort ให้รับรูป) | reuse animals/fruits/things |
| 8 | ประสาทสัมผัส 5 | My Senses | มฐ.12 | listen-and-tap | gen รูป 5 (เล็ก) |
| 9 | จม-ลอย / กลางวัน-กลางคืน | Explore | มฐ.10,12 | sort/match | reuse weather |
| **P4 — SEL + ทักษะชีวิต/EF (differentiator)** |
| 10 | อารมณ์ในสถานการณ์ | How Do They Feel? | มฐ.3 | listen-and-choose | reuse emotions |
| 11 | แบ่งปัน/รอคอย/มารยาท | Be Kind | มฐ.5,8 | listen-and-choose | gen ฉาก (เล็ก) |
| 12 | จำ/ลำดับ (EF) | Memory & Steps | มฐ.10 | **memory (mechanic ใหม่)** | reuse |
| **P5 — ศิลปะ/สร้างสรรค์** |
| 13 | ระบายสี | Color It! | มฐ.11 | **paint (ต่อยอด canvas จาก trace)** | outline เล็ก |
| 14 | ผสมสี | Mix Colors | มฐ.11 | tap/blend | reuse สี |
| **P6 — ลึกอังกฤษ (ขนานไป)** |
| 15 | คำเพิ่ม → เป้า ~600 คำ/3 ปี (ตอนนี้ 236) | ธีมใหม่: food, jobs, places, transport, opposites | มฐ.9 | mechanic เดิม | gen ตามจำเป็น |
| 16 | ฟังเข้าใจ/บทสนทนาสั้น | Listen & Answer | มฐ.9 | listen-and-choose | TTS ประโยค |
| 17 | อ่านยาวขึ้น (sight words เพิ่ม) | Read More | มฐ.9 | listen-and-choose/sight | TTS |

## ภาษาไทย — ยังเป็น "การตัดสินใจ" (ค้าง)
หลักสูตรไทยทุกที่มีภาษาไทย แต่ขัดหลัก immersion. ทางเลือก: (ก) ไม่มีเลย (คงจุดยืน immersion เต็ม) · (ข) แทร็กไทยแยก/สลับได้ (ก-ฮ สระ คำง่าย) เป็น optional · (ค) ฝั่งพ่อแม่เสริมเอง. **รอเจ้าของเคาะ** — ยังไม่สร้างจนกว่าจะตัดสินใจ

## mechanic ใหม่ที่ต้องเขียนเพิ่ม (ตามลำดับคุ้มค่า)
1. **pattern** — แสดงลำดับ 🔴🔵🔴🔵 → เลือกตัวต่อไป (numeracy/logic แกนสำคัญ)
2. **sort รับรูป** — ต่อยอด renderSort ให้จัดกลุ่มด้วยรูป (สัตว์/ผลไม้) ไม่ใช่แค่สี → ปลดล็อกวิทย์/จัดหมวดจริง
3. **paint** — ต่อยอด canvas (มีจาก trace) ให้ระบายสี → ศิลปะ
4. **memory** — เปิดคู่จำ → EF

## สถานะ
- ✅ P1 = สร้างแล้ว (Sort Colors + Color Song) — deploy แล้ว
- ถัดไป: P2 (คณิตลึก) เริ่มที่ pattern mechanic + count 11-20

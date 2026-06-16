# K1 Product Research & Priorities (อนุบาล 1)

> งานวิจัยรอบด้านก่อนเติมฟีเจอร์ — ตลาดไทย, freemium 199฿/เดือน, อายุ 3-4 · ค้น 9 มิ.ย. 2026
> สถานะตอนค้น: ต้นแบบ 7 หน่วย + มาสคอต + สติกเกอร์/ดาว + learning path + daily goal/streak + เสียง Matilda

## 🔑 4 insight หลัก
1. **ช่องว่างใหญ่สุด = โซนผู้ปกครอง (ไม่ใช่คอนเทนต์เด็ก)** — เป็นทั้งกฎหมาย (PDPA: เด็ก <10 ต้อง parental consent) + ตัวเพิ่ม retention อันดับ 1 (โชว์ progress ให้พ่อแม่ → churn ต่ำลง ~2-3 เท่า). benchmark kids-edu churn ~7.4%/เดือน, top quartile 2%.
2. **streak/รางวัลภายนอก ไม่เหมาะเด็ก 3-4 (ฝั่งเด็ก)** — overjustification effect (รางวัลลดแรงจูงใจในตัว ยิ่งเด็กเล็กยิ่งแรง) + AAP เน้น co-play/น้อยๆพอ ไม่ดันเล่นทุกวัน. **streak = กลไกสำหรับพ่อแม่** → ฝั่งเด็กต้อง intrinsic (เล่น/มาสคอต/สติกเกอร์ low-stakes, ไม่มี loss/แดง/timer/leaderboard). โชว์ streak แบบนุ่มฝั่งพ่อแม่ได้ ("สัปดาห์นี้เล่น 3 วัน")
3. **199฿ สมเหตุสมผล แต่คู่แข่งคือ "ฟรี"** — Khan Kids ฟรี, Galaxy Kids (ออฟฟิศ BKK, คู่แข่งตรง) มี free tier. → 2 หน่วยฟรี + ความคุ้ม paid ต้องชัด สำคัญกว่าตัวเลขราคา. (เทียบ: อนุบาล EP ~5,000฿/เดือน, Novakid ติวสด ~€10-16/คาบ → แอป 199฿ ถูกมาก)
4. **คอนเทนต์ต้องลึกพอ** — 60% เลิกจ่ายเพราะ "เบื่อ/เล่นหมด" + "โตเกินคอนเทนต์". 7 หน่วยไม่พอ → ต้องแผนเพิ่มหน่วย + ระดับถัดไป (ตรง vision อนุบาล→ม.6). multi-level เพิ่ม LTV 3-5 เท่า

## 🎯 จุดยืน daily-play + เห็นผล (สรุปจากเจ้าของ 9 มิ.ย.)
พ่อแม่อยากให้เด็ก **เล่นทุกวัน + เห็นผลการเรียน** = **จุดขายหลัก + ตัวรั้งให้จ่ายต่อ** (ไม่ขัดงานวิจัย — แค่ต้อง "ทำให้ถูกฝั่ง"):
- **โชว์ daily-habit + ผลการเรียนให้ "พ่อแม่"** (คนอยากเห็น + คนจ่าย): ปฏิทินเล่นรายวัน + streak ("ลูกเล่นต่อเนื่อง 5 วัน!") + เรียนกี่คำ/หน่วยจบ/เก่งอะไร/กี่นาที + (ทีหลัง) push เตือน → พ่อแม่เห็นว่า "เล่นทุกวันแล้วได้จริง"
- **ฝั่งเด็ก = intrinsic + บวกล้วน** — ไม่มี streak หลุด/แดง/timer/ลงโทษ (เด็ก 3 ขวบรับไม่ไหว + กดดันลดความอยากเรียน). โชว์เด็กแบบบวกได้ "เล่นมา 5 วันแล้ว เก่งมาก! 🎉"
- → **daily-habit + results = หัวใจของโซนผู้ปกครอง (P0)** ไม่ใช่แค่ dashboard เฉยๆ
- ⚠️ ต้องปรับ: หน้าโฮม journey ตอนนี้โชว์ 🔥streak ฝั่งเด็ก → ปรับให้บวกล้วน + ย้ายตัวเด่นไปฝั่งพ่อแม่

## 🔒 Privacy/safety ต้องมี (เด็ก <5)
- **PDPA ไทย:** เด็ก <10 ต้อง parental consent (ชัด/เจาะจง/ถอนได้), ระบุตัวผู้ปกครอง, ภาษาที่เข้าใจ. **เสียงเด็ก (say-it-back) = voiceprint** → เลี่ยงเก็บ หรือต้อง consent
- **COPPA/kidSAFE** (มาตรฐานความเชื่อถือสากล): verifiable parental consent, ไม่มีโฆษณา, ไม่มี IAP ที่เด็กกดถึง, ไม่มีลิงก์ออก/แชท, data minimization
- **trust signals พ่อแม่ดู:** privacy policy ไทย+อังกฤษ, consent flow, ad-free badge, (ระยะยาว) kidSAFE+ COPPA seal = ต่างจากแอปไทยทั่วไป

## 📋 ลำดับความสำคัญ
| | งาน | เหตุผล |
|---|---|---|
| **P0** (ก่อนเก็บเงิน) | โซนผู้ปกครอง + **parent gate** · หน้าสรุป progress (คำที่เรียน/หน่วยจบ/สัปดาห์นี้ — ไม่ใช่ analytics หนัก) · privacy/consent + ad-free + ไม่มี IAP เด็กกด · **ปรับ streak → ฝั่งพ่อแม่ no-loss** | กฎหมาย + retention/conversion |
| **P1** | onboarding (ตั้งโปรไฟล์ลูก + สอนพ่อแม่ co-play) · multi-child profiles · **แผนเพิ่มหน่วย/ระดับ** | conversion + กันเบื่อ (churn) |
| **P2** | offline mode · tip เล่นต่อ offline (แบบ Sago Mini) · voice/pronunciation (ระวัง PDPA) · accessibility · kidSAFE seal | ความครบ/น่าเชื่อถือ |

## คู่แข่ง (ตลาดไทย/ภูมิภาค)
- **Galaxy Kids** — คู่แข่งตรงสุด, ออฟฟิศ BKK, อังกฤษ+จีน, kid-safe/ad-free, app+คลาสสด+AI tutor, freemium (ราคา THB ไม่เปิดเผย — **ต้องเช็คเองใน store**)
- Lingokids/Studycat/Lingumi(=Novakid) — global ไม่มี edge ไทย · Novakid = ติวสด แพง · Khan Kids = ฟรี (เบสไลน์ที่พ่อแม่คาดว่าไม่ต้องจ่าย)

## ⚠️ ค้างเช็คเอง
- ราคา Galaxy Kids เป็น THB (ไม่เปิดเผย — ดู Thai App/Play Store)
- ตัวเลข willingness-to-pay แอปเด็กของพ่อแม่ไทยตรงๆ (ที่ได้เป็นการ triangulate จากราคาโรงเรียน/ติว)

## แหล่งอ้างอิงหลัก
RetentionCheck (kids-edu churn), Lepper overjustification studies, AAP screen-time, Thailand PDPA (Securiti/Tilleke), kidSAFE/FTC COPPA, 6Wresearch/Technavio (ตลาดการศึกษาไทย), Novakid/Veles-Club (ราคา), Galaxy Kids

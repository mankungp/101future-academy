# Open This First: 101 Future

อ่านไฟล์นี้ก่อนทุกครั้งที่กลับมาทำโปรเจกต์ 101 Future

## ตอนนี้เรากำลังทำอะไร

เรากำลังสร้างเว็บ `101future.com` ให้เริ่มจากคอร์สประถม ป.1-ป.6 ก่อน

แนวขายหน้าเว็บ:

- เด็กเลือกเริ่มจากวิชาที่ต้องการได้: คณิต, วิทย์, อังกฤษ, ภาษาไทย
- บทเรียนอิงหลักสูตรไทย
- AI ช่วยสรุปว่าเด็กควรซ้อมอะไรต่อ
- เริ่มจากรายเดือน 299 บาทต่อวิชา
- Login หลักใช้ LINE
- ช่วงรอ KBank เปิดให้ลงชื่อสนใจผ่าน LINE เพื่อไม่ให้ lead หาย

## สิ่งที่ทำเสร็จแล้ว

1. หน้าเว็บจริงเปลี่ยนเป็น ป.1-ป.6 แล้ว
2. หน้า mobile ตรวจแล้ว ไม่ล้นแนวนอน
3. LINE Login backend พร้อมใช้บน production
4. `/learn?package=...` บันทึกแพ็กที่สนใจลงบัญชี LINE ได้
5. Admin มีแผง `LINE Interest` สำหรับดูคนที่สนใจแยกตามวิชา
6. Admin กดเตรียมรายการชำระเงินจาก LINE Interest ได้
7. Payment/order/link structure พร้อมรอ KBank credentials

## สิ่งที่ต้องทำต่อ

1. รอ KBank service approval
2. เอา KBank QR credential ไปใส่ Render
3. ทดสอบ LINE Login จริง: เลือกแพ็ก -> login -> ดูรายการใน Admin LINE Interest
4. จาก Admin กดเตรียมรายการชำระเงิน
5. ทดสอบหน้าจ่ายเงิน `/pay?order=...`
6. ทดสอบ KBank callback แล้วเปิดสิทธิ์เรียน 30 วัน
7. ทำบทเรียนจริง 4 วิชาแรกของ ป.1-ป.6
8. ทำ progress tracking
9. ทำ AI feedback pipeline
10. ทำ dashboard สำหรับนักเรียน/ผู้ปกครอง

## ของที่ต้องไปเอามา

อย่าใส่ secret จริงลง GitHub ให้เอาไปใส่ใน Render Environment Variables เท่านั้น

LINE Developers:

- Channel: `101 Future`
- Status: Published
- `LINE_CHANNEL_ID`: `2010237394`
- `LINE_CHANNEL_SECRET`: เอาจาก LINE Developers แล้วใส่ Render เท่านั้น ห้ามใส่ใน GitHub
- Callback URL: `https://www.101future.com/auth/line/callback`
- Scope ที่ใช้ตอนนี้: `profile openid`

KBank API Portal:

- `PAYMENT_PROVIDER=kbank`
- `PAYMENT_PROVIDER_API_KEY`: ยังไม่ได้ใส่
- `PAYMENT_WEBHOOK_SECRET`: ยังไม่ได้ใส่
- `KBANK_QR_CREATE_URL`: ยังไม่ได้ใส่
- `KBANK_MERCHANT_ID`: ยังไม่ได้ใส่
- `KBANK_TERMINAL_ID`: ถ้ามี
- `KBANK_BRANCH_ID`: ถ้ามี
- สถานะล่าสุด: สร้าง KBank app แล้ว, ทดสอบ API ผ่าน 15/15, ขั้นสมัครบริการต้องใช้ข้อมูลนิติบุคคล/ร้านจริง

## ไฟล์สำคัญ

- สถานะล่าสุด: `PROJECT_STATUS.md`
- Roadmap: `EDTECH_10_PHASES.md`
- เว็บหน้าแรก: `index.html`
- Backend: `server.js`
- หน้าเข้าเรียน: `learn.html`, `learn.js`
- หลังบ้าน: `admin.html`, `admin.js`
- หน้าจ่ายเงินให้ผู้ปกครอง: `pay.html`, `pay.js`

## คำสั่งที่ใช้เช็กก่อน publish

```bash
npm run check
```

## คำสั่ง publish

```bash
GITHUB_TOKEN=$(cat /Users/m4-ai/.openclaw/shop/.secrets/github-token) node scripts/push-github.js
```

## กติกาสำหรับ Codex

ถ้าเริ่มแชทใหม่ ให้บอกว่า:

```text
เปิดโปรเจกต์ 101future ต่อ อ่าน OPEN_THIS_FIRST.md ก่อน
```

แล้วค่อยทำงานต่อจาก `PROJECT_STATUS.md`

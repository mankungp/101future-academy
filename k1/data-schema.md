# Data Schema — อนุบาล 1 (platform-agnostic)

> ออกแบบให้ **เว็บ (ตอนนี้) + iOS/Android (อนาคต)** อ่าน data ตัวเดียวกัน
> เนื้อหา = JSON ล้วน · asset = อ้างด้วย path · ตัว render แยกตาม platform
> อัปเดต 8 มิ.ย. 2026

---

## หลักการ (ยึดให้ครบ ไม่งั้นย้าย native ลำบาก)
1. **Data ≠ Code** — เนื้อหาอยู่ใน `.json` เท่านั้น ห้ามฝังคำ/ภาพ/เสียงในโค้ด UI · frontend มีหน้าที่แค่ "อ่าน JSON แล้ววาด"
2. **Asset อ้างด้วย path/key ไม่ฝังไฟล์** — `"image": "img/red.png"` ไม่ใช่ base64 → native bundler หยิบไปได้
3. **Mission type = enum คงที่** — data เลือก `type` + `config` · แต่ละ platform เขียน "เครื่องเล่น" ของแต่ละ type เอง (web=JS, iOS=Swift, Android=Kotlin/Flutter) · **คนทำเนื้อหาไม่แตะโค้ด**
4. **ไม่มีอะไรเฉพาะ web ใน data** — ห้ามมี HTML/CSS/URL เว็บใน JSON · เก็บแค่ความหมาย (semantic)
5. **Offline-first** — เล่นได้โดยไม่ต้องต่อเซิร์ฟเวอร์ (ดีกับเด็ก/ไม่มีโฆษณา/คุม screen-time) · asset bundle ไปกับแอป · progress เก็บ local แล้วค่อย sync ทีหลัง
6. **มี version** — `schemaVersion` + `contentVersion` ไว้อัปเดตเนื้อหา OTA โดยไม่ต้องอัปแอป

---

## โครงโฟลเดอร์
```
k1/
├─ content/
│  ├─ course.json          ← สารบัญ (ลิสต์หน่วย + เวอร์ชัน)
│  └─ <unit>.json          ← 1 หน่วย = 1 ไฟล์ (เช่น colors.json)
├─ img/<word>.png          ← Canva export (transparent)
└─ audio/
   ├─ words/<word>.mp3      ← ElevenLabs คำเดี่ยว
   ├─ phrases/<key>.mp3     ← ประโยคคำสั่ง
   └─ praise/<key>.mp3      ← คำชม
```

## course.json (สารบัญ)
```json
{
  "schemaVersion": 1,
  "contentVersion": "2026-06-08",
  "language": "en",
  "ageBand": "k1",
  "units": [
    { "id": "colors",  "order": 9,  "file": "content/colors.json",  "icon": "img/_unit-colors.png" },
    { "id": "animals", "order": 6,  "file": "content/animals.json", "icon": "img/_unit-animals.png" }
  ]
}
```

## <unit>.json — โครง 1 หน่วย
```jsonc
{
  "id": "colors",
  "order": 9,
  "title": "Colors",
  "theme": "things-around",          // อิงสาระหลักสูตร 2560
  "standard": {                      // *** บังคับทุก unit (MASTER_PLAN 3.2) — map หลักสูตร ใช้ขายความเชื่อใจ + dashboard ***
    "earlyYears2560": ["มฐ.9","มฐ.10"],  // มาตรฐานปฐมวัย 2560
    "core2551": "ต1.1",                  // แกนกลาง 2551 ภาษาต่างประเทศ (ตัวชี้วัด)
    "commonCore": "L.K.5",               // US Common Core (L.K.5 / RF.K / Math K.CC ...)
    "cefr": "Pre-A1"                     // กรอบ CEFR (อนุบาล = Pre-A1 Starters)
  },
  "intro": { "audio": "audio/phrases/intro-colors.mp3" },

  // คลังคำของหน่วยนี้ (mission อ้างถึงด้วย id)
  "words": [
    {
      "id": "red",
      "text": "red",
      "image": "img/red.png",
      "audio": "audio/words/red.mp3",
      "meta": { "hex": "#ff5b5b" }     // metadata เฉพาะชนิด (สีมี hex, เลขมี value)
    }
  ],

  // มิชชัน = เลือก type + config + อ้างคำจาก words[]
  "missions": [
    {
      "id": "colors-tap",
      "type": "listen-and-tap",        // ← enum (ดูคลังด้านล่าง)
      "items": ["red","yellow","blue","green"],
      "rounds": 4,
      "prompt": { "text": "Tap the {word} balloon!", "audioPattern": "audio/phrases/tap-{id}.mp3" },
      "config": { "choices": 4, "render": "balloon" }
    }
  ],

  "reward": { "sticker": "img/_sticker-rainbow.png" }
}
```

## คลัง Mission Types (enum คงที่ — ทุก platform implement ตามนี้)
| type | การเล่น | config สำคัญ |
|---|---|---|
| `free-explore` | แตะอะไรก็มีเสียง (warm-up) | — | ✅ web |
| `listen-and-tap` | ฟังแล้วแตะให้ถูก | `choices`, `render` | ✅ web |
| `match` | จับคู่การ์ด 2 คอลัมน์ (ภาพ-ภาพ / ภาพ-เสียง) | `mode`, `pairs` | ✅ web |
| `sort` | ลากจัดหมวด | `objectsPerBucket` | ✅ web |
| `count` | นับของ (≤5) | `counts` | ✅ web |
| `tap-part` | แตะอวัยวะบนตัวละคร | (อ่าน x/y% จาก word) | ✅ web |
| `trace` | ลากนิ้วตามรอย (เตรียมเขียน) | (อ่าน `trace` จาก word) | ✅ web |
| `listen-and-choose` | ฟังแล้วเลือก 2-3 | `choices` | ⬜ |
| `say-it` | พูดตาม (ไม่ให้คะแนน) | — | ⬜ |

> เพิ่ม type ใหม่ได้ แต่ต้องเพิ่มทั้ง 3 ฝั่ง (web/iOS/Android) ให้ตรงกัน · **no-fail เสมอ** (ผิด=ใบ้เบาๆ ไม่มีโทษ)

### `match` — สเปกจริง (มิ.ย. 2569)
2 คอลัมน์: ซ้าย=cue, ขวา=ภาพ · แตะ cue ซ้าย (ได้ยินคำ) แล้วแตะภาพขวาที่คู่กัน · ผิด=สั่นเบาๆ
```jsonc
{ "type": "match", "items": ["apple","banana","orange","grape"],
  "prompt": { "text": "Match the pictures!" },
  "config": { "mode": "image-image", "pairs": 4 } }   // mode: "image-image"(เริ่มต้น) | "image-sound"
```
- `mode:"image-image"` = 2 คอลัมน์ภาพ จับคู่ภาพเหมือน (แตะ cue ซ้ายได้ยินคำ)
- `mode:"image-sound"` = **เกมบอกชื่อ ("Tap the {word}!") เด็กกดรูปตามที่บอก** (ไม่มีปุ่ม 🔊 ให้กด) → prompt ควรมี `{word}` เพื่อโชว์คำใน bubble ด้วย
- `pairs` = จำนวนรูป (เริ่มต้น = จำนวน items; image-image เริ่มต้น 4)

### `trace` — สเปกจริง (มิ.ย. 2569)
ลากนิ้วผ่าน waypoint ตามลำดับ (จุดเริ่มเขียวเด้ง) · hit radius ใหญ่สำหรับนิ้วเด็ก · `touch-action:none` กันจอเลื่อน
```jsonc
// mission: อ้าง items → แต่ละ word ใส่ field "trace" = waypoint normalized 0..1 (ตามลำดับเขียน)
{ "id":"one", "text":"one", "label":"1", "audio":"audio/words/one.mp3",
  "trace": [[0.5,0.2],[0.5,0.42],[0.5,0.62],[0.5,0.82]] }
```
- โชว์ glyph จาง = `label` (ตัวอักษร/เลข) หรือ `image` (รูป) ด้านหลัง
- ถ้า word ไม่มี `trace` → ใช้ path เริ่มต้น (เส้นซ้าย→ขวา) เล่นได้เสมอ

---

## Progress / สถานะเด็ก (platform-agnostic, เก็บ local → sync ทีหลัง)
```jsonc
{
  "childId": "local",
  "unitsDone": { "colors": { "stars": 3, "lastPlayed": "..." } },
  "stickers": ["rainbow", "lion"],
  "wordsSeen": { "red": 7, "blue": 5 }      // นับความถี่ → ไว้ทำ spaced repetition + สรุปพ่อแม่
}
```

## เส้นทางทำเป็น iOS/Android (ทางเลือก — data รองรับทุกทาง)
| ทาง | ความเร็ว | ฟีล/แอนิเมชัน | หมายเหตุ |
|---|---|---|---|
| **Capacitor / PWA wrap** | เร็วสุด (ห่อเว็บเดิม) | ดีพอ | ใช้โค้ดเว็บ + JSON เดิมเลย → ออก store ได้ไว |
| **React Native / Flutter** | กลาง | ลื่นสุด | reuse JSON เดิม เขียน render ใหม่ |
> ไม่ว่าเลือกทางไหน **content JSON + img + audio ใช้ซ้ำ 100%** เปลี่ยนแค่ตัว render — นี่คือเหตุผลที่วาง data แบบนี้

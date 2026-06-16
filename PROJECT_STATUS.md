# 101 Future Project Status

Last updated: 2026-06-10

---

# 🔵 ทิศทางปัจจุบัน — เฟส A (เจ้าของอนุมัติ 10 มิ.ย. 2569)

> **เปลี่ยนทิศ:** โฟกัส **อนุบาลก่อน** (อ.1→อ.2→อ.3) · **ป.1 เดิมหยุดขายแล้ว** (freeze — ไม่ดูแล เก็บ lead LINE อย่างเดียว ส่วน ป.1 เดิมทั้งหมดอยู่ครึ่งล่างของไฟล์นี้ ไว้ใช้เฟส D) · **เว็บรื้อใหม่คู่ขนาน** ใน `web/` (ห้ามแตะเว็บเดิมบน Render)
> เอกสารหลัก: `PHASE_A_WORK_ORDER.md` · `MASTER_PLAN.md` · `WEBSITE_MASTER_PLAN.md` · `INTEGRATION_SPEC.md`

## เฟส A — log ความคืบหน้า

### ✅ ปรับตามฟีดแบ็กเจ้าของ (10 มิ.ย. รอบ 2)
- **trace:** เพิ่มเส้น ink สีส้มวิ่งตามนิ้วจริง + เปลี่ยนเขียวตอนจบ · **ใช้ canvas (ไม่ใช่ SVG)** เพราะ SVG non-scaling-stroke เรนเดอร์ไม่ขึ้นบาง in-app browser → canvas ชัวร์ทุกเบราว์เซอร์ · รองรับทั้ง pointer+touch · v=17 (เทสต์: canvas วาดเส้นจริง 4819px ✅)
- **match image-sound:** เอาปุ่ม 🔊 ออก → เปลี่ยนเป็น "เกมบอก Tap the {word}! เด็กกดรูปตามที่บอก" (`renderMatchSound`) · grid รูปอย่างเดียว
- bump `?v=16` · เทสต์ทะลุ _demo: match เสียงบอกคำ+กดถูก ✅ · trace เส้นโชว์ ✅ · celebrate ✅

### ✅ เสร็จ — ข้อ 1: Mission engine ใหม่ 2 ชนิด (10 มิ.ย.)
- เพิ่ม **`match`** (จับคู่ 2 คอลัมน์: `mode` image-image / image-sound, `pairs`) ใน `k1/engine.js`
- เพิ่ม **`trace`** (ลากนิ้วตามรอย waypoint, จุดเริ่มเขียวเด้ง, hit radius ใหญ่, `touch-action:none`) — รองรับ pointer+touch
- no-fail ทั้งคู่ (ผิด=สั่น/ใบ้เบาๆ) · CSS ใน `k1/style.css` · เอกสาร `k1/data-schema.md` อัปเดตตรง implementation
- bump cache `play.html` → engine/style `?v=15`
- **ทดสอบบนมือถือจริง (puppeteer 412px touch):** match image-image เล่นจบ→เด้งมิชชันถัดไป ✅ · trace ลากผ่าน 3 ตัว→celebrate ✅ · render ทั้ง 3 สวย ✅
- unit ทดสอบ: `k1/content/_demo.json` (match 2 โหมด + trace เลข 1/2/3 มี path)

### ✅ เสร็จ — ข้อ 4: เว็บใหม่ P0 (ทำไปก่อนหน้าวันเดียวกัน)
- `web/` 10 หน้า: หน้าแรกเลือกช่วงวัย + แลนดิ้งอนุบาล (เชื่อมเกม `../k1/home.html`, 199฿ + 2 หน่วยฟรี) + ประถม/มัธยม(coming soon) + pricing/safety/about/faq/privacy/terms
- design system = `web/assets/css/site.css` (หมายเหตุ: work order เขียน `design/tokens.css` — ชื่อไฟล์ต่างแต่หน้าที่เดียวกัน)
- ยังไม่ deploy staging / ยังไม่สลับ DNS

### ✅ เสร็จบางส่วน — ข้อ 3: progress layer กลาง (10 มิ.ย.)
- วาง **`k1/progress-store.js`** = `ProgressStore` seam ตาม INTEGRATION_SPEC §3 (LocalProgressStore)
  - childId namespace `future.progress.<childId>` (อ่าน `?child=` default 'local') · event outbox append-only + client UUID · migrate อัตโนมัติจาก `k1_progress` เดิม
  - API: load/save (compat เกมเดิม) + recordEvent + sync(no-op) + isEntitled(local=true) + onSyncStateChange
- wire `engine.js` ผ่าน store + record event `started`/`completed` unit · `home.html` อ่าน store เดียวกัน · เพิ่ม `<script progress-store.js?v=15>`
- **ทดสอบผ่าน:** migration ✅ · recordEvent ✅ · child namespace แยก ✅ · เกม boot+started event ✅ · home อ่าน store (9⭐/3streak) ✅ · ไม่มี error (เหลือแค่ favicon 404)
- **ยังไม่ทำ (เลื่อน):** การแยกไฟล์ core/theme เป็นโมดูลใหญ่ — INTEGRATION_SPEC บอก seam สำคัญกว่า file-split + work order ห้าม rewrite ใหญ่ → ทำ seam (progress) ซึ่งคุ้มสุดแล้ว

### ✅ เสร็จ — ข้อ 2: หน่วยใหม่ #1 Emotions/Feelings (10 มิ.ย.)
- **อาร์ต:** ตัวการ์ตูนอ้วนกลม cream 3D (Gemini) 6 อารมณ์ happy/sad/angry/scared/sleepy/surprised · **character-lock** (gen happy เป็น ref แล้วแก้แค่สีหน้า → เข้าชุดเป๊ะ) · ลบพื้น floodfill โปร่ง · `k1/img/emotions/*.png`
- **เสียง:** Matilda (ElevenLabs) — 6 คำ + 6 ประโยค "Tap the X face!" + intro "Let's learn feelings!"
- **เกม 3 มิชชัน:** free-explore (แตะหน้าฟังคำ) → listen-and-tap (แตะหน้าอารมณ์) → match image-sound (บอกแล้วกดรูป) · `content/emotions.json`
- ลงทะเบียน: sticker 😊 + UNIT_ORDER + home.html (node Feelings) + rebuild units.js · bump engine v=18
- **เทสต์ทะลุจบ (มือถือ):** explore→tap แตะถูกครบ 6 →match→celebrate ✅ · ไม่มี error
- **ยังไม่ deploy R2** (ยังเล่นได้แค่ local) → ต้องอัป img/emotions + audio + emotions.json ขึ้น R2 (รออนุมัติ deploy)

### ✅ เสร็จ — หน่วยใหม่ #2 School + #3 Self-care (10 มิ.ย.)
- **School** (book/bag/pencil/crayon/scissors/chair) — วัตถุ 3D น่ารัก (Gemini Flash) · sticker 🎒
- **Self-care** (wash-hands/brush-teeth/eat/drink/sleep/bath) — **ตัวละครครีมเดิม** (character-lock จาก Emotions) ทำ 6 ท่า ผูกหน่วยเข้าชุด · sticker 🧼
- ลบพื้น floodfill · Matilda 12 คำ + 12 ประโยค + 2 intro · 3 มิชชัน/หน่วย (explore→tap→match)
- ลงทะเบียน STICKERS+UNIT_ORDER+home (node Take Care, My School)+units.js · bump v=19
- **เทสต์ทะลุจบทั้ง 2 หน่วย (มือถือ):** แตะถูกครบ 6 →match→celebrate ✅ ไม่มี error

### ✅ เสร็จ — เติม `standard:` (map หลักสูตร) ครบทุกหน่วย
- ทุก unit JSON มี `standard{earlyYears2560, core2551, commonCore, cefr}` (MASTER_PLAN 3.2 บังคับ) · อัปเดต data-schema.md

### ✅ เสร็จ — หน่วยใหม่ #4 Weather + #5 Move & Music (10 มิ.ย.) → **ครบ 12/12!**
- **Weather** (sun/moon/star/cloud/rain/rainbow) — วัตถุ 3D น่ารัก · sticker ☀️
- **Move & Music** (clap/sing/dance/jump/run/drum) — ตัวละครครีมเดิมทำ 6 ท่า/แอคชั่น · sticker 🎵
- ลบพื้น · Matilda 12 คำ + 12 ประโยค + 2 intro · 3 มิชชัน/หน่วย · ลงทะเบียน+units.js · bump v=20
- **เทสต์ทะลุจบทั้ง 2 (มือถือ):** แตะถูกครบ →match→celebrate ✅ (weather เจอ false-fail จากบั๊กเทสต์ rain/rainbow → แก้ regex \b ยืนยันเกมปกติ)

### 🎉 อนุบาล 1 = **12/12 หน่วย ครบแล้ว** (ทำเสร็จ+เทสต์ทุกหน่วย, local)
Colors · Feelings · Take Care · My School · Animals · Fruits · Weather · Shapes · Numbers · Family · My Body · Move & Music
> 7 เดิม LIVE บน R2 อยู่แล้ว · 5 ใหม่ (Emotions/School/Self-care/Weather/Music) เสร็จ local **รอ deploy R2**

### ✅ DEPLOY แล้ว — อนุบาล 12/12 LIVE บน R2 (10 มิ.ย. เจ้าของอนุมัติ)
- อัปผ่าน `scripts/r2-upload.sh` → bucket `101future-assets` prefix `k1/` · LIVE: **https://pub-6ae1d2a213bb42df8cf6dda518ab6574.r2.dev/k1/home.html**
- ขึ้น: 30 รูป (5 หน่วยใหม่) + 99 words + 113 phrases audio + 12 content JSON + units.js + engine/style/play/home/progress-store (v=20)
- **กัน `_demo` ไม่ขึ้น prod** (rebuild units.js ไม่มี _demo) · verify: 24/24 objects = 200, CDN เสิร์ฟ play.html v=20 ใหม่ (ไม่ค้าง cache), ทุก unit JSON มี standard
- หมายเหตุ: เล่นเกม live ผ่าน puppeteer จาก sandbox ไม่ได้ (เบราว์เซอร์เข้า external https ไม่ได้) — แต่ไฟล์เหมือน localhost ที่เทสต์ผ่านทุกหน่วย + object 200 ครบ

### ✅ เฟส B เริ่ม — Phonics Track B v1: หน่วย ABC LIVE (10 มิ.ย.)
- **ABC** (ตัวอักษร A-Z) — label-based ไม่ต้อง gen รูป · 26 ตัวอักษร เสียง Matilda พูดชื่อตัว ("A".."Z")
- มิชชัน: **listen-and-tap** "Find the letter X!" (รู้จักตัวอักษร, RF.K.1d) + **trace** 6 ตัว (c/o/l/i/u/v ลากตามรอย — เขียน) · standard = Common Core RF.K.1d + RF.K.3
- **เลี่ยง TTS พูด phoneme เดี่ยว** (/b/ ออกไม่ชัด) → v1 ใช้ชื่อตัวอักษร · sticker 🔤
- เทสต์: find 10/10 + trace 6/6 + celebrate ✅ · **deploy R2 แล้ว** (play v=21, 26 letter audio + abc.json, verify 200 ครบ)

### ✅ Track B v2: หน่วย First Sounds LIVE (10 มิ.ย.)
- **First Sounds** (เสียงแรก/onset) — โชว์ตัวอักษรใหญ่ + รูปให้เลือกอันที่ขึ้นต้นด้วยตัวนั้น (RF.K.2d/RF.K.3a)
- **mission type ใหม่ `first-letter`** (relational — ของเดิม match แบบ identity ไม่พอ) · reusable ทุก onset
- **ใช้ภาพ+เสียงเดิม 10 คำ** (apple/bear/cat/dog/elephant/fish/lion/moon/pig/sun) ไม่ต้อง gen รูป · เผา credit แค่ intro 1 ไฟล์ · sticker 👂
- บั๊กที่เจอ+แก้: `fillItem` เช็ค meta.hex ก่อน image → เอา hex ออกจากคำ, ให้ big-letter ใช้ palette เอง
- เทสต์: first-letter 8/8 + celebrate ✅ · **deploy R2 + verify 200** (play v=22, engine renderFirstLetter, style fl-letter)
- **อนุบาลรวม 14 หน่วย LIVE** (12 ธีม + 2 phonics: ABC, First Sounds)

### ✅ Parent Summary LIVE (10 มิ.ย.) — จุดขาย "พ่อแม่เห็นผล"
- หน้า **`k1/parent.html`** (UI ไทย, parent-facing) อ่านจาก ProgressStore event log (localStorage) — ไม่ต้องต่อ Supabase
- โชว์: วันนี้เล่นยัง/streak · หน่วยจบ X/14 (progress bar) · คำศัพท์ที่เรียน (≈ ผลรวมคำหน่วยที่จบ) · ดาว · แนะนำหน่วยต่อ · รายการหน่วยจบ · timeline กิจกรรมล่าสุด (จาก event log) · note ปรัชญา no-pressure
- ปุ่ม "👪 ผู้ปกครอง" บน home.html · เทสต์: 4/14, 54 คำ, streak/ดาว/กิจกรรมถูกต้อง ✅ · **deploy R2 + verify 200**
- ยังเป็น localStorage ต่อเครื่อง → P1 จริงค่อยซิงก์ Supabase + LINE family + PIN gate

### ✅ child-home principle fix + Rhyme LIVE (10 มิ.ย.)
- **ย้าย streak/เป้ารายวันออกจากหน้าเด็ก** → เหลือแค่ "Let's Play!" + ⭐ดาวสะสม (collectible เชิงบวก) · ตัวเลขกดดันอยู่ฝั่งพ่อแม่หมด (ตาม MASTER_PLAN 4.2 / research no-pressure) · deploy แล้ว
- **Rhyme Time** (คล้องจอง) — mission type ใหม่ `rhyme` (match by `rime`) · ตระกูล -at (cat/hat/bat) + -og (dog/frog/log) · gen รูปเพิ่ม 3 (hat/bat/log) + เสียง · sticker 🎩 · เทสต์ 6/6+celebrate ✅ deploy v=23

### 📊 สรุป LIVE บน production ตอนนี้
- เกมอนุบาล **15 หน่วย** = 12 ธีม + 3 phonics (ABC 🔤, First Sounds 👂, Rhyme 🎩)
- mission types: free-explore/listen-and-tap/count/tap-part/sort/match/trace/first-letter/rhyme
- หน้า **รายงานผู้ปกครอง** (parent.html) · ProgressStore event log · ทุก unit มี standard
- เว็บใหม่ web/ (10 หน้า) — **ยังไม่ deploy** (รอตัดสินใจที่อยู่)

### ✅ เฟส C เริ่ม — อ.2 เปิดหัว (10 มิ.ย.)
- **โครง level:** unit JSON มี field `level` (k1/k2) · home.html แยกหมวด "อนุบาล 1" / "อนุบาล 2 · ประโยค" (zigzag แก้ให้นับเฉพาะ node ไม่ให้ header ทำเพี้ยน)
- **mission type ใหม่ `listen-and-choose`** (ฟังประโยค→เลือกภาพ) — จุดเด่น อ.2 = ประโยค ไม่ใช่คำเดี่ยว (ใช้กลไก listen-and-tap ที่ promptFor รองรับประโยค)
- **อ.2 หน่วยแรก "I Can See"** (k2see) — ประโยค "I see a {animal}!" ใช้ภาพสัตว์เดิม + เสียงประโยค Matilda · sticker 👀 · เทสต์ 6/6+celebrate ✅ deploy v=24
- **อ.2 เพิ่ม 2 หน่วย (10 มิ.ย.):** "It Is..." (k2it, รูปทรง — "It is a star!") + "I Like..." (k2like, ผลไม้ — "I like banana!") · ใช้ภาพเดิม + เสียงประโยค Matilda · เทสต์ 6/6 ทั้งคู่ + celebrate ✅ deploy v=25
- **อ.2 เพิ่ม "I Can.." (k2can, action/กริยา 💪) + "Where Is..?" (k2where, สัตว์ชุดใหม่ 🔍)** · เทสต์ 6/6 ทั้งคู่+celebrate ✅ deploy v=26
- **อ.2 ตอนนี้ 5 หน่วย** (I See / It Is / I Like / I Can / Where Is) — sentence frames หลากหลาย (statement/verb/question) ครอบคลุมศัพท์ สัตว์/รูปทรง/ผลไม้/action
- **อ.2 เพิ่ม 4 มิติ (10 มิ.ย. "ทำทั้งหมด"):** 🧮 How Many?(count) · ✏️ Write Letters(trace +6→รวม 12) · 🆚 Big or Small?(**mission ใหม่ `size`** ภาพเดียว 2 ขนาด + tool ใหม่ gen-phrase.mjs) · 🙌 I Have..
- **อ.2 เพิ่มโดเมนใหม่:** 🏠 This Is My..(ครอบครัว, social) · 🎨 It Is (สี — color tiles hex)
- **อ.2 = 11 หน่วย** · รวม kindergarten LIVE = **อ.1 15 + อ.2 11 = 26 หน่วย** · 12 mission types · CVC blending ยังติด TTS phoneme · deploy v=28
- หมายเหตุ: repo working dir เคย read-only ชั่วคราว (EPERM) 13 มิ.ย. — คลายเองแล้ว, R2 deploy ไม่กระทบ

### ⬜ ถัดไป — แยกเป็น 2 กลุ่ม
**ทำเองได้ (autonomous, ไม่แตะ secret):** sight words · letter-sound (ต้องหาเสียง phoneme คุณภาพ ไม่ใช่ TTS) · polish/a11y · เพิ่มความลึกหน่วยเดิม
**ต้องวางแผน+อนุมัติ (P1 ระบบ):** LINE family login + Supabase sync + PIN gate + payment (KBank/Opn) · deploy เว็บใหม่ web/ ขึ้น staging
- เว็บใหม่ P0 (`web/`) ยังไม่ deploy (staging) — รอตัดสินใจที่อยู่
- Parent summary จาก localStorage (จุดขาย "พ่อแม่เห็นผล") · engine core/theme split (เลื่อน)
- โค้ดยังไม่ commit git (deploy ไป R2 ตรง) — ถ้าต้องการ commit บอกได้
- หมายเหตุ: `_demo.json` = unit ทดสอบ (อย่าขึ้น production / ตัดตอน build R2)

### เกณฑ์จบเฟส A
- [x] match + trace เล่นได้จริงบนมือถือ
- [~] อ.1 หน่วย: 7 LIVE บน R2 + Emotions/School/Self-care เสร็จ+เทสต์ (local, รอ deploy) = **10/12** · เหลือ Sky/Weather, Sound/Music
- [~] engine: progress seam กลางเสร็จ (ProgressStore) · file-split core/theme เลื่อน (seam คุ้มกว่า)
- [x] เว็บใหม่ P0 (หน้าแรก+แลนดิ้งอนุบาล+tokens) — เหลือ deploy staging

---

<details>
<summary>📦 (ARCHIVED) สถานะ ป.1-6 เดิม — freeze แล้ว ไว้ใช้เฟส D</summary>

## Current Product Direction

101 Future starts with primary school courses for ป.1-ป.6.

Public positioning:

- Students can choose the first subject themselves: Math, Science, English, or Thai.
- Lessons follow Thai curriculum needs and use AI to summarize what each child should practice next.
- Monthly pricing starts at 299 THB / 30 days per subject.
- No wallet in the first version.
- LINE Login is the main path. Access code remains as a fallback.
- While KBank payment is pending, the site collects LINE interests so leads are not lost.
- Learning direction is animation-first for young learners. Start with English ป.1 as interactive missions, not video-heavy lessons.
- First prototype mission: `Pack My School Bag` / `My School Bag`, where children tap or drag school items, hear/read words, answer tiny exercises, and receive a parent-friendly summary.

## Live Site

- Domain: https://www.101future.com
- Repo: https://github.com/mankungp/101future-academy
- Local path: `/Users/m4-ai/Documents/Codex/2026-05-29/domain-edtech`

## Current Implementation

Done:

- Public landing page for primary ป.1-ป.6.
- Mobile hero/nav cleaned up and verified on production.
- Public copy hides internal terms such as KBank approval, cost, cache, tokens, and phase details.
- Packages API:
  - Math ป.1-ป.6: 299 THB / 30 days
  - Science ป.1-ป.6: 299 THB / 30 days
  - English ป.1-ป.6: 299 THB / 30 days
  - Thai ป.1-ป.6: 299 THB / 30 days
  - Primary 4-subject bundle: 599 THB / 30 days, coming soon
- LINE Login backend and production callback.
- `/learn?package=...` saves LINE interest to the account after login.
- Admin has a LINE Interest panel showing interested accounts by subject.
- Admin can create a pending payment order from an interest.
- Payment order, parent payment link, KBank QR adapter scaffold, and entitlement unlock structure exist.
- `/pay?order=...` page exists for parent payment links.
- Access-code fallback login exists.
- English ป.1 Unit 1 exists on `/learn`:
  - Unit title: `My School Bag`
  - Mission 1: `/mission/school-bag` for 20 non-repeating picture-word rounds
  - Mission 2: `/mission/this-is` for listening to `This is a/an ...` sentences and tapping the matching object
  - Mission 3: `/mission/say-it-back` for speaking practice of `This is a/an ...`; scripted, no-fail, in-browser word match via SpeechRecognition with a record-and-playback fallback, no real-time AI yet
  - Story: `My School Bag`
  - Vocabulary: school bag, book, pencil, ruler
  - 3-question exercise
  - Mock result summary after completion
- English Mission 1 now opens as a full-screen mission at `/mission/school-bag`, separate from `/learn`.
- Mission object visuals are local SVG assets, not CSS-only shapes, so book, pencil, ruler, and eraser are easier for young learners to recognize.
- Wrong-answer feedback now tells the child what they tapped and what the prompt asked for.
- Correct answers now show a short animated popup and the next prompt is read automatically, while the Listen button remains for replay.
- Mission speech now uses more natural classroom phrases: wrong answers say "No, this is a/an ...", correct answers say "Yes, correct", and restart reads the first prompt again.
- Correct-answer timing now keeps the reward popup longer and waits before reading the next prompt. Mission speech is slower for primary students. Final production voice must be selected before replacing the current browser speech prototype.
- Mission entry now starts with a prominent Start Mission button. After the first click, the button becomes Listen Again for replay.
- Mission pages now lock zoom and vertical page scrolling so the play screen stays focused for young children.
- Mission 1 now contains the 20-round picture-word prototype directly; `/mission/lab` redirects back to Mission 1.
- Mission 1 now has a first sound-design layer: start chime, prompt cue, wrong-answer tone, correct ding, bag-drop sound, and complete fanfare using Web Audio while final human TTS is still pending.
- Added more visible interaction animation: listening state on the prompt card, wrong-answer object bubble, and a correct item flying into the school bag.
- Mission 1 visuals were updated toward a more realistic/3D object style. `pencil`, `pen`, and `crayon` use inspected and cropped Canva PNG assets; other objects use polished local SVG assets. Current asset cache marker: `20260531-real-objects-v2`.
- English ป.1 Unit 1 source doc exists at `ENGLISH_P1_UNIT1.md`.
- Mission attempts now start saving locally in `localStorage` under `101future.learningAttempts` so repeated mistakes can become parent/AI feedback later.

## Learning UX References

LingoAce-inspired notes to keep:

- Use a story world or mission context before drilling vocabulary.
- Put the child into one clear action at a time: listen, choose/tap/drag, then get immediate feedback.
- Use bright, concrete object art and character-like reactions instead of text-heavy instruction.
- Keep parent-facing summaries separate from the child mission screen.
- Do not build the first version like a tutor classroom page; build it like guided skill practice.

## Not Yet Done

Payment:

- KBank app is created in KBank API Portal.
- KBank API exercise/test is complete: 15/15 passed.
- KBank production service approval and credentials are still pending.
- Need KBank API key/token from KBank API Portal after service approval.
- Need exact KBank QR create endpoint from KBank API Portal.
- Need callback verification details from KBank.
- Need real Thai QR payment test.

Learning product:

- Need a real grade-by-grade curriculum map beyond English ป.1 Unit 1.
- English ป.1 Unit 1 now has Mission 1, Mission 2, and a Mission 3 speaking prototype. Mission 3 still needs a final human TTS voice and, later, server-side speaking records; standalone parent dashboard output is still pending.
- Need the next animation polish pass: bag open/close, stronger completion badge, and a more finished lesson-end screen.
- Need first real lessons for English ป.1, then expand grade by grade.
- Need first real lessons for Math, Science, and Thai later.
- Need server-side progress tracking tied to LINE accounts.
- Need speaking attempt records.
- Need AI feedback pipeline.
- Need parent/student dashboard.

Infrastructure:

- Current storage is JSON files.
- Before real paid users, move to durable DB or confirm Render disk persistence.
- Need backup plan.
- Need production env audit.

## Required Production Env

Payment:

```text
PAYMENT_PROVIDER=kbank
PAYMENT_PROVIDER_API_KEY=...
PAYMENT_WEBHOOK_SECRET=...
KBANK_QR_CREATE_URL=...
KBANK_MERCHANT_ID=...
KBANK_TERMINAL_ID=...
KBANK_BRANCH_ID=...
SITE_ORIGIN=https://www.101future.com
```

LINE Login:

```text
LINE_CHANNEL_ID=2010237394
LINE_CHANNEL_SECRET=...
LINE_CALLBACK_URL=https://www.101future.com/auth/line/callback
```

## Next Steps

1. Wait for KBank service approval, then add production KBank credentials to Render.
2. Test real LINE Login: choose a package, login with LINE, confirm it appears in Admin LINE Interest.
3. From Admin, create a payment order from a LINE interest.
4. Test parent payment page with that order link.
5. Test KBank callback unlocks learning access.
6. Done: English ป.1 Mission 3 speaking practice for `This is a/an ...` at `/mission/say-it-back` (scripted, no-fail). Next: select final human TTS voice and add server-side speaking records.
7. Generate/select real human TTS voice samples before replacing browser speech.
8. Create Canva collateral for Unit 1: cover, flashcards, sentence cards, parent summary, completion badge.
9. Add server-side progress tracking for mission completion and score.
10. Add AI feedback pipeline later, after scripted missions are stable.
11. Build first real ป.1 lessons for other subjects later.
12. Add parent/student dashboard.
13. Move JSON storage to a durable database before real paid users.

## Rule For Future Codex Chats

When returning to this project, open this file first:

```text
/Users/m4-ai/Documents/Codex/2026-05-29/domain-edtech/PROJECT_STATUS.md
```

Then open:

```text
/Users/m4-ai/Documents/Codex/2026-05-29/domain-edtech/EDTECH_10_PHASES.md
```

Do not infer project state from old chat history. Treat these files as the source of truth.

</details>

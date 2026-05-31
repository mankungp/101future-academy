# English ป.1 Unit 1: My School Bag

## Goal

ให้เด็ก ป.1 เริ่มจากการฟังคำศัพท์ของใช้ในห้องเรียน แล้วค่อยต่อเป็นประโยคสั้นแบบ `This is a/an ...` โดยยังเป็น mission สั้น เล่นง่าย และมี feedback ทันที

## Lesson Flow

1. Mission 1: Pack My School Bag
   - Skill: ฟังคำศัพท์เดี่ยว
   - Prompt: `Tap the book.`
   - Vocabulary: book, pencil, ruler, eraser
   - Feedback: บอกว่าจิ้มอะไร และโจทย์ถามหาอะไร

2. Mission 2: This Is My School Bag
   - Skill: ฟังประโยคสั้น
   - Pattern: `This is a/an ...`
   - Prompt examples:
     - `This is a book.`
     - `This is a pencil.`
     - `This is a ruler.`
     - `This is an eraser.`
   - Feedback: เด็กเห็นประโยค + ความหมายภาษาไทยทันที

3. Mission 3: Say It Back
   - Skill: พูดตาม
   - Planned behavior: เด็กกดอัดเสียง แล้วระบบเทียบคำ/ประโยคแบบง่ายก่อน
   - Start with human-friendly feedback, not harsh scoring

4. Mission Lab: 20 Game Variants
   - Skill: ทดลอง mechanics สั้น ๆ ว่าเด็กตอบสนองกับเกมแบบไหน
   - Route: `/mission/lab?game=1`
   - Behavior: เลือกเกม ฟังโจทย์ แตะคำตอบ ได้ feedback ทันที
   - Screen rule: หน้า mission ต้องอยู่ในจอเดียว ไม่ให้ zoom หรือเลื่อนขึ้นลง

5. Parent Summary
   - สรุปคำศัพท์ที่เรียน
   - สรุปประโยคที่ฝึก
   - บอกคำที่ตอบผิดซ้ำ เพื่อให้ผู้ปกครองรู้ว่าควรทวนตรงไหน

## Canva Collateral Needed

- Unit cover: My School Bag
- Flashcards: book, pencil, ruler, eraser
- Sentence cards: This is a book / pencil / ruler / eraser
- Parent summary one-page sheet
- Completion badge: School Bag Star

## Voice Direction

- เสียงต้องเป็นครูเด็กประถม: ช้า อบอุ่น ชัด
- ใช้ pauses ระหว่างคำ เช่น `This is... a book.`
- ยังไม่ควรใช้เสียงเดียวลง production ถาวรจนกว่าจะเลือก provider/voice แล้ว

## Tracking

ตอนนี้ mission เก็บ attempt ใน localStorage ก่อนด้วย key:

- `101future.learningAttempts`

ข้อมูลที่เก็บ:

- mission id
- target word / phrase
- selected word / phrase
- correct true/false
- timestamp

รอบถัดไปค่อยส่งข้อมูลนี้เข้าหลังบ้านเมื่อบัญชี LINE พร้อมและนโยบายข้อมูลชัดเจน

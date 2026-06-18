#!/usr/bin/env node
/**
 * gen-audio.mjs — เจนเสียงทั้งหมดจาก ElevenLabs ครั้งเดียว แล้วเก็บเป็น mp3
 * อ่าน content/*.json → เจนคำเดี่ยว + ประโยคคำสั่ง + คำชม → k1/audio/...
 *
 * วิธีใช้ (รันในโฟลเดอร์ k1/):
 *   export ELEVENLABS_API_KEY="xi-..."     # คีย์จาก ElevenLabs (Profile → API key)
 *   export VOICE_ID="xxxxxxxx"             # id เสียงที่เลือก (จากหน้า Voice)
 *   node tools/gen-audio.mjs
 *
 * - ข้ามไฟล์ที่มีอยู่แล้ว (รันซ้ำได้ ไม่เปลืองเครดิต)
 * - ต้องใช้ Node 18+ (มี fetch ในตัว)
 */
import { readFile, readdir, mkdir, writeFile, access } from "node:fs/promises";
import { join, dirname } from "node:path";

const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.VOICE_ID;
const MODEL = process.env.MODEL_ID || "eleven_multilingual_v2";
const ROOT = process.cwd();                 // ควรเป็นโฟลเดอร์ k1/
const CONTENT_DIR = join(ROOT, "content");

if (!API_KEY || !VOICE_ID) {
  console.error("❌ ต้องตั้ง ELEVENLABS_API_KEY และ VOICE_ID ก่อน (ดูหัวไฟล์)");
  process.exit(1);
}

const VOICE_SETTINGS = { stability: 0.55, similarity_boost: 0.75, style: 0.2, use_speaker_boost: true };

// คำชม/start/win — เสียงคงที่ ไม่อยู่ใน content
const PRAISE = {
  "great-job": "Great job!", "yes": "Yes!", "well-done": "Well done!",
  "you-did-it": "You did it!", "wow": "Wow!", "try-again": "Try again!",
  "almost": "Almost!", "good-try": "Good try!", "lets-play": "Let's play!",
  "ready": "Are you ready?", "hooray": "Hooray!", "hello": "Hello, friend!", "bye": "Bye bye!",
  "song": "Let's sing the colors!",
  "howmany": "How many?",
  "whats-next": "What comes next?",
};

const exists = (p) => access(p).then(() => true, () => false);

async function tts(text, outPath) {
  if (await exists(outPath)) { console.log("· skip", outPath); return; }
  await mkdir(dirname(outPath), { recursive: true });
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: "POST",
    headers: { "xi-api-key": API_KEY, "Content-Type": "application/json", "Accept": "audio/mpeg" },
    body: JSON.stringify({ text, model_id: MODEL, voice_settings: VOICE_SETTINGS }),
  });
  if (!res.ok) { console.error("✗ FAIL", outPath, res.status, await res.text()); return; }
  await writeFile(outPath, Buffer.from(await res.arrayBuffer()));
  console.log("✓", outPath, `"${text}"`);
}

// แทน {word}/{id} ในประโยค ด้วยข้อความคำจริง
function fillPrompt(pattern, word) {
  return pattern.replaceAll("{word}", word.text).replaceAll("{id}", word.text);
}
function fillPath(pattern, id) {
  return pattern.replaceAll("{id}", id).replaceAll("{word}", id);
}

async function run() {
  const files = (await readdir(CONTENT_DIR)).filter(f => f.endsWith(".json") && f !== "course.json");
  const seenWord = new Set();

  for (const f of files) {
    const unit = JSON.parse(await readFile(join(CONTENT_DIR, f), "utf8"));
    const wordById = Object.fromEntries((unit.words || []).map(w => [w.id, w]));

    // 1) คำเดี่ยว
    for (const w of unit.words || []) {
      if (seenWord.has(w.id)) continue;          // คำซ้ำข้ามหน่วย เจนครั้งเดียว
      seenWord.add(w.id);
      await tts(w.text, join(ROOT, "audio", "words", `${w.id}.mp3`));
    }

    // 2) ประโยคคำสั่งของแต่ละมิชชัน (ขยาย {id} ตาม items)
    for (const m of unit.missions || []) {
      const pat = m.prompt?.audioPattern;
      if (!pat || !pat.includes("{id}")) continue;
      for (const id of m.items || []) {
        const w = wordById[id]; if (!w) continue;
        await tts(fillPrompt(m.prompt.text, w), join(ROOT, fillPath(pat, id)));
      }
    }

    // 3) intro หน่วย
    if (unit.intro?.audio && unit.intro?.text) {
      await tts(unit.intro.text, join(ROOT, unit.intro.audio));
    }
  }

  // 4) คำชม/start/win
  for (const [key, text] of Object.entries(PRAISE)) {
    await tts(text, join(ROOT, "audio", "praise", `${key}.mp3`));
  }

  console.log("\n🎉 เสร็จ — ไฟล์อยู่ใน k1/audio/");
}
run().catch(e => { console.error(e); process.exit(1); });

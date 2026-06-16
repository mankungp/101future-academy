#!/usr/bin/env node
/* เจนเสียงประโยค/คำอิสระด้วย ElevenLabs (Matilda) · usage:
 *   (ในโฟลเดอร์ k1/, ตั้ง ELEVENLABS_API_KEY + VOICE_ID)
 *   node tools/gen-phrase.mjs "<text>" <out.mp3>
 * ข้ามถ้ามีไฟล์แล้ว (รันซ้ำไม่เปลือง) */
import { writeFile, mkdir, access } from "node:fs/promises";
import { dirname } from "node:path";
const API_KEY = process.env.ELEVENLABS_API_KEY, VOICE_ID = process.env.VOICE_ID;
const MODEL = process.env.MODEL_ID || "eleven_multilingual_v2";
const [, , text, out] = process.argv;
if (!API_KEY || !VOICE_ID || !text || !out) { console.error("need ELEVENLABS_API_KEY+VOICE_ID + text + out"); process.exit(1); }
if (await access(out).then(() => true, () => false)) { console.log("· skip", out); process.exit(0); }
await mkdir(dirname(out), { recursive: true });
const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
  method: "POST", headers: { "xi-api-key": API_KEY, "Content-Type": "application/json", "Accept": "audio/mpeg" },
  body: JSON.stringify({ text, model_id: MODEL, voice_settings: { stability: 0.55, similarity_boost: 0.75, style: 0.2, use_speaker_boost: true } }),
});
if (!res.ok) { console.error("FAIL", res.status, await res.text()); process.exit(1); }
await writeFile(out, Buffer.from(await res.arrayBuffer()));
console.log("✓", out, `"${text}"`);

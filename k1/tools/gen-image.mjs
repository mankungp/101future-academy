#!/usr/bin/env node
/* เจนรูปด้วย Gemini image model · usage:
 *   GEMINI_KEY=... node tools/gen-image.mjs "<prompt>" <out.png> [ref1.jpg ref2.jpg ...]
 * env GEMINI_IMAGE_MODEL override (default gemini-2.5-flash-image)
 */
import { readFile, writeFile } from "node:fs/promises";
const KEY = process.env.GEMINI_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const [, , prompt, outPath, ...refs] = process.argv;
if (!KEY || !prompt || !outPath) { console.error("need GEMINI_KEY + prompt + outPath"); process.exit(1); }

const parts = [{ text: prompt }];
for (const rp of refs) {
  const b = await readFile(rp);
  parts.push({ inlineData: { mimeType: rp.endsWith(".png") ? "image/png" : "image/jpeg", data: b.toString("base64") } });
}
const body = { contents: [{ role: "user", parts }], generationConfig: { responseModalities: ["IMAGE"] } };
const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`,
  { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const j = await r.json();
if (!r.ok) { console.error("ERR", r.status, JSON.stringify(j).slice(0, 600)); process.exit(1); }
const img = j.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
if (!img) { console.error("NO IMAGE:", JSON.stringify(j).slice(0, 600)); process.exit(1); }
const buf = Buffer.from(img, "base64");
await writeFile(outPath, buf);
console.log("saved", outPath, Math.round(buf.length / 1024) + "KB");

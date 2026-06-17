#!/usr/bin/env node
/* รวม content/<unit>.json → content/units.js (window.K1_UNITS) สำหรับเปิดแบบ file:// */
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const DIR = join(process.cwd(), "content");
const files = (await readdir(DIR)).filter(f => f.endsWith(".json") && f !== "course.json" && !f.startsWith("_"));
const units = {};
for (const f of files) {
  const u = JSON.parse(await readFile(join(DIR, f), "utf8"));
  units[u.id] = u;
}
await writeFile(join(DIR, "units.js"),
  "window.K1_UNITS = " + JSON.stringify(units, null, 2) + ";\n");
console.log("✓ content/units.js (" + Object.keys(units).join(", ") + ")");

'use strict';
const menu = document.querySelector('.menu'), nav = document.querySelector('nav');
function closeMenu(focus = false) { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); if (focus) menu.focus(); }
menu.addEventListener('click', () => { const open = nav.classList.toggle('open'); menu.setAttribute('aria-expanded', String(open)); });
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => closeMenu()));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) closeMenu(true); });
const details = {
 qwen: ['Qwen3.8 27B · ผลชุดนำร่องสามรอบ', 'ทดสอบชุดนำร่อง 8 งาน × 3 seed รวม 24 ผล ชุดเต็มยังต้องเพิ่มอีก 16 กรณีก่อนใช้เทียบโมเดล'],
 amd: ['AI ภายในองค์กร · แนวคิดเบื้องต้น', 'แนวคิดใช้ AMD Radeon AI PRO R9700 สองใบ ต้องทดลองกับงานจริงก่อน จึงยังไม่รับรองความเร็ว จำนวนผู้ใช้ ราคา หรือวันส่งมอบ']
};
const dialog = document.querySelector('dialog');
if (dialog) {
 document.querySelectorAll('[data-detail]').forEach(b => b.addEventListener('click', () => { const d = details[b.dataset.detail]; document.querySelector('#title').textContent = d[0]; document.querySelector('#body').textContent = d[1]; dialog.showModal(); }));
 dialog.querySelector('.close').addEventListener('click', () => dialog.close());
}
document.querySelectorAll('[data-filter]').forEach(b => b.addEventListener('click', () => {
 document.querySelectorAll('[data-filter]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
 document.querySelectorAll('[data-kind]').forEach(x => { x.hidden = b.dataset.filter !== 'all' && x.dataset.kind !== b.dataset.filter; });
}));
function node(tag, text, cls) { const n = document.createElement(tag); if (text !== undefined) n.textContent = text; if (cls) n.className = cls; return n; }
function validateData(d) {
 if (d.schema_version !== 1) throw Error('schema');
 for (const collection of ['metrics', 'sources', 'protocols', 'records']) {
  if (!Array.isArray(d[collection]) || !d[collection].length || new Set(d[collection].map(x => x.id)).size !== d[collection].length) throw Error('collection');
 }
 for (const m of d.metrics) {
  if (m.min !== 0 || typeof m.max !== 'number' || !Number.isFinite(m.max) || m.max <= m.min || !['higher','lower'].includes(m.direction) || !m.label || !m.unit) throw Error('metric');
 }
 for (const r of d.records) {
  const m = d.metrics.find(x => x.id === r.metric), p = d.protocols.find(x => x.id === r.protocol);
  if (!m || !p || !d.sources.some(x => x.id === r.source)) throw Error('reference');
  if (r.status === 'pending') { if (r.score !== null) throw Error('pending'); continue; }
  if (r.status !== 'verified' || typeof r.score !== 'number' || !Number.isFinite(r.score) || r.score < m.min || r.score > m.max) throw Error('score');
  if (!r.configuration || !r.model || !/^\d{4}-\d{2}-\d{2}$/.test(r.date) || new Date(r.date).toISOString().slice(0, 10) !== r.date) throw Error('metadata');
  if (!r.provenance || !/^sha256:[0-9a-f]{64}$/.test(r.provenance.artifact) || new URL(r.provenance.url).protocol !== 'https:') throw Error('provenance');
  if (p.status !== 'frozen' || !['version','dataset','procedure','rubric'].every(k => p[k])) throw Error('protocol');
 }
}
async function benchmarks() {
 const status = document.querySelector('#benchmark-status'); if (!status) return;
 try {
  const response = await fetch('data/benchmarks.v1.json'); if (!response.ok) throw Error('fetch');
  const d = await response.json(); validateData(d);
  const metric = document.querySelector('#metric-filter'), source = document.querySelector('#source-filter');
  d.metrics.forEach(m => { const option = node('option', m.label); option.value = m.id; metric.append(option); });
  d.sources.forEach(s => { const option = node('option', s.label); option.value = s.id; source.append(option); });
  for (const p of d.protocols) {
   const detail = node('details', undefined, 'panel'); detail.append(node('summary', `${p.label} · ${p.version} · ${p.status === 'frozen' ? 'กำหนดวิธีแล้ว' : 'กำลังเตรียมวิธี ยังไม่ใช้ให้คะแนน'}`));
   for (const [key,label] of [['dataset','ชุดโจทย์'],['procedure','ขั้นตอน'],['rubric','เกณฑ์']]) detail.append(node('p', `${label}: ${p[key]}`));
   document.querySelector('#protocols').append(detail);
  }
  function render() {
   const chart = document.querySelector('#chart'), pending = document.querySelector('#pending'); chart.replaceChildren(); pending.replaceChildren();
   const m = d.metrics.find(x => x.id === metric.value);
   const records = d.records.filter(r => r.metric === m.id && (source.value === 'all' || r.source === source.value));
   const verified = records.filter(r => r.status === 'verified');
   status.textContent = verified.length ? 'แสดงเฉพาะผลที่มีหลักฐานครบ และไม่รวมงานที่ใช้กติกาต่างกันเป็นอันดับเดียว' : 'ยังไม่มีคะแนนรวม — ดูผลชุดนำร่อง 24 ผลได้จากลิงก์ด้านบน';
   for (const r of records.filter(x => x.status === 'pending')) {
    const item = node('article', undefined, 'panel pending-record'); item.append(node('h3', r.model), node('p', 'กำลังเตรียมการทดสอบแบบให้คะแนน'), node('p', r.configuration)); pending.append(item);
   }
   if (!pending.children.length) pending.append(node('p', 'ไม่มีงานที่กำลังรอทดสอบในตัวกรองนี้'));
   const groups = new Map();
   for (const r of verified) { const key = JSON.stringify([r.source, r.protocol]); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(r); }
   for (const records of groups.values()) {
    const r0 = records[0], p = d.protocols.find(x => x.id === r0.protocol), s = d.sources.find(x => x.id === r0.source);
    const group = node('section', undefined, 'panel chart-group'); group.dataset.protocol = p.id; group.dataset.source = s.id;
    group.append(node('h2', `${s.label} · ${p.label}`), node('p', `${m.label} (${m.unit}) · ช่วง ${m.min}–${m.max} · ${m.direction === 'higher' ? 'ค่าสูงดีกว่า' : 'ค่าต่ำดีกว่า'}`));
    for (const r of records) {
     const row = node('article', undefined, 'chart-row'); row.append(node('h3', r.model));
     const track = node('div', undefined, 'bar-track'), bar = node('div', undefined, 'bar');
     bar.style.width = `${100 * (r.score - m.min) / (m.max - m.min)}%`; bar.setAttribute('role','img'); bar.setAttribute('aria-label', `${r.model}: ${r.score} ${m.unit}`); track.append(bar); row.append(track, node('p', `${r.score} ${m.unit} · ${r.date}`), node('p', r.configuration));
     const link = node('a', 'หลักฐานต้นฉบับ ↗', 'plain'); link.href = r.provenance.url; link.rel = 'noopener noreferrer'; row.append(link, node('p', r.provenance.artifact, 'digest'));group.append(row);
    }
    chart.append(group);
   }
  }
  metric.addEventListener('change', render); source.addEventListener('change', render); render();
 } catch (_) { document.querySelector('#chart').replaceChildren(); status.textContent = 'ตรวจข้อมูลไม่ผ่าน จึงซ่อนคะแนนไว้เพื่อไม่ให้แสดงข้อมูลผิด'; }
}
benchmarks();

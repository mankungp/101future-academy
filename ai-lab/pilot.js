/* Public values are text only, never HTML or executable links. */
'use strict';
(() => {
 const fields = [['final_output','คำตอบจากโมเดล'],['prompt','โจทย์ที่ใช้ทดสอบ'],['inputs','ข้อมูลที่ให้โมเดล'],['checks','ตรวจแล้วพบอะไร'],['elapsed_seconds','เวลาที่ใช้ (วินาที)'],['provenance','ที่มาของผลและข้อจำกัด'],['settings','รุ่น เครื่อง และการตั้งค่า'],['assessment','รายละเอียดจากรายงานผล'],['not_run_reason','ทำไมจึงไม่ได้ทดสอบ']];
 const statusLabel={pending:'กำลังรอทดสอบ',not_run:'ไม่ได้ทดสอบ',completed:'ทดสอบแล้ว',failed:'ทดสอบไม่สำเร็จ',partial:'ทดสอบได้บางส่วน'};
 const simpleTitle={
  R2:'อ่านคู่มือและแยกรุ่นสินค้า',
  I2:'อ่านป้ายจากภาพ',
  P1:'เลือกสินค้าตามเงื่อนไข',
  S1:'เขียนบทขายจากข้อมูลสินค้า',
  A1:'อธิบายข้อมูลให้คนทั่วไปเข้าใจ',
  C1:'แยกวันหมดเขตคืนเงินออกจากเวลาตอบกลับ',
  D1:'คำนวณยอดคืน ส่วนลด และภาษีจากตาราง',
  K1:'เขียนโปรแกรมอ่านตารางข้อมูล'
 };
 const simpleSummary={
  R2:'ข้อมูลหลักถูกต้อง แต่ระบบตรวจคำตอบเข้มเกินไปเรื่องชื่อเอกสาร',
  I2:'ไม่ได้ทดสอบงานอ่านภาพ เพราะโมเดลชุดนี้รับภาพไม่ได้',
  P1:'เลือกสินค้าตามเงื่อนไขได้ถูกต้อง',
  S1:'บทขายมีคำโฆษณาหนึ่งจุดที่ไม่มีข้อมูลรองรับ',
  A1:'อธิบายข้อมูลได้ แต่แปลศัพท์สำคัญผิดหนึ่งจุด',
  C1:'เข้าใจเงื่อนไขคืนเงินถูกต้อง แต่สำนวนยังรอตรวจ',
  D1:'คำนวณยอดคืน ส่วนลด และภาษีได้ตรงเฉลย',
  K1:'โค้ดผ่านการทดสอบ 10 ข้อ โดยปิดการเข้าถึงเครือข่ายและไฟล์ส่วนตัว'
 };
 function modelName(v){return typeof v==='string' && v.startsWith('Qwen3.8-27B') ? 'Qwen3.8 27B (Q8)' : text(v);}
 const privateKey=/reason|analysis|chain.?of.?thought|secret|access.?token|password|api.?key|authorization/i;
 function clean(v) {
  if (Array.isArray(v)) return v.map(clean);
  if (v && typeof v==='object') return Object.fromEntries(Object.entries(v).filter(([k])=>!privateKey.test(k)).map(([k,x])=>[k,clean(x)]));
  if (typeof v==='string' && /<\s*(think|analysis|reasoning)\b/i.test(v)) throw Error('Reasoning markup');
  return v;
 }
 function parse(data) {
  if (!data || data.schema_version!==1 || !Array.isArray(data.records)) throw Error('Invalid contract');
  return data.records.map(r=>{
   if (!r || typeof r!=='object' || Array.isArray(r) || ![undefined,null,'pending','not_run','completed','failed','partial'].includes(r.status)) throw Error('Invalid record');
   if(r.elapsed_seconds!=null && (typeof r.elapsed_seconds!=='number' || !Number.isFinite(r.elapsed_seconds) || r.elapsed_seconds<0)) throw Error('Invalid timing');
   const row={};
   for(const k of ['id','model','case_id','case_title','status',...fields.map(x=>x[0])]) if(Object.hasOwn(r,k)) row[k]=clean(r[k]);
   row.score=null; return row;
  });
 }
 function text(v) {return v===undefined || v===null || v==='' ? 'ยังไม่มีข้อมูล' : typeof v==='string' ? v : JSON.stringify(v,null,2);}
 function node(tag,value) {const e=document.createElement(tag);e.textContent=value;return e;}
 function render(data) {
  const records=parse(data), root=document.querySelector('#pilot-results'); root.replaceChildren();
  const tested=records.filter(r=>r.status==='completed').length, notRun=records.filter(r=>r.status==='not_run').length;
  document.querySelector('#pilot-status').textContent=records.length ? `อัปผลแล้ว ${records.length} งาน: ทดสอบแล้ว ${tested} งาน · ไม่ได้ทดสอบ ${notRun} งาน (งานอ่านภาพ)` : 'ยังไม่มีผลทดสอบ และจะไม่ใส่คะแนนแทนข้อมูลที่ขาด';
  for(const r of records) {
   const card=node('article','');card.className='panel pilot-record';
   card.append(node('h2',simpleTitle[r.case_id] || text(r.case_title)),node('p',`โมเดล: ${modelName(r.model)} · รหัสงาน: ${text(r.case_id)}`),node('p',`สถานะ: ${statusLabel[r.status] || 'ยังไม่มีข้อมูล'} · ${r.elapsed_seconds == null ? 'ไม่มีข้อมูลเวลา' : 'ใช้เวลา '+r.elapsed_seconds.toFixed(2)+' วินาที'} · ยังไม่รวมเป็นคะแนนเดียว`));
   card.append(node('p',simpleSummary[r.case_id] || 'เปิดรายละเอียดด้านล่างเพื่อดูผลตรวจ'));
   for(const [key,label] of fields) {
    const detail=node('details','');detail.append(node('summary',label),node('pre',text(r[key])));card.append(detail);
   }
   root.append(card);
  }
 }
 window.PilotResults=Object.freeze({parse,render});
 if(location.protocol==='file:') {document.querySelector('#pilot-status').textContent='ไฟล์ตัวอย่างในเครื่องโหลดผลทดสอบไม่ได้ กรุณาเปิดผ่านเว็บไซต์';return;}
 fetch('data/public-results.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Missing');return r.json();}).then(render).catch(()=>{document.querySelector('#pilot-results').replaceChildren();document.querySelector('#pilot-status').textContent='โหลดหรือตรวจข้อมูลไม่ผ่าน จึงไม่แสดงผลที่คาดเดา';});
})();

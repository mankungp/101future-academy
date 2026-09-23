/* Public values are text only, never HTML or executable links. */
'use strict';
(() => {
 const fields = [['final_output','คำตอบจริงจากโมเดล'],['prompt','โจทย์ที่ใช้ทดสอบ'],['inputs','ข้อมูลที่ให้'],['checks','ผลตรวจและหลักฐาน'],['elapsed_seconds','เวลาทำงาน (วินาที)'],['provenance','แหล่งที่มาและข้อจำกัด'],['settings','รุ่นและการตั้งค่า'],['assessment','รายละเอียดการประเมิน'],['not_run_reason','เหตุที่ไม่ได้ทดสอบ']];
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
 function text(v) {return v===undefined || v===null || v==='' ? 'PENDING — ไม่ได้ระบุ' : typeof v==='string' ? v : JSON.stringify(v,null,2);}
 function node(tag,value) {const e=document.createElement(tag);e.textContent=value;return e;}
 function render(data) {
  const records=parse(data), root=document.querySelector('#pilot-results'); root.replaceChildren();
  document.querySelector('#pilot-status').textContent=records.length ? `${records.length} exploratory records — supplied observations, not verified benchmark scores` : 'PENDING — ยังไม่มีผลจริงที่นำเข้า; ไม่สร้างคะแนนหรือผลตอบแทนข้อมูลที่ขาด';
  for(const r of records) {
   const card=node('article','');card.className='panel pilot-record';
   card.append(node('h2',text(r.case_title)),node('p',`โมเดล: ${text(r.model)} · โจทย์: ${text(r.case_id)}`),node('p',`สถานะ: ${r.status ? r.status.toUpperCase() : 'PENDING'} · ${r.elapsed_seconds == null ? 'ไม่มีเวลาทดสอบ' : r.elapsed_seconds.toFixed(2)+' วินาที'} · ยังไม่จัดอันดับหรือให้คะแนนรวม`));
   if(r.assessment && r.assessment.headline) card.append(node('p',r.assessment.headline));
   for(const [key,label] of fields) {
    const detail=node('details','');detail.append(node('summary',label),node('pre',text(r[key])));card.append(detail);
   }
   root.append(card);
  }
 }
 window.PilotResults=Object.freeze({parse,render});
 if(location.protocol==='file:') {document.querySelector('#pilot-status').textContent='PENDING — file preview cannot fetch JSON; run the listener-free verification or review using an authorized static host.';return;}
 fetch('data/public-results.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Missing');return r.json();}).then(render).catch(()=>{document.querySelector('#pilot-results').replaceChildren();document.querySelector('#pilot-status').textContent='PENDING / INVALID — ไม่พบข้อมูลหรือ schema ไม่ผ่าน; ไม่แสดงผลที่คาดเดา';});
})();

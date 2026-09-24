/* Public values are text only, never HTML or executable links. */
'use strict';
(() => {
 const fields = [['final_output','คำตอบจากโมเดล'],['prompt','โจทย์ที่ใช้ทดสอบ'],['inputs','ข้อมูลที่ให้โมเดล'],['checks','ผลตรวจและหลักฐาน'],['provenance','ที่มาของผลและข้อจำกัด'],['settings','รุ่น เครื่อง และการตั้งค่า'],['assessment','รายละเอียดจากรายงานผล'],['not_run_reason','ทำไมจึงไม่ได้ทดสอบ']];
 const statusLabel={pending:'กำลังรอทดสอบ',not_run:'ไม่ได้ทดสอบ',completed:'ทดสอบแล้ว',failed:'ทดสอบไม่สำเร็จ',partial:'ทดสอบได้บางส่วน'};
 const outcomeLabel={READY_AS_IS:'พร้อมใช้ตามโจทย์',NEEDS_EDIT:'ต้องแก้ข้อความ',FAIL:'พบข้อผิดพลาด',FACTS_CORRECT_RUBRIC_MISMATCH:'ข้อมูลถูก แต่เกณฑ์ตรวจคลาดเคลื่อน',UNSUPPORTED:'ระบบนี้ยังทำงานนี้ไม่ได้'};
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
 const caseOrder=['R2','I2','P1','S1','A1','C1','D1','K1'];
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
   if(r.seed!=null && (!Number.isInteger(r.seed) || r.seed<0)) throw Error('Invalid seed');
   const row={};
   for(const k of ['id','model','case_id','case_title','seed','status','elapsed_seconds',...fields.map(x=>x[0])]) if(Object.hasOwn(r,k)) row[k]=clean(r[k]);
   row.score=null; return row;
  });
 }
 function text(v) {return v===undefined || v===null || v==='' ? 'ยังไม่มีข้อมูล' : typeof v==='string' ? v : JSON.stringify(v,null,2);}
 function node(tag,value) {const e=document.createElement(tag);e.textContent=value;return e;}
 function render(data) {
  const records=parse(data), root=document.querySelector('#pilot-results'); root.replaceChildren();
  const completed=records.filter(r=>r.status==='completed').length;
  const notRun=records.filter(r=>r.status==='not_run').length;
  const outcomes=records.reduce((acc,r)=>{const k=r.assessment && r.assessment.plain_outcome;if(k)acc[k]=(acc[k]||0)+1;return acc;},{});
  document.querySelector('#pilot-status').textContent=records.length ? `ครบ ${records.length} ผล: รันจริง ${completed} ผล · ระบบนี้อ่านภาพไม่ได้ ${notRun} ผล` : 'ยังไม่มีผลทดสอบ และจะไม่ใส่คะแนนแทนข้อมูลที่ขาด';
  const summary=document.querySelector('#plain-summary');
  if(summary) summary.textContent=`พร้อมใช้ตามโจทย์ ${outcomes.READY_AS_IS||0} · ต้องแก้ข้อความ ${outcomes.NEEDS_EDIT||0} · พบคำอ้างเกินข้อมูล ${outcomes.FAIL||0} · ข้อมูลถูกแต่เกณฑ์ตรวจคลาดเคลื่อน ${outcomes.FACTS_CORRECT_RUBRIC_MISMATCH||0} · ระบบนี้ยังอ่านภาพไม่ได้ ${outcomes.UNSUPPORTED||0}`;
  const grouped=Object.groupBy ? Object.groupBy(records,r=>r.case_id) : records.reduce((a,r)=>((a[r.case_id]??=[]).push(r),a),{});
  for(const caseId of caseOrder) {
   const rounds=(grouped[caseId]||[]).sort((a,b)=>(a.seed||0)-(b.seed||0));
   if(!rounds.length) continue;
   const card=node('article','');card.className='panel pilot-record';
   card.append(node('h2',simpleTitle[caseId] || text(rounds[0].case_title)),node('p',`โมเดล: ${modelName(rounds[0].model)} · ทดสอบ ${rounds.length} รอบ`));
   rounds.forEach((r,index)=>{
    const outcome=r.assessment && r.assessment.plain_outcome;
    const block=node('section','');block.className='round-result';
    block.append(node('h3',`รอบ ${index+1} · ${outcomeLabel[outcome] || statusLabel[r.status] || 'ยังไม่มีข้อมูล'}`));
    block.append(node('p',r.assessment && r.assessment.headline ? r.assessment.headline : 'เปิดรายละเอียดเพื่อดูผลตรวจ'));
    block.append(node('p',`สถานะ: ${statusLabel[r.status] || 'ยังไม่มีข้อมูล'} · ${r.elapsed_seconds == null ? 'ไม่มีข้อมูลเวลา' : 'ใช้เวลา '+r.elapsed_seconds.toFixed(2)+' วินาที'} · seed ${text(r.seed)}`));
    const detailWrap=node('details','');detailWrap.className='round-details';
    detailWrap.append(node('summary','เปิดโจทย์ คำตอบ และหลักฐานทั้งหมด'));
    for(const [key,label] of fields) {
     const detail=node('details','');detail.append(node('summary',label),node('pre',text(r[key])));detailWrap.append(detail);
    }
    block.append(detailWrap);card.append(block);
   });
   root.append(card);
  }
 }
 window.PilotResults=Object.freeze({parse,render});
 if(location.protocol==='file:') {document.querySelector('#pilot-status').textContent='ไฟล์ตัวอย่างในเครื่องโหลดผลทดสอบไม่ได้ กรุณาเปิดผ่านเว็บไซต์';return;}
 fetch('data/public-results.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Missing');return r.json();}).then(render).catch(()=>{document.querySelector('#pilot-results').replaceChildren();document.querySelector('#pilot-status').textContent='โหลดหรือตรวจข้อมูลไม่ผ่าน จึงไม่แสดงผลที่คาดเดา';});
})();

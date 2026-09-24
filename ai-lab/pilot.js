/* Public values are text only, never HTML or executable links. */
'use strict';
(() => {
 const fields = [['final_output','คำตอบจากโมเดล'],['prompt','โจทย์ที่ใช้ทดสอบ'],['inputs','ข้อมูลที่ให้โมเดล'],['checks','ผลตรวจและหลักฐาน'],['provenance','ที่มาของผลและข้อจำกัด'],['settings','รุ่น เครื่อง และการตั้งค่า'],['assessment','รายละเอียดจากรายงานผล'],['not_run_reason','ทำไมจึงไม่ได้ทดสอบ']];
 const statusLabel={pending:'กำลังรอทดสอบ',not_run:'ไม่ได้ทดสอบ',completed:'ทดสอบแล้ว',failed:'ทดสอบไม่สำเร็จ',partial:'ทดสอบได้บางส่วน'};
 const outcomeLabel={READY_AS_IS:'พร้อมใช้ตามโจทย์',NEEDS_EDIT:'ต้องแก้ข้อความ',FAIL:'พบข้อผิดพลาด',FACTS_CORRECT_RUBRIC_MISMATCH:'ข้อมูลถูก แต่เกณฑ์ตรวจคลาดเคลื่อน',UNSUPPORTED:'ระบบนี้ยังทำงานนี้ไม่ได้'};
 const simpleTitle={
  R1:'ตรวจข่าวและเรียงเหตุการณ์จากหลายแหล่ง',R2:'อ่านคู่มือและแยกรุ่นสินค้า',R3:'ตรวจคำอ้างที่ขัดกับคู่มือ',
  I1:'ค้นภาพสินค้าจากหลายมุม',I2:'อ่านป้ายจากภาพ',I3:'เลือกภาพที่เหมาะกับการใช้งาน',
  P1:'เลือกสินค้าตามเงื่อนไข',P2:'จัดชุดสินค้าภายใต้งบ',P3:'ตรวจอะไหล่ให้ตรงรุ่นโดยไม่เดา',
  S1:'เขียนบทขายจากข้อมูลสินค้า',S2:'เขียนบทขายให้ต่างกลุ่มเป้าหมาย',S3:'แก้บทขายที่มีคำอ้างเกินจริง',
  A1:'อธิบายข้อมูลให้คนทั่วไปเข้าใจ',A2:'อธิบายเรื่องเดียวให้มือใหม่และฝ่ายจัดซื้อ',A3:'ตรวจและแก้บทความจากหลักฐาน',
  C1:'แยกวันหมดเขตคืนเงินออกจากเวลาตอบกลับ',C2:'ตอบลูกค้าเรื่องได้รับสินค้าผิดรุ่น',C3:'แก้ที่อยู่จัดส่งโดยไม่เปลี่ยนคำสั่งซื้อ',
  D1:'คำนวณยอดคืน ส่วนลด และภาษีจากตาราง',D2:'อ่านใบแจ้งหนี้หลายหน้าและหลายฉบับ',D3:'ใช้ข้อกำหนดคืนสินค้าฉบับปัจจุบัน',
  K1:'เขียนโปรแกรมอ่านตารางข้อมูล',K2:'แก้บั๊กและทดสอบโค้ดจริง',K3:'สร้างไฟล์รายงานและตรวจ hash'
 };
 const caseOrder=['R1','R2','R3','I1','I2','I3','P1','P2','P3','S1','S2','S3','A1','A2','A3','C1','C2','C3','D1','D2','D3','K1','K2','K3'];
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
   for(const k of ['id','model','case_id','case_title','seed','status','elapsed_seconds','performance',...fields.map(x=>x[0])]) if(Object.hasOwn(r,k)) row[k]=clean(r[k]);
   row.score=null; return row;
  });
 }
 function text(v) {return v===undefined || v===null || v==='' ? 'ยังไม่มีข้อมูล' : typeof v==='string' ? v : JSON.stringify(v,null,2);}
 function node(tag,value) {const e=document.createElement(tag);e.textContent=value;return e;}
 function gib(mib){return typeof mib==='number' ? `${(mib/1024).toFixed(1)} GB` : 'ยังไม่มีข้อมูล';}
 function specItem(label,value,sub=''){const item=node('div','');item.className='spec-item';item.append(node('small',label),node('strong',value));if(sub)item.append(node('span',sub));return item;}
 function renderRuntime(summary){
  const panel=document.querySelector('#runtime-panel'),r=summary && summary.runtime_summary;
  if(!r){panel.replaceChildren(node('h2','สเปกที่ใช้รัน'),node('p','ชุดข้อมูลนี้ยังไม่มีหลักฐาน runtime ที่เผยแพร่ได้'));return;}
  const speed=summary.decode_tokens_per_second||{},hw=r.hardware||{},params=r.runtime_parameters||{},policy=r.benchmark_policy||{},ram=hw.system_ram||{},gpus=hw.gpus||[];
  panel.replaceChildren();panel.append(node('h2','สเปกที่ใช้รัน'));
  const lead=node('p',`${text(r.model)} · ${text(r.quantization)} · ${text(r.runtime && r.runtime.name)}`);lead.className='runtime-lead';panel.append(lead);
  const highlights=node('div','');highlights.className='runtime-highlights';
  highlights.append(specItem('ความเร็วสร้างคำตอบ',`${Number(speed.median).toFixed(2)} tokens/s`,`ช่วง ${Number(speed.min).toFixed(2)}–${Number(speed.max).toFixed(2)} tokens/s`),specItem('Context ที่ตั้งจริง',`${Number(params.context_tokens).toLocaleString('en-US')} tokens`,'256K · 1 slot'),specItem('รันจริง',`${summary.completed} inference`,`ไม่ได้รันงานภาพ ${summary.not_run} รายการ`),specItem('เวลาประมวลผลรวม',`${(summary.total_request_wall_s/60).toFixed(1)} นาที`,'รวมเวลารอคำตอบ 63 รอบ'));
  panel.append(highlights);
  const specs=node('div','');specs.className='spec-grid';
  specs.append(specItem('Runtime / backend',`${text(r.runtime.name)} · ${text(r.runtime.build)}`,`${text(r.runtime.cuda_runtime)} · OpenAI-compatible · text-only`),specItem('System RAM',`${gib(ram.used_mib)} ใช้ / ${gib(ram.available_mib)} เหลือใช้`, `รวม ${gib(ram.total_mib)} · free ตรง ${gib(ram.free_mib)}`));
  for(const gpu of gpus)specs.append(specItem(`GPU ${gpu.index} · ${text(gpu.name)}`,`${gib(gpu.vram_used_mib)} VRAM ใช้ / ${gib(gpu.vram_free_mib)} เหลือ`,`VRAM รวม ${gib(gpu.vram_total_mib)}`));
  specs.append(specItem('Runtime parameters',`Flash Attention ${params.flash_attention?'ON':'OFF'} · MTP ${params.spec_draft_n_max}`,`layer split · batch ${params.batch_size} · ubatch ${params.ubatch_size} · KV ${params.kv_cache_k}/${params.kv_cache_v}`),specItem('กติกาการรัน',`3 seeds · cache ${policy.prompt_cache?'ON':'OFF'} · retry ${policy.retry_count}`,`temperature ${policy.temperature} · top-p ${policy.top_p} · top-k ${policy.top_k}`));
  panel.append(specs);
  const note=node('p',text(r.resource_snapshot && r.resource_snapshot.note_th));note.className='snapshot-note';panel.append(note);
 }
 function render(data) {
  const records=parse(data), root=document.querySelector('#pilot-results'); root.replaceChildren();
  const completed=records.filter(r=>r.status==='completed').length;
  const notRun=records.filter(r=>r.status==='not_run').length;
  const outcomes=records.reduce((acc,r)=>{const k=r.assessment && r.assessment.plain_outcome;if(k)acc[k]=(acc[k]||0)+1;return acc;},{});
  document.querySelector('#pilot-status').textContent=records.length ? `ผลทั้งหมด ${records.length} รายการ · รันจริง ${completed} · งานภาพที่ระบบยังไม่รองรับ ${notRun}` : 'ยังไม่มีผลทดสอบ และจะไม่ใส่คะแนนแทนข้อมูลที่ขาด';
  renderRuntime(data.summary);
  const summary=document.querySelector('#plain-summary'); summary.replaceChildren();
  const metrics=[['READY_AS_IS','พร้อมใช้','ใช้ต่อได้ตามโจทย์'],['NEEDS_EDIT','ควรแก้ข้อความ','ข้อมูลหลักใช้ได้'],['FAIL','มีข้อผิดพลาด','ควรตรวจใหม่ก่อนใช้'],['FACTS_CORRECT_RUBRIC_MISMATCH','ข้อมูลถูก','แต่รูปแบบไม่ตรงเกณฑ์'],['UNSUPPORTED','ยังไม่ได้ทดสอบ','ระบบนี้รับภาพไม่ได้']];
  for(const [key,label,sub] of metrics){const card=node('div','');card.className=`metric metric-${key.toLowerCase()}`;card.append(node('strong',String(outcomes[key]||0)),node('span',label),node('small',sub));summary.append(card);}
  const grouped=Object.groupBy ? Object.groupBy(records,r=>r.case_id) : records.reduce((a,r)=>((a[r.case_id]??=[]).push(r),a),{});
  const category={R:'ค้นและตรวจข้อมูล',I:'งานภาพ',P:'เลือกสินค้า',S:'งานเขียนขาย',A:'อธิบายและปรับภาษา',C:'บริการลูกค้า',D:'เอกสารและตาราง',K:'โค้ดและไฟล์'};
  for(const caseId of caseOrder) {
   const rounds=(grouped[caseId]||[]).sort((a,b)=>(a.seed||0)-(b.seed||0));
   if(!rounds.length) continue;
   const outcomesInCase=rounds.map(r=>r.assessment && r.assessment.plain_outcome).filter(Boolean);
   const card=node('details','');card.className='case-card pilot-record';card.dataset.outcomes=outcomesInCase.join(',');
   const caseSummary=node('summary','');caseSummary.className='case-summary';
   const titleWrap=node('span','');titleWrap.className='case-title';titleWrap.append(node('small',`${category[caseId[0]] || 'งานทดสอบ'} · ${caseId}`),node('strong',simpleTitle[caseId] || text(rounds[0].case_title)));
   const chips=node('span','');chips.className='case-chips';
   rounds.forEach((r,index)=>{const outcome=r.assessment && r.assessment.plain_outcome;const chip=node('span',`รอบ ${index+1}: ${outcomeLabel[outcome] || statusLabel[r.status] || 'ไม่มีข้อมูล'}`);chip.className=`status-chip outcome-${String(outcome||r.status).toLowerCase()}`;chips.append(chip);});
   caseSummary.append(titleWrap,chips);card.append(caseSummary);
   const body=node('div','');body.className='case-body';body.append(node('p',`โมเดล ${modelName(rounds[0].model)} · เปิดดูผลแต่ละรอบด้านล่าง`));
   rounds.forEach((r,index)=>{
    const outcome=r.assessment && r.assessment.plain_outcome;
    const block=node('section','');block.className=`round-result outcome-${String(outcome||r.status).toLowerCase()}`;
    const roundHead=node('div','');roundHead.className='round-heading';roundHead.append(node('h3',`รอบ ${index+1}`),node('span',outcomeLabel[outcome] || statusLabel[r.status] || 'ยังไม่มีข้อมูล'));
    block.append(roundHead,node('p',r.assessment && r.assessment.headline ? r.assessment.headline : 'เปิดรายละเอียดเพื่อดูผลตรวจ'));
    const perf=r.performance||{};const perfLine=node('p',perf.decode_tokens_per_second==null ? `${r.elapsed_seconds == null ? 'ไม่มีข้อมูลเวลา' : 'ใช้เวลา '+r.elapsed_seconds.toFixed(2)+' วินาที'} · seed ${text(r.seed)}` : `${Number(perf.decode_tokens_per_second).toFixed(2)} tokens/s · ${r.elapsed_seconds.toFixed(2)} วินาที · output ${text(perf.completion_tokens)} tokens · seed ${text(r.seed)}`);perfLine.className='round-performance';block.append(perfLine);
    const detailWrap=node('details','');detailWrap.className='round-details';
    detailWrap.append(node('summary','ดูโจทย์ คำตอบ และหลักฐาน'));
    for(const [key,label] of fields) {const detail=node('details','');detail.append(node('summary',label),node('pre',text(r[key])));detailWrap.append(detail);}
    block.append(detailWrap);body.append(block);
   });
   card.append(body);root.append(card);
  }
  const controls=document.querySelector('#result-controls');controls.replaceChildren();
  const filterDefs=[['all','ทั้งหมด'],['issues','ควรตรวจหรือแก้'],['FAIL','มีข้อผิดพลาด'],['NEEDS_EDIT','ต้องแก้ข้อความ'],['READY_AS_IS','พร้อมใช้'],['FACTS_CORRECT_RUBRIC_MISMATCH','ข้อมูลถูก แต่รูปแบบต่าง'],['UNSUPPORTED','ยังไม่ได้ทดสอบ']];
  const cards=[...root.querySelectorAll('.case-card')];
  function applyFilter(filter){let shown=0;for(const card of cards){const values=card.dataset.outcomes.split(',');const visible=filter==='all'||(filter==='issues'&&(values.includes('FAIL')||values.includes('NEEDS_EDIT')))||values.includes(filter);card.hidden=!visible;if(visible)shown++;else card.open=false;}for(const b of controls.querySelectorAll('button')){const active=b.dataset.filter===filter;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));}document.querySelector('#result-filter-note').textContent=`แสดง ${shown} จาก ${cards.length} กรณี · แตะชื่อกรณีเพื่อเปิดดูสามรอบ`;}
  for(const [key,label] of filterDefs){const button=node('button',label);button.type='button';button.dataset.filter=key;button.addEventListener('click',()=>applyFilter(key));controls.append(button);}
  applyFilter('all');
 }
 window.PilotResults=Object.freeze({parse,render});
 if(location.protocol==='file:') {document.querySelector('#pilot-status').textContent='ไฟล์ตัวอย่างในเครื่องโหลดผลทดสอบไม่ได้ กรุณาเปิดผ่านเว็บไซต์';return;}
 fetch('data/public-results.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Missing');return r.json();}).then(render).catch(()=>{document.querySelector('#pilot-results').replaceChildren();document.querySelector('#pilot-status').textContent='โหลดหรือตรวจข้อมูลไม่ผ่าน จึงไม่แสดงผลที่คาดเดา';});
})();

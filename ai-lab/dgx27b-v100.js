'use strict';
const labels = {english:'อังกฤษ · LRUCache · ปิดคิด OFF', thai:'ข้อความขายไทย · เปิดคิด ON', code:'โค้ด sum_even · เปิดคิด ON'};
function el(tag,text,className){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;}
async function load(){
 const response=await fetch('data/dgx27b-v100.json');if(!response.ok)throw new Error('data unavailable');const d=await response.json();
 for(const task of Object.keys(labels)){
  const card=el('section',undefined,'dash-chart');card.append(el('h3',labels[task]));
  card.append(el('p',task==='english'?'cap 700 · ชนเพดานทั้ง 5 รอบต่อค่า D':'cap 2048 · จบคำตอบทั้ง 3 รอบต่อค่า D'));
  for(const a of d.aggregates.filter(a=>a.task===task)){
   const row=el('div',undefined,'dash-row'),head=el('div',undefined,'dash-row-head');head.append(el('strong','D'+a.depth),el('span',a.tokens_per_second.toFixed(2)+' t/s','dash-number'));
   const track=el('div',undefined,'dash-track'),fill=el('div',undefined,'dash-fill'+(a.depth===16?' dgx':''));fill.style.width=(a.tokens_per_second/80*100)+'%';track.append(fill);track.setAttribute('aria-hidden','true');row.append(head,track,el('small',`เวลารวมค่ากลาง ${a.wall_s.toFixed(2)} วินาที · n=${a.n}`));card.append(row);
  }
  card.append(el('small','แกน 0–80 tokens/s'));document.querySelector('#charts').append(card);
 }
 for(const a of d.v100_reference){const p=el('p');p.append(el('strong',a.tokens_per_second.toFixed(2)+' t/s'),el('span',({all:'รวมทุกประเภท',S:'หมวดขายเดิม',K:'หมวดโค้ดเดิม'})[a.group]+' · '+a.n+' รอบ'));document.querySelector('#reference').append(p);}
 document.querySelector('#hashes').textContent=JSON.stringify(d.reference_source_hashes,null,2);
 for(const r of d.records){
  const detail=el('details',undefined,'run');detail.dataset.task=r.task;detail.append(el('summary',`${r.case} · ${r.tokens_per_second.toFixed(2)} t/s · ${r.wall_s.toFixed(2)} วินาที · ${r.finish_reason==='length'?'ชนเพดาน':'จบคำตอบ'}`));
  detail.append(el('p',r.review),el('h3','โจทย์'),el('pre',r.prompt),el('h3','คำตอบสุดท้าย'),el('pre',r.final_answer));
  const meta={...r};delete meta.prompt;delete meta.final_answer;delete meta.review;detail.append(el('h3','การตั้งค่า เวลา และที่มาหลักฐาน'),el('pre',JSON.stringify(meta,null,2)));document.querySelector('#runs').append(detail);
 }
 const filter=document.querySelector('#task-filter');function apply(){let count=0;document.querySelectorAll('.run').forEach(row=>{row.hidden=filter.value!=='all'&&row.dataset.task!==filter.value;if(row.hidden)row.open=false;else count++;});document.querySelector('#status').textContent=`แสดง ${count} จาก 22 รอบ · ไม่มีข้อความคิดภายใน`;}
 filter.addEventListener('change',apply);apply();
}
load().catch(()=>{document.querySelector('#status').textContent='โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่หรือเปิดไฟล์ JSON';});

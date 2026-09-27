/* Separate matched-Q8 surface; historical Flash/V100 data and charts are untouched. */
(async()=>{'use strict';
const root=document.querySelector('.q8-comparison');if(!root)return;
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const names={ready_as_is:'พร้อมใช้',needs_text_edit:'ควรแก้ข้อความ / โค้ด',facts_correct_rubric_mismatch:'ข้อมูลถูก แต่รูปแบบไม่ตรงเกณฑ์',substantive_fail:'มีข้อผิดพลาด'};
try{
 const response=await fetch('data/q8-comparison.json');if(!response.ok)throw Error(`HTTP ${response.status}`);const data=await response.json();
 if(data.records.length!==63||data.groups.length!==8)throw Error('Invalid matched population');
 const select=root.querySelector('.q8-category');select.replaceChildren();for(const g of data.groups){const o=el('option',g.label);o.value=g.id;select.append(o);}
 function chart(target,g,kind){const box=root.querySelector(target);box.replaceChildren();const max=kind==='quality'?100:Math.ceil(Math.max(...Object.values(g.models).map(x=>x.rate))/10)*10;
  for(const id of ['dgx','v100']){const x=g.models[id],value=kind==='quality'?x.ready_percent:x.rate;const row=el('div',undefined,'q8-bar-row');row.dataset.model=id;row.dataset.value=String(value);row.append(el('div',data.labels[id],'q8-bar-label'));
   if(id==='v100')row.append(el('p','ชื่อไฟล์ Q8_K_XL แต่ endpoint ระบุ Q4_K - Medium; ยังไม่ยืนยัน precision ด้วย tensor audit ใหม่','q8-run-note'));
   if(kind==='quality'){row.append(el('p',id==='dgx'?'ตรวจเพิ่มเติมรอบนี้ · assistant review':'ผลตรวจเดิม ไม่ตรวจใหม่ด้วยเกณฑ์ DGX','q8-run-note'));row.append(el('div',`พร้อมใช้ ${x.ready} / ${g.n} รอบ · ${value.toFixed(1)}%`,'q8-bar-value'));}
   else{const track=el('div',undefined,'q8-bar-track'),bar=el('div',undefined,`q8-bar ${id}`);bar.style.width=`${value/max*100}%`;track.append(bar);track.setAttribute('aria-hidden','true');row.append(track,el('div',`${value.toFixed(2)} token/s`,'q8-bar-value'));}box.append(row);}
  box.append(el('div',kind==='quality'?'ผลตรวจคุณภาพคนละรอบ — ไม่ใช้จัดอันดับ':`แกนเดียวกัน เริ่มที่ 0 — ${max} token/s`,'q8-axis'));
 }
 const full=root.dataset.q8Full==='true';let filter='all';
 function render(){const g=data.groups.find(x=>x.id===select.value);chart('.q8-quality',g,'quality');chart('.q8-speed',g,'speed');root.querySelector('.q8-status').textContent=`${g.label} · ${g.n} รอบต่อระบบ · Thinking ON`;if(full)renderCases();}
 function disclosure(label,value){const d=el('details');d.append(el('summary',label),el('pre',typeof value==='string'?value:JSON.stringify(value,null,2)));return d;}
 function renderCases(){const list=document.querySelector('#q8-cases');list.replaceChildren();const groups=new Map();let cells=0;
  for(const r of data.records){if(select.value!=='all'&&r.category!==select.value)continue;if(filter==='issues'&&r.dgx.outcome==='ready_as_is')continue;if(!['all','issues'].includes(filter)&&r.dgx.outcome!==filter)continue;if(!groups.has(r.case_id))groups.set(r.case_id,[]);groups.get(r.case_id).push(r);cells++;}
  for(const [cid,rows] of groups){const c=el('details',undefined,'q8-case');const summary=el('summary',`${cid} · ${rows[0].title} `);summary.append(el('span',`${rows.length} รอบ`,'q8-chip'));c.append(summary);
   for(const r of rows){const run=el('details',undefined,'q8-run');run.append(el('summary',`รอบ ${r.seed} · DGX: ${names[r.dgx.outcome]} · V100: ${names[r.v100.outcome]}`));
    for(const id of ['dgx','v100']){const x=r[id],t=x.timing,dg=id==='dgx';run.append(el('h3',data.labels[id]));run.append(el('p',x.review_note,'q8-run-note'));
     run.append(el('p',`เวลารวม ${(dg?t.wall_s:t.request_wall_s).toFixed(2)} วินาที · เริ่ม final ${(dg?t.ttft_final_s:t.first_final_token_s).toFixed(2)} วินาที · ${(dg?t.completion_over_wall_tps:t.completion_tokens_per_wall_s).toFixed(2)} token/s · finish: ${t.finish_reason}`,'q8-timing'));
     run.append(disclosure('คำตอบสุดท้าย',x.final_answer));const details={timing:t,source_sha256:x.source_sha256,source_record:x.source_record,deterministic_errors:x.deterministic_errors,execution:x.execution};run.append(disclosure('ผลตรวจและเวลาแบบละเอียด',details));
    }
    run.append(disclosure('โจทย์ที่ส่งให้โมเดล (ข้อมูลสมมติ)',r.prompt),disclosure('เกณฑ์ frozen',r.expected));c.append(run);
   }list.append(c);
  }document.querySelector('#q8-count').textContent=`แสดง ${groups.size} จาก 21 กรณี · ${cells} จาก 63 รอบ`;}
 if(full){document.querySelector('#q8-outcome').addEventListener('change',e=>{filter=e.target.value;renderCases();});
  const method=document.querySelector('#q8-method');for(const note of data.methodology)method.append(el('p',note));document.querySelector('#q8-runtime').textContent=JSON.stringify({runtime:data.runtime,provenance:data.provenance},null,2);
  const lat=document.querySelector('#q8-latencies');for(const id of ['dgx','v100']){const m=data.metrics[id],section=el('div');section.append(el('h3',data.labels[id]));for(const [k,label] of [['ttft_any_s','เริ่มมีข้อความใด ๆ'],['ttft_final_s','เริ่มคำตอบสุดท้าย'],['wall_s','เวลาคำขอทั้งหมด']])section.append(el('p',`${label}: ${m[k].median.toFixed(2)} วินาที (ค่ากลาง)`));section.append(el('p',`native predicted_per_second: ${m.native_predicted_tps.median.toFixed(2)} token/s · รายงานโดย runtime แยกจากกราฟหลัก`));lat.append(section);}
 }
 select.addEventListener('change',render);render();root.dataset.loaded='true';
}catch(error){root.querySelector('.q8-status').textContent=`ยังโหลดข้อมูลไม่ได้: ${error.message}`;console.error(error);}
})();

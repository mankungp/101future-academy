/* Public values are rendered as text; only allowlisted NASA links become anchors. */
'use strict';
(()=>{
 const labels={ready:'พร้อมใช้',needs_edit:'ต้องแก้',fail:'ไม่ผ่าน',unsupported:'ไม่รองรับ'};
 const text=v=>v==null||v===''?'ยังไม่มีข้อมูล':typeof v==='string'?v:JSON.stringify(v,null,2);
 const node=(tag,value)=>{const e=document.createElement(tag);e.textContent=value;return e;};
 function nasaUrl(v){try{const u=new URL(v);return u.protocol==='https:'&&(u.hostname==='nasa.gov'||u.hostname.endsWith('.nasa.gov'))?u:null}catch{return null}}
 function link(v,label){const u=nasaUrl(v);if(!u)return node('span',text(v));const a=node('a',label||v);a.href=u.href;a.target='_blank';a.rel='noopener noreferrer';return a}
 function render(d){
  if(!d||d.schema_version!=='101future.real-work.public.v1'||!Array.isArray(d.tracks))throw Error('invalid contract');
  document.querySelector('#rw-status').textContent=`ครบ ${d.summary.completed}/${d.summary.total_cells} valid cells · ใช้เครื่องมือจริง ${d.summary.tool_enabled_cells} · ตรวจภาพจริง ${d.summary.visual_reviewed_images} ภาพ · ตัด fixture ที่ไม่สมบูรณ์ ${d.summary.invalid_fixture_attempts_excluded} attempts`;
  const summary=document.querySelector('#rw-summary');summary.replaceChildren();
  for(const [value,label,sub] of [[d.summary.ready,'พร้อมใช้','ผ่านทั้งหลักฐานและผลงาน'],[d.summary.needs_edit,'ต้องแก้','ยังใช้ต่อได้หลังแก้'],[d.summary.fail,'ไม่ผ่าน','พบข้อผิดพลาดจริง'],[d.summary.total_elapsed_minutes.toFixed(1),'นาทีรวม','เวลารัน end-to-end']]){const x=node('div','');x.className='rw-metric';x.append(node('strong',String(value)),node('span',label),node('small',sub));summary.append(x)}
  const checklist=document.querySelector('#rw-checklist');checklist.replaceChildren();
  for(const item of d.checklist){const row=node('div','');row.className=`check-row ${item.pass?'pass':'fail'}`;const mark=node('span',item.pass?'✓':'!');mark.className='check-mark';row.append(mark,node('strong',item.label),node('span',item.note));checklist.append(row)}
  const images=document.querySelector('#rw-images');images.replaceChildren();
  for(const item of d.featured_images){const card=node('article','');card.className='image-card';const img=document.createElement('img');img.src=item.local_src;img.alt=item.title;img.loading='lazy';const copy=node('div','');copy.className='image-copy';copy.append(node('strong',item.title),node('p',`${item.role_label} · NASA ID ${item.nasa_id}`),node('p',`${labels[item.outcome]||item.outcome}: ${item.finding_th}`),link(item.source_page,'เปิดหน้าต้นทาง NASA ↗'));card.append(img,copy);images.append(card)}
  const tracks=document.querySelector('#rw-tracks');tracks.replaceChildren();
  for(const track of d.tracks){const box=node('details','');box.className='track';const head=node('summary','');const title=node('div','');title.className='track-title';title.append(node('strong',track.title),node('span',`${track.ready}/${track.records.length} พร้อมใช้`));head.append(title,node('p',track.description));box.append(head);const grid=node('div','');grid.className='seed-grid';
   for(const r of track.records){const card=node('article','');card.className='seed-card';const h=node('div','');h.className='seed-head';const badge=node('span',labels[r.outcome]||r.outcome);badge.className=`verdict ${r.outcome}`;h.append(node('strong',`seed ${r.seed}`),badge);const toolText=Object.entries(r.tool_counts||{}).map(([k,v])=>`${k} ${v}`).join(' · ')||'ไม่ใช้ tool ในขั้นเขียน';card.append(h,node('p',`${r.elapsed_seconds.toFixed(2)} วินาที · ${r.decode_tokens_per_second==null?'ไม่มีข้อมูลความเร็ว':r.decode_tokens_per_second.toFixed(2)+' tokens/s'} · ${toolText}`));card.lastChild.className='seed-meta';const detail=node('details','');detail.append(node('summary','เปิดดูผลงานจริง'),node('pre',text(r.output)));card.append(detail);if(r.sources&&r.sources.length){const list=node('div','');list.className='source-list';for(const s of r.sources)list.append(link(s,s));card.append(list)}grid.append(card)}
   box.append(grid);tracks.append(box)
  }
 }
 fetch('data/real-work-results.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('missing');return r.json()}).then(render).catch(()=>{document.querySelector('#rw-status').textContent='โหลดหรือตรวจข้อมูลไม่ผ่าน จึงไม่แสดงผลที่คาดเดา';});
})();

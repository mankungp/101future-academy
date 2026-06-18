/* 101future Kids — K1 engine (data-driven, reads content/<unit>.json) */
(() => {
  const $ = (id) => document.getElementById(id);
  const play = $('play'), bubble = $('bubble'), mascot = $('mascot'),
        dots = $('dots'), nextBtn = $('nextBtn');

  let UNIT = null, wordById = {}, missionIndex = 0, currentPrompt = null, _actx = null, _melodyTimer = null, _songTimer = null;
  const STICKERS = { colors:'🌈', emotions:'😊', selfcare:'🧼', school:'🎒', animals:'🦁', fruits:'🍎', weather:'☀️', family:'👨‍👩‍👧', shapes:'⭐', numbers:'🔢', body:'🧒', music:'🎵', abc:'🔤', firstsounds:'👂', rhyme:'🎩', sortcolor:'🧩', colorsong:'🎶', patterns:'🔁', count11:'🔟', matchnum:'#️⃣', livingnot:'🌱', k2see:'👀', k2it:'🔷', k2like:'😋', k2can:'💪', k2where:'🔍', k2count:'🧮', k2write:'✏️', k2size:'🆚', k2have:'🙌', k2family:'🏠', k2color:'🎨', k3sight:'📖', k3read:'📕', k3long:'📚', k3write:'🖍️' };
  const UNIT_ORDER = ['colors','emotions','selfcare','school','animals','fruits','weather','family','shapes','numbers','body','music','abc','firstsounds','rhyme','sortcolor','colorsong','patterns','count11','matchnum','livingnot','k2see','k2it','k2like','k2can','k2where','k2count','k2write','k2size','k2have','k2family','k2color','k3sight','k3read','k3long','k3write'];
  // progress ผ่าน ProgressStore กลาง (progress-store.js) — fallback ถ้าไฟล์ไม่โหลด
  const PStore = window.FutureProgress;
  function loadProgress(){
    if (PStore) return PStore.load();
    try { return JSON.parse(localStorage.getItem('k1_progress')||'{}'); } catch(e){ return {}; }
  }
  function saveProgress(p){
    if (PStore) { PStore.save(p); return; }
    try { localStorage.setItem('k1_progress', JSON.stringify(p)); } catch(e){}
  }
  function recordEvent(verb, objectType, objectId, result){
    if (PStore && PStore.recordEvent) PStore.recordEvent({ verb, object_type:objectType, object_id:objectId, result });
  }

  // ---------- audio ----------
  // preload + decode all clips → play from memory (in sync with visuals)
  const audioBuffers = {};
  const AUDIOVER = '?a=2';
  const PRAISE_KEYS = ['yes','great-job','well-done','wow','you-did-it','try-again','almost','good-try','hooray','lets-play','ready','hello','bye'];
  function collectAudioPaths() {
    const set = new Set();
    if (UNIT.intro && UNIT.intro.audio) set.add(UNIT.intro.audio);
    UNIT.words.forEach(w => { if (w.audio) set.add(w.audio); if (w.sound) set.add(w.sound); });
    UNIT.missions.forEach(m => {
      const pat = m.prompt && m.prompt.audioPattern;
      if (pat && pat.indexOf('{id}') >= 0) (m.items || []).forEach(id => set.add(pat.replaceAll('{id}', id).replaceAll('{word}', id)));
      if (m.prompt && m.prompt.audio) set.add(m.prompt.audio);
    });
    PRAISE_KEYS.forEach(k => set.add('audio/praise/' + k + '.mp3'));
    ['correct','pop','whoosh','star','win'].forEach(n => set.add('audio/ui/' + n + '.mp3'));
    return Array.from(set);
  }
  async function preloadAudio() {
    try { _actx = _actx || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    await Promise.all(collectAudioPaths().map(async p => {
      try {
        const r = await fetch(p + AUDIOVER); if (!r.ok) return;
        audioBuffers[p] = await _actx.decodeAudioData(await r.arrayBuffer());
      } catch (e) {}
    }));
  }
  // preload all unit images into browser cache (ready before gameplay)
  function preloadImages() {
    const seen = {};
    const add = (p) => { if (p && !seen[p]) { seen[p] = 1; const im = new Image(); im.src = p + '?v=11'; } };
    (UNIT.words || []).forEach(w => add(w.image));
    add(UNIT.character);
    ['img/m-idle.png', 'img/m-happy.png', 'img/m-cheer.png', 'img/m-clap.png', 'img/m-point.png', 'img/m-wave.png'].forEach(add);
  }
  function playAudio(path) {
    return new Promise((res) => {
      if (!path) return res();
      const buf = audioBuffers[path];
      if (buf && _actx) {
        try {
          const s = _actx.createBufferSource();
          s.buffer = buf; s.connect(_actx.destination);
          s.onended = res; s.start(); return;
        } catch (e) {}
      }
      const a = new Audio(path + AUDIOVER); a.onended = res; a.onerror = res; a.play().catch(res);
    });
  }
  function sfx(n) { playAudio('audio/ui/' + n + '.mp3'); }
  let bgm;
  function initBgm() { if (!bgm) { bgm = new Audio('audio/ui/bgm.mp3' + AUDIOVER); bgm.loop = true; bgm.volume = 0.12; } }
  function updateMusicBtn() { const b = $('musicBtn'); if (b) b.textContent = (localStorage.getItem('k1_muted') === '1') ? '🔇' : '🎵'; }
  function startBgm() { initBgm(); if (localStorage.getItem('k1_muted') !== '1') bgm.play().catch(() => {}); updateMusicBtn(); }
  function toggleMusic() { initBgm(); if (localStorage.getItem('k1_muted') === '1') { localStorage.removeItem('k1_muted'); bgm.play().catch(() => {}); } else { localStorage.setItem('k1_muted', '1'); bgm.pause(); } updateMusicBtn(); }
  const PRAISE_OK = [['Yes!','yes'],['Great job!','great-job'],['Well done!','well-done'],['Wow!','wow'],['You did it!','you-did-it']];
  const PRAISE_RETRY = [['Try again!','try-again'],['Almost!','almost'],['Good try!','good-try']];
  const pick = (a) => a[Math.floor(Math.random()*a.length)];
  function praise(set, happy=true) {
    const [t,k] = pick(set);
    bubble.textContent = t;
    if (happy) sfx('correct');
    mascot.classList.add(happy ? 'happy' : 'sad');
    setTimeout(() => mascot.classList.remove('happy','sad'), 600);
    if (happy) { setMascot('happy'); setTimeout(() => setMascot('idle'), 1000); }
    else { setMascot('point'); setTimeout(() => setMascot('idle'), 1100); }
    return playAudio('audio/praise/' + k + '.mp3');
  }

  // ---------- mascot ----------
  function setMascot(state) { try { mascot.src = 'img/m-' + state + '.png?v=10'; } catch (e) {} }
  function say(text, audioPath) {
    currentPrompt = { text, audioPath };
    bubble.textContent = text;
    return playAudio(audioPath);
  }
  $('replayBtn').onclick = () => { if (currentPrompt) { bubble.textContent = currentPrompt.text; playAudio(currentPrompt.audioPath); } };

  function promptFor(m, word) {
    const text = (m.prompt?.text || '').replaceAll('{word}', word.text).replaceAll('{id}', word.text);
    const audio = m.prompt?.audioPattern
      ? m.prompt.audioPattern.replaceAll('{id}', word.id).replaceAll('{word}', word.id)
      : word.audio;
    return { text, audio };
  }
  const shuffle = (a) => { a = a.slice(); for (let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };

  // ---------- progress dots ----------
  function renderDots() {
    dots.innerHTML = '';
    UNIT.missions.forEach((_, i) => {
      const d = document.createElement('div');
      d.className = 'dot' + (i < missionIndex ? ' done' : i === missionIndex ? ' cur' : '');
      dots.appendChild(d);
    });
  }

  // ---------- confetti ----------
  function burst(el) {
    const r = el.getBoundingClientRect(), pr = play.getBoundingClientRect();
    const e = ['🎈','✨','⭐','💖','🌟','🎉'];
    for (let i=0;i<8;i++){
      const s = document.createElement('div'); s.className='confetti'; s.textContent=e[i%e.length];
      s.style.left = (r.left-pr.left+r.width/2-12+((i*37)%60-30)) + 'px';
      s.style.top = (r.top-pr.top+10) + 'px';
      play.appendChild(s); setTimeout(()=>s.remove(),1100);
    }
  }

  // ---------- mission: free-explore ----------
  function popSound() {
    try {
      _actx = _actx || new (window.AudioContext || window.webkitAudioContext)();
      const o = _actx.createOscillator(), g = _actx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(680, _actx.currentTime);
      o.frequency.exponentialRampToValueAtTime(1500, _actx.currentTime + 0.08);
      g.gain.setValueAtTime(0.3, _actx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, _actx.currentTime + 0.18);
      o.connect(g); g.connect(_actx.destination);
      o.start(); o.stop(_actx.currentTime + 0.18);
    } catch (e) {}
  }

  // fill a balloon/tile: solid color (w.meta.hex) or image (w.image)
  function fillItem(el, w) {
    if (w.label) {
      if (w.meta && w.meta.hex) el.style.background = w.meta.hex;
      el.classList.add('has-label');
      const t = document.createElement('span'); t.className = 'item-label'; t.textContent = w.label;
      el.appendChild(t); return;
    }
    if (w.meta && typeof w.meta.hex === 'string') { el.style.background = w.meta.hex; return; }
    if (w.image) {
      el.classList.add('has-img');
      const im = document.createElement('img'); im.className = 'item-img'; im.src = w.image + '?v=11'; im.alt = '';
      el.appendChild(im); return;
    }
    el.style.background = '#ccc';
  }

  function bigBurst(el, color) {
    const r = el.getBoundingClientRect(), pr = play.getBoundingClientRect();
    const cx = r.left - pr.left + r.width / 2, cy = r.top - pr.top + r.height / 2;
    const ring = document.createElement('div'); ring.className = 'shockwave';
    ring.style.left = cx + 'px'; ring.style.top = cy + 'px'; ring.style.borderColor = color || '#fff';
    play.appendChild(ring); setTimeout(() => ring.remove(), 600);
    const N = 18;
    for (let i = 0; i < N; i++) {
      const p = document.createElement('div'); p.className = 'particle';
      const ang = (i / N) * 2 * Math.PI, dist = 90 + (i % 3) * 34;
      p.style.left = cx + 'px'; p.style.top = cy + 'px';
      p.style.background = i % 4 === 0 ? '#ffd23f' : (color || '#ff5fa2');
      p.style.setProperty('--dx', (Math.cos(ang) * dist) + 'px');
      p.style.setProperty('--dy', (Math.sin(ang) * dist) + 'px');
      play.appendChild(p); setTimeout(() => p.remove(), 720);
    }
    ['💥','⭐','✨','🌟'].forEach(e => {
      const s = document.createElement('div'); s.className = 'confetti'; s.textContent = e;
      s.style.left = (cx - 14) + 'px'; s.style.top = (cy - 14) + 'px';
      play.appendChild(s); setTimeout(() => s.remove(), 1100);
    });
  }

  // free-explore: pop balloons, each pops with effect + spawns a new color, until all done
  function renderExplore(m) {
    say('Pop the balloons!', null);
    play.innerHTML = '';
    const pool = shuffle(UNIT.words.slice());   // all colors
    const total = pool.length;
    const SLOTS = 1;
    let nextIdx = 0, popped = 0;

    const wrap = document.createElement('div'); wrap.className = 'explore-wrap';
    const prog = document.createElement('div'); prog.className = 'exp-progress';
    const dots = pool.map(() => { const d = document.createElement('div'); d.className = 'pd'; prog.appendChild(d); return d; });
    const row = document.createElement('div'); row.className = 'explore-row';
    wrap.append(prog, row); play.appendChild(wrap);

    const spawn = (slot) => {
      if (nextIdx >= total) { slot.innerHTML = ''; return; }
      const w = pool[nextIdx++];
      const b = document.createElement('div');
      b.className = 'balloon rise big'; fillItem(b, w);
      b.onclick = () => pop(b, w, slot);
      slot.innerHTML = ''; slot.appendChild(b);
    };
    const pop = (b, w, slot) => {
      if (b.dataset.done) return; b.dataset.done = '1';
      popSound(); bigBurst(b, w.meta && w.meta.hex); b.classList.add('boom');
      say(w.text, w.audio);
      if (w.sound) setTimeout(() => playAudio(w.sound), 650);
      if (dots[popped]) { dots[popped].style.background = w.meta?.hex || '#fff'; dots[popped].classList.add('filled'); }
      popped++;
      setTimeout(() => {
        if (popped >= total) { praise(PRAISE_OK, true); setTimeout(nextMission, 1100); return; }
        spawn(slot);
      }, 420);
    };
    for (let i = 0; i < SLOTS; i++) {
      const slot = document.createElement('div'); slot.className = 'slot';
      row.appendChild(slot); spawn(slot);
    }
    nextBtn.classList.remove('hidden');
  }

  // ---------- mission: listen-and-tap ----------
  function renderTap(m) {
    const pool = shuffle(m.items.map(id => wordById[id]));
    let round = 0;
    const ask = () => {
      const target = pool[round % pool.length];
      const choices = m.config?.choices || pool.length;
      let opts = [target, ...shuffle(pool.filter(w=>w.id!==target.id)).slice(0, choices-1)];
      opts = shuffle(opts);
      const p = promptFor(m, target);
      say(p.text, p.audio);
      play.innerHTML = '';
      opts.forEach(w => {
        const b = document.createElement('div');
        b.className = 'balloon'; fillItem(b, w);
        b.onclick = () => {
          if (w.id === target.id) {
            burst(b); b.classList.add('pop');
            praise(PRAISE_OK, true);
            round++;
            setTimeout(() => round >= m.rounds ? nextMission() : ask(), 850);
          } else {
            b.classList.add('wrong'); setTimeout(()=>b.classList.remove('wrong'),420);
            praise(PRAISE_RETRY, false);
          }
        };
        play.appendChild(b);
      });
    };
    ask();
  }

  // ---------- mission: sort ----------
  function renderSort(m) {
    const items = m.items.map(id => wordById[id]);
    const per = m.config?.objectsPerBucket || 2;
    const buckets = m.config?.buckets || null;   // category mode: word.meta.group → bucket id
    let queue = shuffle(items.flatMap(w => Array(per).fill(w)));
    let qi = 0;
    const keyOf = (w) => buckets ? (w.meta && w.meta.group) : w.id;

    play.innerHTML = '';
    const area = document.createElement('div'); area.className = 'sort-area';
    const tray = document.createElement('div'); tray.className = 'obj-tray';
    const boxesEl = document.createElement('div'); boxesEl.className = 'boxes';
    area.append(tray, boxesEl); play.appendChild(area);

    const boxDefs = buckets || items.map(w => ({ id: w.id, hex: (w.meta && w.meta.hex) }));
    boxDefs.forEach(bd => {
      const box = document.createElement('div'); box.className = 'box';
      if (bd.hex) {
        box.style.background = bd.hex + '55'; box.style.borderColor = bd.hex;
        box.innerHTML = '<div class="lid">📦</div>';
      } else {
        box.classList.add('box-cat');
        box.innerHTML = '<div class="box-emo">' + (bd.emo || '📦') + '</div><div class="box-lbl">' + (bd.label || '') + '</div>';
      }
      box.onclick = () => choose(bd, box);
      boxesEl.appendChild(box);
    });

    const showObj = () => {
      tray.innerHTML = '';
      if (qi >= queue.length) { setTimeout(nextMission, 400); return; }
      const w = queue[qi];
      const p = promptFor(m, w);
      say(p.text, p.audio);
      const o = document.createElement('div'); o.className = 'obj';
      if (buckets) fillItem(o, w);                 // วัตถุเป็นรูป (สิ่งมีชีวิต/ของใช้)
      else o.style.background = w.meta?.hex || '#ccc';
      o.dataset.id = w.id; tray.appendChild(o);
    };
    const choose = (bd, boxEl) => {
      const w = queue[qi]; if (!w) return;
      if (bd.id === keyOf(w)) {
        boxEl.classList.add('hit'); setTimeout(()=>boxEl.classList.remove('hit'),400);
        const o = tray.querySelector('.obj'); if (o) o.classList.add('gone');
        burst(boxEl); praise(PRAISE_OK, true);
        qi++; setTimeout(showObj, 700);
      } else {
        boxEl.classList.add('wrong'); setTimeout(()=>boxEl.classList.remove('wrong'),420);
        praise(PRAISE_RETRY, false);
      }
    };
    showObj();
  }

  // ---------- mission: song ----------
  function playTone(freq, dur, type, vol) {
    try {
      _actx = _actx || new (window.AudioContext || window.webkitAudioContext)();
      const o = _actx.createOscillator(), g = _actx.createGain();
      o.type = type || 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, _actx.currentTime);
      g.gain.exponentialRampToValueAtTime(vol || 0.1, _actx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, _actx.currentTime + (dur || 0.3));
      o.connect(g); g.connect(_actx.destination);
      o.start(); o.stop(_actx.currentTime + (dur || 0.3) + 0.03);
    } catch (e) {}
  }
  function startMelody() {
    stopMelody();
    const seq = [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 587.33, 523.25];
    let i = 0;
    const beat = () => { playTone(seq[i % seq.length], 0.32, 'sine', 0.09); i++; };
    beat(); _melodyTimer = setInterval(beat, 380);
  }
  function stopMelody() {
    if (_melodyTimer) { clearInterval(_melodyTimer); _melodyTimer = null; }
    if (_songTimer) { clearTimeout(_songTimer); _songTimer = null; }
  }
  function bounce(el) { el.animate([{transform:'scale(1)'},{transform:'scale(1.25)'},{transform:'scale(1)'}], {duration:380, easing:'ease-out'}); }

  function renderSong(m) {
    const colors = m.items ? m.items.map(id => wordById[id]) : UNIT.words.slice();
    play.innerHTML = '';
    const grid = document.createElement('div'); grid.className = 'song-grid';
    const tiles = colors.map(w => {
      const t = document.createElement('div'); t.className = 'song-tile'; t.style.background = w.meta?.hex || '#ccc';
      t.onclick = () => { bounce(t); say(w.text, w.audio); };
      grid.appendChild(t); return { t, w };
    });
    play.appendChild(grid);
    say('Color song! 🎵', 'audio/praise/song.mp3');
    startMelody();
    let i = 0;
    const step = () => {
      if (i >= tiles.length) { stopMelody(); praise(PRAISE_OK, true); _songTimer = setTimeout(nextMission, 1300); return; }
      const { t, w } = tiles[i]; bounce(t);
      const a = new Audio(w.audio); a.play().catch(() => {});
      i++; _songTimer = setTimeout(step, 720);
    };
    _songTimer = setTimeout(step, 1100);
    nextBtn.classList.remove('hidden');
  }

  // ---------- mission: count ----------
  const NUMWORDS = ['', 'one','two','three','four','five','six','seven','eight','nine','ten',
    'eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty'];
  function renderCount(m) {
    const counts = (m.counts || [1,2,3,4,5]);
    const colors = ['#ff5b5b','#ffd23f','#4d8bff','#5fd06a','#ff9f40','#9b6dff','#ff7eb3'];
    let round = 0;
    const ask = () => {
      if (round >= counts.length) { nextMission(); return; }
      const n = counts[round];
      say((m.prompt && m.prompt.text) || 'How many?', m.prompt && m.prompt.audio);
      play.innerHTML = '';
      const wrap = document.createElement('div'); wrap.className = 'count-area'; play.appendChild(wrap);
      let tapped = 0;
      const color = colors[round % colors.length];
      for (let i = 0; i < n; i++) {
        const b = document.createElement('div'); b.className = 'balloon count-obj'; b.style.background = color;
        b.onclick = () => {
          if (b.dataset.done) return; b.dataset.done = '1';
          tapped++; b.classList.add('counted'); bounce(b); popSound();
          playAudio('audio/words/' + (NUMWORDS[tapped] || 'one') + '.mp3');
          if (tapped >= n) { setTimeout(() => { praise(PRAISE_OK, true); round++; setTimeout(ask, 1200); }, 800); }
        };
        wrap.appendChild(b);
      }
    };
    ask();
  }

  // ---------- mission: tap-part (body) ----------
  function renderTapPart(m) {
    const all = m.items.map(id => wordById[id]);
    const remaining = shuffle(all.slice());
    const charW = 320, charH = 460, R = 80;   // dot spacing guard (well separated)
    const overlaps = (a, b) => { const dx = (a.x - b.x) / 100 * charW, dy = (a.y - b.y) / 100 * charH; return (dx*dx + dy*dy) < (R*R); };
    play.innerHTML = '';
    const stage = document.createElement('div'); stage.className = 'body-stage';
    const img = document.createElement('img'); img.className = 'body-char'; img.src = (UNIT.character || '') + '?v=11'; img.alt = '';
    stage.appendChild(img);
    play.appendChild(stage);
    let target = null;
    const render = () => {
      Array.prototype.forEach.call(stage.querySelectorAll('.body-dot'), d => d.remove());
      if (remaining.length === 0) { nextMission(); return; }
      // show only a non-overlapping subset of the remaining parts
      const vis = [];
      shuffle(remaining.slice()).forEach(w => { if (vis.length < 4 && !vis.some(v => overlaps(v, w))) vis.push(w); });
      target = vis[Math.floor(Math.random() * vis.length)];
      const p = promptFor(m, target); say(p.text, p.audio);
      vis.forEach(w => {
        const mk = document.createElement('div'); mk.className = 'body-dot';
        mk.style.left = w.x + '%'; mk.style.top = w.y + '%';
        mk.onclick = () => {
          if (w.id === target.id) {
            mk.classList.add('hit'); burst(mk); popSound(); praise(PRAISE_OK, true);
            const i = remaining.indexOf(w); if (i >= 0) remaining.splice(i, 1);
            setTimeout(render, 950);   // correct part disappears, fresh non-overlapping set comes up
          } else {
            mk.classList.add('miss'); setTimeout(() => mk.classList.remove('miss'), 420);
            praise(PRAISE_RETRY, false);
          }
        };
        stage.appendChild(mk);
      });
    };
    render();
  }

  // ---------- mission: match (pair up tiles) ----------
  // config.mode: 'image-image' (default) | 'image-sound'  · config.pairs: how many pairs (default min(4,n))
  // no-fail: wrong tap = gentle shake + soft praise, nothing lost
  function renderMatch(m) {
    const mode = m.config?.mode || 'image-image';
    if (mode === 'image-sound') return renderMatchSound(m);   // "บอกแล้วกดรูป"
    const all = m.items.map(id => wordById[id]);
    const n = Math.min(m.config?.pairs || 4, all.length);
    const words = shuffle(all).slice(0, n);
    say(m.prompt?.text || 'Find the pairs!', m.prompt?.audio);
    play.innerHTML = '';
    const area = document.createElement('div'); area.className = 'match-area';
    const colL = document.createElement('div'); colL.className = 'match-col';
    const colR = document.createElement('div'); colR.className = 'match-col';
    area.append(colL, colR); play.appendChild(area);

    let selected = null, matched = 0;

    shuffle(words).forEach(w => {            // left = cue column (image, tap to hear)
      const t = document.createElement('div'); t.className = 'match-tile cue';
      fillItem(t, w);
      t.onclick = () => {
        if (t.classList.contains('matched')) return;
        if (selected) selected.el.classList.remove('sel');
        selected = { w, el: t }; t.classList.add('sel');
        say(w.text, w.audio);
      };
      colL.appendChild(t);
    });

    shuffle(words).forEach(w => {            // right = answer column (always images)
      const t = document.createElement('div'); t.className = 'match-tile ans'; fillItem(t, w);
      t.onclick = () => {
        if (t.classList.contains('matched')) return;
        if (!selected) { say(m.prompt?.text || 'Tap one on the left first', m.prompt?.audio); return; }
        if (selected.w.id === w.id) {
          t.classList.add('matched'); selected.el.classList.add('matched'); selected.el.classList.remove('sel');
          burst(t); burst(selected.el); popSound(); praise(PRAISE_OK, true);
          selected = null; matched++;
          if (matched >= words.length) setTimeout(nextMission, 1050);
        } else {
          t.classList.add('wrong'); setTimeout(() => t.classList.remove('wrong'), 420);
          praise(PRAISE_RETRY, false);
        }
      };
      colR.appendChild(t);
    });
  }

  // image-sound: เกมบอกว่าให้กดอะไร เด็กกดรูปตามที่บอก (กดถูก=หาย, ครบ=จบ)
  function renderMatchSound(m) {
    const all = m.items.map(id => wordById[id]);
    const n = Math.min(m.config?.pairs || all.length, all.length);
    const words = shuffle(all).slice(0, n);
    play.innerHTML = '';
    const area = document.createElement('div'); area.className = 'match-area single';
    const grid = document.createElement('div'); grid.className = 'match-grid';
    area.appendChild(grid); play.appendChild(area);
    const tiles = shuffle(words).map(w => {
      const t = document.createElement('div'); t.className = 'match-tile ans'; fillItem(t, w);
      grid.appendChild(t); return { t, w };
    });
    const order = shuffle(words);
    let i = 0;
    const ask = () => {
      if (i >= order.length) { setTimeout(nextMission, 900); return; }
      const target = order[i];
      const text = (m.prompt?.text || 'Tap the {word}!').replaceAll('{word}', target.text);
      say(text, target.audio);                       // บอกด้วยเสียง
      tiles.forEach(({ t, w }) => {
        t.onclick = () => {
          if (t.classList.contains('matched')) return;
          if (w.id === target.id) {
            t.classList.add('matched'); burst(t); popSound(); praise(PRAISE_OK, true);
            i++; setTimeout(ask, 950);
          } else {
            t.classList.add('wrong'); setTimeout(() => t.classList.remove('wrong'), 420);
            praise(PRAISE_RETRY, false);
          }
        };
      });
    };
    ask();
  }

  // ---------- mission: first-letter (phonics — เสียงแรก/ตัวแรก) ----------
  // แต่ละ word มี w.first = ตัวอักษรแรก (เช่น "b") · โชว์ตัวอักษรใหญ่ + รูปให้เลือกอันที่ขึ้นต้นด้วยตัวนั้น
  const FL_COLORS = ['#ff5b5b','#ff9f40','#ffd23f','#5fd06a','#16c4c0','#4d8bff','#9b6dff','#ff7eb3'];
  function renderFirstLetter(m) {
    const pool = m.items.map(id => wordById[id]);
    const nChoices = m.config?.choices || 4;
    let round = 0;
    const ask = () => {
      if (round >= m.rounds) { nextMission(); return; }
      const target = pool[round % pool.length];
      const L = (target.first || '').toUpperCase();
      const distractors = shuffle(pool.filter(w => w.first !== target.first)).slice(0, nChoices - 1);
      const opts = shuffle([target, ...distractors]);
      play.innerHTML = '';
      const big = document.createElement('div'); big.className = 'fl-letter'; big.textContent = L;
      big.style.background = FL_COLORS[round % FL_COLORS.length];
      play.appendChild(big);
      const row = document.createElement('div'); row.className = 'fl-row'; play.appendChild(row);
      say('What starts with ' + L + '?', 'audio/words/letter-' + target.first + '.mp3');
      opts.forEach(w => {
        const t = document.createElement('div'); t.className = 'match-tile ans'; fillItem(t, w);
        t.onclick = () => {
          if (t.classList.contains('matched')) return;
          if (w.first === target.first) {
            t.classList.add('matched'); burst(t); popSound();
            playAudio(w.audio);                 // พูดคำที่ถูก
            praise(PRAISE_OK, true); round++;
            setTimeout(ask, 1050);
          } else {
            t.classList.add('wrong'); setTimeout(() => t.classList.remove('wrong'), 420);
            praise(PRAISE_RETRY, false);
          }
        };
        row.appendChild(t);
      });
    };
    ask();
  }

  // ---------- mission: rhyme (phonics — คล้องจอง) ----------
  // แต่ละ word มี w.rime (เช่น "at" สำหรับ cat/hat/bat) · โชว์คำเป้า + เลือกอันที่คล้องจอง
  function renderRhyme(m) {
    const pool = m.items.map(id => wordById[id]);
    const eligible = pool.filter(t => pool.some(w => w.id !== t.id && w.rime === t.rime));
    const nChoices = m.config?.choices || 3;
    let round = 0;
    const ask = () => {
      if (round >= m.rounds || !eligible.length) { nextMission(); return; }
      const target = eligible[round % eligible.length];
      const mate = shuffle(pool.filter(w => w.id !== target.id && w.rime === target.rime))[0];
      const others = shuffle(pool.filter(w => w.rime !== target.rime)).slice(0, nChoices - 1);
      const opts = shuffle([mate, ...others]);
      play.innerHTML = '';
      const big = document.createElement('div'); big.className = 'rh-target';
      const im = document.createElement('img'); im.className = 'rh-target-img'; im.src = (target.image || '') + '?v=11'; im.alt = '';
      big.appendChild(im); play.appendChild(big);
      const row = document.createElement('div'); row.className = 'fl-row'; play.appendChild(row);
      say('Which rhymes with ' + target.text + '?', target.audio);
      opts.forEach(w => {
        const t = document.createElement('div'); t.className = 'match-tile ans'; fillItem(t, w);
        t.onclick = () => {
          if (t.classList.contains('matched')) return;
          if (w.rime === target.rime) {
            t.classList.add('matched'); burst(t); popSound(); playAudio(w.audio);
            praise(PRAISE_OK, true); round++; setTimeout(ask, 1100);
          } else {
            t.classList.add('wrong'); setTimeout(() => t.classList.remove('wrong'), 420);
            praise(PRAISE_RETRY, false);
          }
        };
        row.appendChild(t);
      });
    };
    ask();
  }

  // ---------- mission: size (big/small — adjectives, ภาพเดียว 2 ขนาด) ----------
  function renderSize(m) {
    const pool = m.items.map(id => wordById[id]);
    let round = 0;
    const ask = () => {
      if (round >= m.rounds) { nextMission(); return; }
      const w = pool[round % pool.length];
      const wantBig = (round % 2 === 0);
      play.innerHTML = '';
      const row = document.createElement('div'); row.className = 'fl-row sz-row'; play.appendChild(row);
      say(wantBig ? 'Tap the BIG one!' : 'Tap the small one!', wantBig ? 'audio/words/big.mp3' : 'audio/words/small.mp3');
      shuffle([true, false]).forEach(isBig => {
        const t = document.createElement('div'); t.className = 'match-tile ans ' + (isBig ? 'sz-big' : 'sz-small');
        fillItem(t, w);
        t.onclick = () => {
          if (t.classList.contains('matched')) return;
          if (isBig === wantBig) {
            t.classList.add('matched'); burst(t); popSound(); praise(PRAISE_OK, true);
            round++; setTimeout(ask, 1000);
          } else {
            t.classList.add('wrong'); setTimeout(() => t.classList.remove('wrong'), 420);
            praise(PRAISE_RETRY, false);
          }
        };
        row.appendChild(t);
      });
    };
    ask();
  }

  // ---------- mission: pattern (อะไรมาต่อ — numeracy/logic, มฐ.10) ----------
  // generative: สร้างลำดับซ้ำจาก items (tile สี/รูป) แล้วถามตัวถัดไป · no-fail
  const PAT_TEMPLATES = [['A','B'], ['A','B','C'], ['A','A','B'], ['A','B','B']];
  function renderPattern(m) {
    const pool = m.items.map(id => wordById[id]).filter(Boolean);
    const rounds = m.rounds || 5;
    let round = 0;
    const ask = () => {
      if (round >= rounds) { nextMission(); return; }
      const tpl = PAT_TEMPLATES[round % PAT_TEMPLATES.length];
      const need = new Set(tpl).size;
      const chosen = shuffle(pool).slice(0, Math.max(need, 2));
      const map = {}; ['A','B','C','D'].forEach((s, i) => map[s] = chosen[i] || chosen[0]);
      const reps = tpl.length <= 2 ? 3 : 2;        // โชว์ลำดับซ้ำพอให้เด็กจับ pattern
      const full = [];
      for (let r = 0; r < reps; r++) tpl.forEach(s => full.push(map[s]));
      const answer = full[full.length - 1];        // ตัวสุดท้าย = คำตอบ
      const shown = full.slice(0, full.length - 1); // โชว์ทุกตัวก่อนช่องคำถาม
      const distract = shuffle(pool.filter(w => w.id !== answer.id)).slice(0, 2);
      const opts = shuffle([answer, ...distract]);
      play.innerHTML = '';
      const seq = document.createElement('div'); seq.className = 'pat-seq';
      shown.forEach(w => { const c = document.createElement('div'); c.className = 'pat-cell'; fillItem(c, w); seq.appendChild(c); });
      const q = document.createElement('div'); q.className = 'pat-cell pat-q'; q.textContent = '?'; seq.appendChild(q);
      play.appendChild(seq);
      const row = document.createElement('div'); row.className = 'fl-row'; play.appendChild(row);
      say((m.prompt && m.prompt.text) || 'What comes next?', m.prompt && m.prompt.audio);
      opts.forEach(w => {
        const t = document.createElement('div'); t.className = 'match-tile ans'; fillItem(t, w);
        t.onclick = () => {
          if (t.classList.contains('matched')) return;
          if (w.id === answer.id) {
            t.classList.add('matched'); burst(t); popSound();
            q.classList.remove('pat-q'); q.textContent = ''; fillItem(q, w);   // เฉลยลงช่อง ?
            playAudio(w.audio); praise(PRAISE_OK, true); round++; setTimeout(ask, 1150);
          } else {
            t.classList.add('wrong'); setTimeout(() => t.classList.remove('wrong'), 420);
            praise(PRAISE_RETRY, false);
          }
        };
        row.appendChild(t);
      });
    };
    ask();
  }

  // ---------- mission: countmatch (จับคู่จำนวน→ตัวเลข, มฐ.10 / K.CC.B) ----------
  // โชว์กลุ่มของ n ชิ้น → เด็กแตะตัวเลขที่ตรง · no-fail · reuse เสียง one..twenty
  function renderCountMatch(m) {
    const counts = m.counts || [2,3,4,5,6];
    const nChoices = (m.config && m.config.choices) || 3;
    const colors = ['#ff5b5b','#ffd23f','#4d8bff','#5fd06a','#ff9f40','#9b6dff','#ff7eb3','#16c4c0'];
    const maxN = Math.max.apply(null, counts.concat([9]));
    let round = 0;
    const ask = () => {
      if (round >= counts.length) { nextMission(); return; }
      const n = counts[round];
      play.innerHTML = '';
      say((m.prompt && m.prompt.text) || 'How many? Tap the number!', m.prompt && m.prompt.audio);
      const wrap = document.createElement('div'); wrap.className = 'count-area cm-objs';
      const color = colors[round % colors.length];
      for (let i = 0; i < n; i++) { const d = document.createElement('div'); d.className = 'cm-dot'; d.style.background = color; wrap.appendChild(d); }
      play.appendChild(wrap);
      const pool = []; for (let k = 1; k <= maxN; k++) if (k !== n) pool.push(k);
      const opts = shuffle([n].concat(shuffle(pool).slice(0, nChoices - 1)));
      const row = document.createElement('div'); row.className = 'fl-row'; play.appendChild(row);
      opts.forEach(k => {
        const t = document.createElement('div'); t.className = 'match-tile ans has-label';
        const sp = document.createElement('span'); sp.className = 'item-label'; sp.textContent = String(k); t.appendChild(sp);
        t.onclick = () => {
          if (t.classList.contains('matched')) return;
          if (k === n) {
            t.classList.add('matched'); burst(t); popSound();
            playAudio('audio/words/' + (NUMWORDS[n] || 'one') + '.mp3');
            praise(PRAISE_OK, true); round++; setTimeout(ask, 1100);
          } else {
            t.classList.add('wrong'); setTimeout(() => t.classList.remove('wrong'), 420);
            praise(PRAISE_RETRY, false);
          }
        };
        row.appendChild(t);
      });
    };
    ask();
  }

  // ---------- mission: trace (drag along the path — pre-writing) ----------
  // each item's word may carry w.trace = [[x,y],...] normalized 0..1 waypoints (in stroke order).
  // falls back to a simple left→right path so it is always playable. big hit radius for kid fingers.
  function defaultPath() { return [[0.18,0.5],[0.39,0.34],[0.61,0.66],[0.82,0.5]]; }
  function renderTrace(m) {
    const items = m.items.map(id => wordById[id]);
    let idx = 0;
    const showOne = () => {
      if (idx >= items.length) { nextMission(); return; }
      const w = items[idx];
      const p = promptFor(m, w);
      say(p.text || ('Trace ' + w.text), p.audio);
      play.innerHTML = '';
      const stage = document.createElement('div'); stage.className = 'trace-stage';
      if (w.label) { const g = document.createElement('div'); g.className = 'trace-glyph'; g.textContent = w.label; stage.appendChild(g); }
      else if (w.image) { const im = document.createElement('img'); im.className = 'trace-glyph-img'; im.src = w.image + '?v=11'; im.alt = ''; stage.appendChild(im); }
      const path = (w.trace && w.trace.length) ? w.trace : defaultPath();
      const dotsEl = path.map((pt, i) => {
        const d = document.createElement('div'); d.className = 'trace-dot' + (i === 0 ? ' start' : '');
        d.style.left = (pt[0] * 100) + '%'; d.style.top = (pt[1] * 100) + '%';
        stage.appendChild(d); return d;
      });
      // ink layer — canvas วาดเส้นตามนิ้ว (เรนเดอร์เหมือนกันทุกเบราว์เซอร์ ไม่พึ่ง SVG)
      const canvas = document.createElement('canvas'); canvas.className = 'trace-ink';
      stage.appendChild(canvas);
      play.appendChild(stage);
      const dpr = window.devicePixelRatio || 1;
      const r0 = stage.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(r0.width * dpr)); canvas.height = Math.max(1, Math.round(r0.height * dpr));
      const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr);
      ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#ff8a3d';

      const HIT = 0.16;                       // big hit radius (kid fingers)
      let drawing = false, nextDot = 0, last = null;
      const loc = (e) => { const t = (e.touches && e.touches[0]) ? e.touches[0] : e; const r = stage.getBoundingClientRect(); return { x: t.clientX - r.left, y: t.clientY - r.top, w: r.width, h: r.height }; };
      const checkDot = (nx, ny) => {
        const pt = path[nextDot]; if (!pt) return;
        if (Math.hypot(nx - pt[0], ny - pt[1]) < HIT) {
          dotsEl[nextDot].classList.add('lit'); popSound(); nextDot++;
          if (nextDot >= path.length) {
            drawing = false; ctx.strokeStyle = '#36c06e';
            burst(stage); praise(PRAISE_OK, true);
            idx++; setTimeout(showOne, 1000);
          }
        }
      };
      const down = (e) => {
        drawing = true; const p = loc(e); last = p;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + 0.01, p.y + 0.01); ctx.stroke();
        checkDot(p.x / p.w, p.y / p.h);
      };
      const move = (e) => {
        if (!drawing) return; if (e.cancelable) e.preventDefault();
        const p = loc(e);
        if (last) { ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke(); }
        last = p; checkDot(p.x / p.w, p.y / p.h);
      };
      const up = () => { drawing = false; last = null; };
      // ครอบทั้ง pointer + touch กันเบราว์เซอร์ไหนไม่รองรับอันใดอันหนึ่ง (touch-action:none กันจอเลื่อน)
      stage.addEventListener('pointerdown', down);
      stage.addEventListener('pointermove', move);
      stage.addEventListener('pointercancel', up);
      stage.addEventListener('touchstart', down, { passive: false });
      stage.addEventListener('touchmove', move, { passive: false });
      window.addEventListener('pointerup', up);
      window.addEventListener('touchend', up);
    };
    showOne();
  }

  // ---------- flow ----------
  function runMission(i) {
    stopMelody();
    missionIndex = i; renderDots();
    nextBtn.classList.add('hidden');
    play.classList.remove('mfade'); void play.offsetWidth; play.classList.add('mfade');
    const m = UNIT.missions[i];
    if (m.type === 'free-explore') renderExplore(m);
    else if (m.type === 'listen-and-tap') renderTap(m);
    else if (m.type === 'sort') renderSort(m);
    else if (m.type === 'song') renderSong(m);
    else if (m.type === 'count') renderCount(m);
    else if (m.type === 'tap-part') renderTapPart(m);
    else if (m.type === 'match') renderMatch(m);
    else if (m.type === 'trace') renderTrace(m);
    else if (m.type === 'first-letter') renderFirstLetter(m);
    else if (m.type === 'rhyme') renderRhyme(m);
    else if (m.type === 'listen-and-choose') renderTap(m);   // อ.2 ประโยค (ใช้กลไกเดียวกับ listen-and-tap)
    else if (m.type === 'size') renderSize(m);
    else if (m.type === 'pattern') renderPattern(m);
    else if (m.type === 'countmatch') renderCountMatch(m);
    else nextMission();
  }
  function nextMission() {
    if (missionIndex + 1 >= UNIT.missions.length) celebrate();
    else { sfx('whoosh'); runMission(missionIndex + 1); }
  }
  nextBtn.onclick = nextMission;

  function celebrate() {
    stopMelody();
    const p = loadProgress(); p.units = p.units || {};
    if (!p.units[UNIT.id]) { p.units[UNIT.id] = true; p.stars = (p.stars || 0) + 3; }
    const today = new Date().toISOString().slice(0, 10);
    if (p.lastDay !== today) {
      const diff = p.lastDay ? Math.round((Date.parse(today) - Date.parse(p.lastDay)) / 86400000) : 999;
      p.streak = (diff === 1) ? (p.streak || 0) + 1 : 1;
      p.lastDay = today; p.todayCount = 0;
    }
    p.todayCount = (p.todayCount || 0) + 1;
    saveProgress(p);
    recordEvent('completed', 'unit', UNIT.id);
    const sp = $('stickerPop'); if (sp && STICKERS[UNIT.id]) sp.textContent = STICKERS[UNIT.id];
    renderDots();
    $('winOverlay').classList.remove('hidden');
    sfx('win');
    playAudio('audio/praise/great-job.mp3').then(()=>playAudio('audio/praise/hooray.mp3'));
  }

  // ---------- boot ----------
  async function loadUnit(id) {
    try {
      const r = await fetch('content/' + id + '.json?v=14');
      if (r.ok) return await r.json();
    } catch (e) {}
    return (window.K1_UNITS || {})[id] || null;   // file:// fallback
  }

  function start() {
    try { _actx = _actx || new (window.AudioContext || window.webkitAudioContext)(); _actx.resume(); } catch (e) {}
    startBgm();
    $('startOverlay').classList.add('hidden');
    $('winOverlay').classList.add('hidden');
    missionIndex = 0;
    recordEvent('started', 'unit', UNIT.id);
    setMascot('wave');
    say((UNIT.intro && UNIT.intro.text) || "Let's play!", UNIT.intro && UNIT.intro.audio)
      .then(() => { setMascot('idle'); runMission(0); });
  }

  $('homeBtn').onclick = () => { location.href = 'home.html'; };
  { const mb = $('musicBtn'); if (mb) mb.onclick = toggleMusic; updateMusicBtn(); }
  $('bookBtn').onclick = () => {
    const p = loadProgress(); const done = p.units || {};
    const grid = $('bookGrid');
    if (grid) {
      grid.innerHTML = '';
      UNIT_ORDER.forEach(id => {
        const d = document.createElement('div'); d.className = 'book-sticker' + (done[id] ? '' : ' locked');
        d.textContent = done[id] ? (STICKERS[id] || '⭐') : '🔒';
        grid.appendChild(d);
      });
    }
    const bs = $('bookStars'); if (bs) bs.textContent = p.stars || 0;
    $('bookOverlay').classList.remove('hidden');
  };
  { const bc = $('bookClose'); if (bc) bc.onclick = () => $('bookOverlay').classList.add('hidden'); }

  (async () => {
    const unitId = new URLSearchParams(location.search).get('unit') || 'colors';
    UNIT = await loadUnit(unitId);
    if (!UNIT) { bubble.textContent = 'No data — run a local server (see note).'; return; }
    wordById = Object.fromEntries(UNIT.words.map(w => [w.id, w]));
    preloadAudio();
    preloadImages();
    $('startTitle').textContent = UNIT.title || 'Play';
    renderDots();
    $('startBtn').onclick = start;
    $('againBtn').onclick = start;
  })();
})();

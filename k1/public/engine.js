/* 101future Kids — K1 engine (data-driven, reads content/<unit>.json) */
(() => {
  const $ = (id) => document.getElementById(id);
  const play = $('play'), bubble = $('bubble'), mascot = $('mascot'),
        dots = $('dots'), nextBtn = $('nextBtn');

  let UNIT = null, wordById = {}, missionIndex = 0, currentPrompt = null, _actx = null, _melodyTimer = null, _songTimer = null;

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
  const PRAISE_OK = [['Yes!','yes'],['Great job!','great-job'],['Well done!','well-done'],['Wow!','wow'],['You did it!','you-did-it']];
  const PRAISE_RETRY = [['Try again!','try-again'],['Almost!','almost'],['Good try!','good-try']];
  const pick = (a) => a[Math.floor(Math.random()*a.length)];
  function praise(set, happy=true) {
    const [t,k] = pick(set);
    bubble.textContent = t;
    mascot.classList.add(happy ? 'happy' : 'sad');
    setTimeout(() => mascot.classList.remove('happy','sad'), 600);
    if (happy) { setMascot('happy'); setTimeout(() => setMascot('idle'), 1000); }
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
    if (w.image) {
      el.classList.add('has-img');
      const im = document.createElement('img'); im.className = 'item-img'; im.src = w.image + '?v=11'; im.alt = '';
      el.appendChild(im); return;
    }
    if (w.label) {
      if (w.meta && w.meta.hex) el.style.background = w.meta.hex;
      el.classList.add('has-label');
      const t = document.createElement('span'); t.className = 'item-label'; t.textContent = w.label;
      el.appendChild(t); return;
    }
    if (w.meta && typeof w.meta.hex === 'string') { el.style.background = w.meta.hex; return; }
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
    const colors = m.items.map(id => wordById[id]);
    const per = m.config?.objectsPerBucket || 2;
    let queue = shuffle(colors.flatMap(w => Array(per).fill(w)));
    let qi = 0;

    play.innerHTML = '';
    const area = document.createElement('div'); area.className = 'sort-area';
    const tray = document.createElement('div'); tray.className = 'obj-tray';
    const boxesEl = document.createElement('div'); boxesEl.className = 'boxes';
    area.append(tray, boxesEl); play.appendChild(area);

    colors.forEach(w => {
      const box = document.createElement('div');
      box.className = 'box'; box.style.background = (w.meta?.hex || '#ccc') + '55';
      box.style.borderColor = w.meta?.hex || '#fff';
      box.innerHTML = '<div class="lid">📦</div>';
      box.onclick = () => choose(w, box);
      boxesEl.appendChild(box);
    });

    const showObj = () => {
      tray.innerHTML = '';
      if (qi >= queue.length) { setTimeout(nextMission, 400); return; }
      const w = queue[qi];
      const p = promptFor(m, w);
      say(p.text, p.audio);
      const o = document.createElement('div');
      o.className = 'obj'; o.style.background = w.meta?.hex || '#ccc';
      o.dataset.id = w.id; tray.appendChild(o);
    };
    const choose = (boxWord, boxEl) => {
      const w = queue[qi]; if (!w) return;
      if (boxWord.id === w.id) {
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
  const NUMWORDS = ['', 'one','two','three','four','five','six','seven','eight','nine','ten'];
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

  // ---------- flow ----------
  function runMission(i) {
    stopMelody();
    missionIndex = i; renderDots();
    nextBtn.classList.add('hidden');
    const m = UNIT.missions[i];
    if (m.type === 'free-explore') renderExplore(m);
    else if (m.type === 'listen-and-tap') renderTap(m);
    else if (m.type === 'sort') renderSort(m);
    else if (m.type === 'song') renderSong(m);
    else if (m.type === 'count') renderCount(m);
    else nextMission();
  }
  function nextMission() {
    if (missionIndex + 1 >= UNIT.missions.length) celebrate();
    else runMission(missionIndex + 1);
  }
  nextBtn.onclick = nextMission;

  function celebrate() {
    stopMelody();
    renderDots();
    $('winOverlay').classList.remove('hidden');
    playAudio('audio/praise/great-job.mp3').then(()=>playAudio('audio/praise/hooray.mp3'));
  }

  // ---------- boot ----------
  async function loadUnit(id) {
    try {
      const r = await fetch('content/' + id + '.json?v=12');
      if (r.ok) return await r.json();
    } catch (e) {}
    return (window.K1_UNITS || {})[id] || null;   // file:// fallback
  }

  function start() {
    try { _actx = _actx || new (window.AudioContext || window.webkitAudioContext)(); _actx.resume(); } catch (e) {}
    $('startOverlay').classList.add('hidden');
    $('winOverlay').classList.add('hidden');
    missionIndex = 0;
    say((UNIT.intro && UNIT.intro.text) || "Let's play!", UNIT.intro && UNIT.intro.audio)
      .then(() => runMission(0));
  }

  $('homeBtn').onclick = () => { location.href = 'home.html'; };
  $('bookBtn').onclick = () => { mascot.classList.add('happy'); setTimeout(()=>mascot.classList.remove('happy'),600); };

  (async () => {
    const unitId = new URLSearchParams(location.search).get('unit') || 'colors';
    UNIT = await loadUnit(unitId);
    if (!UNIT) { bubble.textContent = 'No data — run a local server (see note).'; return; }
    wordById = Object.fromEntries(UNIT.words.map(w => [w.id, w]));
    preloadAudio();
    $('startTitle').textContent = UNIT.title || 'Play';
    renderDots();
    $('startBtn').onclick = start;
    $('againBtn').onclick = start;
  })();
})();

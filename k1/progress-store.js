/* 101future — ProgressStore (seam ตาม INTEGRATION_SPEC §3)
   วันนี้: LocalProgressStore (localStorage) · พรุ่งนี้สลับเป็น Supabase ได้โดยเกมไม่ต้องแก้
   - childId namespace:  future.progress.<childId>
   - event outbox (append-only) เตรียม sync เฟส B
   - migrate อัตโนมัติจากคีย์เก่า k1_progress (childId 'local')
   เกมเรียกผ่าน window.FutureProgress เท่านั้น ห้ามแตะ localStorage ตรง ๆ */
(function (global) {
  'use strict';

  // currentChildId มาจาก ?child= (INTEGRATION_SPEC §4) · ยังไม่มี login → 'local'
  function currentChildId() {
    try {
      var c = new URLSearchParams(location.search).get('child');
      if (c && c.trim()) return c.trim();
      var cur = localStorage.getItem('future.currentChild');
      if (cur) return cur;
    } catch (e) {}
    return 'local';
  }

  var EMPTY = { stars: 0, streak: 0, lastDay: null, todayCount: 0, units: {}, wordsSeen: {}, events: [] };

  function uuid() {
    // RFC4122-ish v4 (พอสำหรับ idempotency key ของ event)
    if (global.crypto && global.crypto.randomUUID) { try { return global.crypto.randomUUID(); } catch (e) {} }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0, v = c === 'x' ? r : (r & 0x3) | 0x8; return v.toString(16);
    });
  }

  function LocalProgressStore(childId) {
    this.childId = childId || currentChildId();
    this.key = 'future.progress.' + this.childId;
    this._listeners = [];
    this._migrate();
  }

  LocalProgressStore.prototype._read = function () {
    try {
      var raw = localStorage.getItem(this.key);
      if (raw) return Object.assign({}, EMPTY, JSON.parse(raw));
    } catch (e) {}
    return Object.assign({}, EMPTY);
  };
  LocalProgressStore.prototype._write = function (p) {
    try { localStorage.setItem(this.key, JSON.stringify(p)); } catch (e) {}
  };

  // ดึงข้อมูลจากคีย์เก่า k1_progress มาใส่ future.progress.local ครั้งเดียว (ไม่ทำลายของเดิม)
  LocalProgressStore.prototype._migrate = function () {
    if (this.childId !== 'local') return;
    try {
      if (localStorage.getItem(this.key)) return;           // มีของใหม่แล้ว ไม่ต้องย้าย
      var old = localStorage.getItem('k1_progress');
      if (!old) return;
      var o = JSON.parse(old);
      var p = Object.assign({}, EMPTY, {
        stars: o.stars || 0, streak: o.streak || 0,
        lastDay: o.lastDay || null, todayCount: o.todayCount || 0,
        units: o.units || {}, wordsSeen: o.wordsSeen || {}
      });
      this._write(p);
    } catch (e) {}
  };

  // ---- compat API (เกมเดิมเรียกแบบ load/save blob ได้เลย) ----
  LocalProgressStore.prototype.load = function () { return this._read(); };
  LocalProgressStore.prototype.save = function (p) { this._write(p); };

  LocalProgressStore.prototype.getProfile = function () {
    return { childId: this.childId, displayName: null, grade: null };
  };
  LocalProgressStore.prototype.loadProgress = function () { return Promise.resolve(this._read()); };

  // append-only event (id ฝั่ง client = idempotency key, INTEGRATION_SPEC §2)
  LocalProgressStore.prototype.recordEvent = function (ev) {
    var p = this._read();
    p.events = p.events || [];
    p.events.push({
      id: uuid(),
      child_id: this.childId,
      verb: ev.verb,
      object_type: ev.object_type,
      object_id: ev.object_id,
      result: ev.result || null,
      occurred_at: new Date().toISOString()
    });
    if (p.events.length > 500) p.events = p.events.slice(-500);   // กันบวมบนเครื่อง
    this._write(p);
    this._emit('pending');
    return Promise.resolve();
  };

  // local = ไม่มี backend จริง → sync เป็น no-op (Supabase adapter จะ override)
  LocalProgressStore.prototype.sync = function () { this._emit('synced'); return Promise.resolve(); };

  // local = ปลดล็อกทุกอย่าง (gate จริงอยู่ที่ Supabase adapter เฟส B)
  LocalProgressStore.prototype.isEntitled = function () { return Promise.resolve(true); };

  LocalProgressStore.prototype.onSyncStateChange = function (cb) { if (typeof cb === 'function') this._listeners.push(cb); };
  LocalProgressStore.prototype._emit = function (state) { this._listeners.forEach(function (cb) { try { cb(state); } catch (e) {} }); };

  // ---- Family: โปรไฟล์ลูกหลายคน (เตรียมต่อ account/Supabase) ----
  // เก็บใน localStorage future.family + future.currentChild · childId เด็กใหม่ = 'local' (คงต่อ progress เดิม)
  global.FutureFamily = {
    list: function () { try { return JSON.parse(localStorage.getItem('future.family') || '[]'); } catch (e) { return []; } },
    add: function (name, avatar) {
      var l = this.list();
      var id = (l.length === 0) ? 'local' : ('child-' + Date.now().toString(36) + Math.floor(Math.random() * 1e4));
      l.push({ id: id, name: (name || 'ลูก'), avatar: (avatar || '🧒') });
      try { localStorage.setItem('future.family', JSON.stringify(l)); } catch (e) {}
      return id;
    },
    remove: function (id) {
      var l = this.list().filter(function (c) { return c.id !== id; });
      try { localStorage.setItem('future.family', JSON.stringify(l)); } catch (e) {}
    },
    setCurrent: function (id) { try { localStorage.setItem('future.currentChild', id); } catch (e) {} },
    current: function () { try { return localStorage.getItem('future.currentChild') || 'local'; } catch (e) { return 'local'; } }
  };

  // bootstrap: ตัวเดียวที่รู้ว่าใช้ backend อะไร (วันนี้ = Local)
  global.FutureProgress = new LocalProgressStore();
  global.FutureProgress.LocalProgressStore = LocalProgressStore;   // เผื่อ test/สลับ
})(window);

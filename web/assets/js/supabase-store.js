/* 101future — FutureSync: ซิงก์ progress ขึ้น Supabase (cloud)
   ทำงานเมื่อมี session เท่านั้น (anon sign-in หรือ LINE ภายหลัง) · ไม่มี session = local-only เงียบๆ ไม่พัง
   ใช้คู่กับ k1/progress-store.js (FutureProgress + FutureFamily) · โหลด supabase-js จาก CDN
   ตาราง: child_progress(user_id,child_id,data,updated_at) + activity_event(...) RLS = user_id=auth.uid() */
(function (global) {
  'use strict';
  var CFG = global.SUPA || {};
  var sb = null, ready = false, uid = null;

  function log(/*...*/) { try { console.log.apply(console, ['[sync]'].concat([].slice.call(arguments))); } catch (e) {} }

  // โหลด supabase-js (esm) แบบ dynamic
  async function loadLib() {
    if (global.supabase && global.supabase.createClient) return global.supabase;
    var mod = await import('https://esm.sh/@supabase/supabase-js@2');
    return mod;
  }

  async function init() {
    if (!CFG.url || !CFG.key) { log('no config'); return false; }
    try {
      var lib = await loadLib();
      sb = lib.createClient(CFG.url, CFG.key, { auth: { persistSession: true, autoRefreshToken: true } });
      // มี session อยู่แล้วไหม
      var s = await sb.auth.getSession();
      if (s && s.data && s.data.session) { uid = s.data.session.user.id; ready = true; log('session ok', uid); return true; }
      // ลอง anonymous sign-in (ถ้าโปรเจกต์เปิดไว้)
      if (sb.auth.signInAnonymously) {
        var r = await sb.auth.signInAnonymously();
        if (r && r.data && r.data.user) { uid = r.data.user.id; ready = true; log('anon ok', uid); return true; }
        log('anon disabled/failed', r && r.error && r.error.message);
      }
    } catch (e) { log('init err', e && e.message); }
    ready = false; return false;
  }

  // ดันข้อมูลลูกขึ้น cloud (progress blob + event ที่ยังไม่ sync)
  async function pushChild(childId) {
    if (!ready || !sb) return;
    var P = global.FutureProgress; if (!P) return;
    try {
      var blob = P.load ? P.load() : null;
      if (blob) {
        await sb.from('child_progress').upsert(
          { user_id: uid, child_id: childId, data: blob, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,child_id' });
        // events (idempotent insert)
        var evs = (blob.events || []).slice(-100).map(function (e) {
          return { id: e.id, user_id: uid, child_id: childId, verb: e.verb, object_type: e.object_type, object_id: e.object_id, result: e.result, occurred_at: e.occurred_at };
        });
        if (evs.length) await sb.from('activity_event').upsert(evs, { onConflict: 'id', ignoreDuplicates: true });
      }
    } catch (e) { log('push err', e && e.message); }
  }

  // ดึงข้อมูลลูกจาก cloud มา merge (cloud ใหม่กว่า = ใช้ cloud)
  async function pull(childId) {
    if (!ready || !sb) return;
    var P = global.FutureProgress; if (!P || !P.save) return;
    try {
      var r = await sb.from('child_progress').select('data,updated_at').eq('child_id', childId).maybeSingle();
      if (r && r.data && r.data.data) {
        var local = P.load(), remote = r.data.data;
        // ใช้ remote ถ้าดาวมากกว่า/เท่ากัน (heuristic ง่ายๆ กันถอยหลัง)
        if ((remote.stars || 0) >= (local.stars || 0)) P.save(remote);
      }
    } catch (e) { log('pull err', e && e.message); }
  }

  var pushTimer = null;
  global.FutureSync = {
    ready: function () { return ready; },
    init: init,
    pull: pull,
    pushChild: pushChild,
    // เรียกถี่ๆ ได้ debounce 1.5s
    schedulePush: function (childId) {
      if (pushTimer) clearTimeout(pushTimer);
      pushTimer = setTimeout(function () { pushChild(childId); }, 1500);
    }
  };

  // ---- auto-wire: ดักทุกครั้งที่เกมเซฟ → push ขึ้น cloud (ครั้งเดียว) ----
  function wireAutoPush(childId) {
    var P = global.FutureProgress;
    if (!P || P.__syncWired) return;
    P.__syncWired = true;
    ['save', 'recordEvent'].forEach(function (fn) {
      if (typeof P[fn] !== 'function') return;
      var orig = P[fn].bind(P);
      P[fn] = function () {
        var r = orig.apply(P, arguments);
        try { global.FutureSync.schedulePush(childId); } catch (e) {}
        return r;
      };
    });
  }

  // ---- bootstrap: ทำงานเองเมื่อหน้าโหลด · ไม่มี config/ไม่มี session = local-only เงียบๆ ----
  function boot() {
    if (!global.SUPA) { log('no SUPA, local-only'); return; }
    init().then(function (ok) {
      if (!ok) return;                                  // anon ปิด/ล้มเหลว → เกมทำงาน local ปกติ
      var cid = (global.FutureProgress && global.FutureProgress.childId) || 'local';
      wireAutoPush(cid);                                // ต่อจากนี้ทุกการเซฟ push เอง
      pull(cid).then(function () { pushChild(cid); });  // sync ขาเข้า + ดันของ local ขึ้นครั้งแรก
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);

# 101future — แผนจุดเชื่อม (Integration Spec) · 10 มิ.ย. 2569

> ป้องกัน "สร้างชิ้นแยกๆ แล้วงงตอนรวม" — อิงวิจัยแพตเทิร์นจริง (sub-agent 10 มิ.ย.)
> **หลักคิดเดียว: เราไม่ได้สร้าง "แอปเดียว" แต่สร้าง "หลาย front-end ที่ต่อกับสัญญาชุดเดียวกัน"**
> โค้ดเปลี่ยนได้ตลอด — แต่ **สัญญา (contracts) ต้องนิ่ง** · ล็อก 9 ข้อข้างล่างตอนนี้ ที่เหลือเลื่อนได้

---

## ⭐ TL;DR — ล็อก 9 สัญญานี้ตอนนี้ (ถูกวันนี้ แพงถ้าแก้ทีหลัง)
| # | สัญญา | ทำไมรอไม่ได้ |
|---|---|---|
| 1 | **`ProgressStore` interface** — เกมคุยผ่านชั้นนี้ชั้นเดียว | เกมทุกตัวที่เขียนก่อนมีอันนี้ = ต้องรื้อใหม่ |
| 2 | **รูปแบบ event** (`id,child_id,verb,object_type,object_id,result,occurred_at`) append-only | log คือ source of truth ตลอดกาล เปลี่ยนทีหลัง=ย้ายข้อมูล |
| 3 | **event id = UUID สร้างฝั่ง client** | เพิ่ม idempotency ย้อนหลัง = ฝันร้าย dedup |
| 4 | **`currentChildId` เป็น param แยก ไม่ฝังใน progress** | ปัญหาที่พี่ห่วงเป๊ะ: localStorage ไม่รู้ว่าลูกคนไหน → namespace ตอนนี้ |
| 5 | **URL convention** `/play/<subject>/<unit>/` บน apex | เปลี่ยนชื่อ URL ทีหลัง = 301 รก + bookmark พัง |
| 6 | **เช็คสิทธิ์ = scope บน account + flag `unit.free`** (ไม่เช็ค "แพลนพรีเมียม") | ถ้าเกม hardcode แพลน เปลี่ยนราคาทีไรพังหมด |
| 7 | **account ผูกกับ `line_user_id`, child เป็น row แยก** | ทั้ง data model ห้อยกับอันนี้ เปลี่ยน key ทีหลัง=รื้อ RLS |
| 8 | **เก็บ consent PDPA ตอนสร้างบัญชี** | ความเสี่ยงกฎหมาย ถูกถ้าทำแต่แรก |
| 9 | **โดเมนเดียว `101future.com`** | การแชร์ session ข้าม subdomain ขึ้นกับข้อนี้ |

> ทั้ง 9 ข้อ = **แค่ "ตัดสินใจ + วาง stub interface"** ไม่ใช่สร้างระบบจริง · ของจริง (Supabase/LINE/จ่ายเงิน/Capacitor) เลื่อนได้ เสียบเข้า seam ทีหลังไม่ต้องรื้อ

---

## 1. Data model (source of truth)
**เลือก:** custom event-log + derived state บน Postgres — **ยืม "ไวยากรณ์" ของ xAPI (actor-verb-object) แต่ไม่ต้องมี LRS** (xAPI/cmi5/SCORM เต็มรูปเกินตัว solo + ไว้สำหรับ interop กับ LMS เจ้าอื่นที่เราไม่มี)

2 ชั้น:
1. **Event log** (append-only, ไม่แก้) = ความจริง
2. **Derived state** (mastery/%/streak) = คำนวณจาก event · ลบแล้วสร้างใหม่ได้เสมอ

```sql
account(   id uuid pk, line_user_id text unique not null, display_name text, created_at timestamptz )
child(     id uuid pk, account_id uuid->account, display_name text, avatar_key text,
           birth_year int,        -- อายุหยาบ ไม่เก็บวันเกิดเต็ม (PDPA minimize)
           grade_band text )      -- 'K1'|'P1'..'M6'
unit(   id text pk, subject text, grade_band text, title_th text, free boolean default false, seq int )
lesson( id text pk, unit_id text->unit, title_th text, seq int, skill_tags text[] )

entitlement( id uuid pk, account_id uuid->account,
  scope text,    -- 'all' | 'subject:math' | 'unit:p1-eng-u3'
  source text,   -- 'free'|'subscription'|'promo'
  status text default 'active', starts_at timestamptz, expires_at timestamptz )  -- null=ตลอดชีพ

activity_event( id uuid pk,        -- *** client-generated UUID (idempotency) ***
  child_id uuid->child, account_id uuid,   -- denormalize account ไว้เร่ง RLS
  verb text,          -- 'started'|'completed'|'answered'|'learned_word'|'failed'
  object_type text,   -- 'lesson'|'unit'|'word'|'question'
  object_id text,     -- 'p1-eng-u3-l2'
  result jsonb,       -- {correct:9,total:10,ms:4200}
  occurred_at timestamptz,  -- เกิดบนเครื่อง
  recorded_at timestamptz default now(),  -- server รับ
  client_seq bigint )       -- ต่อเครื่อง monotonic, tiebreak

progress( child_id uuid->child, object_type text, object_id text,
  status text,        -- not_started|in_progress|completed
  mastery numeric,    -- 0..1 EWMA ของ correctness
  pct_complete numeric, last_event_at timestamptz,
  primary key(child_id,object_type,object_id) )   -- cache, rebuild ได้
```
**เมตริกพ่อแม่ (derive จาก log):** %unit = lesson เสร็จ/ทั้งหมด · words learned = distinct object_id ที่ verb='learned_word' · **streak = นับวันติดกันแบบเวลาไทย (Asia/Bangkok) ไม่ใช่ UTC** (ไม่งั้น streak เด็กพังตอนเที่ยงคืน) · mastery = EWMA α≈0.3

---

## 2. Offline-first sync (มือถือไทยเน็ตหลุด + Capacitor)
**เลือก: append-only event outbox + idempotent UUID — ไม่ใช้ CRDT, ไม่ sync derived state**
> เพราะ progress เป็น "เหตุการณ์ที่เกิดแล้ว" (monotonic) → 2 เครื่องไม่ขัดกัน แค่ union + dedupe by id · CRDT แก้ปัญหา mutate ร่วม (เอกสารร่วม) ที่เราไม่มี = อย่าแบกฟรี

```
GAME → [localStorage outbox] → (พอ online) → POST /sync → Supabase
```
อัลกอริทึม: (1) เกม append ทุก action ลง outbox[] ทันที (กันแครช) (2) online แล้ว POST ทั้ง batch (3) server `INSERT … ON CONFLICT(id) DO NOTHING` = retry ปลอดภัย (4) สำเร็จ → ลบ id ที่ ack ออกจาก outbox (5) server recompute progress (6) client GET progress มา hydrate dashboard · retry backoff, ล้มเกิน N ครั้ง = คาไว้ใน outbox + โชว์ badge "ค้าง sync" (Duolingo ก็ cache local + queue/batch แบบนี้)

---

## 3. Storage adapter (กุญแจสำคัญสุด — วางตอนนี้เลย)
**เกมห้ามแตะ `localStorage`/`supabase` ตรงๆ — เรียกผ่าน object เดียว** สลับ backend ได้โดยเกมไม่ต้องแก้

```js
// CONTRACT — แช่แข็ง เกมเห็นแค่หน้าตานี้
class ProgressStore {
  async getProfile()                  {}  // {childId, displayName, grade}
  async loadProgress(childId)         {}  // derived state ไป hydrate UI
  async recordEvent(event)            {}  // append outbox, return ทันที
  async sync()                        {}  // flush outbox → backend + pull snapshot
  async isEntitled(childId, objectId) {}  // เช็คสิทธิ์ (§5)
  onSyncStateChange(cb)               {}  // 'synced'|'pending'|'offline'
}
// adapters สลับด้วย config:
class LocalProgressStore    extends ProgressStore {}  // วันนี้: localStorage ล้วน
class SupabaseProgressStore extends ProgressStore {}  // พรุ่งนี้: outbox + Supabase
class MemoryProgressStore   extends ProgressStore {}  // test

// bootstrap.js = ไฟล์เดียวที่รู้ว่ามี backend อะไร
const store = CONFIG.backend==='supabase'
  ? new SupabaseProgressStore(supa, outbox) : new LocalProgressStore();
initGame({ store });   // เกมรับ store เข้าไป ไม่ import backend เอง
```
**migration ตอนมี account:** `SupabaseProgressStore` รอบแรกอ่าน key localStorage เดิม → replay เป็น event ผ่าน `recordEvent` → sync ขึ้น = progress offline เดิมลอยขึ้นเอง ไม่ต้องรื้อเกม
**👉 ล็อก interface นี้ตอนนี้ แม้ตอนนี้มีแค่ `LocalProgressStore`**

---

## 4. Auth / session ข้าม front-end
**เลือก: โดเมนเดียวกัน + Supabase session + `currentChildId` คนละช่อง**
- ทุกอย่างใต้ **`101future.com`** เดียว · marketing+เกม = subpath (apex), dashboard = `app.` subdomain
- ใช้ **session ของ Supabase เอง** เก็บใน **cookie scope `.101future.com`** (ไม่ใช่ localStorage — localStorage ข้าม subdomain ไม่ได้ + JWT ใน localStorage โดน XSS ดูดได้ <200ms) · access token TTL สั้น
- **LINE ไม่ใช่ provider built-in ของ Supabase** → ต้อง exchange เอง:
```
Browser → LINE Login (OAuth2/OIDC + PKCE) → LINE id_token
 → POST /functions/v1/line-auth (Supabase Edge Function):
     verify id_token กับ LINE JWKS · upsert account by line_user_id · mint Supabase session
 → set cookie บน .101future.com
```
service-role key อยู่แค่ใน Edge Function **ห้ามหลุด client**
- **`currentChildId` ไม่ฝังใน token** (token = พิสูจน์ "พ่อแม่", child = UI state) · dashboard ตั้ง → เกมอ่านตอน launch `/play/p1-eng/?child=<id>` · **server re-check ทุกครั้งว่า childId เป็นของ account นั้นจริง (RLS)** — query param เป็นแค่ใบ้ ไม่ใช่อำนาจ

---

## 5. Entitlements (สิทธิ์/กำแพงเงิน)
**เลือก: entitlement = scope grant บน account · เกม+dashboard เรียก `can_access()` ตัวเดียวกัน · ห้ามเช็ค "แพลนพรีเมียม"**
> pricing *สร้าง* entitlement เท่านั้น ไม่เคยถูกอ่านตอนเช็คสิทธิ์ → เปลี่ยนราคา/แพ็กเกจไม่กระทบเกม

```sql
-- can_access() เรียกได้ทั้งจาก RLS และ API
create function can_access(p_account_id uuid, p_object_id text) returns boolean
language sql stable as $$
  select coalesce((select free from unit where id=p_object_id), false)  -- ฟรีเปิดเสมอ
  or exists( select 1 from entitlement e
    where e.account_id=p_account_id and e.status='active'
      and (e.expires_at is null or e.expires_at>now())
      and ( e.scope='all'
         or e.scope='subject:'||(select subject from unit where id=p_object_id)
         or e.scope='unit:'||p_object_id ) );
$$;
```
- entitlement อยู่บน **account** (ไม่ใช่ child) → จ่าย 1 ครั้งปลดล็อกลูกทุกคน = ที่พ่อแม่ไทยคาดหวัง + จุดขาย
- ฟรี 2 หน่วย/วิชา = `unit.free=true` (ไม่ต้องมี row)
- payment webhook (ทีหลัง) ทำอย่างเดียว: insert/expire entitlement — gate ไม่เปลี่ยน

---

## 6. URL / โครง deploy (folder = route)
```
101future.com/                       → marketing (static)              [apex]
101future.com/play/<subject>/<unit>  → เกม (static; folder=route)
101future.com/play/.../assets        → อ้างไป R2
app.101future.com/                   → parent dashboard (auth'd)        [subdomain]
  + Supabase edge functions: /functions/v1/line-auth, /sync, /webhook
assets.101future.com                 → CNAME → R2 (asset URL นิ่ง cache ได้)
```
- เกมเป็น **subpath บน apex** → แชร์ cookie `.101future.com` + config ได้ ไม่ต้อง CORS
- R2 ผ่าน CNAME = URL asset นิ่ง แยกจาก deploy โค้ด (media หนัก: เสียง/3D/วิดีโอ)
- **ของเดิม ป.1-6 ยังรันต่อ** · พร้อมเมื่อไหร่ค่อย 301 เก่า→ใหม่ · **ล็อกชื่อ URL `/play/<subject>/<unit>/` ตอนนี้** เกมที่ทำวันนี้ลง path สุดท้ายเลย ไม่ต้อง redirect

---

## 7. Supabase — RLS + LINE + PDPA
- RLS: ห่อ `(select auth.uid())` · index ทุกคอลัมน์ใน USING · ใช้ `security definer` helper เลี่ยง recursion · **ห้ามเชื่อ `user_metadata`** (ใช้ `app_metadata`/ตาราง) · service-role server-side เท่านั้น
```sql
create function owns_account(p_account_id uuid) returns boolean
language sql security definer set search_path='' stable as $$
  select exists(select 1 from public.account a
    where a.id=p_account_id and a.line_user_id=(select auth.jwt()->>'sub')); $$;
-- child/activity_event/consent: policy using owns_account(account_id)
-- entitlement: select=เจ้าของ, ไม่มี insert/update policy ⇒ เขียนได้แค่ service_role (billing webhook)
```
- **consent_record** (append-only): account_id, child_id(null=ระดับบัญชี), consent_type('pdpa_parental'…), granted, policy_version, granted_at, ip_hash(แฮชไม่เก็บดิบ), user_agent
- **PDPA (ผู้เรียนเป็นผู้เยาว์ทุกคน):** เก็บ **ความยินยอมพ่อแม่ตอนสร้างบัญชี ก่อนมีโปรไฟล์ลูก** + เก็บ record version ตามข้อความ policy · minimize ข้อมูลเด็ก (birth_year ไม่เอา DOB เต็ม, ชื่อเล่น) · โทษ PDPA สูงสุด ฿5M/กระทง
- **MAU/cost:** MAU = พ่อแม่ที่จ่าย (เด็กไม่ login) → ต้นทุนต่ำ ผูกกับรายได้ · เช็คเลข limit ปัจจุบันตอนสมัครจริง (ยังไม่ยืนยัน)

---

## 8. ลำดับ: ล็อกตอนนี้ vs เลื่อนได้
**ล็อกตอนนี้ (แค่ตัดสินใจ + stub):** ดูตาราง TL;DR 9 ข้อ → เขียนลง spec นี้ + วางไฟล์ `progress-store.js` stub วันนี้ แล้วสร้างชิ้นไหนก่อนก็ได้
**เลื่อนได้ปลอดภัย (ไม่ผูกมัด):** Supabase backend จริง · LINE→Supabase edge function · payment/KBank webhook · Capacitor (เสียบหลัง adapter เดิม) · CRDT (ไม่ต้องทำเลย) · xAPI LRS/cmi5 (ทำตอนมีดีล B2B โรงเรียน) · per-child cap · multi-device merge UI

---

## 9. ก้าวถัดไปที่ผมแนะนำ (ถูก ไม่แตะ secret ไม่ต้องขออนุมัติ)
1. วาง **`k1/progress-store.js`** = `ProgressStore` interface + `LocalProgressStore` (ใช้ localStorage ที่ K1 มีอยู่ ห่อเป็น event-shape + outbox)
2. Refactor เกม K1 ให้เก็บ progress **ผ่าน store** + ใส่ `currentChildId` (ตอนนี้ stub เด็กคนเดียว)
3. เปลี่ยนชื่อ/ย้ายให้เข้า URL convention `/play/...` (หรือจดไว้ทำตอน deploy)
> = ทำให้ทุกอย่างหลังจากนี้ "เสียบติด" โดยเกม K1 ที่มีอยู่ไม่ต้องรื้อตอนต่อ dashboard/login

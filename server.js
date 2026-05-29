const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");

const ROOT = __dirname;
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, "data");
const LEADS_FILE = path.join(DATA_DIR, "leads.json");
const TOKEN_FILE = path.join(DATA_DIR, "admin-token.txt");
const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || "127.0.0.1";
const LEAD_WEBHOOK_URL = process.env.LEAD_WEBHOOK_URL || process.env.NOTIFY_WEBHOOK_URL || "";
const LEAD_WEBHOOK_SECRET = process.env.LEAD_WEBHOOK_SECRET || process.env.NOTIFY_WEBHOOK_SECRET || "";
const DEFAULT_OWNER = process.env.DEFAULT_LEAD_OWNER || "";
const DUPLICATE_WINDOW_DAYS = Number(process.env.DUPLICATE_WINDOW_DAYS || 90);

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

const STATIC_ROUTES = new Map([
  ["/", "index.html"],
  ["/index.html", "index.html"],
  ["/styles.css", "styles.css"],
  ["/app.js", "app.js"],
  ["/admin", "admin.html"],
  ["/admin.html", "admin.html"],
  ["/admin.js", "admin.js"],
]);

const VALID_STATUSES = new Set([
  "new",
  "contacted",
  "trial",
  "enrolled",
  "paid",
  "not-fit",
  "archived",
]);

const WORKFLOWS = {
  new: {
    action: "โทรกลับหรือทัก LINE เพื่อคัดกรองความสนใจ",
    days: 1,
  },
  contacted: {
    action: "ส่งรายละเอียดคอร์สและนัดรอบทดลองเรียน",
    days: 2,
  },
  trial: {
    action: "ยืนยันวันทดลองเรียนและเตรียมอุปกรณ์",
    days: 1,
  },
  enrolled: {
    action: "ส่งขั้นตอนชำระเงินและเพิ่มเข้ากลุ่มเรียน",
    days: 2,
  },
  paid: {
    action: "",
    days: null,
  },
  "not-fit": {
    action: "",
    days: null,
  },
  archived: {
    action: "",
    days: null,
  },
};

let adminToken = "";

async function main() {
  await ensureDataFiles();
  adminToken = await getAdminToken();

  const server = http.createServer((request, response) => {
    handleRequest(request, response).catch((error) => {
      if (error instanceof HttpError) {
        sendJson(response, error.status, { error: error.message });
        return;
      }
      console.error(error);
      sendJson(response, 500, { error: "Internal server error" });
    });
  });

  server.listen(PORT, HOST, () => {
    console.log(`101 Future server running at http://${HOST}:${PORT}`);
    if (!process.env.ADMIN_TOKEN) {
      console.log(`Admin token: ${adminToken}`);
    }
  });
}

async function ensureDataFiles() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(LEADS_FILE);
  } catch {
    await fs.writeFile(LEADS_FILE, "[]\n", "utf8");
  }
}

async function getAdminToken() {
  if (process.env.ADMIN_TOKEN) return process.env.ADMIN_TOKEN;
  try {
    return (await fs.readFile(TOKEN_FILE, "utf8")).trim();
  } catch {
    const token = crypto.randomBytes(18).toString("hex");
    await fs.writeFile(TOKEN_FILE, `${token}\n`, { encoding: "utf8", mode: 0o600 });
    return token;
  }
}

async function handleRequest(request, response) {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  setBaseHeaders(response);

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, { ok: true, service: "101future-enrollment" });
    return;
  }

  if (request.method === "HEAD" && url.pathname === "/api/health") {
    sendHead(response, 200, "application/json; charset=utf-8");
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/leads") {
    await createLead(request, response);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/leads") {
    requireAdmin(request, url);
    const leads = await readLeads();
    sendJson(response, 200, { leads: sortLeads(leads) });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/automation") {
    requireAdmin(request, url);
    const leads = await readLeads();
    sendJson(response, 200, buildAutomationSummary(leads));
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/automation/run") {
    requireAdmin(request, url);
    await runAutomation(request, response);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/leads.csv") {
    requireAdmin(request, url);
    const leads = sortLeads(await readLeads());
    sendText(response, 200, toCsv(leads), "text/csv; charset=utf-8");
    return;
  }

  const leadMatch = url.pathname.match(/^\/api\/leads\/([^/]+)$/);
  if (request.method === "PATCH" && leadMatch) {
    requireAdmin(request, url);
    await updateLead(leadMatch[1], request, response);
    return;
  }

  if ((request.method === "GET" || request.method === "HEAD") && STATIC_ROUTES.has(url.pathname)) {
    await serveStatic(response, STATIC_ROUTES.get(url.pathname), request.method === "HEAD");
    return;
  }

  if ((request.method === "GET" || request.method === "HEAD") && url.pathname.startsWith("/assets/")) {
    await serveAsset(response, url.pathname, request.method === "HEAD");
    return;
  }

  sendJson(response, 404, { error: "Not found" });
}

async function createLead(request, response) {
  const body = await readJsonBody(request);
  const lead = normalizeLead(body);
  const errors = validateLead(lead);

  if (errors.length) {
    sendJson(response, 400, { error: errors.join(", ") });
    return;
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const leads = await readLeads();
  const duplicate = findDuplicateLead(leads, lead, now);

  if (duplicate) {
    const changes = mergeLeadData(duplicate, lead);
    duplicate.updatedAt = nowIso;
    duplicate.lastSubmittedAt = nowIso;
    duplicate.duplicateCount = Number(duplicate.duplicateCount || 0) + 1;
    duplicate.timeline = ensureTimeline(duplicate);
    duplicate.timeline.push({
      at: nowIso,
      action: "duplicate-submission",
      note: changes.length ? `อัปเดตข้อมูล: ${changes.join(", ")}` : "ผู้สมัครส่งฟอร์มซ้ำ",
    });
    duplicate.automation = nextAutomationPlan(duplicate, now, "duplicate");
    await writeLeads(leads);
    await notifyLeadEvent("lead.duplicate", duplicate, request, { changes });
    sendJson(response, 200, { lead: publicLead(duplicate), duplicate: true });
    return;
  }

  lead.id = createId();
  lead.status = "new";
  lead.createdAt = nowIso;
  lead.updatedAt = lead.createdAt;
  lead.lastSubmittedAt = lead.createdAt;
  lead.duplicateCount = 0;
  lead.source = {
    ip: request.headers["x-forwarded-for"] || request.socket.remoteAddress || "",
    userAgent: request.headers["user-agent"] || "",
  };
  lead.timeline = [{ at: lead.createdAt, action: "created", note: lead.note || "" }];
  lead.automation = nextAutomationPlan(lead, now, "created");

  leads.push(lead);
  await writeLeads(leads);
  await notifyLeadEvent("lead.created", lead, request);
  sendJson(response, 201, { lead: publicLead(lead) });
}

async function updateLead(id, request, response) {
  const body = await readJsonBody(request);
  const leads = await readLeads();
  const lead = leads.find((item) => item.id === decodeURIComponent(id));

  if (!lead) {
    sendJson(response, 404, { error: "Lead not found" });
    return;
  }

  lead.timeline = ensureTimeline(lead);
  const now = new Date().toISOString();
  const nextStatus = String(body.status || lead.status).trim();
  if (!VALID_STATUSES.has(nextStatus)) {
    sendJson(response, 400, { error: "Invalid status" });
    return;
  }

  if (lead.status !== nextStatus) {
    lead.timeline.push({ at: now, action: "status", from: lead.status, to: nextStatus });
    lead.status = nextStatus;
  }

  const note = String(body.note || "").trim();
  if (note) {
    lead.timeline.push({ at: now, action: "note", note });
    lead.lastContactNote = note;
  }

  lead.updatedAt = now;
  lead.automation = nextAutomationPlan(lead, new Date(now), "status-update");
  await writeLeads(leads);
  await notifyLeadEvent("lead.updated", lead, request);
  sendJson(response, 200, { lead });
}

async function runAutomation(request, response) {
  const leads = await readLeads();
  const now = new Date();
  const nowIso = now.toISOString();
  const dueLeads = [];

  for (const lead of leads) {
    lead.timeline = ensureTimeline(lead);
    if (!lead.automation) {
      lead.automation = nextAutomationPlan(lead, now, "backfill");
    }
    if (!isAutomationDue(lead, now)) continue;

    const lastReminderDate = String(lead.automation.lastReminderAt || "").slice(0, 10);
    const today = nowIso.slice(0, 10);
    if (lastReminderDate === today) continue;

    lead.automation.lastReminderAt = nowIso;
    lead.updatedAt = nowIso;
    lead.timeline.push({
      at: nowIso,
      action: "automation-reminder",
      note: lead.automation.nextAction,
    });
    dueLeads.push(lead);
  }

  if (dueLeads.length) {
    await writeLeads(leads);
    for (const lead of dueLeads) {
      await notifyLeadEvent("lead.followup_due", lead, request);
    }
  }

  sendJson(response, 200, { ok: true, notified: dueLeads.length, due: dueLeads.map(adminLead) });
}

function normalizeLead(body) {
  return {
    name: clean(body.name),
    phone: clean(body.phone),
    lineId: clean(body.lineId),
    ageGroup: clean(body.ageGroup),
    course: clean(body.course),
    preferredSchedule: clean(body.preferredSchedule),
    note: clean(body.note),
  };
}

function mergeLeadData(existing, incoming) {
  const fields = ["name", "phone", "lineId", "ageGroup", "course", "preferredSchedule", "note"];
  const changes = [];
  for (const field of fields) {
    if (!incoming[field] || incoming[field] === existing[field]) continue;
    if (existing[field]) {
      changes.push(field);
    }
    existing[field] = incoming[field];
  }
  return changes;
}

function validateLead(lead) {
  const errors = [];
  if (!lead.name) errors.push("กรุณากรอกชื่อ");
  if (!lead.phone) errors.push("กรุณากรอกเบอร์โทร");
  if (!lead.course) errors.push("กรุณาเลือกหลักสูตร");
  if (lead.name.length > 120) errors.push("ชื่อยาวเกินไป");
  if (lead.phone.length > 40) errors.push("เบอร์โทรยาวเกินไป");
  return errors;
}

function clean(value) {
  return String(value || "").trim().slice(0, 1000);
}

function findDuplicateLead(leads, lead, now) {
  const phone = normalizePhone(lead.phone);
  const lineId = normalizeKey(lead.lineId);
  const minCreatedAt = now.getTime() - DUPLICATE_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  return sortLeads(leads).find((item) => {
    if (["archived", "not-fit"].includes(item.status)) return false;
    const createdAt = Date.parse(item.createdAt || "");
    if (Number.isFinite(createdAt) && createdAt < minCreatedAt) return false;
    return (phone && normalizePhone(item.phone) === phone) || (lineId && normalizeKey(item.lineId) === lineId);
  });
}

function normalizePhone(value) {
  return String(value || "").replace(/[^\d+]/g, "");
}

function normalizeKey(value) {
  return String(value || "").trim().toLowerCase();
}

function ensureTimeline(lead) {
  if (Array.isArray(lead.timeline)) return lead.timeline;
  lead.timeline = [];
  return lead.timeline;
}

function nextAutomationPlan(lead, now = new Date(), reason = "workflow") {
  const workflow = WORKFLOWS[lead.status] || WORKFLOWS.new;
  const existing = lead.automation || {};
  const nextFollowUpAt = workflow.days === null ? "" : addDays(now, workflow.days).toISOString();

  return {
    owner: existing.owner || DEFAULT_OWNER,
    priority: leadPriority(lead),
    nextAction: workflow.action,
    nextFollowUpAt,
    lastReminderAt: existing.lastReminderAt || "",
    reason,
    updatedAt: now.toISOString(),
  };
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function leadPriority(lead) {
  if (["paid", "archived", "not-fit"].includes(lead.status)) return "done";
  if (Number(lead.duplicateCount || 0) > 0) return "warm";
  if (lead.preferredSchedule && lead.lineId) return "hot";
  if (lead.preferredSchedule || lead.lineId) return "normal";
  return "follow";
}

function isAutomationDue(lead, now = new Date()) {
  const next = Date.parse(lead.automation?.nextFollowUpAt || "");
  return Number.isFinite(next) && next <= now.getTime();
}

function buildAutomationSummary(leads) {
  const now = new Date();
  const enriched = sortLeads(leads).map((lead) => {
    if (!lead.automation) {
      return { ...lead, automation: nextAutomationPlan(lead, now, "preview") };
    }
    return lead;
  });
  const due = enriched.filter((lead) => isAutomationDue(lead, now));
  const upcoming = enriched.filter((lead) => {
    const next = Date.parse(lead.automation?.nextFollowUpAt || "");
    return Number.isFinite(next) && next > now.getTime();
  });
  const completed = enriched.filter((lead) => !lead.automation?.nextFollowUpAt);

  return {
    now: now.toISOString(),
    counts: {
      due: due.length,
      upcoming: upcoming.length,
      completed: completed.length,
    },
    due: due.map(adminLead),
    upcoming: upcoming.slice(0, 20).map(adminLead),
  };
}

function adminLead(lead) {
  return {
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    lineId: lead.lineId,
    course: lead.course,
    status: lead.status,
    createdAt: lead.createdAt,
    automation: lead.automation || null,
  };
}

function createId() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `LEAD-${date}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 1_000_000) throw new HttpError(413, "Payload too large");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "Invalid JSON");
  }
}

async function readLeads() {
  const raw = await fs.readFile(LEADS_FILE, "utf8");
  return JSON.parse(raw);
}

async function writeLeads(leads) {
  await fs.writeFile(LEADS_FILE, `${JSON.stringify(leads, null, 2)}\n`, "utf8");
}

function sortLeads(leads) {
  return [...leads].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

function publicLead(lead) {
  return {
    id: lead.id,
    name: lead.name,
    course: lead.course,
    createdAt: lead.createdAt,
    nextAction: lead.automation?.nextAction || "",
  };
}

function requireAdmin(request, url) {
  const auth = request.headers.authorization || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const token = bearer || request.headers["x-admin-token"] || url.searchParams.get("token") || "";
  if (token !== adminToken) throw new HttpError(401, "Unauthorized");
}

async function serveStatic(response, filename, isHead = false) {
  const filePath = path.join(ROOT, filename);
  const ext = path.extname(filePath);
  if (isHead) {
    sendHead(response, 200, MIME_TYPES[ext] || "application/octet-stream");
    return;
  }
  const content = await fs.readFile(filePath);
  sendBuffer(response, 200, content, MIME_TYPES[ext] || "application/octet-stream");
}

async function serveAsset(response, pathname, isHead = false) {
  const safeName = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(ROOT, safeName);
  if (!filePath.startsWith(path.join(ROOT, "assets") + path.sep)) {
    throw new HttpError(404, "Not found");
  }
  const ext = path.extname(filePath).toLowerCase();
  if (isHead) {
    sendHead(response, 200, MIME_TYPES[ext] || "application/octet-stream");
    return;
  }
  const content = await fs.readFile(filePath);
  sendBuffer(response, 200, content, MIME_TYPES[ext] || "application/octet-stream");
}

function setBaseHeaders(response) {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "same-origin");
}

function sendJson(response, status, payload) {
  sendText(response, status, JSON.stringify(payload), "application/json; charset=utf-8");
}

function sendHead(response, status, contentType) {
  response.writeHead(status, { "Content-Type": contentType });
  response.end();
}

function sendText(response, status, text, contentType) {
  sendBuffer(response, status, Buffer.from(text), contentType);
}

function sendBuffer(response, status, buffer, contentType) {
  response.writeHead(status, { "Content-Type": contentType, "Content-Length": buffer.length });
  response.end(buffer);
}

function toCsv(leads) {
  const headers = [
    "id",
    "createdAt",
    "updatedAt",
    "status",
    "priority",
    "nextAction",
    "nextFollowUpAt",
    "duplicateCount",
    "name",
    "phone",
    "lineId",
    "ageGroup",
    "course",
    "preferredSchedule",
    "note",
  ];
  const rows = leads.map((lead) => headers.map((key) => csvCell(csvValue(lead, key))).join(","));
  return `${headers.join(",")}\n${rows.join("\n")}\n`;
}

function csvValue(lead, key) {
  if (key === "priority") return lead.automation?.priority || "";
  if (key === "nextAction") return lead.automation?.nextAction || "";
  if (key === "nextFollowUpAt") return lead.automation?.nextFollowUpAt || "";
  return lead[key];
}

function csvCell(value) {
  if (value === undefined) return '""';
  if (value && typeof value === "object") return csvCell(JSON.stringify(value));
  const text = String(value || "").replaceAll('"', '""');
  return `"${text}"`;
}

async function notifyLeadEvent(event, lead, request, extra = {}) {
  if (!LEAD_WEBHOOK_URL) return;

  const payload = {
    event,
    at: new Date().toISOString(),
    service: "101future-enrollment",
    lead: adminLead(lead),
    extra,
  };
  const headers = {
    "Content-Type": "application/json",
    "User-Agent": "101future-enrollment/0.1",
  };
  if (LEAD_WEBHOOK_SECRET) headers["X-Webhook-Secret"] = LEAD_WEBHOOK_SECRET;

  try {
    const webhookResponse = await fetch(LEAD_WEBHOOK_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    if (!webhookResponse.ok) {
      console.warn(`Lead webhook ${event} failed: ${webhookResponse.status}`);
    }
  } catch (error) {
    console.warn(`Lead webhook ${event} failed: ${error.message}`);
  }
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

process.on("uncaughtException", (error) => {
  if (error instanceof HttpError) return;
  console.error(error);
});

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

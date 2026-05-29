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

  if (request.method === "GET" && STATIC_ROUTES.has(url.pathname)) {
    await serveStatic(response, STATIC_ROUTES.get(url.pathname));
    return;
  }

  if (request.method === "GET" && url.pathname.startsWith("/assets/")) {
    await serveAsset(response, url.pathname);
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

  lead.id = createId();
  lead.status = "new";
  lead.createdAt = new Date().toISOString();
  lead.updatedAt = lead.createdAt;
  lead.source = {
    ip: request.headers["x-forwarded-for"] || request.socket.remoteAddress || "",
    userAgent: request.headers["user-agent"] || "",
  };
  lead.timeline = [{ at: lead.createdAt, action: "created", note: lead.note || "" }];

  const leads = await readLeads();
  leads.push(lead);
  await writeLeads(leads);
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
  await writeLeads(leads);
  sendJson(response, 200, { lead });
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
  };
}

function requireAdmin(request, url) {
  const auth = request.headers.authorization || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const token = bearer || request.headers["x-admin-token"] || url.searchParams.get("token") || "";
  if (token !== adminToken) throw new HttpError(401, "Unauthorized");
}

async function serveStatic(response, filename) {
  const filePath = path.join(ROOT, filename);
  const ext = path.extname(filePath);
  const content = await fs.readFile(filePath);
  sendBuffer(response, 200, content, MIME_TYPES[ext] || "application/octet-stream");
}

async function serveAsset(response, pathname) {
  const safeName = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(ROOT, safeName);
  if (!filePath.startsWith(path.join(ROOT, "assets") + path.sep)) {
    throw new HttpError(404, "Not found");
  }
  const ext = path.extname(filePath).toLowerCase();
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

function sendText(response, status, text, contentType) {
  sendBuffer(response, status, Buffer.from(text), contentType);
}

function sendBuffer(response, status, buffer, contentType) {
  response.writeHead(status, { "Content-Type": contentType, "Content-Length": buffer.length });
  response.end(buffer);
}

function toCsv(leads) {
  const headers = ["id", "createdAt", "status", "name", "phone", "lineId", "ageGroup", "course", "preferredSchedule", "note"];
  const rows = leads.map((lead) => headers.map((key) => csvCell(lead[key])).join(","));
  return `${headers.join(",")}\n${rows.join("\n")}\n`;
}

function csvCell(value) {
  const text = String(value || "").replaceAll('"', '""');
  return `"${text}"`;
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

const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const QRCode = require("qrcode");

const ROOT = __dirname;
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, "data");
const LEADS_FILE = path.join(DATA_DIR, "leads.json");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const ACCOUNTS_FILE = path.join(DATA_DIR, "accounts.json");
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");
const TOKEN_FILE = path.join(DATA_DIR, "admin-token.txt");
const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || "127.0.0.1";
const LEAD_WEBHOOK_URL = process.env.LEAD_WEBHOOK_URL || process.env.NOTIFY_WEBHOOK_URL || "";
const LEAD_WEBHOOK_SECRET = process.env.LEAD_WEBHOOK_SECRET || process.env.NOTIFY_WEBHOOK_SECRET || "";
const DEFAULT_OWNER = process.env.DEFAULT_LEAD_OWNER || "";
const DUPLICATE_WINDOW_DAYS = Number(process.env.DUPLICATE_WINDOW_DAYS || 90);
const EASYSLIP_API_KEY = process.env.EASYSLIP_API_KEY || "";
const EASYSLIP_VERIFY_URL = process.env.EASYSLIP_VERIFY_URL || "https://api.easyslip.com/v2/verify/bank";
const EASYSLIP_MATCH_ACCOUNT = process.env.EASYSLIP_MATCH_ACCOUNT === "true";
const COURSE_PRICES = parseJsonEnv("COURSE_PRICES_JSON", {});
const DEFAULT_COURSE_PRICE = Number(process.env.DEFAULT_COURSE_PRICE || 0);
const PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || "";
const PAYMENT_PROVIDER_API_KEY = process.env.PAYMENT_PROVIDER_API_KEY || "";
const PAYMENT_WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || "";
const XENDIT_API_VERSION = process.env.XENDIT_API_VERSION || "2024-11-11";
const KBANK_QR_CREATE_URL = process.env.KBANK_QR_CREATE_URL || "";
const KBANK_MERCHANT_ID = process.env.KBANK_MERCHANT_ID || "";
const KBANK_TERMINAL_ID = process.env.KBANK_TERMINAL_ID || "";
const KBANK_BRANCH_ID = process.env.KBANK_BRANCH_ID || "";
const KBANK_API_KEY_HEADER = process.env.KBANK_API_KEY_HEADER || "x-api-key";
const KBANK_WEBHOOK_TOKEN_HEADER = process.env.KBANK_WEBHOOK_TOKEN_HEADER || "x-callback-token";
const SITE_ORIGIN = process.env.SITE_ORIGIN || "https://www.101future.com";
const ACCESS_DAYS = Number(process.env.ACCESS_DAYS || 30);
const LINE_CHANNEL_ID = process.env.LINE_CHANNEL_ID || "";
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || "";
const LINE_CALLBACK_URL = process.env.LINE_CALLBACK_URL || `${SITE_ORIGIN}/auth/line/callback`;
const SESSION_COOKIE_NAME = "future_session";

const PACKAGES = [
  {
    id: "eng-m1-m3-speaking-grammar-30d",
    name: "อังกฤษรายเดือน",
    subject: "English",
    level: "ม.1-ม.3",
    durationDays: 30,
    price: Number(
      COURSE_PRICES["English Monthly"] ||
        COURSE_PRICES["อังกฤษ ม.ต้น: พูดได้ + แกรมมาร์แน่น"] ||
        COURSE_PRICES["English Speaking + Grammar ม.1-ม.3"] ||
        COURSE_PRICES.english ||
        299,
    ),
    description: "ฝึกพูดเป็นประโยค ทวนแกรมมาร์พื้นฐาน และรับ feedback หลังทำแบบฝึก",
  },
  {
    id: "eng-math-m1-m3-30d",
    name: "อังกฤษ + คณิต",
    subject: "English, Math",
    level: "ม.1-ม.3",
    durationDays: 30,
    price: Number(COURSE_PRICES["English + Math"] || COURSE_PRICES.core || COURSE_PRICES.englishMath || 399),
    description: "แพ็กเตรียมเปิดสำหรับเรียนอังกฤษและคณิต ม.ต้นในระบบเดียว",
  },
  {
    id: "all-core-m1-m3-30d",
    name: "ครบวิชา ม.ต้น",
    subject: "English, Math, Science, Thai",
    level: "ม.1-ม.3",
    durationDays: 30,
    price: Number(COURSE_PRICES["All ม.ต้น"] || COURSE_PRICES.allCore || 599),
    description: "แพ็กเตรียมเปิดสำหรับวิชาหลัก ม.ต้น: อังกฤษ คณิต วิทย์ และไทย",
  },
];

const COURSE_CONTENT = {
  "อังกฤษรายเดือน": [
    {
      title: "เริ่มพูดให้เป็นประโยค",
      duration: "20 นาที",
      summary: "ฝึกแนะนำตัว ตอบคำถามพื้นฐาน และเรียงประโยคให้ชัดขึ้น",
    },
    {
      title: "แกรมมาร์ที่ใช้บ่อยในข้อสอบ",
      duration: "30 นาที",
      summary: "ทวน tense โครงสร้างประโยค และคำศัพท์ที่พบในระดับ ม.ต้น",
    },
    {
      title: "ฝึกบทสนทนาใช้งานจริง",
      duration: "35 นาที",
      summary: "ฝึกตอบคำถามจากสถานการณ์ใกล้ตัวและรับ feedback หลังฝึก",
    },
  ],
  "English Monthly": [
    {
      title: "Lesson Cache: Past Tense 01",
      duration: "20 นาที",
      summary: "เรียนจากคำอธิบาย ตัวอย่าง และ quiz ที่เตรียมไว้ล่วงหน้า",
    },
    {
      title: "Speaking Prompt Cache",
      duration: "15 นาที",
      summary: "ฝึกตอบคำถามสั้นจาก prompt เช่น What did you do yesterday?",
    },
    {
      title: "AI Correction",
      duration: "10 นาที",
      summary: "AI ตรวจเฉพาะคำตอบเด็ก แก้ grammar และเก็บ weakness tag",
    },
  ],
  "อังกฤษ ม.ต้น: พูดได้ + แกรมมาร์แน่น": [
    {
      title: "เริ่มพูดให้เป็นประโยค",
      duration: "20 นาที",
      summary: "ฝึกแนะนำตัว ตอบคำถามพื้นฐาน และเรียงประโยคให้พูดได้ชัดขึ้น",
    },
    {
      title: "แกรมมาร์พื้นฐานที่ต้องแม่น",
      duration: "34 นาที",
      summary: "ทบทวน tense โครงสร้างประโยค และจุดที่เด็ก ม.ต้น มักพลาด",
    },
    {
      title: "ฝึกบทสนทนาใช้งานจริง",
      duration: "40 นาที",
      summary: "ฝึกถามตอบสถานการณ์ใกล้ตัว พร้อมประโยคตั้งต้นสำหรับพูดต่อยอด",
    },
  ],
  "English Speaking + Grammar ม.1-ม.3": [
    {
      title: "เริ่มพูดให้เป็นประโยค",
      duration: "20 นาที",
      summary: "ฝึกแนะนำตัว ตอบคำถามพื้นฐาน และเรียงประโยคให้พูดได้ชัดขึ้น",
    },
    {
      title: "แกรมมาร์พื้นฐานที่ต้องแม่น",
      duration: "34 นาที",
      summary: "ทบทวน tense โครงสร้างประโยค และจุดที่เด็ก ม.ต้น มักพลาด",
    },
    {
      title: "ฝึกบทสนทนาใช้งานจริง",
      duration: "40 นาที",
      summary: "ฝึกถามตอบสถานการณ์ใกล้ตัว พร้อมประโยคตั้งต้นสำหรับพูดต่อยอด",
    },
  ],
  "AI 101": [
    {
      title: "AI Starter Kit",
      duration: "18 นาที",
      summary: "เข้าใจว่า AI ช่วยเรียนและทำงานตรงไหนได้บ้าง พร้อมกติกาการใช้แบบปลอดภัย",
    },
    {
      title: "Prompt Lab",
      duration: "32 นาที",
      summary: "ฝึกเขียน prompt สำหรับสรุป อ่าน คิด และสร้างชิ้นงาน",
    },
    {
      title: "Mini Project",
      duration: "45 นาที",
      summary: "ทำโปรเจกต์เล็กจากปัญหาจริง แล้วเตรียมส่งงานให้ครูตรวจ",
    },
  ],
  "English for Future": [
    {
      title: "Future Conversation",
      duration: "24 นาที",
      summary: "ประโยคใช้งานจริงสำหรับแนะนำตัว ถามตอบ และคุยเรื่องเป้าหมาย",
    },
    {
      title: "Presentation Basics",
      duration: "30 นาที",
      summary: "จัดโครงเรื่องและพูดนำเสนอแบบสั้นให้เข้าใจง่าย",
    },
  ],
  "Code & Create": [
    {
      title: "Web Basics",
      duration: "28 นาที",
      summary: "รู้จัก HTML, CSS, JavaScript ผ่านหน้าเว็บชิ้นแรก",
    },
    {
      title: "Automation Basics",
      duration: "36 นาที",
      summary: "สร้าง workflow ง่าย ๆ เพื่อลดงานซ้ำ",
    },
  ],
  "Future Skills": [
    {
      title: "Thinking System",
      duration: "22 นาที",
      summary: "แยกปัญหา ตั้งคำถาม และออกแบบทางเลือกก่อนลงมือ",
    },
    {
      title: "Portfolio Sprint",
      duration: "34 นาที",
      summary: "เปลี่ยนสิ่งที่เรียนเป็นผลงานสั้น ๆ สำหรับใช้ต่อ",
    },
  ],
};

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
  ["/learn", "learn.html"],
  ["/learn.html", "learn.html"],
  ["/learn.js", "learn.js"],
  ["/pay", "pay.html"],
  ["/pay.html", "pay.html"],
  ["/pay.js", "pay.js"],
  ["/refund-policy", "refund-policy.html"],
  ["/refund-policy.html", "refund-policy.html"],
  ["/privacy-policy", "privacy-policy.html"],
  ["/privacy-policy.html", "privacy-policy.html"],
  ["/terms", "terms.html"],
  ["/terms.html", "terms.html"],
  ["/admin", "admin.html"],
  ["/admin.html", "admin.html"],
  ["/admin.js", "admin.js"],
]);

const VALID_STATUSES = new Set([
  "pending-payment",
  "payment-review",
  "paid",
  "payment-rejected",
  "archived",
  "new",
  "contacted",
  "trial",
  "enrolled",
  "not-fit",
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
  try {
    await fs.access(ORDERS_FILE);
  } catch {
    await fs.writeFile(ORDERS_FILE, "[]\n", "utf8");
  }
  try {
    await fs.access(ACCOUNTS_FILE);
  } catch {
    await fs.writeFile(ACCOUNTS_FILE, "[]\n", "utf8");
  }
  try {
    await fs.access(SESSIONS_FILE);
  } catch {
    await fs.writeFile(SESSIONS_FILE, "[]\n", "utf8");
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

  if (request.method === "GET" && url.pathname === "/api/packages") {
    sendJson(response, 200, { packages: PACKAGES });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/auth/me") {
    await getCurrentAccount(request, response);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/auth/profile") {
    await updateAccountProfile(request, response);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/auth/logout") {
    await logoutAccount(request, response);
    return;
  }

  if (request.method === "GET" && url.pathname === "/auth/line") {
    await startLineLogin(response, url);
    return;
  }

  if (request.method === "GET" && url.pathname === "/auth/line/callback") {
    await handleLineCallback(url, response);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/me/enrollments") {
    await getMyEnrollments(request, response);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/orders") {
    await createOrder(request, response);
    return;
  }

  const orderMatch = url.pathname.match(/^\/api\/orders\/([^/]+)$/);
  if (request.method === "GET" && orderMatch) {
    await getOrder(orderMatch[1], request, response);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/payment/webhook") {
    await handlePaymentWebhook(request, response);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/leads") {
    await createLead(request, response);
    return;
  }

  const paymentMatch = url.pathname.match(/^\/api\/enrollments\/([^/]+)\/payment$/);
  if (request.method === "POST" && paymentMatch) {
    await submitPayment(paymentMatch[1], request, response);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/access") {
    await unlockContent(request, response);
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
    ensureEnrollmentArtifacts(duplicate);
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
    await writeLeads(leads);
    await notifyLeadEvent("enrollment.duplicate", duplicate, request, { changes });
    sendJson(response, 200, { lead: publicLead(duplicate), duplicate: true });
    return;
  }

  lead.id = createId();
  lead.status = "pending-payment";
  lead.createdAt = nowIso;
  lead.updatedAt = lead.createdAt;
  lead.lastSubmittedAt = lead.createdAt;
  lead.duplicateCount = 0;
  lead.payment = {
    status: "unpaid",
    amount: "",
    reference: "",
    payerName: "",
    note: "",
    submittedAt: "",
    reviewedAt: "",
  };
  lead.access = {
    code: createAccessCode(),
    unlockedAt: "",
  };
  lead.source = {
    ip: request.headers["x-forwarded-for"] || request.socket.remoteAddress || "",
    userAgent: request.headers["user-agent"] || "",
  };
  lead.timeline = [{ at: lead.createdAt, action: "enrolled", note: lead.note || "" }];

  leads.push(lead);
  await writeLeads(leads);
  await notifyLeadEvent("enrollment.created", lead, request);
  sendJson(response, 201, { lead: publicLead(lead) });
}

async function getCurrentAccount(request, response) {
  const account = await accountFromRequest(request);
  sendJson(response, 200, {
    lineConfigured: Boolean(LINE_CHANNEL_ID && LINE_CHANNEL_SECRET),
    account: account ? publicAccount(account) : null,
  });
}

async function updateAccountProfile(request, response) {
  const account = await accountFromRequest(request);
  if (!account) {
    sendJson(response, 401, { error: "กรุณาเข้าสู่ระบบด้วย LINE ก่อน" });
    return;
  }
  const body = await readJsonBody(request);
  const accounts = await readAccounts();
  const stored = accounts.find((item) => item.id === account.id);
  if (!stored) {
    sendJson(response, 404, { error: "ไม่พบบัญชี" });
    return;
  }
  const role = clean(body.role);
  if (role && !["student", "parent", "both"].includes(role)) {
    sendJson(response, 400, { error: "role ไม่ถูกต้อง" });
    return;
  }
  if (role) stored.role = role;
  stored.phone = clean(body.phone) || stored.phone || "";
  stored.email = clean(body.email) || stored.email || "";
  stored.updatedAt = new Date().toISOString();
  await writeAccounts(accounts);
  sendJson(response, 200, { account: publicAccount(stored) });
}

async function logoutAccount(request, response) {
  const session = sessionFromRequest(request);
  if (session?.id) {
    const sessions = await readSessions();
    await writeSessions(sessions.filter((item) => item.id !== session.id));
  }
  response.setHeader("Set-Cookie", sessionCookie("", new Date(0)));
  sendJson(response, 200, { ok: true });
}

async function startLineLogin(response, url) {
  if (!LINE_CHANNEL_ID || !LINE_CHANNEL_SECRET) {
    redirect(response, `/learn?auth=${encodeURIComponent("line-not-configured")}`);
    return;
  }
  const state = crypto.randomBytes(16).toString("hex");
  const next = url.searchParams.get("next") || "/learn";
  const sessions = await readSessions();
  sessions.push({
    id: `LINESTATE-${state}`,
    type: "line-oauth-state",
    next,
    createdAt: new Date().toISOString(),
    expiresAt: addMinutes(new Date(), 10).toISOString(),
  });
  await writeSessions(sessions);

  const authUrl = new URL("https://access.line.me/oauth2/v2.1/authorize");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", LINE_CHANNEL_ID);
  authUrl.searchParams.set("redirect_uri", LINE_CALLBACK_URL);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("scope", "profile openid email");
  redirect(response, authUrl.toString());
}

async function handleLineCallback(url, response) {
  const code = url.searchParams.get("code") || "";
  const state = url.searchParams.get("state") || "";
  if (!code || !state) {
    redirect(response, "/learn?auth=line-error");
    return;
  }

  const sessions = await readSessions();
  const stateSession = sessions.find((item) => item.id === `LINESTATE-${state}` && item.type === "line-oauth-state");
  if (!stateSession || Date.parse(stateSession.expiresAt || "") < Date.now()) {
    redirect(response, "/learn?auth=line-expired");
    return;
  }

  const tokenResponse = await fetch("https://api.line.me/oauth2/v2.1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: LINE_CALLBACK_URL,
      client_id: LINE_CHANNEL_ID,
      client_secret: LINE_CHANNEL_SECRET,
    }).toString(),
  });
  const tokenData = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok || !tokenData.access_token) {
    redirect(response, "/learn?auth=line-token-error");
    return;
  }

  const profileResponse = await fetch("https://api.line.me/v2/profile", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const profile = await profileResponse.json().catch(() => ({}));
  if (!profileResponse.ok || !profile.userId) {
    redirect(response, "/learn?auth=line-profile-error");
    return;
  }

  const account = await upsertLineAccount(profile, tokenData);
  const authSession = {
    id: `SESSION-${crypto.randomBytes(18).toString("hex")}`,
    type: "auth",
    accountId: account.id,
    createdAt: new Date().toISOString(),
    expiresAt: addDays(new Date(), 30).toISOString(),
  };
  const nextSessions = sessions.filter((item) => item.id !== stateSession.id && Date.parse(item.expiresAt || "") > Date.now());
  nextSessions.push(authSession);
  await writeSessions(nextSessions);

  response.setHeader("Set-Cookie", sessionCookie(authSession.id, new Date(authSession.expiresAt)));
  redirect(response, stateSession.next || "/learn");
}

async function getMyEnrollments(request, response) {
  const account = await accountFromRequest(request);
  if (!account) {
    sendJson(response, 401, { error: "กรุณาเข้าสู่ระบบด้วย LINE ก่อน" });
    return;
  }
  const leads = await readLeads();
  const mine = sortLeads(leads).filter((lead) => lead.accountId === account.id || lead.payerAccountId === account.id);
  sendJson(response, 200, {
    account: publicAccount(account),
    enrollments: mine.map((lead) => ({
      ...publicLead(lead),
      lessons: isAccessActive(lead) ? lessonsForCourse(lead.course) : [],
    })),
  });
}

async function createOrder(request, response) {
  const body = await readJsonBody(request);
  const account = await accountFromRequest(request);
  const packageItem = PACKAGES.find((item) => item.id === clean(body.packageId));
  if (!packageItem) {
    sendJson(response, 400, { error: "ไม่พบแพ็กที่เลือก" });
    return;
  }

  const lead = normalizeLead({ ...body, course: packageItem.name, ageGroup: body.ageGroup || packageItem.level });
  const errors = validateLead(lead);
  if (errors.length) {
    sendJson(response, 400, { error: errors.join(", ") });
    return;
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const leads = await readLeads();
  const orders = await readOrders();
  const duplicate = findDuplicateLead(leads, lead, now);
  const enrollment = duplicate || {
    ...lead,
    id: createId(),
    createdAt: nowIso,
    duplicateCount: 0,
    source: {
      ip: request.headers["x-forwarded-for"] || request.socket.remoteAddress || "",
      userAgent: request.headers["user-agent"] || "",
    },
    timeline: [{ at: nowIso, action: "enrolled", note: packageItem.name }],
  };

  ensureEnrollmentArtifacts(enrollment);
  enrollment.accountId = account?.id || enrollment.accountId || "";
  enrollment.applicantRole = clean(body.applicantRole) || account?.role || enrollment.applicantRole || "student";
  enrollment.payerType = clean(body.payerType) || enrollment.payerType || "self";
  enrollment.payerAccountId = enrollment.payerType === "self" ? account?.id || enrollment.payerAccountId || "" : enrollment.payerAccountId || "";
  enrollment.status = enrollment.status === "paid" ? "paid" : "pending-payment";
  enrollment.course = packageItem.name;
  enrollment.email = lead.email;
  enrollment.phone = lead.phone;
  enrollment.lineId = lead.lineId;
  enrollment.ageGroup = lead.ageGroup;
  enrollment.preferredSchedule = lead.preferredSchedule;
  enrollment.note = lead.note;
  enrollment.updatedAt = nowIso;
  enrollment.lastSubmittedAt = nowIso;

  if (duplicate) {
    duplicate.duplicateCount = Number(duplicate.duplicateCount || 0) + 1;
    duplicate.timeline = ensureTimeline(duplicate);
    duplicate.timeline.push({ at: nowIso, action: "order-created-repeat", note: packageItem.name });
  } else {
    leads.push(enrollment);
  }

  const order = {
    id: createOrderId(),
    enrollmentId: enrollment.id,
    packageId: packageItem.id,
    packageName: packageItem.name,
    durationDays: packageItem.durationDays,
    amount: packageItem.price,
    currency: "THB",
    status: "pending",
    provider: PAYMENT_PROVIDER || "unconfigured",
    providerReference: "",
    providerPaymentId: "",
    providerStatus: "",
    paymentUrl: "",
    qrImageUrl: "",
    qrPayload: "",
    applicantRole: enrollment.applicantRole,
    payerType: enrollment.payerType,
    paymentLink: "",
    createdAt: nowIso,
    updatedAt: nowIso,
    paidAt: "",
    expiresAt: addMinutes(now, 30).toISOString(),
  };

  const paymentSession = await createPaymentSession(order, enrollment);
  order.paymentLink = `${SITE_ORIGIN}/pay?order=${encodeURIComponent(order.id)}`;
  order.provider = paymentSession.provider || order.provider;
  order.providerReference = paymentSession.providerReference || "";
  order.providerPaymentId = paymentSession.providerPaymentId || "";
  order.providerStatus = paymentSession.providerStatus || paymentSession.status || "";
  order.paymentUrl = paymentSession.paymentUrl || "";
  order.qrImageUrl = paymentSession.qrImageUrl || "";
  order.qrPayload = paymentSession.qrPayload || "";
  order.paymentStatusMessage = paymentSession.message || "";
  orders.push(order);

  await writeLeads(leads);
  await writeOrders(orders);
  await notifyLeadEvent("order.created", enrollment, request, { order: publicOrder(order), paymentSession });
  sendJson(response, 201, { enrollment: publicLead(enrollment), order: publicOrder(order), payment: paymentSession });
}

async function getOrder(id, request, response) {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  const orders = await readOrders();
  const order = orders.find((item) => item.id === decodeURIComponent(id));
  if (!order) {
    sendJson(response, 404, { error: "ไม่พบรายการสมัคร" });
    return;
  }
  const leads = await readLeads();
  const enrollment = leads.find((lead) => lead.id === order.enrollmentId);
  const phone = normalizePhone(url.searchParams.get("phone"));
  if (enrollment && phone && phone !== normalizePhone(enrollment.phone)) {
    sendJson(response, 403, { error: "เบอร์โทรไม่ตรงกับรายการสมัคร" });
    return;
  }
  sendJson(response, 200, { order: publicOrder(order), enrollment: enrollment ? publicLead(enrollment) : null });
}

async function handlePaymentWebhook(request, response) {
  const rawBody = await readRawBody(request);
  if (!verifyPaymentSignature(request, rawBody)) {
    sendJson(response, 401, { error: "Invalid webhook signature" });
    return;
  }

  let payload;
  try {
    payload = JSON.parse(rawBody || "{}");
  } catch {
    throw new HttpError(400, "Invalid JSON");
  }

  const paymentEvent = paymentEventFromPayload(payload);
  const paid = isPaidPaymentEvent(paymentEvent);
  const now = new Date();

  const leads = await readLeads();
  const orders = await readOrders();
  const order = orders.find((item) => {
    return (
      item.id === paymentEvent.reference ||
      (paymentEvent.providerReference && item.providerReference === paymentEvent.providerReference) ||
      (paymentEvent.paymentRequestId && item.providerReference === paymentEvent.paymentRequestId) ||
      (paymentEvent.providerReference && item.providerPaymentId === paymentEvent.providerReference) ||
      (paymentEvent.providerPaymentId && item.providerPaymentId === paymentEvent.providerPaymentId)
    );
  });
  if (!order) {
    sendJson(response, 404, { error: "Order not found" });
    return;
  }
  order.lastWebhook = { ...paymentEvent, receivedAt: now.toISOString() };
  order.providerStatus = paymentEvent.status || order.providerStatus || "";

  if (!paid) {
    order.updatedAt = now.toISOString();
    await writeOrders(orders);
    sendJson(response, 202, { ok: true, ignored: true, status: paymentEvent.status });
    return;
  }
  if (order.status === "paid") {
    await writeOrders(orders);
    sendJson(response, 200, { ok: true, duplicate: true, order: publicOrder(order) });
    return;
  }
  if (Number(order.amount) !== Number(paymentEvent.paidAmount)) {
    order.status = "amount-mismatch";
    order.updatedAt = now.toISOString();
    await writeOrders(orders);
    sendJson(response, 422, { error: "Amount mismatch" });
    return;
  }

  const lead = leads.find((item) => item.id === order.enrollmentId);
  if (!lead) {
    sendJson(response, 404, { error: "Enrollment not found" });
    return;
  }

  markOrderPaid(order, lead, now, paymentEvent);
  await writeOrders(orders);
  await writeLeads(leads);
  await notifyLeadEvent("order.paid", lead, request, { order: publicOrder(order) });
  sendJson(response, 200, { ok: true, order: publicOrder(order), enrollment: publicLead(lead) });
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
  ensureEnrollmentArtifacts(lead);
  const now = new Date().toISOString();
  const nextStatus = String(body.status || lead.status).trim();
  if (!VALID_STATUSES.has(nextStatus)) {
    sendJson(response, 400, { error: "Invalid status" });
    return;
  }

  if (lead.status !== nextStatus) {
    lead.timeline.push({ at: now, action: "status", from: lead.status, to: nextStatus });
    lead.status = nextStatus;
    syncEnrollmentStatus(lead, nextStatus, now);
  }

  const note = String(body.note || "").trim();
  if (note) {
    lead.timeline.push({ at: now, action: "note", note });
    lead.lastContactNote = note;
  }

  lead.updatedAt = now;
  await writeLeads(leads);
  await notifyLeadEvent("enrollment.updated", lead, request);
  sendJson(response, 200, { lead });
}

async function submitPayment(id, request, response) {
  const body = await readJsonBody(request);
  const leads = await readLeads();
  const lead = leads.find((item) => item.id === decodeURIComponent(id));

  if (!lead) {
    sendJson(response, 404, { error: "ไม่พบเลขสมัครนี้" });
    return;
  }

  const phone = normalizePhone(body.phone);
  if (!phone || phone !== normalizePhone(lead.phone)) {
    sendJson(response, 403, { error: "เบอร์โทรไม่ตรงกับใบสมัคร" });
    return;
  }

  const slipImageBase64 = String(body.slipImageBase64 || "");
  const slipPayload = String(body.slipPayload || "").trim();
  const paymentNote = clean(body.paymentNote);
  if (!slipImageBase64 && !slipPayload) {
    sendJson(response, 400, { error: "กรุณาแนบรูปสลิปหรือส่ง QR payload จากสลิป" });
    return;
  }

  const now = new Date().toISOString();
  ensureEnrollmentArtifacts(lead);
  const expectedAmount = expectedAmountForCourse(lead.course);
  const verification = await verifyThaiBankSlip({
    base64: slipImageBase64,
    payload: slipPayload,
    enrollmentId: lead.id,
    expectedAmount,
  });

  if (!verification.ok) {
    lead.status = "payment-rejected";
    lead.payment = {
      ...lead.payment,
      status: "rejected",
      amount: clean(body.amount),
      reference: "",
      payerName: clean(body.payerName),
      paidAt: "",
      note: verification.message || paymentNote,
      submittedAt: now,
      reviewedAt: now,
      verification,
    };
    lead.updatedAt = now;
    lead.timeline = ensureTimeline(lead);
    lead.timeline.push({ at: now, action: "payment-rejected", note: verification.message });
    await writeLeads(leads);
    await notifyLeadEvent("payment.rejected", lead, request, { verification });
    sendJson(response, 422, { error: verification.message || "ตรวจสลิปไม่ผ่าน", lead: publicLead(lead) });
    return;
  }

  lead.status = "paid";
  const expiresAt = addDays(new Date(now), ACCESS_DAYS).toISOString();
  lead.payment = {
    ...lead.payment,
    status: "approved",
    amount: String(verification.amount || expectedAmount || clean(body.amount) || ""),
    reference: verification.transRef || "",
    payerName: clean(body.payerName),
    paidAt: verification.paidAt || "",
    note: paymentNote,
    submittedAt: now,
    reviewedAt: now,
    verification,
  };
  lead.access.unlockedAt = now;
  lead.access.expiresAt = expiresAt;
  lead.entitlement = {
    orderId: "",
    packageId: "",
    packageName: lead.course,
    startsAt: now,
    expiresAt,
    status: "active",
  };
  lead.updatedAt = now;
  lead.timeline = ensureTimeline(lead);
  lead.timeline.push({
    at: now,
    action: "payment-verified",
    note: `ตรวจสลิปผ่าน${verification.transRef ? `: ${verification.transRef}` : ""}`,
  });
  lead.timeline.push({ at: now, action: "content-unlocked", note: "เปิดบทเรียนอัตโนมัติ" });

  await writeLeads(leads);
  await notifyLeadEvent("payment.verified", lead, request, { verification });
  sendJson(response, 200, { lead: publicLead(lead), unlocked: true, lessons: lessonsForCourse(lead.course) });
}

async function unlockContent(request, response) {
  const body = await readJsonBody(request);
  const enrollmentId = clean(body.enrollmentId).toUpperCase();
  const phone = normalizePhone(body.phone);
  const accessCode = clean(body.accessCode).toUpperCase();
  const leads = await readLeads();
  const lead = leads.find((item) => String(item.id || "").toUpperCase() === enrollmentId);

  if (!lead) {
    sendJson(response, 404, { error: "ไม่พบเลขสมัครนี้" });
    return;
  }

  ensureEnrollmentArtifacts(lead);
  if (!phone || phone !== normalizePhone(lead.phone) || accessCode !== String(lead.access.code || "").toUpperCase()) {
    sendJson(response, 403, { error: "ข้อมูลเข้าเรียนไม่ถูกต้อง" });
    return;
  }

  if (!isAccessActive(lead)) {
    sendJson(response, 403, {
      unlocked: false,
      status: lead.status,
      paymentStatus: lead.payment?.status || "unpaid",
      expiresAt: lead.access?.expiresAt || "",
      message: accessPendingMessage(lead.status),
    });
    return;
  }

  sendJson(response, 200, {
    unlocked: true,
    enrollment: {
      id: lead.id,
      name: lead.name,
      course: lead.course,
      unlockedAt: lead.access.unlockedAt,
      expiresAt: lead.access.expiresAt,
    },
    lessons: lessonsForCourse(lead.course),
  });
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
    email: clean(body.email),
    lineId: clean(body.lineId),
    ageGroup: clean(body.ageGroup),
    course: clean(body.course),
    preferredSchedule: clean(body.preferredSchedule),
    note: clean(body.note),
  };
}

function mergeLeadData(existing, incoming) {
  const fields = ["name", "phone", "email", "lineId", "ageGroup", "course", "preferredSchedule", "note"];
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
  if (!lead.email) errors.push("กรุณากรอกอีเมล");
  if (!lead.course) errors.push("กรุณาเลือกหลักสูตร");
  if (lead.name.length > 120) errors.push("ชื่อยาวเกินไป");
  if (lead.phone.length > 40) errors.push("เบอร์โทรยาวเกินไป");
  if (lead.email.length > 160) errors.push("อีเมลยาวเกินไป");
  return errors;
}

function clean(value) {
  return String(value || "").trim().slice(0, 1000);
}

function parseJsonEnv(name, fallback) {
  if (!process.env[name]) return fallback;
  try {
    return JSON.parse(process.env[name]);
  } catch {
    console.warn(`${name} is not valid JSON`);
    return fallback;
  }
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

function ensureEnrollmentArtifacts(lead) {
  if (!lead.payment) {
    lead.payment = {
      status: lead.status === "paid" ? "approved" : "unpaid",
      amount: "",
      reference: "",
      payerName: "",
      note: "",
      submittedAt: "",
      reviewedAt: "",
    };
  }
  if (!lead.access) {
    lead.access = {
      code: createAccessCode(),
      unlockedAt: lead.status === "paid" ? lead.updatedAt || lead.createdAt || "" : "",
      expiresAt: lead.status === "paid" ? addDays(new Date(lead.updatedAt || lead.createdAt || Date.now()), ACCESS_DAYS).toISOString() : "",
    };
  }
  if (!lead.access.code) lead.access.code = createAccessCode();
  if (!("expiresAt" in lead.access)) lead.access.expiresAt = "";
  return lead;
}

function syncEnrollmentStatus(lead, status, now) {
  ensureEnrollmentArtifacts(lead);
  if (status === "paid") {
    lead.payment.status = "approved";
    lead.payment.reviewedAt = now;
    lead.access.unlockedAt = lead.access.unlockedAt || now;
    lead.access.expiresAt = lead.access.expiresAt || addDays(new Date(now), ACCESS_DAYS).toISOString();
    lead.timeline.push({ at: now, action: "content-unlocked", note: "อนุมัติชำระเงินและเปิดบทเรียน" });
    return;
  }
  if (status === "payment-review") {
    lead.payment.status = lead.payment.status === "approved" ? "approved" : "review";
    return;
  }
  if (status === "payment-rejected") {
    lead.payment.status = "rejected";
    lead.payment.reviewedAt = now;
    lead.access.unlockedAt = "";
    lead.access.expiresAt = "";
    return;
  }
  if (status === "pending-payment") {
    lead.payment.status = "unpaid";
    lead.access.unlockedAt = "";
    lead.access.expiresAt = "";
  }
}

function accessPendingMessage(status) {
  if (status === "payment-review") return "ได้รับแจ้งชำระแล้ว รอตรวจสอบ";
  if (status === "payment-rejected") return "การชำระยังไม่ผ่าน กรุณาส่งข้อมูลใหม่";
  return "ยังรอชำระเงิน";
}

function expectedAmountForCourse(course) {
  const value = COURSE_PRICES[course] ?? COURSE_PRICES.default ?? DEFAULT_COURSE_PRICE;
  const amount = Number(value || 0);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

async function verifyThaiBankSlip({ base64, payload, enrollmentId, expectedAmount }) {
  if (!EASYSLIP_API_KEY) {
    return {
      ok: false,
      provider: "easyslip",
      code: "SLIP_API_NOT_CONFIGURED",
      message: "ยังไม่ได้ตั้งค่า EASYSLIP_API_KEY สำหรับตรวจสลิปอัตโนมัติ",
    };
  }

  const requestBody = {
    checkDuplicate: true,
    remark: enrollmentId,
  };
  if (base64) requestBody.base64 = base64;
  if (payload) requestBody.payload = payload;
  if (expectedAmount) requestBody.matchAmount = expectedAmount;
  if (EASYSLIP_MATCH_ACCOUNT) requestBody.matchAccount = true;

  try {
    const verificationResponse = await fetch(EASYSLIP_VERIFY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${EASYSLIP_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    const result = await verificationResponse.json().catch(() => ({}));

    if (!verificationResponse.ok || !result.success) {
      return {
        ok: false,
        provider: "easyslip",
        status: verificationResponse.status,
        code: result.error?.code || "SLIP_VERIFY_FAILED",
        message: result.error?.message || "ตรวจสลิปไม่ผ่าน",
      };
    }

    const data = result.data || {};
    const amount = slipAmount(data);
    if (data.isDuplicate) {
      return {
        ok: false,
        provider: "easyslip",
        code: "DUPLICATE_SLIP",
        message: "สลิปนี้เคยถูกใช้แล้ว",
        transRef: slipTransRef(data),
        amount,
      };
    }
    if (expectedAmount && Math.abs(Number(amount || 0) - expectedAmount) > 0.01) {
      return {
        ok: false,
        provider: "easyslip",
        code: "AMOUNT_NOT_MATCHED",
        message: `ยอดโอนในสลิปไม่ตรงกับยอดหลักสูตร (${expectedAmount} บาท)`,
        transRef: slipTransRef(data),
        amount,
      };
    }

    return {
      ok: true,
      provider: "easyslip",
      transRef: slipTransRef(data),
      amount,
      paidAt: data.rawSlip?.date || "",
      isDuplicate: Boolean(data.isDuplicate),
      isAmountMatched: expectedAmount ? amount === expectedAmount || data.isAmountMatched === true : undefined,
      receiver: data.rawSlip?.receiver?.account?.name?.th || data.rawSlip?.receiver?.account?.name?.en || "",
      sender: data.rawSlip?.sender?.account?.name?.th || data.rawSlip?.sender?.account?.name?.en || "",
    };
  } catch (error) {
    return {
      ok: false,
      provider: "easyslip",
      code: "SLIP_VERIFY_ERROR",
      message: error.message || "ระบบตรวจสลิปขัดข้อง",
    };
  }
}

function slipAmount(data) {
  return Number(data.amountInSlip ?? data.rawSlip?.amount?.amount ?? data.amount?.amount ?? 0);
}

function slipTransRef(data) {
  return data.rawSlip?.transRef || data.transRef || "";
}

function lessonsForCourse(course) {
  return COURSE_CONTENT[course] || COURSE_CONTENT["อังกฤษ ม.ต้น: พูดได้ + แกรมมาร์แน่น"];
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

function addMinutes(date, minutes) {
  const next = new Date(date);
  next.setMinutes(next.getMinutes() + minutes);
  return next;
}

function createOrderId() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `ORDER-${date}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

async function createPaymentSession(order, enrollment) {
  if (!PAYMENT_PROVIDER || !PAYMENT_PROVIDER_API_KEY) {
    return {
      provider: PAYMENT_PROVIDER || "unconfigured",
      status: "provider_not_configured",
      message: "ยังไม่ได้ตั้งค่าระบบรับชำระเงินอัตโนมัติ",
      checkoutUrl: `${SITE_ORIGIN}/#apply`,
    };
  }

  if (normalizeKey(PAYMENT_PROVIDER) === "xendit") {
    return createXenditPaymentRequest(order, enrollment);
  }

  if (normalizeKey(PAYMENT_PROVIDER) === "kbank") {
    return createKbankQrPaymentRequest(order, enrollment);
  }

  return {
    provider: PAYMENT_PROVIDER,
    status: "adapter_ready",
    message: "ตั้งค่าผู้ให้บริการรับชำระเงินแล้ว แต่ยังไม่ได้เปิดใช้งานกับระบบนี้",
    checkoutUrl: `${SITE_ORIGIN}/#apply`,
  };
}

async function createKbankQrPaymentRequest(order, enrollment) {
  if (!KBANK_QR_CREATE_URL || !KBANK_MERCHANT_ID) {
    return {
      provider: "kbank",
      status: "provider_not_configured",
      providerStatus: "missing_kbank_config",
      message: "ยังไม่ได้ตั้งค่า KBank QR API URL หรือ merchant id",
      checkoutUrl: `${SITE_ORIGIN}/#apply`,
    };
  }

  const payload = {
    merchantId: KBANK_MERCHANT_ID,
    terminalId: KBANK_TERMINAL_ID,
    branchId: KBANK_BRANCH_ID,
    partnerTxnUid: order.id,
    partnerId: "101future",
    requestDt: new Date().toISOString(),
    txnAmount: Number(order.amount).toFixed(2),
    txnCurrencyCode: "THB",
    reference1: order.id,
    reference2: order.enrollmentId,
    reference3: order.packageId,
    description: `${order.packageName} (${order.id})`.slice(0, 140),
    expiryDt: order.expiresAt,
    metadata: {
      orderId: order.id,
      enrollmentId: order.enrollmentId,
      packageId: order.packageId,
      studentName: clean(enrollment?.name).slice(0, 120),
    },
  };

  try {
    const providerResponse = await fetch(KBANK_QR_CREATE_URL, {
      method: "POST",
      headers: {
        [KBANK_API_KEY_HEADER]: PAYMENT_PROVIDER_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const text = await providerResponse.text();
    const data = parseJsonText(text);

    if (!providerResponse.ok) {
      return {
        provider: "kbank",
        status: "provider_error",
        providerStatus: "provider_error",
        message: kbankErrorMessage(data, text, providerResponse.status),
        checkoutUrl: `${SITE_ORIGIN}/#apply`,
      };
    }

    const qrPayload = clean(
      data.qrPayload ||
        data.qrCode ||
        data.qr_code ||
        data.qr ||
        data.rawQr ||
        data.data?.qrPayload ||
        data.data?.qrCode ||
        data.data?.qr_code,
    );
    const qrImageUrl =
      clean(data.qrImageUrl || data.qr_image_url || data.data?.qrImageUrl || data.data?.qr_image_url) ||
      (qrPayload ? await QRCode.toDataURL(qrPayload, { width: 320, margin: 2 }) : "");
    const providerReference = clean(
      data.partnerTxnUid ||
        data.transactionId ||
        data.txnId ||
        data.qrId ||
        data.data?.partnerTxnUid ||
        data.data?.transactionId ||
        data.data?.txnId ||
        data.data?.qrId ||
        order.id,
    );

    return {
      provider: "kbank",
      status: "created",
      providerStatus: clean(data.status || data.respCode || data.data?.status || "created"),
      providerReference,
      providerPaymentId: clean(data.transactionId || data.txnId || data.data?.transactionId || data.data?.txnId),
      paymentUrl: "",
      qrImageUrl,
      qrPayload,
      checkoutUrl: `${SITE_ORIGIN}/#apply`,
      message: qrPayload || qrImageUrl
        ? "สแกน Thai QR จาก KBank เพื่อชำระเงิน เมื่อธนาคารยืนยันยอดถูกต้องระบบจะเปิดบทเรียนให้อัตโนมัติ"
        : "สร้างรายการ KBank QR แล้ว แต่ยังไม่พบ QR payload/image ในผลลัพธ์จากธนาคาร",
    };
  } catch (error) {
    return {
      provider: "kbank",
      status: "provider_error",
      providerStatus: "provider_error",
      message: `เชื่อมต่อ KBank QR API ไม่สำเร็จ: ${error.message}`,
      checkoutUrl: `${SITE_ORIGIN}/#apply`,
    };
  }
}

async function createXenditPaymentRequest(order, enrollment) {
  const payload = {
    reference_id: order.id,
    type: "PAY",
    country: "TH",
    currency: "THB",
    request_amount: Number(order.amount),
    capture_method: "AUTOMATIC",
    channel_code: "QRPROMPTPAY",
    channel_properties: {
      expires_at: xenditTimestamp(order.expiresAt),
      qr_string_type: "DYNAMIC",
    },
    description: `${order.packageName} (${order.id})`.slice(0, 1000),
    metadata: {
      order_id: order.id,
      orderId: order.id,
      enrollment_id: order.enrollmentId,
      package_id: order.packageId,
      student_name: clean(enrollment?.name).slice(0, 120),
      product: "101future",
    },
  };

  try {
    const providerResponse = await fetch("https://api.xendit.co/v3/payment_requests", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${PAYMENT_PROVIDER_API_KEY}:`).toString("base64")}`,
        "Content-Type": "application/json",
        "api-version": XENDIT_API_VERSION,
      },
      body: JSON.stringify(payload),
    });
    const text = await providerResponse.text();
    const data = parseJsonText(text);

    if (!providerResponse.ok) {
      return {
        provider: "xendit",
        status: "provider_error",
        providerStatus: "provider_error",
        message: xenditErrorMessage(data, text, providerResponse.status),
        checkoutUrl: `${SITE_ORIGIN}/#apply`,
      };
    }

    const qrPayload = findXenditAction(data, "QR_STRING")?.value || "";
    const paymentUrl = findXenditAction(data, "WEB_URL")?.value || "";
    const qrImageUrl = qrPayload ? await QRCode.toDataURL(qrPayload, { width: 320, margin: 2 }) : "";

    return {
      provider: "xendit",
      status: "created",
      providerStatus: data.status || "",
      providerReference: clean(data.payment_request_id || data.id || data.reference_id),
      providerPaymentId: clean(data.latest_payment_id || ""),
      paymentUrl,
      qrImageUrl,
      qrPayload,
      checkoutUrl: paymentUrl || `${SITE_ORIGIN}/#apply`,
      message: qrPayload
        ? "สแกน QR เพื่อชำระเงินได้เลย เมื่อยอดถูกต้องระบบจะเปิดบทเรียนให้อัตโนมัติ"
        : "สร้างรายการชำระเงินแล้ว แต่ยังไม่พบข้อมูล QR ในผลลัพธ์จากผู้ให้บริการ",
    };
  } catch (error) {
    return {
      provider: "xendit",
      status: "provider_error",
      providerStatus: "provider_error",
      message: `เชื่อมต่อ Xendit ไม่สำเร็จ: ${error.message}`,
      checkoutUrl: `${SITE_ORIGIN}/#apply`,
    };
  }
}

function markOrderPaid(order, lead, now = new Date(), paymentEvent = {}) {
  ensureEnrollmentArtifacts(lead);
  const nowIso = now.toISOString();
  const expiresAt = addDays(now, order.durationDays || ACCESS_DAYS).toISOString();
  order.status = "paid";
  order.providerReference = paymentEvent.paymentRequestId || order.providerReference || paymentEvent.providerReference || "";
  order.providerPaymentId = paymentEvent.providerPaymentId || order.providerPaymentId || "";
  order.providerStatus = paymentEvent.status || order.providerStatus || "";
  order.paidAt = order.paidAt || nowIso;
  order.updatedAt = nowIso;
  lead.status = "paid";
  lead.payment = {
    ...lead.payment,
    status: "approved",
    amount: String(order.amount || ""),
    reference: order.id,
    reviewedAt: nowIso,
    provider: order.provider,
    providerReference: order.providerReference,
    providerPaymentId: order.providerPaymentId,
    paidAt: nowIso,
  };
  lead.access.unlockedAt = lead.access.unlockedAt || nowIso;
  lead.access.expiresAt = expiresAt;
  lead.entitlement = {
    orderId: order.id,
    packageId: order.packageId,
    packageName: order.packageName,
    startsAt: lead.access.unlockedAt,
    expiresAt,
    status: "active",
  };
  lead.timeline = ensureTimeline(lead);
  lead.timeline.push({ at: nowIso, action: "order-paid", note: order.id });
  lead.timeline.push({ at: nowIso, action: "content-unlocked", note: `เปิดสิทธิ์ ${ACCESS_DAYS} วัน` });
}

function verifyPaymentSignature(request, rawBody) {
  if (!PAYMENT_WEBHOOK_SECRET) return false;
  if (normalizeKey(PAYMENT_PROVIDER) === "xendit") {
    const token = String(request.headers["x-callback-token"] || "");
    return token ? timingSafeEqual(token, PAYMENT_WEBHOOK_SECRET) : false;
  }
  if (normalizeKey(PAYMENT_PROVIDER) === "kbank") {
    const token = String(request.headers[KBANK_WEBHOOK_TOKEN_HEADER.toLowerCase()] || request.headers["x-api-key"] || "");
    if (token && timingSafeEqual(token, PAYMENT_WEBHOOK_SECRET)) return true;
    const kbankSignature = String(request.headers["x-kbank-signature"] || request.headers["x-signature"] || "");
    if (!kbankSignature) return false;
    const expected = crypto.createHmac("sha256", PAYMENT_WEBHOOK_SECRET).update(rawBody).digest("hex");
    return timingSafeEqual(kbankSignature.replace(/^sha256=/, ""), expected);
  }
  const signature = String(request.headers["x-signature"] || request.headers["x-callback-token"] || "");
  if (!signature) return false;
  const expected = crypto.createHmac("sha256", PAYMENT_WEBHOOK_SECRET).update(rawBody).digest("hex");
  return timingSafeEqual(signature.replace(/^sha256=/, ""), expected);
}

function paymentEventFromPayload(payload) {
  const envelope =
    payload.paymentCapture?.value ||
    payload.paymentAuthorization?.value ||
    payload.paymentFailure?.value ||
    payload.value ||
    payload;
  const data = envelope.data?.data || envelope.data || payload.data?.data || payload.data || envelope;
  const metadata = data.metadata || envelope.metadata || payload.metadata || {};
  const providerPaymentId = clean(
    data.payment_id ||
      payload.payment_id ||
      data.latest_payment_id ||
      payload.id ||
      data.transactionId ||
      payload.transactionId ||
      data.txnId ||
      payload.txnId,
  );
  const paymentRequestId = clean(
    data.payment_request_id ||
      payload.payment_request_id ||
      metadata.payment_request_id ||
      data.partnerTxnUid ||
      payload.partnerTxnUid ||
      data.qrId ||
      payload.qrId,
  );

  return {
    event: String(envelope.event || payload.event || ""),
    status: String(data.status || envelope.status || payload.status || data.txnStatus || payload.txnStatus || data.paymentStatus || payload.paymentStatus || "").toLowerCase(),
    reference: clean(
      data.reference_id ||
        envelope.reference_id ||
        payload.reference_id ||
        data.partnerTxnUid ||
        payload.partnerTxnUid ||
        data.reference1 ||
        payload.reference1 ||
        data.ref1 ||
        payload.ref1 ||
        metadata.orderId ||
        metadata.order_id ||
        payload.orderId ||
        payload.order_id ||
        payload.reference ||
        payload.external_id,
    ),
    providerReference: clean(providerPaymentId || paymentRequestId || payload.providerReference || data.charge_id || payload.charge_id),
    providerPaymentId,
    paymentRequestId,
    paidAmount: Number(
      data.request_amount ??
        data.amount ??
        data.txnAmount ??
        data.transactionAmount ??
        data.paidAmount ??
        data.paid_amount ??
        data.capture_amount ??
        data.captures?.[0]?.capture_amount ??
        payload.amount ??
        payload.txnAmount ??
        payload.transactionAmount ??
        payload.paidAmount ??
        payload.paid_amount ??
        0,
    ),
  };
}

function isPaidPaymentEvent(paymentEvent) {
  const value = `${paymentEvent.status} ${paymentEvent.event}`.toLowerCase();
  return value.includes("succeeded") || value.includes("success") || value.includes("paid") || value.includes("completed") || value.includes("settled");
}

function findXenditAction(data, descriptor) {
  return (Array.isArray(data.actions) ? data.actions : []).find((action) => {
    return String(action.descriptor || "").toUpperCase() === descriptor;
  });
}

function parseJsonText(text) {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function xenditErrorMessage(data, text, status) {
  return clean(data.message || data.error || data.error_code || text) || `Xendit ตอบกลับ status ${status}`;
}

function kbankErrorMessage(data, text, status) {
  return clean(data.message || data.error || data.errorCode || data.respMsg || data.respCode || text) || `KBank ตอบกลับ status ${status}`;
}

function xenditTimestamp(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function timingSafeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
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
  ensureEnrollmentArtifacts(lead);
  return {
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    lineId: lead.lineId,
    course: lead.course,
    status: lead.status,
    createdAt: lead.createdAt,
    payment: lead.payment,
    access: lead.access,
    automation: lead.automation || null,
  };
}

function createId() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `LEAD-${date}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

function createAccessCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

async function readJsonBody(request) {
  const raw = await readRawBody(request);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, "Invalid JSON");
  }
}

async function readRawBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 8_000_000) throw new HttpError(413, "Payload too large");
    chunks.push(chunk);
  }
  return chunks.length ? Buffer.concat(chunks).toString("utf8") : "";
}

async function readLeads() {
  const raw = await fs.readFile(LEADS_FILE, "utf8");
  return JSON.parse(raw);
}

async function readOrders() {
  const raw = await fs.readFile(ORDERS_FILE, "utf8");
  return JSON.parse(raw);
}

async function readAccounts() {
  const raw = await fs.readFile(ACCOUNTS_FILE, "utf8");
  return JSON.parse(raw);
}

async function readSessions() {
  const raw = await fs.readFile(SESSIONS_FILE, "utf8");
  return JSON.parse(raw);
}

async function writeLeads(leads) {
  await fs.writeFile(LEADS_FILE, `${JSON.stringify(leads, null, 2)}\n`, "utf8");
}

async function writeOrders(orders) {
  await fs.writeFile(ORDERS_FILE, `${JSON.stringify(orders, null, 2)}\n`, "utf8");
}

async function writeAccounts(accounts) {
  await fs.writeFile(ACCOUNTS_FILE, `${JSON.stringify(accounts, null, 2)}\n`, "utf8");
}

async function writeSessions(sessions) {
  await fs.writeFile(SESSIONS_FILE, `${JSON.stringify(sessions, null, 2)}\n`, "utf8");
}

function sortLeads(leads) {
  return [...leads].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

function publicLead(lead) {
  ensureEnrollmentArtifacts(lead);
  const accessActive = isAccessActive(lead);
  return {
    id: lead.id,
    name: lead.name,
    course: lead.course,
    status: lead.status,
    paymentStatus: lead.payment?.status || "unpaid",
    accessCode: lead.access?.code || "",
    accessActive,
    accessExpiresAt: lead.access?.expiresAt || "",
    learnUrl: "/learn",
    createdAt: lead.createdAt,
    applicantRole: lead.applicantRole || "",
    payerType: lead.payerType || "",
    nextAction: accessActive ? "เข้าเรียนได้ทันที" : "เลือกแพ็กและชำระเงินเพื่อเปิดบทเรียน",
  };
}

function publicOrder(order) {
  return {
    id: order.id,
    enrollmentId: order.enrollmentId,
    packageId: order.packageId,
    packageName: order.packageName,
    amount: order.amount,
    currency: order.currency,
    status: order.status,
    provider: order.provider,
    providerStatus: order.providerStatus || "",
    paymentUrl: order.paymentUrl,
    qrImageUrl: order.qrImageUrl,
    qrPayload: order.qrPayload,
    payerType: order.payerType || "",
    paymentLink: order.paymentLink || `${SITE_ORIGIN}/pay?order=${encodeURIComponent(order.id)}`,
    paymentStatusMessage: order.paymentStatusMessage || "",
    createdAt: order.createdAt,
    expiresAt: order.expiresAt,
    paidAt: order.paidAt,
  };
}

function publicAccount(account) {
  return {
    id: account.id,
    role: account.role || "",
    displayName: account.displayName || "",
    pictureUrl: account.pictureUrl || "",
    phone: account.phone || "",
    email: account.email || "",
    createdAt: account.createdAt || "",
  };
}

async function upsertLineAccount(profile, tokenData = {}) {
  const accounts = await readAccounts();
  const now = new Date().toISOString();
  let account = accounts.find((item) => item.provider === "line" && item.lineUserId === profile.userId);
  if (!account) {
    account = {
      id: `ACCOUNT-${crypto.randomBytes(8).toString("hex").toUpperCase()}`,
      provider: "line",
      lineUserId: profile.userId,
      role: "",
      displayName: "",
      pictureUrl: "",
      phone: "",
      email: "",
      createdAt: now,
      updatedAt: now,
    };
    accounts.push(account);
  }
  account.displayName = clean(profile.displayName) || account.displayName || "";
  account.pictureUrl = clean(profile.pictureUrl) || account.pictureUrl || "";
  if (tokenData.id_token && !account.email) {
    const claims = decodeJwtPayload(tokenData.id_token);
    account.email = clean(claims.email) || account.email || "";
  }
  account.updatedAt = now;
  await writeAccounts(accounts);
  return account;
}

async function accountFromRequest(request) {
  const session = sessionFromRequest(request);
  if (!session?.id) return null;
  const sessions = await readSessions();
  const active = sessions.find((item) => item.id === session.id && item.type === "auth");
  if (!active || Date.parse(active.expiresAt || "") <= Date.now()) return null;
  const accounts = await readAccounts();
  return accounts.find((item) => item.id === active.accountId) || null;
}

function sessionFromRequest(request) {
  const cookies = parseCookies(request.headers.cookie || "");
  const id = cookies[SESSION_COOKIE_NAME] || "";
  return id ? { id } : null;
}

function parseCookies(cookieHeader) {
  return String(cookieHeader || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const idx = part.indexOf("=");
      if (idx <= 0) return acc;
      acc[decodeURIComponent(part.slice(0, idx))] = decodeURIComponent(part.slice(idx + 1));
      return acc;
    }, {});
}

function sessionCookie(value, expiresAt) {
  const secure = SITE_ORIGIN.startsWith("https://") ? "; Secure" : "";
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}${secure}`;
}

function redirect(response, location) {
  response.writeHead(302, { Location: location });
  response.end();
}

function decodeJwtPayload(token) {
  try {
    const payload = String(token).split(".")[1] || "";
    const json = Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return {};
  }
}

function isAccessActive(lead) {
  const expiresAt = Date.parse(lead.access?.expiresAt || lead.entitlement?.expiresAt || "");
  return lead.status === "paid" && lead.payment?.status === "approved" && Number.isFinite(expiresAt) && expiresAt > Date.now();
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
    "paymentStatus",
    "paymentAmount",
    "paymentReference",
    "accessCode",
    "unlockedAt",
    "duplicateCount",
    "name",
    "phone",
    "email",
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
  ensureEnrollmentArtifacts(lead);
  if (key === "priority") return lead.automation?.priority || "";
  if (key === "nextAction") return lead.automation?.nextAction || "";
  if (key === "nextFollowUpAt") return lead.automation?.nextFollowUpAt || "";
  if (key === "paymentStatus") return lead.payment?.status || "";
  if (key === "paymentAmount") return lead.payment?.amount || "";
  if (key === "paymentReference") return lead.payment?.reference || "";
  if (key === "accessCode") return lead.access?.code || "";
  if (key === "unlockedAt") return lead.access?.unlockedAt || "";
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

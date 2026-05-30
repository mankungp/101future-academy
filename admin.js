const statusLabels = {
  "pending-payment": "รอชำระ",
  "payment-review": "รอตรวจ",
  paid: "เปิดเรียนแล้ว",
  "payment-rejected": "สลิปไม่ผ่าน",
  archived: "เก็บไว้ก่อน",
  new: "ใหม่",
  contacted: "ติดต่อแล้ว",
  trial: "นัดทดลองเรียน",
  enrolled: "ลงทะเบียนแล้ว",
  "not-fit": "ยังไม่เหมาะ",
};

let token = localStorage.getItem("101future.adminToken") || "";
let leads = [];
let interests = [];

const loginPanel = document.querySelector("#loginPanel");
const adminPanel = document.querySelector("#adminPanel");
const tokenInput = document.querySelector("#tokenInput");
const loginButton = document.querySelector("#loginButton");
const loginStatus = document.querySelector("#loginStatus");
const refreshButton = document.querySelector("#refreshButton");
const metricsEl = document.querySelector("#metrics");
const interestList = document.querySelector("#interestList");
const paymentList = document.querySelector("#paymentList");
const leadList = document.querySelector("#leadList");
const exportLink = document.querySelector("#exportLink");

tokenInput.value = token;
updateExportLink();

loginButton.addEventListener("click", async () => {
  token = tokenInput.value.trim();
  localStorage.setItem("101future.adminToken", token);
  updateExportLink();
  await loadLeads();
});

refreshButton.addEventListener("click", loadLeads);

async function loadLeads() {
  loginStatus.textContent = "";
  const [leadResult, interestResult] = await Promise.all([fetchJson("/api/leads"), fetchJson("/api/interests")]);

  if (!leadResult.ok || !interestResult.ok) {
    loginStatus.textContent = leadResult.data?.error || interestResult.data?.error || "เข้าสู่ระบบไม่สำเร็จ";
    return;
  }

  leads = leadResult.data.leads;
  interests = interestResult.data.interests || [];
  loginPanel.classList.add("hidden");
  adminPanel.classList.remove("hidden");
  renderMetrics();
  renderInterests();
  renderPaymentQueue();
  renderLeads();
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const data = await response.json();
  return { ok: response.ok, data };
}

function renderMetrics() {
  const counts = leads.reduce(
    (acc, lead) => {
      acc.total += 1;
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    },
    { total: 0 },
  );

  const items = [
    ["ทั้งหมด", counts.total],
    ["รอชำระ", counts["pending-payment"] || 0],
    ["รอตรวจ", counts["payment-review"] || 0],
    ["เปิดเรียน", counts.paid || 0],
    ["ไม่ผ่าน", counts["payment-rejected"] || 0],
    ["สนใจ LINE", interests.length],
  ];

  metricsEl.innerHTML = items
    .map(([label, value]) => `<article class="metric"><span>${label}</span><strong>${value}</strong></article>`)
    .join("");
}

function renderInterests() {
  if (!interestList) return;
  interestList.innerHTML =
    interests.map(renderInterestCard).join("") ||
    `<article class="payment-card empty-state">
      <strong>ยังไม่มีคนลงชื่อสนใจ</strong>
      <span>เมื่อกดเลือกแพ็กผ่าน LINE รายการจะเข้ามาที่นี่</span>
    </article>`;

  interestList.querySelectorAll("[data-create-order]").forEach((button) => {
    button.addEventListener("click", async () => {
      await createInterestOrder(button.dataset.accountId, button.dataset.packageId);
    });
  });
}

function renderInterestCard(interest) {
  const role = { student: "นักเรียน", parent: "ผู้ปกครอง", both: "นักเรียน/ผู้ปกครอง" }[interest.role] || "ยังไม่ระบุ";
  const order = interest.order || null;
  const enrollment = interest.enrollment || null;
  const orderLink = order?.paymentLink || "";
  const statusText = order
    ? `เตรียมชำระแล้ว: ${statusLabels[enrollment?.status] || order.status}`
    : "รอเปิดรายการชำระ";
  const contact = [interest.phone ? `โทร ${escapeHtml(interest.phone)}` : "", interest.email ? escapeHtml(interest.email) : ""]
    .filter(Boolean)
    .join(" · ");

  return `
    <article class="payment-card">
      <div>
        <span class="mini-label">${escapeHtml(statusText)}</span>
        <strong>${escapeHtml(interest.displayName || "บัญชี LINE")}</strong>
        <p>${escapeHtml(interest.packageName)} · ${money(interest.price)} / ${interest.durationDays || 30} วัน</p>
      </div>
      <div class="automation-links">
        <span>${escapeHtml(role)}</span>
        <span>${contact || "ยังไม่มีเบอร์/อีเมล"}</span>
        <span>ล่าสุด: ${formatDateTime(interest.updatedAt)}</span>
      </div>
      <div class="queue-actions">
        ${
          orderLink
            ? `<a class="button primary" href="${escapeHtml(orderLink)}" target="_blank" rel="noreferrer">เปิดลิงก์ชำระ</a>`
            : `<button class="button primary" data-create-order="true" data-account-id="${escapeHtml(interest.accountId)}" data-package-id="${escapeHtml(interest.packageId)}">เตรียมรายการชำระ</button>`
        }
      </div>
    </article>
  `;
}

async function createInterestOrder(accountId, packageId) {
  const result = await fetchJson(`/api/interests/${encodeURIComponent(accountId)}/${encodeURIComponent(packageId)}/order`, {
    method: "POST",
  });
  if (!result.ok) {
    alert(result.data.error || "สร้างรายการชำระไม่สำเร็จ");
    return;
  }
  await loadLeads();
}

function renderPaymentQueue() {
  const queue = leads.filter((lead) => ["payment-review", "payment-rejected"].includes(lead.status));
  paymentList.innerHTML =
    queue.map(renderPaymentCard).join("") ||
    `<article class="payment-card empty-state">
      <strong>ไม่มีเคสค้าง</strong>
      <span>รายการผิดปกติจะแสดงที่นี่</span>
    </article>`;

  paymentList.querySelectorAll("[data-status]").forEach((button) => {
    button.addEventListener("click", async () => {
      await updateLead(button.dataset.id, { status: button.dataset.status, note: button.dataset.note || "" });
    });
  });
}

function money(value) {
  return `${Number(value || 0).toLocaleString("th-TH", { maximumFractionDigits: 0 })} บาท`;
}

function renderPaymentCard(lead) {
  const payment = lead.payment || {};
  return `
    <article class="payment-card ${lead.status === "payment-rejected" ? "due" : ""}">
      <div>
        <span class="mini-label">${statusLabels[lead.status] || lead.status}</span>
        <strong>${escapeHtml(lead.name)}</strong>
        <p>${escapeHtml(payment.note || payment.verification?.message || "รอข้อมูลเพิ่มเติม")}</p>
      </div>
      <div class="automation-links">
        <span>ยอด: ${escapeHtml(payment.amount || "-")}</span>
        <span>Ref: ${escapeHtml(payment.reference || "-")}</span>
      </div>
      <div class="queue-actions">
        <button class="button primary" data-id="${lead.id}" data-status="paid" data-note="manual approve">เปิดเรียน</button>
        <button class="button secondary" data-id="${lead.id}" data-status="payment-rejected" data-note="manual reject">ไม่ผ่าน</button>
      </div>
    </article>
  `;
}

function renderLeads() {
  if (!leads.length) {
    leadList.innerHTML = `<article class="lead-card"><p>ยังไม่มีผู้สมัคร</p></article>`;
    return;
  }

  leadList.innerHTML = leads.map(renderLead).join("");
  leadList.querySelectorAll("[data-save]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.save;
      const card = button.closest(".lead-card");
      await updateLead(id, {
        status: card.querySelector("[name='status']").value,
        note: card.querySelector("[name='note']").value,
      });
    });
  });
}

function renderLead(lead) {
  const createdAt = formatDateTime(lead.createdAt);
  const note = lead.note ? escapeHtml(lead.note) : "-";
  const line = lead.lineId ? escapeHtml(lead.lineId) : "-";
  const email = lead.email ? escapeHtml(lead.email) : "-";
  const payment = lead.payment || {};
  const access = lead.access || {};

  return `
    <article class="lead-card ${lead.status === "payment-rejected" ? "lead-due" : ""}">
      <div>
        <div class="lead-title">
          <h3>${escapeHtml(lead.name)}</h3>
          <span class="status-pill">${statusLabels[lead.status] || lead.status}</span>
          <span class="priority-pill">${escapeHtml(payment.status || "unpaid")}</span>
        </div>
        <div class="lead-meta">
          <span>โทร: <a href="tel:${escapeHtml(lead.phone)}">${escapeHtml(lead.phone)}</a></span>
          <span>อีเมล: ${email}</span>
          <span>LINE: ${line}</span>
          <span>หลักสูตร: ${escapeHtml(lead.course)}</span>
          <span>สมัครเมื่อ: ${createdAt}</span>
          <span>Access: ${escapeHtml(access.code || "-")}</span>
          <span>ปลดล็อก: ${formatDateTime(access.unlockedAt)}</span>
          <span>Ref: ${escapeHtml(payment.reference || "-")}</span>
        </div>
        <p>${note}</p>
      </div>
      <div class="lead-actions">
        <select name="status">${Object.entries(statusLabels)
          .map(([value, label]) => `<option value="${value}" ${lead.status === value ? "selected" : ""}>${label}</option>`)
          .join("")}</select>
        <textarea name="note" rows="3" placeholder="บันทึกการดูแลเคส"></textarea>
        <button class="button primary" data-save="${lead.id}">บันทึกสถานะ</button>
      </div>
    </article>
  `;
}

async function updateLead(id, payload) {
  const result = await fetchJson(`/api/leads/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!result.ok) {
    alert(result.data.error || "บันทึกไม่สำเร็จ");
    return;
  }
  await loadLeads();
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function updateExportLink() {
  exportLink.href = `/api/leads.csv?token=${encodeURIComponent(token)}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[char];
  });
}

if (token) loadLeads();

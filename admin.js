const statusLabels = {
  new: "ใหม่",
  contacted: "ติดต่อแล้ว",
  trial: "นัดทดลองเรียน",
  enrolled: "ลงทะเบียนแล้ว",
  paid: "ชำระแล้ว",
  "not-fit": "ยังไม่เหมาะ",
  archived: "เก็บไว้ก่อน",
};

const priorityLabels = {
  hot: "ด่วน",
  warm: "สมัครซ้ำ",
  normal: "ปกติ",
  follow: "ต้องคัดกรอง",
  done: "จบงาน",
};

let token = localStorage.getItem("101future.adminToken") || "";
let leads = [];
let automationSummary = null;

const loginPanel = document.querySelector("#loginPanel");
const adminPanel = document.querySelector("#adminPanel");
const tokenInput = document.querySelector("#tokenInput");
const loginButton = document.querySelector("#loginButton");
const loginStatus = document.querySelector("#loginStatus");
const refreshButton = document.querySelector("#refreshButton");
const runAutomationButton = document.querySelector("#runAutomationButton");
const metricsEl = document.querySelector("#metrics");
const automationList = document.querySelector("#automationList");
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
runAutomationButton.addEventListener("click", runAutomation);

async function loadLeads() {
  loginStatus.textContent = "";

  const [leadResult, automationResult] = await Promise.all([
    fetchJson("/api/leads"),
    fetchJson("/api/automation"),
  ]);

  if (!leadResult.ok) {
    loginStatus.textContent = leadResult.data.error || "เข้าสู่ระบบไม่สำเร็จ";
    return;
  }

  leads = leadResult.data.leads.map(withAutomationFallback);
  automationSummary = automationResult.ok ? automationResult.data : buildClientAutomationSummary(leads);
  loginPanel.classList.add("hidden");
  adminPanel.classList.remove("hidden");
  renderMetrics();
  renderAutomation();
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
    ["ต้องตามวันนี้", automationSummary?.counts?.due || 0],
    ["ใหม่", counts.new || 0],
    ["ทดลองเรียน", counts.trial || 0],
    ["ลงทะเบียน", (counts.enrolled || 0) + (counts.paid || 0)],
  ];

  metricsEl.innerHTML = items
    .map(([label, value]) => `<article class="metric"><span>${label}</span><strong>${value}</strong></article>`)
    .join("");
}

function renderAutomation() {
  const due = automationSummary?.due || [];
  const upcoming = automationSummary?.upcoming || [];
  const items = [
    ...due.map((lead) => renderAutomationCard(lead, "due")),
    ...upcoming.slice(0, Math.max(0, 6 - due.length)).map((lead) => renderAutomationCard(lead, "upcoming")),
  ];

  automationList.innerHTML =
    items.join("") ||
    `<article class="automation-card empty-state">
      <strong>ไม่มีคิวค้าง</strong>
      <span>ระบบจะสร้างคิวอัตโนมัติเมื่อมีผู้สมัครใหม่</span>
    </article>`;
}

function renderAutomationCard(lead, mode) {
  const automation = lead.automation || {};
  const dueClass = mode === "due" ? "due" : "";
  const dueText = mode === "due" ? "ถึงเวลาตาม" : formatDateTime(automation.nextFollowUpAt);
  return `
    <article class="automation-card ${dueClass}">
      <div>
        <span class="mini-label">${dueText}</span>
        <strong>${escapeHtml(lead.name)}</strong>
        <p>${escapeHtml(automation.nextAction || "ไม่มีงานถัดไป")}</p>
      </div>
      <div class="automation-links">
        <a href="tel:${escapeHtml(lead.phone || "")}">โทร</a>
        <span>LINE: ${escapeHtml(lead.lineId || "-")}</span>
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
  const age = lead.ageGroup ? escapeHtml(lead.ageGroup) : "-";
  const schedule = lead.preferredSchedule ? escapeHtml(lead.preferredSchedule) : "-";
  const automation = lead.automation || {};
  const due = automationDueLabel(lead);
  const duplicate = Number(lead.duplicateCount || 0);

  return `
    <article class="lead-card ${isDue(lead) ? "lead-due" : ""}">
      <div>
        <div class="lead-title">
          <h3>${escapeHtml(lead.name)}</h3>
          <span class="status-pill">${statusLabels[lead.status] || lead.status}</span>
          <span class="priority-pill">${priorityLabels[automation.priority] || "ปกติ"}</span>
          ${duplicate ? `<span class="priority-pill warm">ส่งซ้ำ ${duplicate}</span>` : ""}
        </div>
        <div class="lead-meta">
          <span>โทร: <a href="tel:${escapeHtml(lead.phone)}">${escapeHtml(lead.phone)}</a></span>
          <span>LINE: ${line}</span>
          <span>หลักสูตร: ${escapeHtml(lead.course)}</span>
          <span>ระดับ: ${age}</span>
          <span>เวลา: ${schedule}</span>
          <span>สมัครเมื่อ: ${createdAt}</span>
          <span>งานถัดไป: ${escapeHtml(automation.nextAction || "-")}</span>
          <span>กำหนดตาม: ${due}</span>
        </div>
        <p>${note}</p>
      </div>
      <div class="lead-actions">
        <select name="status">${Object.entries(statusLabels)
          .map(([value, label]) => `<option value="${value}" ${lead.status === value ? "selected" : ""}>${label}</option>`)
          .join("")}</select>
        <textarea name="note" rows="3" placeholder="บันทึกการติดต่อ"></textarea>
        <button class="button primary" data-save="${lead.id}">บันทึกและตั้งคิวต่อ</button>
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

async function runAutomation() {
  runAutomationButton.disabled = true;
  try {
    const result = await fetchJson("/api/automation/run", { method: "POST" });
    if (!result.ok) throw new Error(result.data.error || "Run automation ไม่สำเร็จ");
    await loadLeads();
    loginStatus.textContent = `Automation ตรวจแล้ว แจ้งเตือน ${result.data.notified} รายการ`;
  } catch (error) {
    alert(error.message);
  } finally {
    runAutomationButton.disabled = false;
  }
}

function withAutomationFallback(lead) {
  if (lead.automation) return lead;
  return {
    ...lead,
    automation: {
      priority: "normal",
      nextAction: lead.status === "new" ? "โทรกลับหรือทัก LINE เพื่อคัดกรองความสนใจ" : "",
      nextFollowUpAt: "",
    },
  };
}

function buildClientAutomationSummary(items) {
  const due = items.filter(isDue);
  const upcoming = items.filter((lead) => {
    const time = Date.parse(lead.automation?.nextFollowUpAt || "");
    return Number.isFinite(time) && time > Date.now();
  });
  return { counts: { due: due.length, upcoming: upcoming.length }, due, upcoming };
}

function isDue(lead) {
  const time = Date.parse(lead.automation?.nextFollowUpAt || "");
  return Number.isFinite(time) && time <= Date.now();
}

function automationDueLabel(lead) {
  const value = lead.automation?.nextFollowUpAt;
  if (!value) return "-";
  return isDue(lead) ? "ถึงเวลาแล้ว" : formatDateTime(value);
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

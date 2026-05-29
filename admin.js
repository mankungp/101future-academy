const statusLabels = {
  new: "ใหม่",
  contacted: "ติดต่อแล้ว",
  trial: "นัดทดลองเรียน",
  enrolled: "ลงทะเบียนแล้ว",
  paid: "ชำระแล้ว",
  "not-fit": "ยังไม่เหมาะ",
  archived: "เก็บไว้ก่อน",
};

let token = localStorage.getItem("101future.adminToken") || "";
let leads = [];

const loginPanel = document.querySelector("#loginPanel");
const adminPanel = document.querySelector("#adminPanel");
const tokenInput = document.querySelector("#tokenInput");
const loginButton = document.querySelector("#loginButton");
const loginStatus = document.querySelector("#loginStatus");
const refreshButton = document.querySelector("#refreshButton");
const metricsEl = document.querySelector("#metrics");
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
  const response = await fetch("/api/leads", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();

  if (!response.ok) {
    loginStatus.textContent = data.error || "เข้าสู่ระบบไม่สำเร็จ";
    return;
  }

  leads = data.leads;
  loginPanel.classList.add("hidden");
  adminPanel.classList.remove("hidden");
  renderMetrics();
  renderLeads();
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
    ["ใหม่", counts.new || 0],
    ["ติดต่อแล้ว", counts.contacted || 0],
    ["ทดลองเรียน", counts.trial || 0],
    ["ลงทะเบียน", (counts.enrolled || 0) + (counts.paid || 0)],
  ];

  metricsEl.innerHTML = items
    .map(([label, value]) => `<article class="metric"><span>${label}</span><strong>${value}</strong></article>`)
    .join("");
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
  const createdAt = new Date(lead.createdAt).toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const note = lead.note ? escapeHtml(lead.note) : "-";
  const line = lead.lineId ? escapeHtml(lead.lineId) : "-";
  const age = lead.ageGroup ? escapeHtml(lead.ageGroup) : "-";
  const schedule = lead.preferredSchedule ? escapeHtml(lead.preferredSchedule) : "-";

  return `
    <article class="lead-card">
      <div>
        <div class="lead-title">
          <h3>${escapeHtml(lead.name)}</h3>
          <span class="status-pill">${statusLabels[lead.status] || lead.status}</span>
        </div>
        <div class="lead-meta">
          <span>โทร: ${escapeHtml(lead.phone)}</span>
          <span>LINE: ${line}</span>
          <span>หลักสูตร: ${escapeHtml(lead.course)}</span>
          <span>ระดับ: ${age}</span>
          <span>เวลา: ${schedule}</span>
          <span>สมัครเมื่อ: ${createdAt}</span>
        </div>
        <p>${note}</p>
      </div>
      <div class="lead-actions">
        <select name="status">${Object.entries(statusLabels)
          .map(([value, label]) => `<option value="${value}" ${lead.status === value ? "selected" : ""}>${label}</option>`)
          .join("")}</select>
        <textarea name="note" rows="3" placeholder="บันทึกการติดต่อ"></textarea>
        <button class="button primary" data-save="${lead.id}">บันทึกสถานะ</button>
      </div>
    </article>
  `;
}

async function updateLead(id, payload) {
  const response = await fetch(`/api/leads/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    alert(data.error || "บันทึกไม่สำเร็จ");
    return;
  }
  leads = leads.map((lead) => (lead.id === data.lead.id ? data.lead : lead));
  renderMetrics();
  renderLeads();
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

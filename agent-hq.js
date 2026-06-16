const tokenKey = "101future.adminToken";

let token = localStorage.getItem(tokenKey) || "";
let hq = null;

const loginPanel = document.querySelector("#loginPanel");
const dashboardPanel = document.querySelector("#dashboardPanel");
const tokenInput = document.querySelector("#tokenInput");
const loginButton = document.querySelector("#loginButton");
const loginStatus = document.querySelector("#loginStatus");
const refreshButton = document.querySelector("#refreshButton");
const planText = document.querySelector("#planText");
const lastSync = document.querySelector("#lastSync");
const roomState = document.querySelector("#roomState");
const metricGrid = document.querySelector("#metricGrid");
const orchestratorMode = document.querySelector("#orchestratorMode");
const nextActionList = document.querySelector("#nextActionList");
const workflowMap = document.querySelector("#workflowMap");
const routingMatrix = document.querySelector("#routingMatrix");
const agentCount = document.querySelector("#agentCount");
const agentList = document.querySelector("#agentList");
const projectGrid = document.querySelector("#projectGrid");
const taskBoard = document.querySelector("#taskBoard");
const approvalList = document.querySelector("#approvalList");
const openclawPanel = document.querySelector("#openclawPanel");
const updateList = document.querySelector("#updateList");

tokenInput.value = token;

loginButton.addEventListener("click", async () => {
  token = tokenInput.value.trim();
  localStorage.setItem(tokenKey, token);
  await loadHq();
});

refreshButton.addEventListener("click", loadHq);

if (token) {
  loadHq();
}

async function loadHq() {
  loginStatus.textContent = "";
  try {
    const response = await fetch("/api/agent-hq", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "เข้า Agent HQ ไม่สำเร็จ");
    }
    hq = data;
    loginPanel.classList.add("hidden");
    dashboardPanel.classList.remove("hidden");
    renderHq();
  } catch (error) {
    loginPanel.classList.remove("hidden");
    dashboardPanel.classList.add("hidden");
    loginStatus.textContent = error.message;
  }
}

function renderHq() {
  const plan = hq.room?.plan;
  planText.textContent = plan?.objective || "ยังไม่มีแผนกลางใน agent-room";
  lastSync.textContent = formatTime(hq.room?.updatedAt || hq.now);
  roomState.textContent = hq.room?.ok ? "agent-room online" : hq.room?.error || "agent-room offline";
  renderMetrics();
  renderOrchestrator();
  renderAgents();
  renderProjects();
  renderTasks();
  renderApprovals();
  renderOpenClaw();
  renderUpdates();
}

function renderOrchestrator() {
  const orchestrator = hq.orchestrator || {};
  orchestratorMode.textContent = orchestrator.mode || "human gated";
  nextActionList.innerHTML =
    (orchestrator.nextActions || [])
      .map(
        (item) => `
          <article class="agent-next-action priority-${escapeHtml(item.priority || "normal")}">
            <span>${escapeHtml(item.label || "Next")}</span>
            <strong>${escapeHtml(item.title || "")}</strong>
            <p>${escapeHtml(item.owner || "unassigned")} · ${escapeHtml(item.reason || "")}</p>
          </article>
        `,
      )
      .join("") || `<article><strong>ยังไม่มีงานถัดไป</strong><p>agent-room ยังไม่มี task ที่ต้อง route</p></article>`;

  workflowMap.innerHTML = (orchestrator.workflow || [])
    .map(
      (step, index) => `
        <article class="${step.active ? "is-active" : ""}">
          <span>${String(index + 1).padStart(2, "0")}</span>
          <strong>${escapeHtml(step.title)}</strong>
          <small>${escapeHtml(step.detail)}</small>
        </article>
      `,
    )
    .join("");

  routingMatrix.innerHTML = (orchestrator.routing || [])
    .map(
      (route) => `
        <article>
          <span>${escapeHtml(route.from)}</span>
          <strong>${escapeHtml(route.to)}</strong>
          <p>${escapeHtml(route.rule)}</p>
        </article>
      `,
    )
    .join("");
}

function renderMetrics() {
  const metrics = [
    ["Agents", hq.metrics.agents, "ready"],
    ["Open tasks", hq.metrics.openTasks, "active"],
    ["Doing", hq.metrics.doing, "working"],
    ["Review", hq.metrics.review, "check"],
    ["Blocked", hq.metrics.blocked, "risk"],
  ];
  metricGrid.innerHTML = metrics
    .map(
      ([label, value, tone]) => `
        <article class="agent-metric metric-${tone}">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
          <small>${escapeHtml(tone)}</small>
        </article>
      `,
    )
    .join("");
}

function renderAgents() {
  agentCount.textContent = `${hq.agents.length} agents`;
  agentList.innerHTML = hq.agents
    .map(
      (agent) => `
        <article class="agent-person ${statusClass(agent.status)}">
          <div class="agent-avatar">${initials(agent.name)}</div>
          <div>
            <strong>${escapeHtml(agent.name)}</strong>
            <span>${escapeHtml(agent.role)}</span>
            <small>${escapeHtml(agent.current)}</small>
          </div>
          <i>${escapeHtml(labelStatus(agent.status))}</i>
        </article>
      `,
    )
    .join("");
}

function renderProjects() {
  projectGrid.innerHTML = hq.projects
    .map(
      (project) => `
        <article class="agent-project ${statusClass(project.status)}">
          <div>
            <span>${escapeHtml(project.id)}</span>
            <strong>${escapeHtml(project.label)}</strong>
          </div>
          <div class="agent-progress" aria-label="${escapeHtml(project.progress)}%">
            <b style="width:${Number(project.progress) || 0}%"></b>
          </div>
          <p>${escapeHtml(project.focus)}</p>
        </article>
      `,
    )
    .join("");
}

function renderTasks() {
  const lanes = [
    ["doing", "กำลังทำ"],
    ["review", "รอตรวจ"],
    ["todo", "รอเริ่ม"],
  ];
  taskBoard.innerHTML = lanes
    .map(([status, label]) => {
      const tasks = hq.tasks.filter((task) => task.status === status).slice(0, 5);
      return `
        <section class="agent-task-lane">
          <h3>${escapeHtml(label)}</h3>
          ${
            tasks
              .map(
                (task) => `
                  <article>
                    <strong>${escapeHtml(task.title)}</strong>
                    <span>${escapeHtml(task.owner || "unassigned")}</span>
                  </article>
                `,
              )
              .join("") || `<p>ยังไม่มีงานในช่องนี้</p>`
          }
        </section>
      `;
    })
    .join("");
}

function renderApprovals() {
  approvalList.innerHTML = hq.approvals
    .map(
      (item) => `
        <article class="agent-approval ${item.risk === "high" ? "is-high" : ""}">
          <span>${escapeHtml(item.risk === "high" ? "high risk" : "review")}</span>
          <strong>${escapeHtml(item.title)}</strong>
          <p>${escapeHtml(item.note)} · ${escapeHtml(item.owner || "System")}</p>
        </article>
      `,
    )
    .join("");
}

function renderOpenClaw() {
  const rows = [
    ["Gateway", hq.openclaw.gateway],
    ["Notify", hq.openclaw.notify],
    ["Bridge", hq.openclaw.bridge],
    ["Guardrail", hq.openclaw.guardrail],
  ];
  openclawPanel.innerHTML = rows
    .map(
      ([label, value]) => `
        <article>
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
        </article>
      `,
    )
    .join("");
}

function renderUpdates() {
  updateList.innerHTML =
    hq.recent
      .map(
        (item) => `
          <article>
            <time>${escapeHtml(formatDateTime(item.at))}</time>
            <strong>${escapeHtml(item.from || "agent")} · ${escapeHtml(item.kind || "note")}</strong>
            <p>${escapeHtml(item.text || item.task || "")}</p>
          </article>
        `,
      )
      .join("") || `<article><strong>ยังไม่มี event</strong><p>agent-room ยังว่างอยู่</p></article>`;
}

function statusClass(status) {
  return `status-${String(status || "standby").replace(/[^a-z0-9-]/gi, "-")}`;
}

function labelStatus(status) {
  return (
    {
      doing: "working",
      review: "review",
      todo: "queued",
      active: "active",
      blocked: "blocked",
      standby: "standby",
      planning: "planning",
      working: "working",
    }[status] || status
  );
}

function initials(name) {
  return String(name || "A")
    .split(/[\s/]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("th-TH", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const form = document.querySelector("#leadForm");
const statusEl = document.querySelector("#formStatus");
const packageGrid = document.querySelector("#packageGrid");
const packageSelect = document.querySelector("#packageSelect");
const orderPanel = document.querySelector("#orderPanel");
const orderIntro = document.querySelector("#orderIntro");
const orderStatusEl = document.querySelector("#orderStatus");
const qrBox = document.querySelector("#qrBox");
const refreshOrderButton = document.querySelector("#refreshOrderButton");

let packages = [];
let currentOrder = null;
let currentEnrollment = null;

loadPackages();

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = form.querySelector("button[type='submit']");
  const payload = Object.fromEntries(new FormData(form).entries());

  statusEl.textContent = "";
  statusEl.classList.remove("error");
  submit.disabled = true;

  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "สร้างรายการสมัครไม่สำเร็จ");

    currentOrder = data.order;
    currentEnrollment = data.enrollment;
    showOrder(data.order, data.enrollment, data.payment);
  } catch (error) {
    statusEl.textContent = error.message;
    statusEl.classList.add("error");
  } finally {
    submit.disabled = false;
  }
});

refreshOrderButton.addEventListener("click", refreshOrderStatus);

async function loadPackages() {
  const response = await fetch("/api/packages");
  const data = await response.json();
  packages = data.packages || [];
  packageGrid.innerHTML = packages.map(renderPackage).join("");
  packageSelect.innerHTML =
    `<option value="">เลือกแพ็กเรียน</option>` +
    packages.map((item) => `<option value="${item.id}">${escapeHtml(item.name)} - ${money(item.price)}</option>`).join("");

  packageGrid.querySelectorAll("[data-package]").forEach((button) => {
    button.addEventListener("click", () => {
      packageSelect.value = button.dataset.package;
      document.querySelector("#apply").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function renderPackage(item) {
  return `
    <article class="program">
      <span class="program-tag">${escapeHtml(item.level)}</span>
      <h3>${escapeHtml(item.name)}</h3>
      <p>${escapeHtml(item.description)}</p>
      <strong class="price-line">${money(item.price)} / ${item.durationDays} วัน</strong>
      <button class="text-button" data-package="${item.id}">สมัครแพ็กนี้</button>
    </article>
  `;
}

function showOrder(order, enrollment, payment) {
  orderPanel.classList.remove("hidden");
  orderIntro.innerHTML = `
    เลขสมัคร <strong>${escapeHtml(order.id)}</strong>
    ยอดชำระ <strong>${money(order.amount)}</strong>
    สำหรับ <strong>${escapeHtml(enrollment.name)}</strong>
  `;

  if (order.qrImageUrl) {
    qrBox.innerHTML = `<img class="qr-image" src="${escapeHtml(order.qrImageUrl)}" alt="KBank Thai QR" />`;
  } else if (order.qrPayload) {
    qrBox.innerHTML = `<pre>${escapeHtml(order.qrPayload)}</pre>`;
  } else {
    qrBox.innerHTML = `<p>${escapeHtml(payment?.message || order.paymentStatusMessage || "ยังไม่ได้เปิดระบบสร้าง QR ชำระเงินอัตโนมัติ")}</p>`;
  }

  if (order.payerType === "parent_link" && order.paymentLink) {
    qrBox.innerHTML += `
      <div class="share-link">
        <strong>ลิงก์สำหรับส่งให้ผู้ปกครองชำระเงิน</strong>
        <input readonly value="${escapeHtml(order.paymentLink)}" />
        <button class="button secondary" type="button" data-copy-link="${escapeHtml(order.paymentLink)}">คัดลอกลิงก์</button>
      </div>
    `;
    qrBox.querySelector("[data-copy-link]")?.addEventListener("click", async (event) => {
      await navigator.clipboard?.writeText(event.currentTarget.dataset.copyLink || "");
      orderStatusEl.textContent = "คัดลอกลิงก์สำหรับผู้ปกครองแล้ว";
    });
  }

  orderStatusEl.textContent = order.status === "paid" ? "ชำระเงินแล้ว เข้าเรียนได้" : "หลังชำระเงิน ระบบจะตรวจยอดและเปิดบทเรียนให้ 30 วัน";
  statusEl.textContent = `สร้างรายการสมัครแล้ว: ${order.id}`;
  orderPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function refreshOrderStatus() {
  if (!currentOrder?.id) return;
  orderStatusEl.textContent = "กำลังเช็คสถานะ...";
  orderStatusEl.classList.remove("error");

  try {
    const phone = form.elements.phone.value || "";
    const response = await fetch(`/api/orders/${encodeURIComponent(currentOrder.id)}?phone=${encodeURIComponent(phone)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "เช็กสถานะไม่สำเร็จ");
    currentOrder = data.order;
    currentEnrollment = data.enrollment;
    if (data.order.status === "paid" && data.enrollment?.accessActive) {
      orderStatusEl.innerHTML = `ชำระแล้ว เปิดบทเรียนถึง ${formatDate(data.enrollment.accessExpiresAt)} <a href="/learn">เข้าเรียน</a>`;
    } else {
      orderStatusEl.textContent = `สถานะล่าสุด: ${statusLabel(data.order.status)}`;
    }
  } catch (error) {
    orderStatusEl.textContent = error.message;
    orderStatusEl.classList.add("error");
  }
}

function statusLabel(status) {
  return {
    pending: "รอชำระเงิน",
    paid: "ชำระเงินแล้ว",
    "amount-mismatch": "ยอดชำระไม่ตรง รอตรวจสอบ",
  }[status] || status;
}

function money(value) {
  return Number(value || 0).toLocaleString("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  });
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("th-TH", { dateStyle: "medium" });
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

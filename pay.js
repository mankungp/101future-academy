const payStatus = document.querySelector("#payStatus");
const payQrBox = document.querySelector("#payQrBox");

const params = new URLSearchParams(location.search);
const orderId = params.get("order") || "";

loadOrder();

async function loadOrder() {
  if (!orderId) {
    payStatus.textContent = "ไม่พบเลขรายการชำระเงิน";
    return;
  }
  try {
    const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "โหลดรายการไม่สำเร็จ");

    payStatus.innerHTML = `
      <span class="mini-label">${escapeHtml(orderStatusText(data.order.status))}</span>
      <strong>${escapeHtml(data.order.packageName)}</strong>
      <span>เลขรายการ ${escapeHtml(data.order.id)}</span>
      <span>ชื่อบัญชี ${escapeHtml(data.enrollment?.name || "-")}</span>
      <span>ยอดชำระ <strong>${money(data.order.amount)}</strong></span>
    `;

    if (data.order.status === "paid") {
      payQrBox.innerHTML = `
        <div class="selected-package">
          <strong>ชำระเงินแล้ว</strong>
          <p>สิทธิ์เรียนถูกเปิดแล้ว กลับไปหน้าเข้าเรียนเพื่อตรวจสอบบทเรียนได้</p>
          <a class="button primary" href="/learn">ไปหน้าเข้าเรียน</a>
        </div>
      `;
      return;
    }
    if (data.order.qrImageUrl) {
      payQrBox.innerHTML = `
        <img class="qr-image" src="${escapeHtml(data.order.qrImageUrl)}" alt="Thai QR payment" />
        <p>หลังชำระเงิน ระบบจะตรวจสอบและเปิดสิทธิ์เรียนให้อัตโนมัติ</p>
      `;
    } else if (data.order.qrPayload) {
      payQrBox.innerHTML = `<pre>${escapeHtml(data.order.qrPayload)}</pre>`;
    } else {
      payQrBox.innerHTML = `
        <div class="selected-package">
          <strong>ยังไม่เปิดชำระเงิน</strong>
          <p>${escapeHtml(data.order.paymentStatusMessage || "ระบบ KBank อยู่ระหว่างรอพร้อมใช้งาน รายการนี้ถูกเตรียมไว้แล้ว")}</p>
          <a class="button secondary" href="/learn">กลับไปดูสถานะบัญชี</a>
        </div>
      `;
    }
  } catch (error) {
    payStatus.textContent = error.message;
  }
}

function orderStatusText(status) {
  return status === "paid" ? "ชำระเงินแล้ว" : "รอชำระเงิน";
}

function money(value) {
  return `${Number(value || 0).toLocaleString("th-TH", { maximumFractionDigits: 0 })} บาท`;
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

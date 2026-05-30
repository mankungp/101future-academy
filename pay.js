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
      รายการ <strong>${escapeHtml(data.order.id)}</strong><br />
      แพ็ก <strong>${escapeHtml(data.order.packageName)}</strong><br />
      นักเรียน <strong>${escapeHtml(data.enrollment?.name || "-")}</strong><br />
      ยอดชำระ <strong>${money(data.order.amount)}</strong>
    `;

    if (data.order.status === "paid") {
      payQrBox.innerHTML = `<p>รายการนี้ชำระแล้ว นักเรียนเข้าเรียนได้ทันที</p>`;
      return;
    }
    if (data.order.qrImageUrl) {
      payQrBox.innerHTML = `<img class="qr-image" src="${escapeHtml(data.order.qrImageUrl)}" alt="Thai QR payment" />`;
    } else if (data.order.qrPayload) {
      payQrBox.innerHTML = `<pre>${escapeHtml(data.order.qrPayload)}</pre>`;
    } else {
      payQrBox.innerHTML = `<p>${escapeHtml(data.order.paymentStatusMessage || "ระบบกำลังรอเปิด QR ชำระเงิน")}</p>`;
    }
  } catch (error) {
    payStatus.textContent = error.message;
  }
}

function money(value) {
  return Number(value || 0).toLocaleString("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  });
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

const form = document.querySelector("#leadForm");
const paymentForm = document.querySelector("#paymentForm");
const statusEl = document.querySelector("#formStatus");
const paymentStatusEl = document.querySelector("#paymentStatus");
const paymentPanel = document.querySelector("#paymentPanel");
const paymentIntro = document.querySelector("#paymentIntro");
const courseSelect = document.querySelector("#courseSelect");

let currentEnrollment = null;

document.querySelectorAll("[data-course]").forEach((button) => {
  button.addEventListener("click", () => {
    courseSelect.value = button.dataset.course;
    document.querySelector("#apply").scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = form.querySelector("button[type='submit']");
  const payload = Object.fromEntries(new FormData(form).entries());

  statusEl.textContent = "";
  statusEl.classList.remove("error");
  submit.disabled = true;

  try {
    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "สมัครไม่สำเร็จ");

    currentEnrollment = data.lead;
    form.reset();
    showPaymentStep(data.lead, data.duplicate, payload.phone);
  } catch (error) {
    statusEl.textContent = error.message;
    statusEl.classList.add("error");
  } finally {
    submit.disabled = false;
  }
});

paymentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = paymentForm.querySelector("button[type='submit']");
  const formData = new FormData(paymentForm);
  const file = formData.get("slipImage");

  paymentStatusEl.textContent = "";
  paymentStatusEl.classList.remove("error");
  submit.disabled = true;

  try {
    if (!currentEnrollment?.id) throw new Error("กรุณาสมัครก่อนแนบสลิป");
    if (!file || !file.size) throw new Error("กรุณาเลือกรูปสลิป");

    const slipImageBase64 = await fileToBase64(file);
    const payload = {
      phone: formData.get("phone"),
      payerName: formData.get("payerName"),
      paymentNote: formData.get("paymentNote"),
      slipImageBase64,
    };

    const response = await fetch(`/api/enrollments/${encodeURIComponent(currentEnrollment.id)}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "ตรวจสลิปไม่สำเร็จ");

    currentEnrollment = data.lead;
    paymentStatusEl.innerHTML = `ตรวจสลิปผ่าน เปิดบทเรียนแล้ว <a href="/learn">เข้าเรียน</a>`;
  } catch (error) {
    paymentStatusEl.textContent = error.message;
    paymentStatusEl.classList.add("error");
  } finally {
    submit.disabled = false;
  }
});

function showPaymentStep(lead, duplicate, phone) {
  paymentPanel.classList.remove("hidden");
  paymentForm.elements.enrollmentId.value = lead.id;
  paymentForm.elements.phone.value = phone || "";
  paymentIntro.innerHTML = `
    ${duplicate ? "พบใบสมัครเดิมและอัปเดตข้อมูลให้แล้ว" : "สมัครสำเร็จ"}
    เลขสมัคร <strong>${escapeHtml(lead.id)}</strong>
    access code <strong>${escapeHtml(lead.accessCode)}</strong>
    เมื่อสลิปผ่านแล้วใช้สองค่านี้เข้าเรียนที่ <a href="/learn">/learn</a>
  `;
  statusEl.textContent = "ขั้นต่อไป: แนบรูปสลิป ระบบจะตรวจและเปิดบทเรียนให้อัตโนมัติ";
  paymentPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("อ่านไฟล์สลิปไม่สำเร็จ"));
    reader.readAsDataURL(file);
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

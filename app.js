const form = document.querySelector("#leadForm");
const statusEl = document.querySelector("#formStatus");
const courseSelect = document.querySelector("#courseSelect");

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
    if (!response.ok) throw new Error(data.error || "ส่งใบสมัครไม่สำเร็จ");

    form.reset();
    statusEl.textContent = data.duplicate
      ? `มีข้อมูลอยู่แล้ว ระบบอัปเดตคิวติดตามให้ รหัส ${data.lead.id}`
      : `รับใบสมัครแล้ว รหัส ${data.lead.id}`;
  } catch (error) {
    statusEl.textContent = error.message;
    statusEl.classList.add("error");
  } finally {
    submit.disabled = false;
  }
});

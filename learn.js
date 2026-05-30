const accessForm = document.querySelector("#accessForm");
const accessStatus = document.querySelector("#accessStatus");
const lessonPanel = document.querySelector("#lessonPanel");
const lessonList = document.querySelector("#lessonList");
const courseTitle = document.querySelector("#courseTitle");
const expiryText = document.querySelector("#expiryText");
const lineStatus = document.querySelector("#lineStatus");
const lineLoginButton = document.querySelector("#lineLoginButton");
const profileForm = document.querySelector("#profileForm");
const logoutButton = document.querySelector("#logoutButton");
const selectedPackageBox = document.querySelector("#selectedPackageBox");
const accountSummary = document.querySelector("#accountSummary");
const interestSummary = document.querySelector("#interestSummary");
const accessSummary = document.querySelector("#accessSummary");
const interestPanel = document.querySelector("#interestPanel");
const interestList = document.querySelector("#interestList");
const englishExercise = document.querySelector("#englishExercise");
const englishExerciseStatus = document.querySelector("#englishExerciseStatus");
const englishResult = document.querySelector("#englishResult");

const params = new URLSearchParams(location.search);
const selectedPackageId = params.get("package") || "";
let selectedPackageItem = null;
let currentAccount = null;

showAuthMessage();
loadSelectedPackage();
loadLineAccount();

accessForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = accessForm.querySelector("button[type='submit']");
  const payload = Object.fromEntries(new FormData(accessForm).entries());

  accessStatus.textContent = "";
  accessStatus.classList.remove("error");
  lessonPanel.classList.add("hidden");
  submit.disabled = true;

  try {
    const response = await fetch("/api/access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || data.error || "ยังไม่สามารถเข้าเรียนได้");

    courseTitle.textContent = `${data.enrollment.course} ของ ${data.enrollment.name}`;
    expiryText.textContent = `สิทธิ์เรียนถึง ${formatDate(data.enrollment.expiresAt)}`;
    lessonList.innerHTML = data.lessons.map(renderLesson).join("");
    lessonPanel.classList.remove("hidden");
    accessStatus.textContent = "เปิดบทเรียนแล้ว";
  } catch (error) {
    accessStatus.textContent = error.message;
    accessStatus.classList.add("error");
  } finally {
    submit.disabled = false;
  }
});

profileForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(profileForm).entries());
  const response = await fetch("/api/auth/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    lineStatus.textContent = data.error || "บันทึกข้อมูลบัญชีไม่สำเร็จ";
    return;
  }
  lineStatus.textContent = `บันทึกแล้ว: ${data.account.displayName || "บัญชี LINE"}`;
  await loadMyEnrollments();
});

logoutButton?.addEventListener("click", async () => {
  await fetch("/api/auth/logout", { method: "POST" });
  location.reload();
});

englishExercise?.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(englishExercise);
  const answers = ["q1", "q2", "q3"].map((key) => formData.get(key));
  if (answers.some((answer) => !answer)) {
    englishExerciseStatus.textContent = "กรุณาตอบให้ครบ 3 ข้อก่อนดูสรุปผล";
    englishExerciseStatus.classList.add("error");
    return;
  }

  const score = answers.filter((answer) => answer === "correct").length;
  englishExerciseStatus.textContent = "";
  englishExerciseStatus.classList.remove("error");
  renderEnglishResult(score);
});

async function loadLineAccount() {
  try {
    const response = await fetch("/api/auth/me");
    const data = await response.json();
    if (!data.lineConfigured) {
      lineStatus.textContent = "การเข้าสู่ระบบด้วย LINE ยังไม่พร้อมใช้งาน";
      accountSummary.textContent = "LINE ยังไม่พร้อม";
      lineLoginButton?.classList.add("hidden");
      return;
    }
    if (!data.account) {
      currentAccount = null;
      accountSummary.textContent = "ยังไม่ได้เข้าสู่ระบบ";
      interestSummary.textContent = selectedPackageItem ? "รอบันทึกหลังเข้าสู่ระบบ" : "-";
      accessSummary.textContent = "ยังไม่มีสิทธิ์เรียน";
      if (!lineStatus.dataset.authMessage) {
        lineStatus.textContent = "เข้าสู่ระบบด้วย LINE เพื่อดูแพ็กและสิทธิ์เรียน";
      }
      renderSelectedPackage("login-required");
      lineLoginButton?.classList.remove("hidden");
      return;
    }
    currentAccount = data.account;
    accountSummary.textContent = data.account.displayName || "บัญชี LINE";
    renderMyInterests(data.account.interests || []);
    lineLoginButton?.classList.add("hidden");
    logoutButton?.classList.remove("hidden");
    profileForm?.classList.remove("hidden");
    profileForm.elements.role.value = data.account.role || "student";
    profileForm.elements.phone.value = data.account.phone || "";
    profileForm.elements.email.value = data.account.email || "";
    lineStatus.textContent = `เข้าสู่ระบบแล้ว: ${data.account.displayName || "บัญชี LINE"} หน้านี้ใช้ติดตามแพ็กที่สนใจและสิทธิ์เรียนของคุณ`;
    await saveSelectedInterest();
    await loadMyEnrollments();
  } catch (error) {
    lineStatus.textContent = error.message || "ตรวจสอบการเข้าสู่ระบบ LINE ไม่สำเร็จ";
  }
}

async function loadSelectedPackage() {
  if (!selectedPackageBox || !selectedPackageId) return;
  try {
    const response = await fetch("/api/packages");
    const data = await response.json();
    const item = (data.packages || []).find((pkg) => pkg.id === selectedPackageId);
    if (!item) return;
    selectedPackageItem = item;
    if (currentAccount) {
      await saveSelectedInterest();
    } else {
      renderSelectedPackage("login-required");
    }
  } catch {
    selectedPackageBox?.classList.add("hidden");
  }
}

function renderSelectedPackage(state = "login-required", message = "") {
  if (!selectedPackageBox || !selectedPackageItem) return;
  const stateText = {
    "login-required": "เข้าสู่ระบบด้วย LINE เพื่อบันทึกแพ็กนี้ไว้ในบัญชี",
    saving: "กำลังบันทึกแพ็กที่สนใจ...",
    saved: "บันทึกแพ็กที่สนใจแล้ว ทีมงานจะเห็นรายการนี้ในระบบหลังบ้าน",
    error: message || "บันทึกแพ็กที่สนใจไม่สำเร็จ กรุณาลองใหม่",
  }[state];
  selectedPackageBox.classList.remove("hidden");
  selectedPackageBox.innerHTML = `
    <span class="mini-label">แพ็กที่สนใจ</span>
    <strong>${escapeHtml(selectedPackageItem.name)} · ${money(selectedPackageItem.price)} / ${selectedPackageItem.durationDays} วัน</strong>
    <p>${escapeHtml(stateText)}</p>
  `;
}

async function saveSelectedInterest() {
  if (!selectedPackageId || !selectedPackageItem || !currentAccount) return;
  renderSelectedPackage("saving");
  try {
    const response = await fetch("/api/me/interests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageId: selectedPackageId }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "บันทึกแพ็กที่สนใจไม่สำเร็จ");
    currentAccount = data.account || currentAccount;
    renderSelectedPackage("saved");
  } catch (error) {
    renderSelectedPackage("error", error.message);
  }
}

function showAuthMessage() {
  if (!lineStatus) return;
  const auth = params.get("auth") || "";
  const messages = {
    "line-not-configured": "การเข้าสู่ระบบด้วย LINE ยังไม่พร้อมใช้งาน",
    "line-error": "เข้าสู่ระบบ LINE ไม่สำเร็จ กรุณาลองใหม่",
    "line-expired": "เวลาล็อกอินหมดอายุ กรุณาเข้าสู่ระบบด้วย LINE ใหม่",
    "line-token-error": "LINE ยืนยันตัวตนไม่สำเร็จ กรุณาลองใหม่",
    "line-profile-error": "อ่านข้อมูลโปรไฟล์ LINE ไม่สำเร็จ กรุณาลองใหม่",
  };
  if (messages[auth]) {
    lineStatus.textContent = messages[auth];
    lineStatus.dataset.authMessage = "true";
  }
}

async function loadMyEnrollments() {
  const response = await fetch("/api/me/enrollments");
  const data = await response.json();
  if (!response.ok) return;
  const active = (data.enrollments || []).find((item) => item.accessActive);
  const pending = (data.enrollments || []).find((item) => !item.accessActive);
  if (!active) {
    accessSummary.textContent = pending ? statusLabel(pending.status, pending.paymentStatus) : "ยังไม่มีสิทธิ์เรียน";
    return;
  }
  accessSummary.textContent = `${active.course} ถึง ${formatDate(active.accessExpiresAt)}`;
  courseTitle.textContent = `${active.course} ของ ${active.name}`;
  expiryText.textContent = `สิทธิ์เรียนถึง ${formatDate(active.accessExpiresAt)}`;
  lessonList.innerHTML = (active.lessons || []).map(renderLesson).join("");
  lessonPanel.classList.remove("hidden");
  accessStatus.textContent = "เปิดบทเรียนจากบัญชี LINE แล้ว";
}

function renderMyInterests(interests = []) {
  if (!interestPanel || !interestList) return;
  const list = interests.filter((item) => item.packageName);
  interestSummary.textContent = list.length ? `${list.length} แพ็ก` : "ยังไม่มี";
  if (!list.length) {
    interestPanel.classList.add("hidden");
    return;
  }
  interestPanel.classList.remove("hidden");
  interestList.innerHTML = list.map(renderInterest).join("");
}

function renderInterest(item) {
  return `
    <article class="lesson-card">
      <span class="mini-label">${escapeHtml(interestStatusLabel(item.status))}</span>
      <h3>${escapeHtml(item.packageName)}</h3>
      <p>${money(item.price)} / ${item.durationDays || 30} วัน · ${escapeHtml(item.level || "ป.1-ป.6")}</p>
      <p>${escapeHtml(interestNextText(item))}</p>
      ${item.lastOrderId ? `<a class="button primary" href="/pay?order=${encodeURIComponent(item.lastOrderId)}">ดูหน้าชำระเงิน</a>` : `<a class="button secondary" href="/#packages">ดูแพ็กเรียน</a>`}
    </article>
  `;
}

function interestStatusLabel(status) {
  return {
    interested: "ลงชื่อสนใจแล้ว",
    payment_ready: "มีรายการชำระแล้ว",
    paid: "เปิดสิทธิ์แล้ว",
  }[status] || "ลงชื่อสนใจแล้ว";
}

function interestNextText(item) {
  if (item.status === "paid") return "แพ็กนี้เปิดสิทธิ์เรียนแล้ว กลับมาดูบทเรียนได้ในหน้านี้";
  if (item.lastOrderId || item.status === "payment_ready") return "ทีมงานเตรียมรายการชำระเงินแล้ว สามารถเปิดหน้าชำระเงินเพื่อตรวจสอบได้";
  return "บันทึกไว้แล้ว ระหว่างรอระบบชำระเงินพร้อมใช้งาน";
}

function statusLabel(status, paymentStatus) {
  if (status === "pending-payment") return "รอชำระเงิน";
  if (status === "payment-review") return "รอตรวจสอบการชำระเงิน";
  if (status === "payment-rejected") return "การชำระเงินยังไม่ผ่าน";
  if (paymentStatus === "approved") return "รอเปิดสิทธิ์เรียน";
  return "ยังไม่มีสิทธิ์เรียน";
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("th-TH", { dateStyle: "medium" });
}

function money(value) {
  return `${Number(value || 0).toLocaleString("th-TH", { maximumFractionDigits: 0 })} บาท`;
}

function renderLesson(lesson, index) {
  return `
    <article class="lesson-card">
      <span class="mini-label">Lesson ${index + 1} · ${escapeHtml(lesson.duration)}</span>
      <h3>${escapeHtml(lesson.title)}</h3>
      <p>${escapeHtml(lesson.summary)}</p>
      <a class="button secondary" href="#englishPreview">${lesson.title.includes("Daily") || lesson.title.includes("คำศัพท์") ? "ดูบทเรียนตัวอย่าง" : "ดูโครงบทเรียน"}</a>
    </article>
  `;
}

function renderEnglishResult(score) {
  if (!englishResult) return;
  const level = score === 3 ? "เข้าใจบทเรียนดี" : score === 2 ? "เข้าใจเกือบครบ" : "ควรทบทวนเพิ่ม";
  const next = score === 3
    ? "ลองฝึกแต่งประโยคเพิ่ม เช่น I have a red pencil."
    : score === 2
      ? "กลับไปดูคำศัพท์และสีของสิ่งของอีกครั้ง แล้วลองตอบใหม่"
      : "เริ่มจากจำคำศัพท์ book, pencil, ruler แล้วอ่านเรื่องสั้นซ้ำอีก 1 รอบ";
  englishResult.classList.remove("hidden");
  englishResult.innerHTML = `
    <span class="mini-label">สรุปผลหลังเรียน</span>
    <h3>${score}/3 · ${escapeHtml(level)}</h3>
    <p>${escapeHtml(next)}</p>
    <div class="result-tags">
      <span>Vocabulary</span>
      <span>Reading</span>
      <span>Simple sentence</span>
    </div>
  `;
  englishResult.scrollIntoView({ behavior: "smooth", block: "nearest" });
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

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

async function loadLineAccount() {
  try {
    const response = await fetch("/api/auth/me");
    const data = await response.json();
    if (!data.lineConfigured) {
      lineStatus.textContent = "การเข้าสู่ระบบด้วย LINE ยังไม่พร้อมใช้งาน";
      lineLoginButton?.classList.add("hidden");
      return;
    }
    if (!data.account) {
      currentAccount = null;
      if (!lineStatus.dataset.authMessage) {
        lineStatus.textContent = "เข้าสู่ระบบด้วย LINE เพื่อดูแพ็กที่สนใจและสิทธิ์เรียน";
      }
      renderSelectedPackage("login-required");
      lineLoginButton?.classList.remove("hidden");
      return;
    }
    currentAccount = data.account;
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
  if (!active) return;
  courseTitle.textContent = `${active.course} ของ ${active.name}`;
  expiryText.textContent = `สิทธิ์เรียนถึง ${formatDate(active.accessExpiresAt)}`;
  lessonList.innerHTML = (active.lessons || []).map(renderLesson).join("");
  lessonPanel.classList.remove("hidden");
  accessStatus.textContent = "เปิดบทเรียนจากบัญชี LINE แล้ว";
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
      <button class="button secondary" type="button">เริ่มเรียน</button>
    </article>
  `;
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

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

loadLineAccount();

accessForm.addEventListener("submit", async (event) => {
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
      lineStatus.textContent = "LINE Login ยังไม่ได้เปิดใช้งานบนระบบนี้";
      lineLoginButton?.classList.add("hidden");
      return;
    }
    if (!data.account) {
      lineStatus.textContent = "เข้าสู่ระบบด้วย LINE เพื่อดูสิทธิ์เรียนที่ผูกกับบัญชี";
      lineLoginButton?.classList.remove("hidden");
      return;
    }
    lineLoginButton?.classList.add("hidden");
    logoutButton?.classList.remove("hidden");
    profileForm?.classList.remove("hidden");
    profileForm.elements.role.value = data.account.role || "student";
    profileForm.elements.phone.value = data.account.phone || "";
    profileForm.elements.email.value = data.account.email || "";
    lineStatus.textContent = `เข้าสู่ระบบแล้ว: ${data.account.displayName || "บัญชี LINE"}`;
    await loadMyEnrollments();
  } catch (error) {
    lineStatus.textContent = error.message || "ตรวจสอบ LINE Login ไม่สำเร็จ";
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

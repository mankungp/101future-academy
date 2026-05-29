const accessForm = document.querySelector("#accessForm");
const accessStatus = document.querySelector("#accessStatus");
const lessonPanel = document.querySelector("#lessonPanel");
const lessonList = document.querySelector("#lessonList");
const courseTitle = document.querySelector("#courseTitle");
const expiryText = document.querySelector("#expiryText");

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

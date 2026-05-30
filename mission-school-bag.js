const missionItems = [
  { word: "book", thai: "หนังสือ" },
  { word: "pencil", thai: "ดินสอ" },
  { word: "ruler", thai: "ไม้บรรทัด" },
  { word: "eraser", thai: "ยางลบ" },
];

const promptText = document.querySelector("#missionPromptText");
const stars = document.querySelector("#missionStars");
const itemsBox = document.querySelector("#missionItems");
const bag = document.querySelector("#missionBag");
const packedItems = document.querySelector("#packedItems");
const feedback = document.querySelector("#missionFeedback");
const completeBox = document.querySelector("#missionComplete");
const soundButton = document.querySelector("#missionSoundButton");
const resetRequested = new URLSearchParams(window.location.search).get("reset") === "1";

let currentIndex = Number(localStorage.getItem("101future.schoolBagMission.index") || 0);
let score = Number(localStorage.getItem("101future.schoolBagMission.score") || 0);
let draggedWord = "";

if (resetRequested) {
  localStorage.removeItem("101future.schoolBagMission.index");
  localStorage.removeItem("101future.schoolBagMission.score");
  localStorage.removeItem("101future.schoolBagMission.completedAt");
  currentIndex = 0;
  score = 0;
}

if (currentIndex >= missionItems.length) {
  currentIndex = 0;
  score = 0;
  saveProgress();
}

restorePackedItems();
renderMission();

soundButton?.addEventListener("click", () => {
  speakPrompt();
});

itemsBox?.querySelectorAll(".mission-item").forEach((item) => {
  item.addEventListener("click", () => chooseItem(item.dataset.word || "", item));
  item.addEventListener("dragstart", (event) => {
    draggedWord = item.dataset.word || "";
    event.dataTransfer?.setData("text/plain", draggedWord);
  });
});

bag?.addEventListener("dragover", (event) => {
  event.preventDefault();
  bag.classList.add("bag-ready");
});

bag?.addEventListener("dragleave", () => {
  bag.classList.remove("bag-ready");
});

bag?.addEventListener("drop", (event) => {
  event.preventDefault();
  bag.classList.remove("bag-ready");
  const word = event.dataTransfer?.getData("text/plain") || draggedWord;
  const item = [...(itemsBox?.querySelectorAll(".mission-item") || [])].find((node) => node.dataset.word === word);
  chooseItem(word, item);
});

function currentTarget() {
  return missionItems[currentIndex] || missionItems[0];
}

function renderMission() {
  const target = currentTarget();
  promptText.textContent = `Tap the ${target.word}.`;
  stars.textContent = `${score}/${missionItems.length}`;
  feedback.textContent = `โจทย์คือ ${target.word} (${target.thai})`;
  itemsBox?.querySelectorAll(".mission-item").forEach((item) => {
    const packed = Number(item.dataset.packed || 0) === 1;
    item.disabled = packed;
    item.classList.toggle("target-hint", item.dataset.word === target.word && !packed);
  });
}

function chooseItem(word, item) {
  if (!word || !item || currentIndex >= missionItems.length) return;

  const target = currentTarget();
  if (word !== target.word) {
    const selected = missionItems.find((entry) => entry.word === word) || { word, thai: item.dataset.thai || "" };
    item.classList.remove("wrong");
    void item.offsetWidth;
    item.classList.add("wrong");
    feedback.innerHTML = `
      <strong>อันนี้คือ ${escapeHtml(selected.word)} (${escapeHtml(selected.thai)})</strong>
      <span>แต่โจทย์ถามหา ${escapeHtml(target.word)} (${escapeHtml(target.thai)}) ลองแตะคำว่า ${escapeHtml(target.word)} อีกครั้ง</span>
    `;
    highlightTarget(target.word);
    speakText(selected.word);
    return;
  }

  item.classList.remove("correct");
  void item.offsetWidth;
  item.classList.add("correct");
  item.dataset.packed = "1";
  item.disabled = true;
  addPackedItem(target);
  currentIndex += 1;
  score += 1;
  saveProgress();
  feedback.innerHTML = `<strong>ถูกต้อง</strong><span>${escapeHtml(target.word)} แปลว่า ${escapeHtml(target.thai)}</span>`;
  speakText(target.word);

  if (currentIndex >= missionItems.length) {
    completeMission();
    return;
  }

  window.setTimeout(renderMission, 650);
}

function highlightTarget(word) {
  itemsBox?.querySelectorAll(".mission-item").forEach((node) => {
    node.classList.toggle("target-hint-strong", node.dataset.word === word);
  });
  window.setTimeout(() => {
    itemsBox?.querySelectorAll(".mission-item").forEach((node) => node.classList.remove("target-hint-strong"));
  }, 1200);
}

function addPackedItem(item) {
  if (!packedItems) return;
  const chip = document.createElement("span");
  chip.textContent = `${item.word} · ${item.thai}`;
  packedItems.append(chip);
  bag?.classList.remove("bag-pop");
  void bag?.offsetWidth;
  bag?.classList.add("bag-pop");
}

function restorePackedItems() {
  itemsBox?.querySelectorAll(".mission-item").forEach((node, index) => {
    if (index < currentIndex) {
      node.dataset.packed = "1";
      addPackedItem(missionItems[index]);
    }
  });
}

function completeMission() {
  stars.textContent = `${score}/${missionItems.length}`;
  promptText.textContent = "Great job!";
  feedback.innerHTML = `<strong>Mission complete</strong><span>เก็บของใส่กระเป๋าครบแล้ว</span>`;
  completeBox?.classList.remove("hidden");
  if (completeBox) {
    completeBox.innerHTML = `
      <span class="mini-label">สรุปสำหรับผู้ปกครอง</span>
      <h3>School Bag Star</h3>
      <p>วันนี้รู้จักคำศัพท์ 4 คำ: book, pencil, ruler, eraser และฝึกฟังคำสั่งสั้น ๆ เช่น Tap the book.</p>
      <button id="restartMissionButton" class="button secondary" type="button">เล่นอีกครั้ง</button>
      <a class="button primary" href="/learn">กลับหน้าเรียน</a>
    `;
    completeBox.querySelector("#restartMissionButton")?.addEventListener("click", restartMission);
  }
  localStorage.setItem("101future.schoolBagMission.completedAt", new Date().toISOString());
}

function restartMission() {
  currentIndex = 0;
  score = 0;
  saveProgress();
  if (packedItems) packedItems.innerHTML = "";
  completeBox?.classList.add("hidden");
  itemsBox?.querySelectorAll(".mission-item").forEach((item) => {
    item.disabled = false;
    item.dataset.packed = "0";
    item.classList.remove("correct", "wrong", "target-hint", "target-hint-strong");
  });
  renderMission();
}

function speakPrompt() {
  speakText(`Tap the ${currentTarget().word}.`);
}

function speakText(text) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.82;
  window.speechSynthesis.speak(utterance);
}

function saveProgress() {
  localStorage.setItem("101future.schoolBagMission.index", String(currentIndex));
  localStorage.setItem("101future.schoolBagMission.score", String(score));
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

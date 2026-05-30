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
const missionScreen = document.querySelector(".mission-screen");
const correctBurst = document.querySelector("#correctBurst");
const correctBurstWord = document.querySelector("#correctBurstWord");
const resetRequested = new URLSearchParams(window.location.search).get("reset") === "1";

let currentIndex = Number(localStorage.getItem("101future.schoolBagMission.index") || 0);
let score = Number(localStorage.getItem("101future.schoolBagMission.score") || 0);
let draggedWord = "";
let isTransitioning = false;
let correctBurstTimer = 0;
let nextPromptTimer = 0;
let preferredEnglishVoice = null;
let missionStarted = false;

loadVoices();
if ("speechSynthesis" in window) {
  window.speechSynthesis.addEventListener?.("voiceschanged", loadVoices);
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

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
renderStartScreen();

soundButton?.addEventListener("click", () => {
  if (!missionStarted) {
    startMission();
    return;
  }
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
  setSoundButtonReplay();
  promptText.textContent = `Tap the ${target.word}.`;
  stars.textContent = `${score}/${missionItems.length}`;
  feedback.textContent = `โจทย์คือ ${target.word} (${target.thai})`;
  missionScreen?.classList.remove("awaiting-start");
  itemsBox?.querySelectorAll(".mission-item").forEach((item) => {
    const packed = Number(item.dataset.packed || 0) === 1;
    item.disabled = packed;
    item.classList.toggle("target-hint", item.dataset.word === target.word && !packed);
  });
}

function chooseItem(word, item) {
  if (!missionStarted || isTransitioning || !word || !item || currentIndex >= missionItems.length) return;

  const target = currentTarget();
  if (word !== target.word) {
    const selected = missionItems.find((entry) => entry.word === word) || { word, thai: item.dataset.thai || "" };
    item.classList.remove("wrong");
    void item.offsetWidth;
    item.classList.add("wrong");
    const selectedPhrase = `No, this is ${withArticle(selected.word)}.`;
    feedback.innerHTML = `
      <strong>${escapeHtml(selectedPhrase)}</strong>
      <span>แต่โจทย์ถามหา ${escapeHtml(target.word)} (${escapeHtml(target.thai)}) ลองแตะคำว่า ${escapeHtml(target.word)} อีกครั้ง</span>
    `;
    highlightTarget(target.word);
    speakText(selectedPhrase, { rate: 0.66, fallbackMs: 2200 });
    return;
  }

  item.classList.remove("correct");
  void item.offsetWidth;
  item.classList.add("correct");
  item.dataset.packed = "1";
  item.disabled = true;
  addPackedItem(target);
  showCorrectBurst(target);
  lockMission();
  currentIndex += 1;
  score += 1;
  saveProgress();
  feedback.innerHTML = `<strong>Yes, correct!</strong><span>${escapeHtml(target.word)} แปลว่า ${escapeHtml(target.thai)}</span>`;
  const correctStartedAt = Date.now();
  const advanceAfterPraise = () => {
    const waitMs = Math.max(0, 2200 - (Date.now() - correctStartedAt));
    window.clearTimeout(nextPromptTimer);
    nextPromptTimer = window.setTimeout(advanceMission, waitMs);
  };
  const speechStarted = speakText(`Yes, correct. ${target.word}.`, {
    rate: 0.66,
    fallbackMs: 2600,
    onEnd: advanceAfterPraise,
  });

  if (!speechStarted) {
    window.clearTimeout(nextPromptTimer);
    nextPromptTimer = window.setTimeout(advanceMission, 2200);
  }
}

function advanceMission() {
  if (currentIndex >= missionItems.length) {
    unlockMission();
    completeMission();
    return;
  }

  renderMission();
  unlockMission();
  window.setTimeout(speakPrompt, 280);
}

function renderStartScreen() {
  const hasProgress = currentIndex > 0;
  missionStarted = false;
  stars.textContent = `${score}/${missionItems.length}`;
  promptText.textContent = hasProgress ? "Ready to continue?" : "Ready to pack your school bag?";
  feedback.innerHTML = hasProgress
    ? "<strong>Resume Mission</strong><span>กดเริ่มต่อ แล้วฟังโจทย์ถัดไป</span>"
    : "<strong>Start Mission</strong><span>กดเริ่ม แล้วฟังคำสั่งแรก</span>";
  missionScreen?.classList.add("awaiting-start");
  setSoundButtonStart(hasProgress);
  itemsBox?.querySelectorAll(".mission-item").forEach((item) => {
    const packed = Number(item.dataset.packed || 0) === 1;
    item.disabled = packed;
    item.classList.remove("target-hint", "target-hint-strong", "correct", "wrong");
  });
}

function startMission() {
  missionStarted = true;
  renderMission();
  window.setTimeout(speakPrompt, 120);
}

function setSoundButtonStart(isResume = false) {
  if (!soundButton) return;
  soundButton.textContent = isResume ? "Resume Mission" : "Start Mission";
  soundButton.setAttribute("aria-label", isResume ? "เล่น Mission ต่อ" : "เริ่ม Mission");
  soundButton.classList.add("start-button");
}

function setSoundButtonReplay() {
  if (!soundButton) return;
  soundButton.textContent = "Listen Again";
  soundButton.setAttribute("aria-label", "ฟังคำสั่งอีกครั้ง");
  soundButton.classList.remove("start-button");
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

function lockMission() {
  isTransitioning = true;
  missionScreen?.classList.add("is-transitioning");
}

function unlockMission() {
  isTransitioning = false;
  missionScreen?.classList.remove("is-transitioning");
}

function showCorrectBurst(item) {
  if (!correctBurst) return;
  if (correctBurstWord) correctBurstWord.textContent = `${item.word} = ${item.thai}`;
  window.clearTimeout(correctBurstTimer);
  correctBurst.classList.remove("hidden", "burst-running");
  void correctBurst.offsetWidth;
  correctBurst.classList.add("burst-running");
  correctBurstTimer = window.setTimeout(() => {
    correctBurst.classList.add("hidden");
    correctBurst.classList.remove("burst-running");
  }, 1800);
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
  missionStarted = false;
  stars.textContent = `${score}/${missionItems.length}`;
  promptText.textContent = "Great job!";
  feedback.innerHTML = `<strong>Mission complete</strong><span>เก็บของใส่กระเป๋าครบแล้ว</span>`;
  speakText("Great job!", { rate: 0.68, fallbackMs: 1800 });
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
  window.clearTimeout(correctBurstTimer);
  window.clearTimeout(nextPromptTimer);
  unlockMission();
  currentIndex = 0;
  score = 0;
  saveProgress();
  if (packedItems) packedItems.innerHTML = "";
  correctBurst?.classList.add("hidden");
  completeBox?.classList.add("hidden");
  missionStarted = true;
  itemsBox?.querySelectorAll(".mission-item").forEach((item) => {
    item.disabled = false;
    item.dataset.packed = "0";
    item.classList.remove("correct", "wrong", "target-hint", "target-hint-strong");
  });
  renderMission();
  window.setTimeout(speakPrompt, 350);
}

function speakPrompt() {
  speakText(`Tap the ${currentTarget().word}.`, { rate: 0.64, fallbackMs: 2200 });
}

function speakText(text, options = {}) {
  if (!("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = options.rate || 0.68;
  utterance.pitch = 1.04;
  if (preferredEnglishVoice) utterance.voice = preferredEnglishVoice;
  if (typeof options.onEnd === "function") {
    let ended = false;
    const finish = () => {
      if (ended) return;
      ended = true;
      window.clearTimeout(fallbackTimer);
      options.onEnd();
    };
    const fallbackTimer = window.setTimeout(finish, options.fallbackMs || estimateSpeechMs(text, utterance.rate));
    utterance.onend = finish;
    utterance.onerror = finish;
  }
  window.speechSynthesis.speak(utterance);
  return true;
}

function loadVoices() {
  if (!("speechSynthesis" in window)) return;
  const voices = window.speechSynthesis.getVoices();
  const englishVoices = voices.filter((voice) => voice.lang?.toLowerCase().startsWith("en"));
  const preferredNames = [
    "ava",
    "samantha",
    "google us english",
    "microsoft jenny",
    "microsoft aria",
    "natural",
    "premium",
    "enhanced",
    "neural",
    "alex",
  ];
  preferredEnglishVoice =
    preferredNames.map((name) => englishVoices.find((voice) => voice.name.toLowerCase().includes(name))).find(Boolean) ||
    englishVoices.find((voice) => voice.lang === "en-US") ||
    englishVoices[0] ||
    null;
}

function estimateSpeechMs(text, rate) {
  const wordCount = String(text).trim().split(/\s+/).filter(Boolean).length || 1;
  return Math.max(1500, Math.min(3600, (wordCount * 520) / Math.max(rate, 0.5)));
}

function withArticle(word) {
  const article = /^[aeiou]/i.test(word) ? "an" : "a";
  return `${article} ${word}`;
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

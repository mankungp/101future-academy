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
const promptHint = document.querySelector("#missionPromptHint");
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
let audioContext = null;

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
  if (promptHint) promptHint.textContent = "ฟังแล้วแตะของที่ได้ยิน";
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

  unlockAudio();
  const target = currentTarget();
  if (word !== target.word) {
    const selected = missionItems.find((entry) => entry.word === word) || { word, thai: item.dataset.thai || "" };
    item.classList.remove("wrong");
    void item.offsetWidth;
    item.classList.add("wrong");
    playUiSound("wrong");
    showWrongBubble(item, selected);
    recordAttempt({ correct: false, selected, target });
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
  playUiSound("correct");
  animateItemToBag(item);
  addPackedItem(target);
  showCorrectBurst(target);
  lockMission();
  recordAttempt({ correct: true, selected: target, target });
  currentIndex += 1;
  score += 1;
  saveProgress();
  stars.textContent = `${score}/${missionItems.length}`;
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
  if (promptHint) promptHint.textContent = hasProgress ? "เล่นต่อจากข้อที่ค้างไว้" : "กดเริ่ม แล้วฟังคำสั่งแรก";
  promptText.textContent = hasProgress ? "Ready to continue?" : "Ready to pack your school bag?";
  feedback.innerHTML = hasProgress
    ? "<strong>Mission 1</strong><span>กด Resume Mission แล้วฟังโจทย์ถัดไป</span>"
    : "<strong>Mission 1</strong><span>แตะของที่ได้ยิน แล้วเก็บใส่กระเป๋า</span>";
  missionScreen?.classList.add("awaiting-start");
  setSoundButtonStart(hasProgress);
  itemsBox?.querySelectorAll(".mission-item").forEach((item) => {
    const packed = Number(item.dataset.packed || 0) === 1;
    item.disabled = packed;
    item.classList.remove("target-hint", "target-hint-strong", "correct", "wrong");
  });
}

function startMission() {
  unlockAudio();
  playUiSound("start");
  missionStarted = true;
  renderMission();
  window.setTimeout(speakPrompt, 420);
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
  window.setTimeout(() => playUiSound("drop"), 240);
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

function showWrongBubble(item, selected) {
  item.querySelector(".object-feedback-bubble")?.remove();
  const bubble = document.createElement("span");
  bubble.className = "object-feedback-bubble wrong-bubble";
  bubble.innerHTML = `<strong>${escapeHtml(selected.word)}</strong><small>${escapeHtml(selected.thai)}</small>`;
  item.append(bubble);
  window.setTimeout(() => bubble.remove(), 1700);
}

function animateItemToBag(item) {
  if (!bag || !item || !item.getBoundingClientRect || !document.body) return;
  const itemBox = item.getBoundingClientRect();
  const bagBox = bag.getBoundingClientRect();
  const flyer = item.cloneNode(true);
  flyer.className = "mission-flyer";
  flyer.removeAttribute("id");
  flyer.removeAttribute("draggable");
  flyer.querySelector(".object-feedback-bubble")?.remove();
  flyer.style.left = `${itemBox.left}px`;
  flyer.style.top = `${itemBox.top}px`;
  flyer.style.width = `${itemBox.width}px`;
  flyer.style.height = `${itemBox.height}px`;
  document.body.append(flyer);

  const targetX = bagBox.left + bagBox.width * 0.5 - itemBox.left - itemBox.width * 0.5;
  const targetY = bagBox.top + bagBox.height * 0.62 - itemBox.top - itemBox.height * 0.5;
  const animation = flyer.animate(
    [
      { transform: "translate3d(0, 0, 0) scale(1)", opacity: 0.96 },
      { transform: `translate3d(${targetX * 0.48}px, ${targetY * 0.24 - 34}px, 0) scale(0.82)`, opacity: 0.96 },
      { transform: `translate3d(${targetX}px, ${targetY}px, 0) scale(0.28)`, opacity: 0 },
    ],
    { duration: 720, easing: "cubic-bezier(0.2, 0.9, 0.22, 1)", fill: "forwards" }
  );
  animation.onfinish = () => flyer.remove();
  animation.oncancel = () => flyer.remove();
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
  playUiSound("complete");
  stars.textContent = `${score}/${missionItems.length}`;
  if (promptHint) promptHint.textContent = "Mission นี้จบแล้ว";
  promptText.textContent = "Great job!";
  feedback.innerHTML = `<strong>Mission complete</strong><span>เก็บของใส่กระเป๋าครบแล้ว</span>`;
  speakText("Great job! Mission complete.", { rate: 0.64, fallbackMs: 2600 });
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
    item.querySelector(".object-feedback-bubble")?.remove();
    item.classList.remove("correct", "wrong", "target-hint", "target-hint-strong");
  });
  renderMission();
  window.setTimeout(speakPrompt, 350);
}

function speakPrompt() {
  setSpeaking(true);
  playUiSound("prompt");
  const started = speakText(`Tap the ${currentTarget().word}.`, {
    rate: 0.64,
    fallbackMs: 2200,
    onEnd: () => setSpeaking(false),
  });
  if (!started) {
    window.setTimeout(() => setSpeaking(false), 900);
  }
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

function recordAttempt({ correct, selected, target }) {
  const attempts = readAttempts();
  attempts.push({
    mission: "english-p1-unit1-school-bag",
    target: target.word,
    targetThai: target.thai,
    selected: selected.word,
    selectedThai: selected.thai,
    correct,
    createdAt: new Date().toISOString(),
  });
  localStorage.setItem("101future.learningAttempts", JSON.stringify(attempts.slice(-80)));
}

function readAttempts() {
  try {
    const parsed = JSON.parse(localStorage.getItem("101future.learningAttempts") || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setSpeaking(isSpeaking) {
  missionScreen?.classList.toggle("is-speaking", Boolean(isSpeaking));
}

function unlockAudio() {
  const context = getAudioContext();
  if (context?.state === "suspended") context.resume();
}

function getAudioContext() {
  if (audioContext) return audioContext;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  audioContext = new AudioContextClass();
  return audioContext;
}

function playUiSound(name) {
  const context = getAudioContext();
  if (!context) return;
  if (context.state === "suspended") context.resume();

  const sounds = {
    start: [
      [523, 0.1, 0, 0.05],
      [659, 0.1, 0.09, 0.05],
      [784, 0.16, 0.18, 0.055],
    ],
    prompt: [
      [740, 0.08, 0, 0.035],
      [880, 0.08, 0.08, 0.032],
    ],
    correct: [
      [660, 0.11, 0, 0.055],
      [880, 0.16, 0.11, 0.06],
      [1046, 0.22, 0.26, 0.05],
    ],
    wrong: [
      [220, 0.12, 0, 0.04, 185],
      [164, 0.16, 0.11, 0.035, 146],
    ],
    drop: [
      [392, 0.09, 0, 0.035],
      [294, 0.12, 0.08, 0.03],
    ],
    complete: [
      [523, 0.1, 0, 0.05],
      [659, 0.1, 0.1, 0.052],
      [784, 0.1, 0.2, 0.055],
      [1046, 0.26, 0.32, 0.05],
    ],
  };

  (sounds[name] || []).forEach(([frequency, duration, offset, volume, endFrequency]) => {
    scheduleTone(context, frequency, duration, offset, volume, endFrequency);
  });
}

function scheduleTone(context, frequency, duration, offset, volume, endFrequency) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const startTime = context.currentTime + offset;
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, startTime);
  if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, startTime + duration);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(Math.max(volume, 0.001), startTime + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.04);
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

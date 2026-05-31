const sentenceItems = [
  { word: "book", thai: "หนังสือ", phrase: "This is a book." },
  { word: "pencil", thai: "ดินสอ", phrase: "This is a pencil." },
  { word: "ruler", thai: "ไม้บรรทัด", phrase: "This is a ruler." },
  { word: "eraser", thai: "ยางลบ", phrase: "This is an eraser." },
];

const promptText = document.querySelector("#missionPromptText");
const promptHint = document.querySelector("#missionPromptHint");
const stars = document.querySelector("#missionStars");
const itemsBox = document.querySelector("#missionItems");
const feedback = document.querySelector("#missionFeedback");
const completeBox = document.querySelector("#missionComplete");
const soundButton = document.querySelector("#missionSoundButton");
const missionScreen = document.querySelector(".mission-screen");
const correctBurst = document.querySelector("#correctBurst");
const correctBurstWord = document.querySelector("#correctBurstWord");
const sentenceProgress = document.querySelector("#sentenceProgress");
const resetRequested = new URLSearchParams(window.location.search).get("reset") === "1";

let currentIndex = Number(localStorage.getItem("101future.thisIsMission.index") || 0);
let score = Number(localStorage.getItem("101future.thisIsMission.score") || 0);
let isTransitioning = false;
let correctBurstTimer = 0;
let nextPromptTimer = 0;
let preferredEnglishVoice = null;
let missionStarted = false;
let audioContext = null;

installNoZoomGuard();
loadVoices();
if ("speechSynthesis" in window) {
  window.speechSynthesis.addEventListener?.("voiceschanged", loadVoices);
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

if (resetRequested) {
  localStorage.removeItem("101future.thisIsMission.index");
  localStorage.removeItem("101future.thisIsMission.score");
  localStorage.removeItem("101future.thisIsMission.completedAt");
  currentIndex = 0;
  score = 0;
}

if (currentIndex >= sentenceItems.length) {
  currentIndex = 0;
  score = 0;
  saveProgress();
}

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
});

function currentTarget() {
  return sentenceItems[currentIndex] || sentenceItems[0];
}

function renderMission() {
  const target = currentTarget();
  setSoundButtonReplay();
  if (promptHint) promptHint.textContent = "ฟังประโยค แล้วแตะรูปที่ตรงกัน";
  promptText.textContent = target.phrase;
  stars.textContent = `${score}/${sentenceItems.length}`;
  feedback.innerHTML = `<strong>ฟังประโยคนี้</strong><span>${escapeHtml(target.phrase)} แปลว่า นี่คือ${escapeHtml(target.thai)}</span>`;
  missionScreen?.classList.remove("awaiting-start");
  renderSentenceProgress();
  itemsBox?.querySelectorAll(".mission-item").forEach((item) => {
    const completed = Number(item.dataset.completed || 0) === 1;
    item.disabled = completed;
    item.classList.toggle("target-hint", item.dataset.word === target.word && !completed);
  });
}

function chooseItem(word, item) {
  if (!missionStarted || isTransitioning || !word || !item || currentIndex >= sentenceItems.length) return;

  unlockAudio();
  const target = currentTarget();
  if (word !== target.word) {
    const selected = sentenceItems.find((entry) => entry.word === word) || { word, thai: item.dataset.thai || "", phrase: item.dataset.phrase || "" };
    item.classList.remove("wrong");
    void item.offsetWidth;
    item.classList.add("wrong");
    playUiSound("wrong");
    showWrongBubble(item, selected);
    recordAttempt({ correct: false, selected, target });
    const selectedPhrase = `No, this is ${withArticle(selected.word)}.`;
    feedback.innerHTML = `
      <strong>${escapeHtml(selectedPhrase)}</strong>
      <span>ประโยคที่ได้ยินคือ ${escapeHtml(target.phrase)} ลองแตะ ${escapeHtml(target.word)} อีกครั้ง</span>
    `;
    highlightTarget(target.word);
    speakText(selectedPhrase, { rate: 0.64, fallbackMs: 2300 });
    return;
  }

  item.classList.remove("correct");
  void item.offsetWidth;
  item.classList.add("correct");
  item.dataset.completed = "1";
  item.disabled = true;
  playUiSound("correct");
  showCorrectBurst(target);
  lockMission();
  recordAttempt({ correct: true, selected: target, target });
  currentIndex += 1;
  score += 1;
  saveProgress();
  stars.textContent = `${score}/${sentenceItems.length}`;
  feedback.innerHTML = `<strong>Yes, correct!</strong><span>${escapeHtml(target.phrase)} = นี่คือ${escapeHtml(target.thai)}</span>`;
  renderSentenceProgress();
  const correctStartedAt = Date.now();
  const advanceAfterPraise = () => {
    const waitMs = Math.max(0, 2600 - (Date.now() - correctStartedAt));
    window.clearTimeout(nextPromptTimer);
    nextPromptTimer = window.setTimeout(advanceMission, waitMs);
  };
  const speechStarted = speakText(`Yes, correct. ${target.phrase}`, {
    rate: 0.62,
    fallbackMs: 3200,
    onEnd: advanceAfterPraise,
  });

  if (!speechStarted) {
    window.clearTimeout(nextPromptTimer);
    nextPromptTimer = window.setTimeout(advanceMission, 2600);
  }
}

function advanceMission() {
  if (currentIndex >= sentenceItems.length) {
    unlockMission();
    completeMission();
    return;
  }

  renderMission();
  unlockMission();
  window.setTimeout(speakPrompt, 320);
}

function renderStartScreen() {
  const hasProgress = currentIndex > 0;
  missionStarted = false;
  stars.textContent = `${score}/${sentenceItems.length}`;
  if (promptHint) promptHint.textContent = hasProgress ? "เล่นต่อจากประโยคที่ค้างไว้" : "กดเริ่ม แล้วฟังประโยคแรก";
  promptText.textContent = hasProgress ? "Ready to continue?" : "Ready to hear a sentence?";
  feedback.innerHTML = hasProgress
    ? "<strong>Mission 2</strong><span>กด Resume Mission แล้วฟังประโยคถัดไป</span>"
    : "<strong>Mission 2</strong><span>ฟังประโยค This is... แล้วแตะรูปให้ตรง</span>";
  missionScreen?.classList.add("awaiting-start");
  renderSentenceProgress();
  setSoundButtonStart(hasProgress);
  itemsBox?.querySelectorAll(".mission-item").forEach((item) => {
    item.disabled = Number(item.dataset.completed || 0) === 1;
    item.classList.remove("target-hint", "target-hint-strong", "correct", "wrong");
  });
}

function startMission() {
  unlockAudio();
  playUiSound("start");
  missionStarted = true;
  renderMission();
  window.setTimeout(speakPrompt, 440);
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
  soundButton.setAttribute("aria-label", "ฟังประโยคอีกครั้ง");
  soundButton.classList.remove("start-button");
}

function renderSentenceProgress() {
  if (!sentenceProgress) return;
  sentenceProgress.innerHTML = sentenceItems.map((item, index) => {
    const status = index < currentIndex ? "done" : index === currentIndex ? "active" : "";
    return `<span class="${status}">${escapeHtml(item.word)}</span>`;
  }).join("");
}

function highlightTarget(word) {
  itemsBox?.querySelectorAll(".mission-item").forEach((node) => {
    node.classList.toggle("target-hint-strong", node.dataset.word === word);
  });
  window.setTimeout(() => {
    itemsBox?.querySelectorAll(".mission-item").forEach((node) => node.classList.remove("target-hint-strong"));
  }, 1400);
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
  if (correctBurstWord) correctBurstWord.textContent = item.phrase;
  window.clearTimeout(correctBurstTimer);
  correctBurst.classList.remove("hidden", "burst-running");
  void correctBurst.offsetWidth;
  correctBurst.classList.add("burst-running");
  correctBurstTimer = window.setTimeout(() => {
    correctBurst.classList.add("hidden");
    correctBurst.classList.remove("burst-running");
  }, 1900);
}

function showWrongBubble(item, selected) {
  item.querySelector(".object-feedback-bubble")?.remove();
  const bubble = document.createElement("span");
  bubble.className = "object-feedback-bubble wrong-bubble";
  bubble.innerHTML = `<strong>${escapeHtml(selected.word)}</strong><small>${escapeHtml(selected.thai)}</small>`;
  item.append(bubble);
  window.setTimeout(() => bubble.remove(), 1700);
}

function completeMission() {
  missionStarted = false;
  playUiSound("complete");
  stars.textContent = `${score}/${sentenceItems.length}`;
  if (promptHint) promptHint.textContent = "Mission นี้จบแล้ว";
  promptText.textContent = "Great job!";
  feedback.innerHTML = `<strong>Mission complete</strong><span>เด็กเริ่มจับประโยค This is... กับสิ่งของได้แล้ว</span>`;
  speakText("Great job! You can say four school sentences.", { rate: 0.62, fallbackMs: 3600 });
  completeBox?.classList.remove("hidden");
  if (completeBox) {
    completeBox.innerHTML = `
      <span class="mini-label">สรุปสำหรับผู้ปกครอง</span>
      <h3>Sentence Starter</h3>
      <p>วันนี้ฝึกประโยค This is a book, This is a pencil, This is a ruler และ This is an eraser.</p>
      <button id="restartMissionButton" class="button primary" type="button">เล่นอีกครั้ง</button>
      <a class="button secondary" href="/learn">กลับหน้าเรียน</a>
    `;
    completeBox.querySelector("#restartMissionButton")?.addEventListener("click", restartMission);
  }
  localStorage.setItem("101future.thisIsMission.completedAt", new Date().toISOString());
}

function restartMission() {
  window.clearTimeout(correctBurstTimer);
  window.clearTimeout(nextPromptTimer);
  unlockMission();
  currentIndex = 0;
  score = 0;
  saveProgress();
  correctBurst?.classList.add("hidden");
  completeBox?.classList.add("hidden");
  missionStarted = true;
  itemsBox?.querySelectorAll(".mission-item").forEach((item) => {
    item.disabled = false;
    item.dataset.completed = "0";
    item.querySelector(".object-feedback-bubble")?.remove();
    item.classList.remove("correct", "wrong", "target-hint", "target-hint-strong");
  });
  renderMission();
  window.setTimeout(speakPrompt, 380);
}

function speakPrompt() {
  setSpeaking(true);
  playUiSound("prompt");
  const started = speakText(currentTarget().phrase, {
    rate: 0.6,
    fallbackMs: 2600,
    onEnd: () => setSpeaking(false),
  });
  if (!started) {
    window.setTimeout(() => setSpeaking(false), 1100);
  }
}

function speakText(text, options = {}) {
  if (!("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = options.rate || 0.64;
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
    mission: "english-p1-unit1-this-is",
    target: target.word,
    targetPhrase: target.phrase,
    selected: selected.word,
    selectedPhrase: selected.phrase,
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
  return Math.max(1800, Math.min(4200, (wordCount * 600) / Math.max(rate, 0.5)));
}

function withArticle(word) {
  const article = /^[aeiou]/i.test(word) ? "an" : "a";
  return `${article} ${word}`;
}

function saveProgress() {
  localStorage.setItem("101future.thisIsMission.index", String(currentIndex));
  localStorage.setItem("101future.thisIsMission.score", String(score));
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

function installNoZoomGuard() {
  const prevent = (event) => event.preventDefault();
  const isLockedMission = () => document.body?.classList.contains("no-zoom-body");
  document.addEventListener("gesturestart", prevent, { passive: false });
  document.addEventListener("gesturechange", prevent, { passive: false });
  document.addEventListener("gestureend", prevent, { passive: false });
  document.addEventListener("touchmove", (event) => {
    if (event.touches && (event.touches.length > 1 || isLockedMission())) event.preventDefault();
  }, { passive: false });

  let lastTouchEnd = 0;
  document.addEventListener("touchend", (event) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 320) event.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });
}

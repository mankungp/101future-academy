const fallbackAssetVersion = "20260531-real-objects-v2";
const unitImageVersion = "20260605-unit1-png-v2";
const schoolBagSvg = (name) => `/assets/school-bag/${name}.svg?v=${fallbackAssetVersion}`;
const schoolBagPng = (name) => `/assets/school-bag/${name}.png?v=${fallbackAssetVersion}`;
const unitPng = (name) => `/assets/english-p1/images/${name}.png?v=${unitImageVersion}`;
const unitItem = (word, thai, answer, audio, imageName, fallbackImage) => ({
  word,
  thai,
  answer,
  audio,
  image: unitPng(imageName),
  fallbackImage,
});

const questionItems = [
  unitItem("book", "หนังสือ", "It is a book!", "it-is-a-book.mp3", "book", schoolBagSvg("book")),
  unitItem("pencil", "ดินสอ", "It is a pencil!", "it-is-a-pencil.mp3", "pencil", schoolBagPng("real-pencil")),
  unitItem("ruler", "ไม้บรรทัด", "It is a ruler!", "it-is-a-ruler.mp3", "ruler", schoolBagSvg("ruler")),
  unitItem("eraser", "ยางลบ", "It is an eraser!", "it-is-an-eraser.mp3", "eraser", schoolBagSvg("eraser")),
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
const questionObjectImage = document.querySelector("#questionObjectImage");
const questionObjectCaption = document.querySelector("#questionObjectCaption");
const resetRequested = new URLSearchParams(window.location.search).get("reset") === "1";
const teacherAudioBase = "/assets/english-p1/audio/";
const gamificationLessonId = "english-p1-unit1-what-is-it";

let currentIndex = Number(localStorage.getItem("101future.thisIsMission.index") || 0);
let score = Number(localStorage.getItem("101future.thisIsMission.score") || 0);
let isTransitioning = false;
let correctBurstTimer = 0;
let nextPromptTimer = 0;
let missionStarted = false;
let audioContext = null;
let activeTeacherAudio = null;
let teacherAudioToken = 0;

installNoZoomGuard();

if (resetRequested) {
  localStorage.removeItem("101future.thisIsMission.index");
  localStorage.removeItem("101future.thisIsMission.score");
  localStorage.removeItem("101future.thisIsMission.completedAt");
  currentIndex = 0;
  score = 0;
}

if (currentIndex >= questionItems.length) {
  currentIndex = 0;
  score = 0;
  saveProgress();
}

renderStartScreen();
window.FutureGamification?.initMissionShell({
  lessonId: gamificationLessonId,
  title: "What Is It?",
  totalQuestions: questionItems.length,
  mascotEmotion: "greeting",
  mascotText: "ดูรูปให้ดี แล้วช่วยน้องฟิวตอบว่า What is it?",
});

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
  return questionItems[currentIndex] || questionItems[0];
}

function answerAudioFile(item) {
  return item.audio;
}

function slugifyWord(word) {
  return String(word).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function renderMission() {
  const target = currentTarget();
  setSoundButtonReplay();
  renderQuestionObject(target);
  renderChoices(target, { disabled: false });
  if (promptHint) promptHint.textContent = `ด่าน ${currentIndex + 1} จาก ${questionItems.length}`;
  promptText.textContent = "What is it?";
  stars.textContent = `${score}/${questionItems.length}`;
  feedback.innerHTML = `<strong>ดูรูป แล้วตอบ</strong><span>แตะคำตอบที่ขึ้นต้นด้วย It is... ให้ตรงกับภาพ</span>`;
  missionScreen?.classList.remove("awaiting-start");
  renderSentenceProgress();
}

function chooseItem(word, item) {
  if (!missionStarted || isTransitioning || !word || !item || currentIndex >= questionItems.length) return;

  unlockAudio();
  const target = currentTarget();
  if (word !== target.word) {
    const selected = questionItems.find((entry) => entry.word === word) || { word, thai: item.dataset.thai || "", answer: item.dataset.answer || "" };
    item.classList.remove("wrong");
    void item.offsetWidth;
    item.classList.add("wrong");
    playUiSound("wrong");
    showWrongBubble(item, selected);
    recordAttempt({ correct: false, selected, target });
    window.FutureGamification?.recordQuestion({
      lessonId: gamificationLessonId,
      questionId: target.word,
      correct: false,
      target: target.word,
      selected: selected.word,
      skillTag: target.word,
      totalQuestions: questionItems.length,
    });
    feedback.innerHTML = `
      <strong>Almost. Try again.</strong>
      <span>${escapeHtml(selected.word)} ยังไม่ตรงกับรูปนี้ ลองดูภาพอีกครั้งนะ</span>
    `;
    highlightTarget(target.word);
    playTeacherAudio(["try-again.mp3", `${slugifyWord(selected.word)}.mp3`]);
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
  window.FutureGamification?.recordQuestion({
    lessonId: gamificationLessonId,
    questionId: target.word,
    correct: true,
    target: target.word,
    selected: target.word,
    skillTag: "what is it",
    totalQuestions: questionItems.length,
  });
  currentIndex += 1;
  score += 1;
  saveProgress();
  stars.textContent = `${score}/${questionItems.length}`;
  feedback.innerHTML = `<strong>Yes, correct!</strong><span>${escapeHtml(target.answer)} = ${escapeHtml(target.word)} (${escapeHtml(target.thai)})</span>`;
  renderSentenceProgress();
  const correctStartedAt = Date.now();
  const advanceAfterPraise = () => {
    const waitMs = Math.max(0, 2600 - (Date.now() - correctStartedAt));
    window.clearTimeout(nextPromptTimer);
    nextPromptTimer = window.setTimeout(advanceMission, waitMs);
  };
  playTeacherAudio([answerAudioFile(target), "great-job.mp3"], { onEnd: advanceAfterPraise });
}

function advanceMission() {
  if (currentIndex >= questionItems.length) {
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
  stars.textContent = `${score}/${questionItems.length}`;
  renderQuestionObject(currentTarget());
  if (promptHint) promptHint.textContent = hasProgress ? "เล่นต่อจากรูปที่ค้างไว้" : "กดเริ่ม แล้วดูรูปแรก";
  promptText.textContent = hasProgress ? "Ready to continue?" : "Ready to answer?";
  feedback.innerHTML = hasProgress
    ? "<strong>Mission 2</strong><span>กด Resume Mission แล้วตอบรูปถัดไป</span>"
    : "<strong>Mission 2</strong><span>ฟัง What is it? ดูรูป แล้วเลือกคำตอบ It is...</span>";
  missionScreen?.classList.add("awaiting-start");
  renderSentenceProgress();
  setSoundButtonStart(hasProgress);
  renderChoices(currentTarget(), { disabled: true });
}

function startMission() {
  unlockAudio();
  playUiSound("start");
  missionStarted = true;
  renderMission();
  window.setTimeout(() => {
    playTeacherAudio(["lets-start.mp3"], { onEnd: speakPrompt });
  }, 260);
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
  soundButton.setAttribute("aria-label", "ฟังคำถามอีกครั้ง");
  soundButton.classList.remove("start-button");
}

function renderSentenceProgress() {
  if (!sentenceProgress) return;
  sentenceProgress.innerHTML = questionItems.map((item, index) => {
    const status = index < currentIndex ? "done" : index === currentIndex ? "active" : "";
    return `<span class="${status}">${escapeHtml(item.word)}</span>`;
  }).join("");
}

function renderQuestionObject(target) {
  if (questionObjectImage) {
    setImageWithFallback(questionObjectImage, target.image, target.fallbackImage || "");
    questionObjectImage.className = `object-image object-image-${slugifyWord(target.word)}`;
    questionObjectImage.alt = `รูปคำถาม: ${target.thai}`;
  }
  if (questionObjectCaption) {
    questionObjectCaption.textContent = "Look carefully";
  }
}

function setImageWithFallback(image, src, fallbackSrc) {
  image.dataset.fallbackSrc = fallbackSrc;
  image.dataset.fallbackUsed = "0";
  image.onerror = () => {
    const fallback = image.dataset.fallbackSrc;
    if (!fallback || image.dataset.fallbackUsed === "1") return;
    image.dataset.fallbackUsed = "1";
    image.src = fallback;
  };
  image.src = src;
}

function renderChoices(target, options = {}) {
  if (!itemsBox) return;
  const choices = shuffleStable([...questionItems], currentIndex);
  itemsBox.innerHTML = choices.map((entry) => `
    <button class="mission-item mission-object sentence-item answer-item" type="button" data-word="${escapeHtml(entry.word)}" data-thai="${escapeHtml(entry.thai)}" data-answer="${escapeHtml(entry.answer)}"${options.disabled ? " disabled" : ""}>
      <span class="answer-pill">${escapeHtml(entry.word)}</span>
      <strong>${escapeHtml(entry.answer)}</strong>
      <small>${escapeHtml(entry.thai)}</small>
    </button>
  `).join("");
  itemsBox.querySelectorAll(".mission-item").forEach((item) => {
    item.addEventListener("click", () => chooseItem(item.dataset.word || "", item));
    item.classList.toggle("target-hint", item.dataset.word === target.word && !options.disabled);
  });
}

function shuffleStable(items, seed) {
  return items
    .map((item, index) => ({ item, sort: Math.sin((seed + 1) * 71 + index * 29) }))
    .sort((a, b) => a.sort - b.sort)
    .map((entry) => entry.item);
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
  if (correctBurstWord) correctBurstWord.textContent = item.answer;
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
  const rewardSummary = window.FutureGamification?.completeLesson({
    lessonId: gamificationLessonId,
    title: "What Is It?",
    score,
    totalQuestions: questionItems.length,
  });
  stars.textContent = `${score}/${questionItems.length}`;
  if (promptHint) promptHint.textContent = "Mission นี้จบแล้ว";
  promptText.textContent = "Great job!";
  feedback.innerHTML = `<strong>Mission complete</strong><span>เด็กตอบคำถาม What is it? ได้ครบทุกภาพแล้ว</span>`;
  playTeacherAudio(["you-did-it.mp3", "lesson-complete.mp3"]);
  completeBox?.classList.remove("hidden");
  if (completeBox) {
    completeBox.innerHTML = `
      <span class="mini-label">สรุปสำหรับผู้ปกครอง</span>
      <h3>Question Answer Star</h3>
      <p>วันนี้เด็กฝึกตอบคำถาม What is it? ด้วยประโยค It is a book, It is a pencil, It is a ruler และ It is an eraser.</p>
      <div class="mission-result-stats" aria-label="ผลการเล่น">
        <span>Questions: ${questionItems.length}</span>
        <span>Score: ${score}/${questionItems.length}</span>
      </div>
      ${window.FutureGamification?.renderLessonReward(rewardSummary) || ""}
      <button id="restartMissionButton" class="button primary" type="button">Play again</button>
      <a class="button secondary" href="/learn">Back</a>
    `;
    completeBox.querySelector("#restartMissionButton")?.addEventListener("click", restartMission);
  }
  window.FutureGamification?.showCelebration({
    title: "ตอบครบทุกภาพ!",
    message: "เด็กตอบ What is it? ได้ครบแล้ว พร้อมเก็บดาวเข้าวันนี้",
    summary: rewardSummary,
  });
  localStorage.setItem("101future.thisIsMission.completedAt", new Date().toISOString());
}

function restartMission() {
  window.clearTimeout(correctBurstTimer);
  window.clearTimeout(nextPromptTimer);
  stopTeacherAudio();
  unlockMission();
  currentIndex = 0;
  score = 0;
  saveProgress();
  correctBurst?.classList.add("hidden");
  completeBox?.classList.add("hidden");
  missionStarted = true;
  renderMission();
  window.setTimeout(() => {
    playTeacherAudio(["lets-start.mp3"], { onEnd: speakPrompt });
  }, 260);
}

function speakPrompt() {
  setSpeaking(true);
  playUiSound("prompt");
  playTeacherAudio(["what-is-it.mp3"], { onEnd: () => setSpeaking(false) });
}

function playTeacherAudio(files, options = {}) {
  const queue = files.filter(Boolean);
  if (!queue.length) {
    options.onEnd?.();
    return false;
  }
  teacherAudioToken += 1;
  const token = teacherAudioToken;
  stopActiveTeacherAudio();
  runTeacherAudioQueue(queue, token, options);
  return true;
}

async function runTeacherAudioQueue(queue, token, options) {
  for (const file of queue) {
    if (token !== teacherAudioToken) return;
    await playTeacherAudioFile(file, token);
  }
  if (token === teacherAudioToken) options.onEnd?.();
}

function playTeacherAudioFile(file, token) {
  return new Promise((resolve) => {
    const audio = new Audio(`${teacherAudioBase}${file}`);
    activeTeacherAudio = audio;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      audio.removeEventListener("ended", finish);
      audio.removeEventListener("error", finish);
      if (activeTeacherAudio === audio) activeTeacherAudio = null;
      resolve();
    };
    audio.addEventListener("ended", finish, { once: true });
    audio.addEventListener("error", finish, { once: true });
    audio.play().catch(finish);
    window.setTimeout(() => {
      if (token === teacherAudioToken) finish();
    }, 6000);
  });
}

function stopTeacherAudio() {
  teacherAudioToken += 1;
  stopActiveTeacherAudio();
}

function stopActiveTeacherAudio() {
  if (!activeTeacherAudio) return;
  try {
    activeTeacherAudio.pause();
    activeTeacherAudio.currentTime = 0;
  } catch {
    /* ignore audio cleanup */
  }
  activeTeacherAudio = null;
}

function recordAttempt({ correct, selected, target }) {
  const attempts = readAttempts();
  attempts.push({
    mission: "english-p1-unit1-what-is-it",
    target: target.word,
    targetAnswer: target.answer,
    selected: selected.word,
    selectedAnswer: selected.answer,
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

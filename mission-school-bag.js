const assetVersion = "20260531-real-objects-v2";
const asset = (name) => `/assets/school-bag/${name}.svg?v=${assetVersion}`;
const assetPng = (name) => `/assets/school-bag/${name}.png?v=${assetVersion}`;

const missionItems = [
  { word: "book", thai: "หนังสือ", image: asset("book"), prompt: "Tap the book." },
  { word: "pencil", thai: "ดินสอ", image: assetPng("real-pencil"), prompt: "Find the pencil." },
  { word: "ruler", thai: "ไม้บรรทัด", image: asset("ruler"), prompt: "Touch the ruler." },
  { word: "eraser", thai: "ยางลบ", image: asset("eraser"), prompt: "Choose the eraser." },
  { word: "school bag", thai: "กระเป๋านักเรียน", image: asset("school-bag"), prompt: "Tap the school bag." },
  { word: "notebook", thai: "สมุด", image: asset("notebook"), prompt: "Find the notebook." },
  { word: "pen", thai: "ปากกา", image: assetPng("real-pen"), prompt: "Touch the pen." },
  { word: "crayon", thai: "สีเทียน", image: assetPng("real-crayon"), prompt: "Choose the crayon." },
  { word: "scissors", thai: "กรรไกร", image: asset("scissors"), prompt: "Tap the scissors." },
  { word: "glue", thai: "กาว", image: asset("glue"), prompt: "Find the glue." },
  { word: "sharpener", thai: "กบเหลาดินสอ", image: asset("sharpener"), prompt: "Touch the sharpener." },
  { word: "desk", thai: "โต๊ะเรียน", image: asset("desk"), prompt: "Choose the desk." },
  { word: "chair", thai: "เก้าอี้", image: asset("chair"), prompt: "Tap the chair." },
  { word: "board", thai: "กระดาน", image: asset("board"), prompt: "Find the board." },
  { word: "clock", thai: "นาฬิกา", image: asset("clock"), prompt: "Touch the clock." },
  { word: "apple", thai: "แอปเปิล", image: asset("apple"), prompt: "Choose the apple." },
  { word: "banana", thai: "กล้วย", image: asset("banana"), prompt: "Tap the banana." },
  { word: "ball", thai: "ลูกบอล", image: asset("ball"), prompt: "Find the ball." },
  { word: "bottle", thai: "ขวดน้ำ", image: asset("bottle"), prompt: "Touch the bottle." },
  { word: "lunch box", thai: "กล่องข้าว", image: asset("lunch-box"), prompt: "Choose the lunch box." },
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
const teacherAudioBase = "/assets/english-p1/audio/";
const gamificationLessonId = "english-p1-unit1-school-bag";

let currentIndex = Number(localStorage.getItem("101future.schoolBagMission.index") || 0);
let score = Number(localStorage.getItem("101future.schoolBagMission.score") || 0);
let draggedWord = "";
let isTransitioning = false;
let correctBurstTimer = 0;
let nextPromptTimer = 0;
let missionStarted = false;
let audioContext = null;
let activeTeacherAudio = null;
let teacherAudioToken = 0;

installNoZoomGuard();

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
window.FutureGamification?.initMissionShell({
  lessonId: gamificationLessonId,
  title: "Pack My School Bag",
  totalQuestions: missionItems.length,
  mascotEmotion: "greeting",
  mascotText: "น้องฟิวจะช่วยเก็บของใส่กระเป๋าให้ครบ 20 คำ!",
});

soundButton?.addEventListener("click", () => {
  if (!missionStarted) {
    startMission();
    return;
  }
  speakPrompt();
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
  renderChoices(target);
  if (promptHint) promptHint.textContent = `ด่าน ${currentIndex + 1} จาก ${missionItems.length}`;
  promptText.textContent = target.prompt;
  stars.textContent = `${score}/${missionItems.length}`;
  feedback.innerHTML = `<strong>ฟังคำถาม</strong><span>แล้วแตะรูปที่ตรงกับคำว่า ${escapeHtml(target.word)}</span>`;
  missionScreen?.classList.remove("awaiting-start");
}

function renderChoices(target) {
  if (!itemsBox) return;
  const choices = choiceSetFor(target);
  itemsBox.innerHTML = choices.map((item) => `
    <button class="mission-item mission-object" type="button" draggable="true" data-word="${escapeHtml(item.word)}" data-thai="${escapeHtml(item.thai)}">
      <img class="object-image object-image-${escapeHtml(slugifyWord(item.word))}" src="${escapeHtml(item.image)}" alt="" />
      <strong>${escapeHtml(item.word)}</strong>
      <small>${escapeHtml(item.thai)}</small>
    </button>
  `).join("");

  itemsBox.querySelectorAll(".mission-item").forEach((item) => {
    item.addEventListener("click", () => chooseItem(item.dataset.word || "", item));
    item.addEventListener("dragstart", (event) => {
      draggedWord = item.dataset.word || "";
      event.dataTransfer?.setData("text/plain", draggedWord);
    });
    item.classList.toggle("target-hint", item.dataset.word === target.word);
  });
}

function choiceSetFor(target) {
  const start = currentIndex * 3 + 1;
  const distractors = [];
  for (let offset = 0; distractors.length < 3 && offset < missionItems.length * 2; offset += 1) {
    const item = missionItems[(start + offset) % missionItems.length];
    if (item.word !== target.word && !distractors.some((entry) => entry.word === item.word)) distractors.push(item);
  }
  return shuffleStable([target, ...distractors], currentIndex);
}

function shuffleStable(items, seed) {
  return items
    .map((item, index) => ({ item, sort: Math.sin((seed + 1) * 97 + index * 31) }))
    .sort((a, b) => a.sort - b.sort)
    .map((entry) => entry.item);
}

function slugifyWord(word) {
  return String(word).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function audioFileForWord(word) {
  return `${slugifyWord(word)}.mp3`;
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
    window.FutureGamification?.recordQuestion({
      lessonId: gamificationLessonId,
      questionId: target.word,
      correct: false,
      target: target.word,
      selected: selected.word,
      skillTag: target.word,
      totalQuestions: missionItems.length,
    });
    const selectedPhrase = `No. ${thingPhrase(selected)}.`;
    feedback.innerHTML = `
      <strong>${escapeHtml(selectedPhrase)}</strong>
      <span>โจทย์ถามหา ${escapeHtml(target.word)} (${escapeHtml(target.thai)}) ลองแตะรูปที่ถูกอีกครั้ง</span>
    `;
    highlightTarget(target.word);
    playTeacherAudio(["try-again.mp3", audioFileForWord(selected.word)]);
    return;
  }

  item.classList.remove("correct");
  void item.offsetWidth;
  item.classList.add("correct");
  playUiSound("correct");
  animateItemToBag(item);
  addPackedItem(target);
  showCorrectBurst(target);
  lockMission();
  recordAttempt({ correct: true, selected: target, target });
  window.FutureGamification?.recordQuestion({
    lessonId: gamificationLessonId,
    questionId: target.word,
    correct: true,
    target: target.word,
    selected: target.word,
    skillTag: target.word,
    totalQuestions: missionItems.length,
  });
  currentIndex += 1;
  score += 1;
  saveProgress();
  stars.textContent = `${score}/${missionItems.length}`;
  feedback.innerHTML = `<strong>Correct!</strong><span>${escapeHtml(target.word)} = ${escapeHtml(target.thai)}</span>`;

  const advanceAfterPraise = () => {
    window.clearTimeout(nextPromptTimer);
    nextPromptTimer = window.setTimeout(advanceMission, 700);
  };
  playTeacherAudio(["correct.mp3", audioFileForWord(target.word)], { onEnd: advanceAfterPraise });
}

function advanceMission() {
  if (currentIndex >= missionItems.length) {
    unlockMission();
    completeMission();
    return;
  }

  renderMission();
  unlockMission();
  window.setTimeout(speakPrompt, 650);
}

function renderStartScreen() {
  const hasProgress = currentIndex > 0;
  missionStarted = false;
  stars.textContent = `${score}/${missionItems.length}`;
  if (promptHint) promptHint.textContent = hasProgress ? "เล่นต่อจากด่านที่ค้างไว้" : "กดเริ่ม แล้วฟังคำถามแรก";
  promptText.textContent = hasProgress ? "Ready to continue?" : "Ready to play 20 picture rounds?";
  feedback.innerHTML = hasProgress
    ? "<strong>Mission 1</strong><span>กด Resume Mission แล้วเล่นด่านถัดไป</span>"
    : "<strong>Mission 1</strong><span>20 ด่าน ฟังคำศัพท์ แล้วแตะรูปภาพให้ถูก</span>";
  missionScreen?.classList.add("awaiting-start");
  setSoundButtonStart(hasProgress);
  itemsBox.innerHTML = "";
  renderChoices(currentTarget());
  itemsBox?.querySelectorAll(".mission-item").forEach((item) => {
    item.disabled = true;
    item.classList.remove("target-hint", "target-hint-strong", "correct", "wrong");
  });
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

function highlightTarget(word) {
  itemsBox?.querySelectorAll(".mission-item").forEach((node) => {
    node.classList.toggle("target-hint-strong", node.dataset.word === word);
  });
  window.setTimeout(() => {
    itemsBox?.querySelectorAll(".mission-item").forEach((node) => node.classList.remove("target-hint-strong"));
  }, 1500);
}

function addPackedItem(item) {
  if (!packedItems) return;
  const chip = document.createElement("span");
  chip.textContent = item.word;
  packedItems.append(chip);
  while (packedItems.children.length > 4) {
    packedItems.firstElementChild?.remove();
  }
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
  }, 2000);
}

function showWrongBubble(item, selected) {
  item.querySelector(".object-feedback-bubble")?.remove();
  const bubble = document.createElement("span");
  bubble.className = "object-feedback-bubble wrong-bubble";
  bubble.innerHTML = `<strong>${escapeHtml(selected.word)}</strong><small>${escapeHtml(selected.thai)}</small>`;
  item.append(bubble);
  window.setTimeout(() => bubble.remove(), 2000);
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
  if (!packedItems) return;
  packedItems.innerHTML = "";
  missionItems.slice(0, currentIndex).forEach(addPackedItem);
}

function completeMission() {
  missionStarted = false;
  playUiSound("complete");
  const rewardSummary = window.FutureGamification?.completeLesson({
    lessonId: gamificationLessonId,
    title: "Pack My School Bag",
    score,
    totalQuestions: missionItems.length,
  });
  stars.textContent = `${score}/${missionItems.length}`;
  if (promptHint) promptHint.textContent = "Mission นี้จบแล้ว";
  promptText.textContent = "Great job!";
  feedback.innerHTML = `<strong>Mission complete</strong><span>เล่นครบ 20 ด่านแล้ว</span>`;
  playTeacherAudio(["great-job.mp3", "lesson-complete.mp3"]);
  completeBox?.classList.remove("hidden");
  if (completeBox) {
    completeBox.innerHTML = `
      <span class="mini-label">สรุปสำหรับผู้ปกครอง</span>
      <h3>Picture Word Star</h3>
      <p>วันนี้เด็กฝึกฟังคำศัพท์และเลือกรูปภาพครบ ${missionItems.length} คำ โดยยังไม่ต้องฝึกประโยคยาว</p>
      <div class="mission-result-stats" aria-label="ผลการเล่น">
        <span>Words: ${missionItems.length}</span>
        <span>Score: ${score}/${missionItems.length}</span>
      </div>
      ${window.FutureGamification?.renderLessonReward(rewardSummary) || ""}
      <button id="restartMissionButton" class="button primary" type="button">Play again</button>
      <a class="button secondary" href="/learn">Back</a>
    `;
    completeBox.querySelector("#restartMissionButton")?.addEventListener("click", restartMission);
  }
  window.FutureGamification?.showCelebration({
    title: "เก็บของครบแล้ว!",
    message: "Mission 1 จบแล้ว ได้ดาว XP และเช็ก streak วันนี้",
    summary: rewardSummary,
  });
  localStorage.setItem("101future.schoolBagMission.completedAt", new Date().toISOString());
}

function restartMission() {
  window.clearTimeout(correctBurstTimer);
  window.clearTimeout(nextPromptTimer);
  stopTeacherAudio();
  unlockMission();
  currentIndex = 0;
  score = 0;
  saveProgress();
  if (packedItems) packedItems.innerHTML = "";
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
  const target = currentTarget();
  playTeacherAudio(["tap-the-picture.mp3", audioFileForWord(target.word)], { onEnd: () => setSpeaking(false) });
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
    mission: "english-p1-unit1-school-bag",
    target: target.word,
    targetThai: target.thai,
    selected: selected.word,
    selectedThai: selected.thai,
    correct,
    round: currentIndex + 1,
    createdAt: new Date().toISOString(),
  });
  localStorage.setItem("101future.learningAttempts", JSON.stringify(attempts.slice(-120)));
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
    start: [[523, 0.1, 0, 0.05], [659, 0.1, 0.09, 0.05], [784, 0.16, 0.18, 0.055]],
    prompt: [[740, 0.08, 0, 0.035], [880, 0.08, 0.08, 0.032]],
    correct: [[660, 0.11, 0, 0.055], [880, 0.16, 0.11, 0.06], [1046, 0.22, 0.26, 0.05]],
    wrong: [[220, 0.12, 0, 0.04, 185], [164, 0.16, 0.11, 0.035, 146]],
    drop: [[392, 0.09, 0, 0.035], [294, 0.12, 0.08, 0.03]],
    complete: [[523, 0.1, 0, 0.05], [659, 0.1, 0.1, 0.052], [784, 0.1, 0.2, 0.055], [1046, 0.26, 0.32, 0.05]],
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

function thingPhrase(item) {
  if (item.word === "scissors") return "These are scissors";
  if (item.word === "glue") return "This is glue";
  return `This is ${withArticle(item.word)}`;
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

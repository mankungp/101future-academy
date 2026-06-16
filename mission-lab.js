const curriculumUrl = "/curriculum/english-p1.json";
const imageBase = "/assets/english-p1/images/";
const audioBase = "/assets/english-p1/audio/";
const schoolBagAssetVersion = "20260531-real-objects-v2";
const schoolBagFallbackImages = new Set([
  "apple",
  "ball",
  "banana",
  "board",
  "book",
  "bottle",
  "chair",
  "clock",
  "crayon",
  "desk",
  "eraser",
  "glue",
  "lunch-box",
  "notebook",
  "pen",
  "pencil",
  "ruler",
  "school-bag",
  "scissors",
  "sharpener",
]);
const gameModes = [
  {
    id: "word-match",
    title: "จับคู่รูป-คำ",
    label: "Match",
    prompt: "ดูรูป แล้วแตะคำที่ตรงกัน",
  },
  {
    id: "bag-drag",
    title: "ลากเข้าเป้าหมาย",
    label: "Drag",
    prompt: "ลากหรือแตะรูปที่ได้ยิน",
  },
  {
    id: "speed-tap",
    title: "Speed Tap",
    label: "Speed",
    prompt: "แตะให้ทันก่อนดาวหมดเวลา",
  },
];
const SPEED_TAP_MS = 6200;

const gameList = document.querySelector("#gameList");
const gameSelect = document.querySelector("#gameSelect");
const labEyebrow = document.querySelector("#labEyebrow");
const labTitle = document.querySelector("#labTitle");
const labSubtitle = document.querySelector("#labSubtitle");
const gameBadge = document.querySelector("#gameBadge");
const gameTitle = document.querySelector("#gameTitle");
const gameDescription = document.querySelector("#gameDescription");
const roundProgress = document.querySelector("#roundProgress");
const promptText = document.querySelector("#missionPromptText");
const promptHint = document.querySelector("#missionPromptHint");
const stars = document.querySelector("#missionStars");
const itemsBox = document.querySelector("#missionItems");
const feedback = document.querySelector("#missionFeedback");
const completeBox = document.querySelector("#missionComplete");
const soundButton = document.querySelector("#missionSoundButton");
const missionScreen = document.querySelector(".mission-screen");
const teacherCard = document.querySelector(".lab-teacher-card");
const correctBurst = document.querySelector("#correctBurst");
const correctBurstWord = document.querySelector("#correctBurstWord");

const params = new URLSearchParams(location.search);
const forceLearnRequested = params.get("learn") === "1";
let curriculum = null;
let playableUnits = [];
let currentUnitIndex = 0;
let currentRound = 0;
let score = 0;
let missionStarted = false;
let isTransitioning = false;
let correctBurstTimer = 0;
let nextPromptTimer = 0;
let speedTimer = 0;
let speedTickTimer = 0;
let currentModeId = gameModes[0].id;
let pointerDrag = null;
let audioContext = null;
let activeTeacherAudio = null;
let teacherAudioToken = 0;
let learnPhase = null;

installNoZoomGuard();
loadCurriculum().catch((error) => {
  if (labTitle) labTitle.textContent = "โหลดบทเรียนไม่สำเร็จ";
  if (feedback) feedback.innerHTML = `<strong>ขออภัย</strong><span>${escapeHtml(error.message || "ไม่พบไฟล์หลักสูตร")}</span>`;
});

gameSelect?.addEventListener("change", () => {
  loadUnitByIndex(Number(gameSelect.value || 0), { reset: true, updateUrl: true });
});

soundButton?.addEventListener("click", () => {
  if (!missionStarted) {
    startMission();
    return;
  }
  playPromptAudio();
});

async function loadCurriculum() {
  const response = await fetch(curriculumUrl);
  if (!response.ok) throw new Error("โหลด curriculum/english-p1.json ไม่ได้");
  curriculum = await response.json();
  playableUnits = (curriculum.units || [])
    .filter((unit) => Number(unit.order) >= 2)
    .map(normalizeUnit)
    .filter((unit) => unit.entries.length);
  if (!playableUnits.length) throw new Error("ยังไม่มี unit ที่เล่นได้");
  currentUnitIndex = initialUnitIndex();
  renderUnitPicker();
  loadUnitByIndex(currentUnitIndex, { reset: true, updateUrl: false });
}

function normalizeUnit(unit) {
  const entries = (unit.vocab || unit.items || [])
    .map((entry, index) => normalizeEntry(unit, entry, index))
    .filter((entry) => entry.key && entry.label && entry.audio);
  return {
    id: unit.id,
    order: Number(unit.order || 0),
    title: unit.title || `Unit ${unit.order}`,
    theme: unit.theme || "",
    status: unit.status || "",
    lessonId: lessonIdForUnit(unit),
    entries,
  };
}

function normalizeEntry(unit, entry, index) {
  const key = entry.key || entry.letter || entry.en || `item-${index + 1}`;
  const image = entry.image || key;
  const audio = entry.audio || key;
  const english = entry.en || entry.word || entry.letter || key;
  const label = unit.id === "u2-abc-phonics" && entry.letter
    ? `${entry.letter.toUpperCase()} · ${entry.en}`
    : english;
  const prompt = promptForEntry(unit, entry, label);
  return {
    key: String(key),
    imageKey: String(image),
    audioKey: String(audio),
    label: String(label),
    english: String(english),
    thai: String(entry.th || entry.sound || ""),
    prompt,
    sentence: String(entry.sentence || prompt),
    imageSrc: resolveImageSrc(unit, image),
    fallbackImageSrc: resolveFallbackImageSrc(unit, image),
    audio: `${audioBase}${encodeURIComponent(audio)}.mp3`,
  };
}

function promptForEntry(unit, entry, label) {
  if (unit.id === "u2-abc-phonics" && entry.letter) return `Find ${entry.en}.`;
  if (unit.id === "u4-classroom-commands") return `Listen. ${entry.en || label}`;
  if (unit.id === "u5-numbers-1-20") return `Find number ${entry.digit || entry.en}.`;
  if (unit.id === "u6-colors") return `What color is it? ${entry.en || label}.`;
  if (unit.id === "u7-my-family") return `Who is it? ${entry.en || label}.`;
  if (unit.id === "u11-feelings") return `How are you? ${entry.en || label}.`;
  return `What is it? ${entry.en || label}.`;
}

function resolveImageSrc(unit, image) {
  if (!image) return "";
  const value = String(image);
  if (value.startsWith("/")) return value;
  if (unit.order === 1) return schoolBagImage(value);
  return `${imageBase}${encodeURIComponent(value)}.png`;
}

function resolveFallbackImageSrc(unit, image) {
  if (!image) return "";
  const value = String(image);
  if (unit.order === 1) return "";
  if (schoolBagFallbackImages.has(value)) return schoolBagImage(value);
  return "";
}

function schoolBagImage(image) {
  return `/assets/school-bag/${encodeURIComponent(image)}.svg?v=${schoolBagAssetVersion}`;
}

function lessonIdForUnit(unit) {
  const order = Number(unit.order || 0);
  const existing = window.FutureGamification?.lessons?.find((lesson) => lesson.unit === `Unit ${order}` && lesson.title === unit.title);
  return existing?.id || `english-p1-unit${order}-${slugify(unit.title)}`;
}

function initialUnitIndex() {
  const unitParam = params.get("unit") || "";
  const idParam = params.get("id") || "";
  const order = Number(unitParam);
  const foundById = idParam ? playableUnits.findIndex((unit) => unit.id === idParam) : -1;
  if (foundById >= 0) return foundById;
  const foundByOrder = Number.isFinite(order) ? playableUnits.findIndex((unit) => unit.order === order) : -1;
  return foundByOrder >= 0 ? foundByOrder : 0;
}

function renderUnitPicker() {
  if (gameSelect) {
    gameSelect.innerHTML = playableUnits.map((unit, index) => `
      <option value="${index}">Unit ${unit.order} · ${escapeHtml(unit.title)}</option>
    `).join("");
  }
  if (!gameList) return;
  gameList.innerHTML = playableUnits.map((unit, index) => `
    <button class="game-picker ${index === currentUnitIndex ? "active" : ""}" type="button" data-unit-index="${index}">
      <span>${String(unit.order).padStart(2, "0")}</span>
      <strong>${escapeHtml(unit.title)}</strong>
    </button>
  `).join("");
  gameList.querySelectorAll(".game-picker").forEach((button) => {
    button.addEventListener("click", () => loadUnitByIndex(Number(button.dataset.unitIndex || 0), { reset: true, updateUrl: true }));
  });
}

function loadUnitByIndex(index, options = {}) {
  currentUnitIndex = Math.max(0, Math.min(playableUnits.length - 1, index));
  currentRound = 0;
  score = 0;
  missionStarted = false;
  isTransitioning = false;
  window.clearTimeout(correctBurstTimer);
  window.clearTimeout(nextPromptTimer);
  clearSpeedTimer();
  currentModeId = gameModeForRound(currentUnit(), 0).id;
  correctBurst?.classList.add("hidden");
  completeBox?.classList.add("hidden");
  missionScreen?.classList.add("awaiting-start");
  missionScreen?.classList.remove("is-transitioning", "is-speaking");
  if (gameSelect) gameSelect.value = String(currentUnitIndex);
  renderUnitPicker();
  renderUnitShell();
  renderChoices();
  setStartButton();
  if (options.updateUrl) {
    const unit = currentUnit();
    history.replaceState(null, "", `/mission/lab?unit=${unit.order}&reset=1`);
  }
  if (options.reset) {
    localStorage.removeItem(storageKey(currentUnit()));
  }
}

function currentUnit() {
  return playableUnits[currentUnitIndex] || playableUnits[0];
}

function currentQuestion() {
  return currentUnit().entries[currentRound] || currentUnit().entries[0];
}

function currentChoices() {
  const entries = currentUnit().entries;
  const target = currentQuestion();
  const choices = [target];
  let offset = 1;
  while (choices.length < Math.min(4, entries.length) && offset <= entries.length + 4) {
    const candidate = entries[(currentRound + offset * 2 + currentUnit().order) % entries.length];
    if (candidate && !choices.some((item) => item.key === candidate.key)) choices.push(candidate);
    offset += 1;
  }
  return rotateChoices(choices, currentRound + currentUnit().order);
}

function rotateChoices(choices, amount) {
  if (!choices.length) return choices;
  const copy = [...choices];
  const steps = amount % copy.length;
  return copy.slice(steps).concat(copy.slice(0, steps));
}

function renderUnitShell() {
  const unit = currentUnit();
  const total = unit.entries.length;
  const mode = gameModeForRound(unit, currentRound);
  if (labEyebrow) labEyebrow.textContent = `English Mission · ป.1 · Unit ${unit.order}`;
  if (labTitle) labTitle.textContent = unit.title;
  if (labSubtitle) labSubtitle.textContent = `ฝึก ${total} คำด้วย 3 เกมสั้น ๆ รูปภาพ และเสียงครู`;
  if (gameBadge) gameBadge.textContent = `Unit ${unit.order} · ${mode.label}`;
  if (gameTitle) gameTitle.textContent = unit.title;
  if (gameDescription) gameDescription.innerHTML = modeIntroMarkup(mode, currentQuestion(), false);
  if (stars) stars.textContent = `${score}/${total}`;
  if (promptHint) promptHint.textContent = "กดเริ่ม แล้วฟังคำแรก";
  if (promptText) promptText.textContent = "Ready?";
  if (feedback) {
    feedback.innerHTML = `<strong>${escapeHtml(unit.title)}</strong><span>กด Start แล้วมาเล่นจับคู่รูปกับเสียงกันเลย!</span>`;
  }
  renderRoundProgress();
  window.FutureGamification?.initMissionShell({
    lessonId: unit.lessonId,
    title: unit.title,
    totalQuestions: total,
    mascotEmotion: "greeting",
    mascotText: "น้องฟิวจะช่วยฟังทีละคำ แตะผิดก็ลองใหม่ได้",
  });
  learnPhase = window.FutureGamification?.createLearnPhase({
    lessonId: unit.lessonId,
    title: unit.title,
    items: unit.entries.map((entry) => ({
      id: entry.key,
      english: entry.label || entry.english,
      thai: entry.thai || entry.sentence,
      imageSrc: entry.imageSrc,
      fallbackImageSrc: entry.fallbackImageSrc,
      audioSrc: entry.audio,
      mascotText: "ฟังเสียงครู แล้วพูดตามน้องฟิว!",
    })),
    unlockAudio,
    onComplete: beginPractice,
    onSkip: beginPractice,
  });
}

function descriptionForUnit(unit) {
  if (unit.id === "u2-abc-phonics") return "ฟังเสียงตัวอักษร แล้วแตะรูปคำศัพท์ให้ถูก";
  if (unit.id === "u4-classroom-commands") return "ฟังคำสั่งในห้องเรียน แล้วแตะภาพท่าทางให้ตรง";
  if (unit.id === "u5-numbers-1-20") return "ฟังตัวเลข แล้วแตะรูปจำนวนให้ตรง";
  if (unit.id === "u6-colors") return "ฟังสี แล้วแตะภาพสีให้ถูก";
  return "ฟังคำศัพท์ แล้วแตะรูปภาพให้ตรงกับเสียงที่ได้ยิน";
}

function renderChoices() {
  if (!itemsBox) return;
  const mode = gameModeForRound(currentUnit(), currentRound);
  currentModeId = mode.id;
  missionScreen?.setAttribute("data-game-mode", mode.id);
  itemsBox.dataset.gameMode = mode.id;
  itemsBox.dataset.targetKey = currentQuestion()?.key || "";
  itemsBox.classList.remove("word-match-game", "bag-drag-game", "speed-tap-game");
  itemsBox.classList.add(`${mode.id}-game`);
  renderModeStage(mode);
  const choices = missionStarted ? currentChoices() : currentUnit().entries.slice(0, Math.min(4, currentUnit().entries.length));
  itemsBox.innerHTML = choices.map(choiceMarkup).join("");
  itemsBox.querySelectorAll(".mission-item").forEach((button) => {
    button.addEventListener("click", () => chooseItem(button.dataset.key || "", button));
    button.addEventListener("dragstart", (event) => {
      if (currentModeId !== "bag-drag") return;
      event.dataTransfer?.setData("text/plain", button.dataset.key || "");
      button.classList.add("is-dragging");
    });
    button.addEventListener("dragend", () => button.classList.remove("is-dragging"));
    button.addEventListener("pointerdown", startPointerDrag);
    button.addEventListener("mousedown", startMouseDrag);
  });
  installImageFallbacks(itemsBox);
}

function choiceMarkup(item) {
  const mode = currentMode();
  if (mode.id === "word-match") {
    return `
      <button class="mission-item mission-object lab-choice word-match-choice" type="button" data-key="${escapeHtml(item.key)}" data-thai="${escapeHtml(item.thai)}">
        <span class="game-word-card">${escapeHtml(item.label)}</span>
        <small>${escapeHtml(item.thai || item.sentence)}</small>
      </button>
    `;
  }

  return `
    <button class="mission-item mission-object lab-choice" type="button" ${mode.id === "bag-drag" ? "draggable=\"true\"" : ""} data-key="${escapeHtml(item.key)}" data-thai="${escapeHtml(item.thai)}">
      <img class="object-image" src="${escapeHtml(item.imageSrc)}" data-fallback-src="${escapeHtml(item.fallbackImageSrc)}" alt="" />
      <span class="object-image-placeholder" aria-hidden="true">${escapeHtml(item.label.slice(0, 2).toUpperCase())}</span>
      <strong>${escapeHtml(item.label)}</strong>
      <small>${escapeHtml(item.thai || item.sentence)}</small>
    </button>
  `;
}

function installImageFallbacks(root) {
  root.querySelectorAll("img.object-image").forEach((img) => {
    img.addEventListener("error", () => {
      const fallback = img.dataset.fallbackSrc || "";
      if (fallback && img.src !== new URL(fallback, location.href).href) {
        img.src = fallback;
        img.dataset.fallbackSrc = "";
        return;
      }
      img.classList.add("is-missing");
      img.setAttribute("alt", "รูปภาพยังไม่พร้อม");
      img.closest(".mission-item")?.classList.add("has-missing-image");
    }, { once: false });
  });
}

function startMission() {
  unlockAudio();
  playUiSound("start");
  stopAudioSequence();
  completeBox?.classList.add("hidden");
  if (currentRound === 0 && learnPhase && (forceLearnRequested || !learnPhase.isDone())) {
    learnPhase.start({ force: forceLearnRequested });
    return;
  }
  beginPractice();
}

function beginPractice() {
  missionStarted = true;
  completeBox?.classList.add("hidden");
  renderQuestion();
  window.setTimeout(playPromptAudio, 380);
}

function renderQuestion() {
  const question = currentQuestion();
  const mode = gameModeForRound(currentUnit(), currentRound);
  currentModeId = mode.id;
  clearSpeedTimer();
  setReplayButton();
  if (promptHint) promptHint.textContent = `ข้อ ${currentRound + 1}/${currentUnit().entries.length} · ${mode.title}`;
  if (promptText) promptText.textContent = promptForGameMode(mode, question);
  if (stars) stars.textContent = `${score}/${currentUnit().entries.length}`;
  if (feedback) {
    feedback.innerHTML = `<strong>${escapeHtml(mode.title)}</strong><span>${escapeHtml(mode.prompt)}</span>`;
  }
  missionScreen?.classList.remove("awaiting-start");
  renderChoices();
  renderRoundProgress();
}

function chooseItem(key, item) {
  if (!missionStarted || isTransitioning || !key || !item) return;
  unlockAudio();
  clearSpeedTimer();
  const question = currentQuestion();
  const selected = currentChoices().find((entry) => entry.key === key) || currentUnit().entries.find((entry) => entry.key === key) || question;
  if (key !== question.key) {
    item.classList.remove("wrong");
    void item.offsetWidth;
    item.classList.add("wrong");
    playUiSound("wrong");
    showWrongBubble(item, selected);
    recordAttempt({ correct: false, selected, target: question });
    window.FutureGamification?.recordQuestion({
      lessonId: currentUnit().lessonId,
      questionId: question.key,
      correct: false,
      target: question.label,
      selected: selected.label,
      skillTag: question.key,
      totalQuestions: currentUnit().entries.length,
    });
    if (feedback) {
      feedback.innerHTML = `
        <strong>ยังไม่ใช่</strong>
        <span>อันนี้คือ ${escapeHtml(selected.label)} (${escapeHtml(selected.thai)}) ลองหา ${escapeHtml(question.label)} อีกครั้ง</span>
      `;
    }
    highlightTarget(question.key);
    playAudioSequence([selected.audio]);
    if (currentModeId === "speed-tap") window.setTimeout(() => startSpeedTimer(), 1100);
    return;
  }

  item.classList.remove("correct");
  void item.offsetWidth;
  item.classList.add("correct");
  playUiSound("correct");
  showCorrectBurst(`${question.label} = ${question.thai || question.sentence}`);
  lockMission();
  recordAttempt({ correct: true, selected: question, target: question });
  window.FutureGamification?.recordQuestion({
    lessonId: currentUnit().lessonId,
    questionId: question.key,
    correct: true,
    target: question.label,
    selected: question.label,
    skillTag: question.key,
    totalQuestions: currentUnit().entries.length,
  });
  score += 1;
  currentRound += 1;
  if (stars) stars.textContent = `${score}/${currentUnit().entries.length}`;
  if (feedback) {
    feedback.innerHTML = `<strong>Yes, correct!</strong><span>${escapeHtml(question.label)} = ${escapeHtml(question.thai || question.sentence)}</span>`;
  }
  renderRoundProgress();
  const startedAt = Date.now();
  playAudioSequence(["/assets/english-p1/audio/correct.mp3", question.audio], {
    onEnd: () => {
      const waitMs = Math.max(0, 1800 - (Date.now() - startedAt));
      window.clearTimeout(nextPromptTimer);
      nextPromptTimer = window.setTimeout(advanceMission, waitMs);
    },
  });
}

function advanceMission() {
  clearSpeedTimer();
  if (currentRound >= currentUnit().entries.length) {
    unlockMission();
    completeMission();
    return;
  }
  renderQuestion();
  unlockMission();
  window.setTimeout(playPromptAudio, 320);
}

function completeMission() {
  missionStarted = false;
  clearSpeedTimer();
  playUiSound("complete");
  const unit = currentUnit();
  const rewardSummary = window.FutureGamification?.completeLesson({
    lessonId: unit.lessonId,
    title: unit.title,
    score,
    totalQuestions: unit.entries.length,
  });
  if (promptHint) promptHint.textContent = "Unit นี้จบแล้ว";
  if (promptText) promptText.textContent = "Great job!";
  if (feedback) {
    feedback.innerHTML = `<strong>Unit complete</strong><span>${escapeHtml(unit.title)} จบแล้ว รูปและเสียงเล่นจาก cache สำเร็จ</span>`;
  }
  completeBox?.classList.remove("hidden");
  if (completeBox) {
    const nextUnitIndex = Math.min(currentUnitIndex + 1, playableUnits.length - 1);
    completeBox.innerHTML = `
      <span class="mini-label">Unit Complete</span>
      <h3>${escapeHtml(unit.title)}</h3>
      <p>คะแนน ${score}/${unit.entries.length} ใช้ทวนคำศัพท์ รูปภาพ และเสียงของ Unit นี้</p>
      <div class="mission-result-stats" aria-label="ผลการเล่น">
        <span>Words: ${unit.entries.length}</span>
        <span>Score: ${score}/${unit.entries.length}</span>
      </div>
      ${window.FutureGamification?.renderLessonReward(rewardSummary) || ""}
      <button id="replayGameButton" class="button secondary" type="button">Play again</button>
      <button id="nextGameButton" class="button primary" type="button">Unit ถัดไป</button>
      <a class="button secondary" href="/learn">Back</a>
    `;
    completeBox.querySelector("#replayGameButton")?.addEventListener("click", () => loadUnitByIndex(currentUnitIndex, { reset: true, updateUrl: true }));
    completeBox.querySelector("#nextGameButton")?.addEventListener("click", () => loadUnitByIndex(nextUnitIndex, { reset: true, updateUrl: true }));
  }
  window.FutureGamification?.showCelebration({
    title: "ผ่าน Unit แล้ว!",
    message: `${unit.title} จบแล้ว ได้ดาวและ XP จากคำศัพท์ชุดนี้`,
    summary: rewardSummary,
  });
  setStartButton();
  saveProgress();
}

function gameModeForRound(unit, round) {
  const safeRound = Math.max(0, Number(round || 0));
  return gameModes[(Number(unit?.order || 0) + safeRound) % gameModes.length] || gameModes[0];
}

function currentMode() {
  return gameModes.find((mode) => mode.id === currentModeId) || gameModes[0];
}

function promptForGameMode(mode, question) {
  if (mode.id === "word-match") return `Which word matches this picture?`;
  if (mode.id === "bag-drag") return `Put ${question.label} in the target.`;
  if (mode.id === "speed-tap") return `Quick! Tap ${question.label}.`;
  return question.prompt;
}

function renderModeStage(mode) {
  const question = currentQuestion();
  if (gameBadge) gameBadge.textContent = `Unit ${currentUnit().order} · ${mode.label}`;
  if (gameDescription) {
    gameDescription.innerHTML = modeIntroMarkup(mode, question, missionStarted);
    installImageFallbacks(gameDescription);
  }
  teacherCard?.classList.remove("word-match-target", "bag-drop-target", "speed-tap-target", "is-drop-ready");
  teacherCard?.classList.add(`${mode.id === "word-match" ? "word-match" : mode.id === "bag-drag" ? "bag-drop" : "speed-tap"}-target`);
  installDropTarget(mode);
  if (mode.id === "speed-tap" && missionStarted) startSpeedTimer();
}

function modeIntroMarkup(mode, question, isLive) {
  if (!question) return escapeHtml(descriptionForUnit(currentUnit()));
  if (mode.id === "word-match") {
    return `
      <span class="mode-pill">จับคู่รูป-คำ</span>
      <span class="game-target-row">
        <img class="object-image game-target-thumb" src="${escapeHtml(question.imageSrc)}" data-fallback-src="${escapeHtml(question.fallbackImageSrc)}" alt="" />
        <b>แตะคำที่ตรงกับรูปนี้</b>
      </span>
    `;
  }
  if (mode.id === "bag-drag") {
    return `
      <span class="mode-pill">ลากหรือแตะ</span>
      <span class="bag-target-badge">🎒 ${escapeHtml(question.label)}</span>
      <small>ลากการ์ดมาใส่ตรงนี้ หรือแตะรูปก็ได้</small>
    `;
  }
  if (mode.id === "speed-tap") {
    return `
      <span class="mode-pill">Speed Tap</span>
      <span class="speed-meter" aria-label="เวลาในรอบนี้"><b id="speedMeterFill"></b></span>
      <small>${isLive ? `แตะ ${escapeHtml(question.label)} ก่อนดาวหมดเวลา` : "กด Start แล้วลองแตะให้ทัน"}</small>
    `;
  }
  return escapeHtml(descriptionForUnit(currentUnit()));
}

function installDropTarget(mode) {
  if (!teacherCard) return;
  teacherCard.ondragover = null;
  teacherCard.ondragleave = null;
  teacherCard.ondrop = null;
  if (mode.id !== "bag-drag") return;
  teacherCard.ondragover = (event) => {
    event.preventDefault();
    teacherCard.classList.add("is-drop-ready");
  };
  teacherCard.ondragleave = () => teacherCard.classList.remove("is-drop-ready");
  teacherCard.ondrop = (event) => {
    event.preventDefault();
    teacherCard.classList.remove("is-drop-ready");
    const key = event.dataTransfer?.getData("text/plain") || "";
    const button = findChoiceButton(key);
    if (button) chooseItem(key, button);
  };
}

function findChoiceButton(key) {
  return [...(itemsBox?.querySelectorAll(".mission-item") || [])].find((button) => button.dataset.key === key) || null;
}

function startSpeedTimer() {
  clearSpeedTimer();
  if (!missionStarted || isTransitioning || currentModeId !== "speed-tap") return;
  const questionKey = currentQuestion()?.key;
  const startedAt = Date.now();
  const fill = document.querySelector("#speedMeterFill");
  const tick = () => {
    const remaining = Math.max(0, SPEED_TAP_MS - (Date.now() - startedAt));
    const ratio = Math.max(0, Math.min(1, remaining / SPEED_TAP_MS));
    if (fill) fill.style.transform = `scaleX(${ratio})`;
    if (ratio <= 0.34) missionScreen?.classList.add("speed-warning");
  };
  tick();
  speedTickTimer = window.setInterval(tick, 120);
  speedTimer = window.setTimeout(() => handleSpeedTimeout(questionKey), SPEED_TAP_MS);
}

function clearSpeedTimer() {
  window.clearTimeout(speedTimer);
  window.clearInterval(speedTickTimer);
  speedTimer = 0;
  speedTickTimer = 0;
  missionScreen?.classList.remove("speed-warning");
}

function startPointerDrag(event) {
  if (currentModeId !== "bag-drag") return;
  const button = event.currentTarget;
  if (!button || button.disabled) return;
  pointerDrag = {
    key: button.dataset.key || "",
    button,
    startX: event.clientX,
    startY: event.clientY,
    active: false,
  };
  button.setPointerCapture?.(event.pointerId);
  button.addEventListener("pointermove", movePointerDrag);
  button.addEventListener("pointerup", finishPointerDrag, { once: true });
  button.addEventListener("pointercancel", cancelPointerDrag, { once: true });
}

function startMouseDrag(event) {
  if (currentModeId !== "bag-drag" || event.button !== 0) return;
  const button = event.currentTarget;
  if (!button || button.disabled) return;
  pointerDrag = {
    key: button.dataset.key || "",
    button,
    startX: event.clientX,
    startY: event.clientY,
    active: false,
  };
  document.addEventListener("mousemove", movePointerDrag);
  document.addEventListener("mouseup", finishPointerDrag, { once: true });
}

function movePointerDrag(event) {
  if (!pointerDrag) return;
  const distance = Math.hypot(event.clientX - pointerDrag.startX, event.clientY - pointerDrag.startY);
  if (distance > 8) {
    pointerDrag.active = true;
    pointerDrag.button.classList.add("is-dragging");
  }
  teacherCard?.classList.toggle("is-drop-ready", pointerDrag.active && isPointInTeacher(event.clientX, event.clientY));
}

function finishPointerDrag(event) {
  if (!pointerDrag) return;
  const drag = pointerDrag;
  cleanupPointerDrag();
  if (drag.active && isPointInTeacher(event.clientX, event.clientY)) {
    event.preventDefault();
    chooseItem(drag.key, drag.button);
  }
}

function cancelPointerDrag() {
  cleanupPointerDrag();
}

function cleanupPointerDrag() {
  if (!pointerDrag) return;
  pointerDrag.button.classList.remove("is-dragging");
  pointerDrag.button.removeEventListener("pointermove", movePointerDrag);
  document.removeEventListener("mousemove", movePointerDrag);
  teacherCard?.classList.remove("is-drop-ready");
  pointerDrag = null;
}

function isPointInTeacher(x, y) {
  if (!teacherCard) return false;
  const rect = teacherCard.getBoundingClientRect();
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function handleSpeedTimeout(questionKey) {
  if (!missionStarted || isTransitioning || currentModeId !== "speed-tap" || currentQuestion()?.key !== questionKey) return;
  clearSpeedTimer();
  const question = currentQuestion();
  playUiSound("wrong");
  if (feedback) {
    feedback.innerHTML = `<strong>เกือบแล้ว</strong><span>ลองแตะ ${escapeHtml(question.label)} อีกครั้งนะ</span>`;
  }
  highlightTarget(question.key);
  recordAttempt({ correct: false, selected: { label: "time-out", thai: "หมดเวลา" }, target: question });
  window.FutureGamification?.recordQuestion({
    lessonId: currentUnit().lessonId,
    questionId: question.key,
    correct: false,
    target: question.label,
    selected: "time-out",
    skillTag: question.key,
    totalQuestions: currentUnit().entries.length,
  });
  window.FutureGamification?.setMascot("encourage", "เกือบแล้ว ลองแตะอีกที!", { sound: true });
}

function renderRoundProgress() {
  if (!roundProgress) return;
  roundProgress.innerHTML = currentUnit().entries.map((entry, index) => {
    const status = index < currentRound ? "done" : index === currentRound ? "active" : "";
    return `<span class="${status}">${escapeHtml(shortLabel(entry))}</span>`;
  }).join("");
}

function shortLabel(entry) {
  return entry.english.length > 12 ? entry.english.slice(0, 11) : entry.english;
}

function playPromptAudio() {
  const question = currentQuestion();
  setSpeaking(true);
  playUiSound("prompt");
  playAudioSequence([question.audio], { onEnd: () => setSpeaking(false) });
}

function setStartButton() {
  if (!soundButton) return;
  soundButton.textContent = "Start Mission";
  soundButton.setAttribute("aria-label", "เริ่ม Mission");
  soundButton.classList.add("start-button");
}

function setReplayButton() {
  if (!soundButton) return;
  soundButton.textContent = "Listen Again";
  soundButton.setAttribute("aria-label", "ฟังอีกครั้ง");
  soundButton.classList.remove("start-button");
}

function highlightTarget(key) {
  itemsBox?.querySelectorAll(".mission-item").forEach((node) => {
    node.classList.toggle("target-hint-strong", node.dataset.key === key);
  });
  window.setTimeout(() => {
    itemsBox?.querySelectorAll(".mission-item").forEach((node) => node.classList.remove("target-hint-strong"));
  }, 1300);
}

function showWrongBubble(item, selected) {
  item.querySelector(".object-feedback-bubble")?.remove();
  const bubble = document.createElement("span");
  bubble.className = "object-feedback-bubble wrong-bubble";
  bubble.innerHTML = `<strong>${escapeHtml(selected.label)}</strong><small>${escapeHtml(selected.thai)}</small>`;
  item.append(bubble);
  window.setTimeout(() => bubble.remove(), 1700);
}

function showCorrectBurst(text) {
  if (!correctBurst) return;
  if (correctBurstWord) correctBurstWord.textContent = text;
  window.clearTimeout(correctBurstTimer);
  correctBurst.classList.remove("hidden", "burst-running");
  void correctBurst.offsetWidth;
  correctBurst.classList.add("burst-running");
  correctBurstTimer = window.setTimeout(() => {
    correctBurst.classList.add("hidden");
    correctBurst.classList.remove("burst-running");
  }, 1800);
}

function lockMission() {
  isTransitioning = true;
  missionScreen?.classList.add("is-transitioning");
}

function unlockMission() {
  isTransitioning = false;
  missionScreen?.classList.remove("is-transitioning");
}

function setSpeaking(isSpeaking) {
  missionScreen?.classList.toggle("is-speaking", Boolean(isSpeaking));
}

function recordAttempt({ correct, selected, target }) {
  const attempts = readAttempts();
  attempts.push({
    mission: "english-p1-curriculum-lab",
    unit: currentUnit().id,
    unitTitle: currentUnit().title,
    target: target.label,
    selected: selected.label,
    correct,
    createdAt: new Date().toISOString(),
  });
  localStorage.setItem("101future.learningAttempts", JSON.stringify(attempts.slice(-160)));
}

function readAttempts() {
  try {
    const parsed = JSON.parse(localStorage.getItem("101future.learningAttempts") || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveProgress() {
  try {
    localStorage.setItem(storageKey(currentUnit()), JSON.stringify({ currentRound, score, savedAt: new Date().toISOString() }));
  } catch {
    /* ignore storage */
  }
}

function storageKey(unit) {
  return `101future.curriculumLab.${unit.id}`;
}

async function playAudioSequence(files, options = {}) {
  teacherAudioToken += 1;
  const token = teacherAudioToken;
  stopActiveAudio();
  for (const file of files.filter(Boolean)) {
    if (token !== teacherAudioToken) return;
    await playAudioFile(file, token);
  }
  if (token === teacherAudioToken && typeof options.onEnd === "function") options.onEnd();
}

function playAudioFile(file, token) {
  return new Promise((resolve) => {
    const audio = new Audio(file);
    activeTeacherAudio = audio;
    const finish = () => {
      audio.removeEventListener("ended", finish);
      audio.removeEventListener("error", finish);
      if (activeTeacherAudio === audio) activeTeacherAudio = null;
      resolve();
    };
    audio.addEventListener("ended", finish, { once: true });
    audio.addEventListener("error", finish, { once: true });
    audio.play().catch(finish);
    window.setTimeout(() => {
      if (token === teacherAudioToken && activeTeacherAudio === audio) finish();
    }, 5200);
  });
}

function stopAudioSequence() {
  teacherAudioToken += 1;
  stopActiveAudio();
}

function stopActiveAudio() {
  if (!activeTeacherAudio) return;
  try {
    activeTeacherAudio.pause();
    activeTeacherAudio.currentTime = 0;
  } catch {
    /* ignore audio cleanup */
  }
  activeTeacherAudio = null;
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

function slugify(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}

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
const correctBurst = document.querySelector("#correctBurst");
const correctBurstWord = document.querySelector("#correctBurstWord");

const params = new URLSearchParams(location.search);
let curriculum = null;
let playableUnits = [];
let currentUnitIndex = 0;
let currentRound = 0;
let score = 0;
let missionStarted = false;
let isTransitioning = false;
let correctBurstTimer = 0;
let nextPromptTimer = 0;
let audioContext = null;
let activeTeacherAudio = null;
let teacherAudioToken = 0;

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
  if (labEyebrow) labEyebrow.textContent = `English Mission · ป.1 · Unit ${unit.order}`;
  if (labTitle) labTitle.textContent = unit.title;
  if (labSubtitle) labSubtitle.textContent = `ฝึก ${total} คำด้วยรูปและเสียงครูจาก cache`;
  if (gameBadge) gameBadge.textContent = `Unit ${unit.order}`;
  if (gameTitle) gameTitle.textContent = unit.title;
  if (gameDescription) gameDescription.textContent = descriptionForUnit(unit);
  if (stars) stars.textContent = `${score}/${total}`;
  if (promptHint) promptHint.textContent = "กดเริ่ม แล้วฟังคำแรก";
  if (promptText) promptText.textContent = "Ready?";
  if (feedback) {
    feedback.innerHTML = `<strong>${escapeHtml(unit.title)}</strong><span>รูปโหลดจาก ${escapeHtml(imageBase)} และเสียงจาก ${escapeHtml(audioBase)}</span>`;
  }
  renderRoundProgress();
  window.FutureGamification?.initMissionShell({
    lessonId: unit.lessonId,
    title: unit.title,
    totalQuestions: total,
    mascotEmotion: "greeting",
    mascotText: "น้องฟิวจะช่วยฟังทีละคำ แตะผิดก็ลองใหม่ได้",
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
  const choices = missionStarted ? currentChoices() : currentUnit().entries.slice(0, Math.min(4, currentUnit().entries.length));
  itemsBox.innerHTML = choices.map(choiceMarkup).join("");
  itemsBox.querySelectorAll(".mission-item").forEach((button) => {
    button.addEventListener("click", () => chooseItem(button.dataset.key || "", button));
  });
  installImageFallbacks(itemsBox);
}

function choiceMarkup(item) {
  return `
    <button class="mission-item mission-object lab-choice" type="button" data-key="${escapeHtml(item.key)}" data-thai="${escapeHtml(item.thai)}">
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
  missionStarted = true;
  completeBox?.classList.add("hidden");
  renderQuestion();
  window.setTimeout(playPromptAudio, 380);
}

function renderQuestion() {
  const question = currentQuestion();
  setReplayButton();
  if (promptHint) promptHint.textContent = `ข้อ ${currentRound + 1}/${currentUnit().entries.length}`;
  if (promptText) promptText.textContent = question.prompt;
  if (stars) stars.textContent = `${score}/${currentUnit().entries.length}`;
  if (feedback) {
    feedback.innerHTML = `<strong>ฟังเสียงครู</strong><span>แตะรูปที่ตรงกับคำที่ได้ยิน</span>`;
  }
  missionScreen?.classList.remove("awaiting-start");
  renderChoices();
  renderRoundProgress();
}

function chooseItem(key, item) {
  if (!missionStarted || isTransitioning || !key || !item) return;
  unlockAudio();
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

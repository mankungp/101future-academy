const fallbackAssetVersion = "20260531-real-objects-v2";
const unitImageVersion = "20260605-unit1-png-v2";
const schoolBagSvg = (name) => `/assets/school-bag/${name}.svg?v=${fallbackAssetVersion}`;
const schoolBagPng = (name) => `/assets/school-bag/${name}.png?v=${fallbackAssetVersion}`;
const unitPng = (name) => `/assets/english-p1/images/${name}.png?v=${unitImageVersion}`;
const unitItem = (word, thai, phrase, imageName, fallbackImage) => ({
  word,
  thai,
  phrase,
  image: unitPng(imageName),
  fallbackImage,
});

const sentenceItems = [
  unitItem("book", "หนังสือ", "It is a book.", "book", schoolBagSvg("book")),
  unitItem("pencil", "ดินสอ", "It is a pencil.", "pencil", schoolBagPng("real-pencil")),
  unitItem("ruler", "ไม้บรรทัด", "It is a ruler.", "ruler", schoolBagSvg("ruler")),
  unitItem("eraser", "ยางลบ", "It is an eraser.", "eraser", schoolBagSvg("eraser")),
];

const micMessages = {
  denied: "ยังไม่ได้อนุญาตไมค์ ให้ผู้ปกครองกดอนุญาตในเบราว์เซอร์ แล้วกดไมค์อีกครั้ง หรือให้เด็กพูดตามแล้วกดไปต่อ",
  recognitionUnsupported: "เบราว์เซอร์นี้ยังตรวจคำพูดอัตโนมัติไม่ได้ ให้เด็กพูดตามครู แล้วกดพูดแล้วไปต่อได้เลย",
  recorderUnsupported: "เครื่องนี้ยังบันทึกเสียงไม่ได้ ให้เด็กพูดตามครู แล้วกดพูดแล้วไปต่อได้เลย",
  mediaUnsupported: "เครื่องนี้ยังใช้ไมค์ไม่ได้ ให้เด็กพูดตามครู แล้วกดพูดแล้วไปต่อได้เลย",
};

const promptText = document.querySelector("#missionPromptText");
const promptHint = document.querySelector("#missionPromptHint");
const stars = document.querySelector("#missionStars");
const feedback = document.querySelector("#missionFeedback");
const completeBox = document.querySelector("#missionComplete");
const soundButton = document.querySelector("#missionSoundButton");
const missionScreen = document.querySelector(".mission-screen");
const correctBurst = document.querySelector("#correctBurst");
const correctBurstWord = document.querySelector("#correctBurstWord");
const sentenceProgress = document.querySelector("#sentenceProgress");
const sayObjectImage = document.querySelector("#sayObjectImage");
const sayObjectPhrase = document.querySelector("#sayObjectPhrase");
const sayObjectThai = document.querySelector("#sayObjectThai");
const micButton = document.querySelector("#micButton");
const micButtonLabel = document.querySelector("#micButtonLabel");
const sayHeard = document.querySelector("#sayHeard");
const playSelfButton = document.querySelector("#playSelfButton");
const iSaidItButton = document.querySelector("#iSaidItButton");

const resetRequested = new URLSearchParams(window.location.search).get("reset") === "1";
const forceLearnRequested = new URLSearchParams(window.location.search).get("learn") === "1";
const teacherAudioBase = "/assets/english-p1/audio/";
const gamificationLessonId = "english-p1-unit1-say-it-back";

let currentIndex = Number(localStorage.getItem("101future.sayItBackMission.index") || 0);
let score = Number(localStorage.getItem("101future.sayItBackMission.score") || 0);
let retryCount = 0;
let isTransitioning = false;
let correctBurstTimer = 0;
let nextPromptTimer = 0;
let missionStarted = false;
let audioContext = null;
let activeTeacherAudio = null;
let teacherAudioToken = 0;

// Speech recognition (in-browser word match) and recorder fallback are detected lazily.
const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition || null;
let recognition = null;
let isListening = false;
let mediaRecorder = null;
let recordedChunks = [];
let recordedUrl = "";
let recordedAudio = null;

installNoZoomGuard();

if (resetRequested) {
  localStorage.removeItem("101future.sayItBackMission.index");
  localStorage.removeItem("101future.sayItBackMission.score");
  localStorage.removeItem("101future.sayItBackMission.completedAt");
  currentIndex = 0;
  score = 0;
}

if (currentIndex >= sentenceItems.length) {
  currentIndex = 0;
  score = 0;
  saveProgress();
}

renderStartScreen();
window.FutureGamification?.initMissionShell({
  lessonId: gamificationLessonId,
  title: "Say It Back",
  totalQuestions: sentenceItems.length,
  mascotEmotion: "greeting",
  mascotText: "น้องฟิวจะอยู่ข้าง ๆ ตอนฝึกพูด ไม่ต้องกลัวผิดนะ",
});
const learnPhase = window.FutureGamification?.createLearnPhase({
  lessonId: gamificationLessonId,
  title: "Say It Back",
  items: sentenceItems.map((item) => ({
    id: item.word,
    english: item.phrase,
    thai: `นี่คือ${item.thai}`,
    imageSrc: item.image,
    fallbackImageSrc: item.fallbackImage,
    audioSrc: `${teacherAudioBase}${sentenceAudioFile(item)}`,
    helper: "ฟังครู แล้วพูดประโยคนี้ตามน้องฟิว!",
    mascotText: "ลองพูดช้า ๆ ตามเสียงครูนะ",
  })),
  unlockAudio,
  onComplete: beginPractice,
  onSkip: beginPractice,
});

soundButton?.addEventListener("click", () => {
  if (!missionStarted) {
    startMission();
    return;
  }
  speakPrompt();
});

micButton?.addEventListener("click", onMicTap);
playSelfButton?.addEventListener("click", playRecording);
iSaidItButton?.addEventListener("click", () => acceptAttempt({ heard: "", selfConfirmed: true }));

function currentTarget() {
  return sentenceItems[currentIndex] || sentenceItems[0];
}

function slugifyWord(word) {
  return String(word).replace(/\s+/g, "-").replace(/[^a-z0-9-]/gi, "").toLowerCase();
}

function sentenceAudioFile(item) {
  const article = /^[aeiou]/i.test(item.word) ? "an" : "a";
  return `it-is-${article}-${slugifyWord(item.word)}.mp3`;
}

function renderMission() {
  const target = currentTarget();
  setSoundButtonReplay();
  if (promptHint) promptHint.textContent = "ฟังครูพูด แล้วกดไมค์พูดตาม";
  promptText.textContent = target.phrase;
  stars.textContent = `${score}/${sentenceItems.length}`;
  feedback.innerHTML = `<strong>พูดตามครู</strong><span>${escapeHtml(target.phrase)} = นี่คือ${escapeHtml(target.thai)}</span>`;
  missionScreen?.classList.remove("awaiting-start");
  if (sayObjectImage) {
    setImageWithFallback(sayObjectImage, target.image, target.fallbackImage || "");
    sayObjectImage.className = `object-image object-image-${slugifyWord(target.word)}`;
    sayObjectImage.alt = `รูปคำถาม: ${target.thai}`;
  }
  if (sayObjectPhrase) sayObjectPhrase.textContent = target.phrase;
  if (sayObjectThai) sayObjectThai.textContent = `นี่คือ${target.thai}`;
  renderSentenceProgress();
  resetTurnControls();
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

function resetTurnControls() {
  retryCount = 0;
  clearRecording();
  if (sayHeard) sayHeard.textContent = "";
  setMicLabel("พูดตาม");
  setMicEnabled(true);
  playSelfButton?.classList.add("say-hidden");
  iSaidItButton?.classList.add("say-hidden");
}

function onMicTap() {
  if (!missionStarted || isTransitioning) return;
  if (isListening) {
    stopListening();
    return;
  }
  unlockAudio();
  stopTeacherAudio();
  if (SpeechRecognitionClass) {
    startRecognition();
  } else {
    startRecorderFallback();
  }
}

function startRecognition() {
  try {
    recognition = new SpeechRecognitionClass();
  } catch {
    startRecorderFallback();
    return;
  }
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 3;
  recognition.continuous = false;

  let gotResult = false;
  setListeningUi(true);
  if (sayHeard) sayHeard.textContent = "กำลังฟัง... พูดเลย";

  recognition.onresult = (event) => {
    gotResult = true;
    const heardOptions = [];
    for (let i = 0; i < event.results.length; i += 1) {
      const result = event.results[i];
      for (let j = 0; j < result.length; j += 1) {
        heardOptions.push(result[j].transcript);
      }
    }
    handleHeard(heardOptions);
  };
  recognition.onerror = (event) => {
    setListeningUi(false);
    if (event.error === "not-allowed" || event.error === "service-not-allowed") {
      offerManualPath(micMessages.denied, { allowMicRetry: true });
    } else if (event.error === "no-speech") {
      if (sayHeard) sayHeard.textContent = "ครูยังไม่ได้ยินเสียง ลองกดไมค์แล้วพูดอีกครั้ง";
      offerRetryControls();
    } else {
      startRecorderFallback();
    }
  };
  recognition.onend = () => {
    setListeningUi(false);
    if (!gotResult && missionStarted && !isTransitioning) {
      // No result event fired (some browsers). Let the child retry or move on.
      offerRetryControls();
    }
  };

  try {
    recognition.start();
  } catch {
    setListeningUi(false);
    startRecorderFallback();
  }
}

function stopListening() {
  try {
    recognition?.stop();
  } catch {
    /* ignore */
  }
  if (mediaRecorder && mediaRecorder.state === "recording") {
    try {
      mediaRecorder.stop();
    } catch {
      /* ignore */
    }
  }
}

function handleHeard(heardOptions) {
  const target = currentTarget();
  const matched = heardOptions.some((text) => transcriptMatchesWord(text, target.word));
  const heardText = (heardOptions[0] || "").trim();
  if (matched) {
    acceptAttempt({ heard: heardText, selfConfirmed: false });
    return;
  }
  retryCount += 1;
  recordAttempt({ correct: false, heard: heardText, selfConfirmed: false, target });
  window.FutureGamification?.recordQuestion({
    lessonId: gamificationLessonId,
    questionId: target.word,
    correct: false,
    target: target.word,
    selected: heardText || "no speech",
    skillTag: target.word,
    totalQuestions: sentenceItems.length,
  });
  if (sayHeard) {
    sayHeard.innerHTML = heardText
      ? `ครูได้ยินว่า <strong>${escapeHtml(heardText)}</strong> ลองพูด ${escapeHtml(target.phrase)} อีกครั้งนะ`
      : "ยังไม่ชัดเท่าไหร่ ลองพูดอีกครั้งช้า ๆ นะ";
  }
  playUiSound("wrong");
  playTeacherAudio(["almost-try-again.mp3", sentenceAudioFile(target)]);
  offerRetryControls();
}

// Fallback: record the child's own voice locally so they can hear themselves, then self-confirm.
function startRecorderFallback() {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    offerManualPath(micMessages.recognitionUnsupported);
    return;
  }
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      recordedChunks = [];
      try {
        mediaRecorder = new MediaRecorder(stream);
      } catch {
        stream.getTracks().forEach((track) => track.stop());
        offerManualPath(micMessages.recorderUnsupported);
        return;
      }
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) recordedChunks.push(event.data);
      };
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        if (recordedChunks.length) {
          const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || "audio/webm" });
          recordedUrl = URL.createObjectURL(blob);
        }
        setListeningUi(false);
        if (sayHeard) sayHeard.textContent = "ฟังเสียงตัวเอง แล้วกดพูดแล้วเพื่อไปต่อได้เลย";
        playSelfButton?.classList.toggle("say-hidden", !recordedUrl);
        offerRetryControls();
      };
      setListeningUi(true);
      if (sayHeard) sayHeard.textContent = "กำลังอัด... พูดเลย แล้วกดอีกครั้งเพื่อหยุด";
      mediaRecorder.start();
      // Safety auto-stop so young children are not stuck recording.
      window.setTimeout(() => {
        if (mediaRecorder && mediaRecorder.state === "recording") mediaRecorder.stop();
      }, 4000);
    })
    .catch((error) => {
      if (error?.name === "NotAllowedError" || error?.name === "SecurityError") {
        offerManualPath(micMessages.denied, { allowMicRetry: true });
        return;
      }
      offerManualPath(micMessages.mediaUnsupported);
    });
}

function offerManualPath(message, options = {}) {
  setListeningUi(false);
  if (sayHeard) sayHeard.textContent = message;
  const allowMicRetry = Boolean(options.allowMicRetry);
  setMicEnabled(allowMicRetry);
  setMicLabel(allowMicRetry ? "ลองเปิดไมค์อีกครั้ง" : "พูดตามเอง");
  iSaidItButton?.classList.remove("say-hidden");
}

function offerRetryControls() {
  setMicLabel("พูดอีกครั้ง");
  setMicEnabled(true);
  iSaidItButton?.classList.remove("say-hidden");
}

function acceptAttempt({ heard, selfConfirmed }) {
  if (isTransitioning) return;
  const target = currentTarget();
  setListeningUi(false);
  setMicEnabled(false);
  playSelfButton?.classList.add("say-hidden");
  iSaidItButton?.classList.add("say-hidden");
  playUiSound("correct");
  showCorrectBurst(target);
  lockMission();
  recordAttempt({ correct: true, heard, selfConfirmed, target });
  window.FutureGamification?.recordQuestion({
    lessonId: gamificationLessonId,
    questionId: target.word,
    correct: true,
    target: target.word,
    selected: heard || target.word,
    skillTag: "speaking",
    totalQuestions: sentenceItems.length,
  });
  currentIndex += 1;
  score += 1;
  saveProgress();
  stars.textContent = `${score}/${sentenceItems.length}`;
  feedback.innerHTML = `<strong>${selfConfirmed ? "เก่งมาก!" : "Yes! เก่งมาก"}</strong><span>${escapeHtml(target.phrase)} = นี่คือ${escapeHtml(target.thai)}</span>`;
  renderSentenceProgress();

  const correctStartedAt = Date.now();
  const advanceAfterPraise = () => {
    const waitMs = Math.max(0, 2600 - (Date.now() - correctStartedAt));
    window.clearTimeout(nextPromptTimer);
    nextPromptTimer = window.setTimeout(advanceMission, waitMs);
  };
  playTeacherAudio(["great-job.mp3", "well-done.mp3"], { onEnd: advanceAfterPraise });
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
  promptText.textContent = hasProgress ? "Ready to continue?" : "Ready to speak?";
  feedback.innerHTML = hasProgress
    ? "<strong>Mission 3</strong><span>กด Resume Mission แล้วพูดประโยคถัดไป</span>"
    : "<strong>Mission 3</strong><span>ฟังครูพูด It is... แล้วลองพูดตาม</span>";
  missionScreen?.classList.add("awaiting-start");
  renderSentenceProgress();
  setSoundButtonStart(hasProgress);
  setMicEnabled(false);
  setMicLabel("พูดตาม");
  playSelfButton?.classList.add("say-hidden");
  iSaidItButton?.classList.add("say-hidden");
  if (sayHeard) sayHeard.textContent = "";
}

function startMission() {
  unlockAudio();
  playUiSound("start");
  stopTeacherAudio();
  completeBox?.classList.add("hidden");
  if (currentIndex === 0 && learnPhase && (forceLearnRequested || !learnPhase.isDone())) {
    learnPhase.start({ force: forceLearnRequested });
    return;
  }
  beginPractice();
}

function beginPractice() {
  missionStarted = true;
  renderMission();
  window.setTimeout(() => {
    playTeacherAudio(["say-it-back.mp3"], { onEnd: speakPrompt });
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
  soundButton.setAttribute("aria-label", "ฟังประโยคอีกครั้ง");
  soundButton.classList.remove("start-button");
}

function setMicEnabled(enabled) {
  if (!micButton) return;
  micButton.disabled = !enabled;
}

function setMicLabel(label) {
  if (micButtonLabel) micButtonLabel.textContent = label;
}

function setListeningUi(listening) {
  isListening = listening;
  micButton?.classList.toggle("is-listening", listening);
  setMicLabel(listening ? "กำลังฟัง... กดเพื่อหยุด" : "พูดตาม");
  setSpeaking(false);
}

function renderSentenceProgress() {
  if (!sentenceProgress) return;
  sentenceProgress.innerHTML = sentenceItems.map((item, index) => {
    const status = index < currentIndex ? "done" : index === currentIndex ? "active" : "";
    return `<span class="${status}">${escapeHtml(item.word)}</span>`;
  }).join("");
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

function completeMission() {
  missionStarted = false;
  playUiSound("complete");
  const rewardSummary = window.FutureGamification?.completeLesson({
    lessonId: gamificationLessonId,
    title: "Say It Back",
    score,
    totalQuestions: sentenceItems.length,
  });
  stars.textContent = `${score}/${sentenceItems.length}`;
  if (promptHint) promptHint.textContent = "Mission นี้จบแล้ว";
  promptText.textContent = "Great job!";
  feedback.innerHTML = `<strong>Mission complete</strong><span>เด็กได้ลองพูดประโยค It is... ครบทุกคำแล้ว</span>`;
  playTeacherAudio(["you-did-it.mp3", "lesson-complete.mp3"]);
  completeBox?.classList.remove("hidden");
  if (completeBox) {
    completeBox.innerHTML = `
      <span class="mini-label">สรุปสำหรับผู้ปกครอง</span>
      <h3>Speaking Practice</h3>
      <p>วันนี้ลูกฝึกพูด It is a book, It is a pencil, It is a ruler และ It is an eraser.</p>
      <div class="mission-result-stats" aria-label="ผลการเล่น">
        <span>Sentences: ${sentenceItems.length}</span>
        <span>Score: ${score}/${sentenceItems.length}</span>
      </div>
      ${window.FutureGamification?.renderLessonReward(rewardSummary) || ""}
      ${renderParentRetrySummary()}
      <button id="restartMissionButton" class="button primary" type="button">Play again</button>
      <a class="button secondary" href="/learn">Back</a>
    `;
    completeBox.querySelector("#restartMissionButton")?.addEventListener("click", restartMission);
  }
  window.FutureGamification?.showCelebration({
    title: "พูดครบแล้ว!",
    message: "Mission 3 จบแล้ว ได้ XP และสรุปคำที่ควรทวนให้ผู้ปกครอง",
    summary: rewardSummary,
  });
  localStorage.setItem("101future.sayItBackMission.completedAt", new Date().toISOString());
}

function renderParentRetrySummary() {
  const retried = summarizeRetriedWords();
  if (!retried.length) {
    return `<p class="say-heard">ออกเสียงได้ลื่นไหลดีมาก ไม่ต้องทวนคำไหนเป็นพิเศษ</p>`;
  }
  const list = retried.map((word) => escapeHtml(word)).join(", ");
  return `<p class="say-heard">คำที่ควรชวนทวนอีกนิด: <strong>${list}</strong></p>`;
}

function summarizeRetriedWords() {
  const attempts = readAttempts().filter((entry) => entry.mission === "english-p1-unit1-say-it-back");
  const wrongByWord = new Set();
  attempts.forEach((entry) => {
    if (entry.correct === false && entry.target) wrongByWord.add(entry.target);
  });
  return [...wrongByWord];
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
  beginPractice();
}

function speakPrompt() {
  setSpeaking(true);
  playUiSound("prompt");
  playTeacherAudio([sentenceAudioFile(currentTarget())], { onEnd: () => setSpeaking(false) });
}

function playRecording() {
  if (!recordedUrl) return;
  unlockAudio();
  if (!recordedAudio) recordedAudio = new Audio();
  recordedAudio.src = recordedUrl;
  recordedAudio.currentTime = 0;
  recordedAudio.play().catch(() => {
    /* ignore playback rejection */
  });
}

function clearRecording() {
  if (recordedUrl) {
    URL.revokeObjectURL(recordedUrl);
    recordedUrl = "";
  }
  recordedChunks = [];
}

function transcriptMatchesWord(transcript, word) {
  const cleaned = String(transcript || "").toLowerCase().replace(/[^a-z\s]/g, " ");
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  if (tokens.includes(word)) return true;
  // Accept a couple of gentle near-misses so young speakers are not blocked.
  const nearMisses = {
    eraser: ["erase", "razor", "eraze"],
    ruler: ["rular", "roller"],
    pencil: ["pencel", "pensil"],
    book: ["boo", "books"],
  };
  return (nearMisses[word] || []).some((variant) => tokens.includes(variant));
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

function recordAttempt({ correct, heard, selfConfirmed, target }) {
  const attempts = readAttempts();
  attempts.push({
    mission: "english-p1-unit1-say-it-back",
    target: target.word,
    targetPhrase: target.phrase,
    heard: heard || "",
    selfConfirmed: Boolean(selfConfirmed),
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
  localStorage.setItem("101future.sayItBackMission.index", String(currentIndex));
  localStorage.setItem("101future.sayItBackMission.score", String(score));
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

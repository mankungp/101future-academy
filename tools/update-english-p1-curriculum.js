const fs = require("fs");

const curriculumPath = "curriculum/english-p1.json";
const gamificationPath = "assets/gamification.js";

const articleFor = (word) => (/^[aeiou]/i.test(word) ? "an" : "a");
const noArticleWords = new Set(["bread", "chicken", "fish", "glue", "hair", "milk", "rice", "soup", "water"]);
const phraseFor = (word) => {
  const normalized = String(word).toLowerCase();
  return noArticleWords.has(normalized) ? word : `${articleFor(word)} ${word}`;
};
const slug = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const vocab = (en, th, extra = {}) => {
  const key = extra.key || slug(en);
  const pattern = extra.pattern || phraseFor(en);
  return {
    key,
    en,
    th,
    sentence: extra.sentence || `It is ${pattern}.`,
    image: extra.image || key,
    audio: extra.audio || key,
    tts: extra.tts || `${en}. What is it? It is ${pattern}.`,
    ...extra,
  };
};
const numberItem = (digit, en, th) => ({
  key: String(digit),
  digit,
  en,
  th,
  image: `count-${digit}`,
  audio: `num-${digit}`,
  tts: `${en}. Number ${digit}.`,
});
const command = (key, en, th, gesture, extra = {}) => ({
  key,
  en,
  th,
  gesture,
  image: extra.image || key,
  audio: extra.audio || key,
  tts: extra.tts || `${en}.`,
  ...extra,
});
const lessonFlow = (unitTitle, options = {}) => ({
  durationMinutes: "5-8",
  principle: "learn through play, one screen one task, immediate feedback under 0.5s",
  qaPattern: options.qaPattern || "What is it? It is a/an ...",
  segments: [
    {
      id: "warm-up",
      title: "Warm-up",
      time: "30-45s",
      activity: `น้องฟิวเจอร์ทักทายและเปิดภารกิจ ${unitTitle}`,
      reward: "no reward yet",
    },
    {
      id: "learn",
      title: "Learn",
      time: "1-1.5m",
      activity: options.learn || "ภาพใหญ่ + เสียงครู + repeat ช้า ๆ 2 รอบ",
      reward: "none",
    },
    {
      id: "practice",
      title: "Practice",
      time: "1.5-2m",
      activity: options.practice || "ฟังคำถาม แตะรูป/คำตอบให้ตรง ตอบผิดให้กำลังใจและเฉลยคำที่แตะ",
      reward: "star per correct answer",
    },
    {
      id: "game",
      title: "Game",
      time: "1-1.5m",
      activity: options.game || "mini-game เลือกรูปเร็วแบบไม่จับแพ้หนัก",
      reward: "bonus XP",
    },
    {
      id: "review",
      title: "Review",
      time: "30-60s",
      activity: "ทวน 1 ข้อจากบทนี้ + 1 ข้อจากคำที่เคยผิด",
      reward: "star",
    },
    {
      id: "celebration",
      title: "Celebration",
      time: "20s",
      activity: "confetti + น้องฟิวเจอร์ฉลอง + สรุปดาว/XP/streak",
      reward: "sticker if daily goal reached",
    },
  ],
});

const schoolBagVocab = [
  vocab("book", "หนังสือ"),
  vocab("pencil", "ดินสอ"),
  vocab("ruler", "ไม้บรรทัด"),
  vocab("eraser", "ยางลบ", { pattern: "an eraser" }),
  vocab("school bag", "กระเป๋านักเรียน"),
  vocab("notebook", "สมุด"),
  vocab("pen", "ปากกา"),
  vocab("crayon", "สีเทียน"),
  vocab("scissors", "กรรไกร", { sentence: "They are scissors.", tts: "scissors. What are they? They are scissors." }),
  vocab("glue", "กาว", { sentence: "It is glue.", tts: "glue. What is it? It is glue." }),
  vocab("sharpener", "กบเหลาดินสอ"),
  vocab("desk", "โต๊ะเรียน"),
  vocab("chair", "เก้าอี้"),
  vocab("board", "กระดาน"),
  vocab("clock", "นาฬิกา"),
  vocab("apple", "แอปเปิล", { pattern: "an apple" }),
  vocab("banana", "กล้วย"),
  vocab("ball", "ลูกบอล"),
  vocab("bottle", "ขวดน้ำ"),
  vocab("lunch box", "กล่องข้าว"),
];

const phonicsItems = [
  ["a", "ah", "/æ/", "apple", "แอปเปิล"],
  ["b", "buh", "/b/", "ball", "ลูกบอล"],
  ["c", "kuh", "/k/", "cat", "แมว"],
  ["d", "duh", "/d/", "dog", "หมา"],
  ["e", "eh", "/e/", "egg", "ไข่"],
  ["f", "fuh", "/f/", "fish", "ปลา"],
  ["g", "guh", "/g/", "goat", "แพะ"],
  ["h", "huh", "/h/", "hat", "หมวก"],
  ["i", "ih", "/i/", "igloo", "บ้านน้ำแข็ง"],
  ["j", "juh", "/dʒ/", "jam", "แยม"],
  ["k", "kuh", "/k/", "kite", "ว่าว"],
  ["l", "luh", "/l/", "lion", "สิงโต"],
  ["m", "muh", "/m/", "moon", "พระจันทร์"],
  ["n", "nuh", "/n/", "nest", "รัง"],
  ["o", "oh", "/ɒ/", "orange", "ส้ม"],
  ["p", "puh", "/p/", "pig", "หมู"],
  ["q", "kwuh", "/kw/", "queen", "ราชินี"],
  ["r", "ruh", "/r/", "rabbit", "กระต่าย"],
  ["s", "sss", "/s/", "sun", "พระอาทิตย์"],
  ["t", "tuh", "/t/", "tiger", "เสือ"],
  ["u", "uh", "/ʌ/", "umbrella", "ร่ม"],
  ["v", "vuh", "/v/", "van", "รถตู้"],
  ["w", "wuh", "/w/", "web", "ใยแมงมุม"],
  ["x", "ks", "/ks/", "box", "กล่อง"],
  ["y", "yuh", "/j/", "yo-yo", "โยโย่"],
  ["z", "zzz", "/z/", "zebra", "ม้าลาย"],
].map(([letter, sound, ipa, en, th]) => ({
  letter,
  sound,
  ipa,
  en,
  th,
  image: slug(en),
  audio: `phonics-${letter}`,
  tts: `${letter.toUpperCase()}. ${letter} says ${sound}. ${en}.`,
}));

const numbers = [
  [1, "one", "หนึ่ง"],
  [2, "two", "สอง"],
  [3, "three", "สาม"],
  [4, "four", "สี่"],
  [5, "five", "ห้า"],
  [6, "six", "หก"],
  [7, "seven", "เจ็ด"],
  [8, "eight", "แปด"],
  [9, "nine", "เก้า"],
  [10, "ten", "สิบ"],
  [11, "eleven", "สิบเอ็ด"],
  [12, "twelve", "สิบสอง"],
  [13, "thirteen", "สิบสาม"],
  [14, "fourteen", "สิบสี่"],
  [15, "fifteen", "สิบห้า"],
  [16, "sixteen", "สิบหก"],
  [17, "seventeen", "สิบเจ็ด"],
  [18, "eighteen", "สิบแปด"],
  [19, "nineteen", "สิบเก้า"],
  [20, "twenty", "ยี่สิบ"],
].map(([digit, en, th]) => numberItem(digit, en, th));

const colors = [
  ["red", "สีแดง", "#e53935"],
  ["blue", "สีน้ำเงิน", "#1e88e5"],
  ["yellow", "สีเหลือง", "#fdd835"],
  ["green", "สีเขียว", "#43a047"],
  ["orange", "สีส้ม", "#fb8c00"],
  ["purple", "สีม่วง", "#8e24aa"],
  ["pink", "สีชมพู", "#ec407a"],
  ["black", "สีดำ", "#212121"],
  ["white", "สีขาว", "#fafafa"],
  ["brown", "สีน้ำตาล", "#8d6e63"],
].map(([en, th, hex]) => vocab(en, th, { hex, image: `color-${en}`, audio: en === "orange" ? "color-orange" : en, sentence: `It is ${en}.`, tts: `${en}. What color is it? It is ${en}.` }));

const family = [
  ["mother", "แม่"],
  ["father", "พ่อ"],
  ["brother", "พี่ชาย/น้องชาย"],
  ["sister", "พี่สาว/น้องสาว"],
  ["baby", "น้องเล็ก/ทารก"],
  ["grandma", "คุณยาย/คุณย่า"],
  ["grandpa", "คุณตา/คุณปู่"],
  ["teacher", "ครู"],
  ["friend", "เพื่อน"],
  ["family", "ครอบครัว"],
].map(([en, th]) => vocab(en, th, { sentence: `It is my ${en}.`, tts: `${en}. Who is it? It is my ${en}.` }));

const body = [
  ["head", "ศีรษะ"],
  ["hair", "ผม"],
  ["eye", "ตา"],
  ["ear", "หู"],
  ["nose", "จมูก"],
  ["mouth", "ปาก"],
  ["tooth", "ฟัน"],
  ["hand", "มือ"],
  ["finger", "นิ้ว"],
  ["arm", "แขน"],
  ["leg", "ขา"],
  ["foot", "เท้า"],
].map(([en, th]) => {
  const pattern = phraseFor(en);
  return vocab(en, th, {
    sentence: `It is ${pattern}.`,
    tts: `${en}. What is it? It is ${pattern}. Touch your ${en}.`,
  });
});

const animals = [
  ["cat", "แมว"],
  ["dog", "หมา"],
  ["bird", "นก"],
  ["fish", "ปลา"],
  ["cow", "วัว"],
  ["pig", "หมู"],
  ["duck", "เป็ด"],
  ["chicken", "ไก่"],
  ["rabbit", "กระต่าย"],
  ["frog", "กบ"],
  ["horse", "ม้า"],
  ["sheep", "แกะ"],
  ["lion", "สิงโต"],
  ["tiger", "เสือ"],
].map(([en, th]) => vocab(en, th));

const food = [
  ["apple", "แอปเปิล"],
  ["banana", "กล้วย"],
  ["orange", "ส้ม"],
  ["mango", "มะม่วง"],
  ["grape", "องุ่น"],
  ["rice", "ข้าว"],
  ["egg", "ไข่"],
  ["milk", "นม"],
  ["water", "น้ำ"],
  ["bread", "ขนมปัง"],
  ["cake", "เค้ก"],
  ["fish", "ปลา"],
  ["chicken", "ไก่"],
  ["soup", "ซุป"],
].map(([en, th]) => {
  const pattern = phraseFor(en);
  return vocab(en, th, {
    sentence: `It is ${pattern}.`,
    tts: `${en}. What is it? It is ${pattern}. I like ${en}.`,
  });
});

const feelings = [
  ["happy", "มีความสุข"],
  ["sad", "เศร้า"],
  ["angry", "โกรธ"],
  ["sleepy", "ง่วง"],
  ["hungry", "หิว"],
  ["thirsty", "กระหายน้ำ"],
  ["hot", "ร้อน"],
  ["cold", "หนาว"],
  ["tired", "เหนื่อย"],
  ["scared", "กลัว"],
].map(([en, th]) => ({
  key: slug(en),
  en,
  th,
  sentence: `I am ${en}.`,
  image: `feeling-${slug(en)}`,
  audio: `feeling-${slug(en)}`,
  tts: `${en}. How are you? I am ${en}.`,
}));

const commands = [
  ["stand-up", "Stand up.", "ยืนขึ้น", "stand"],
  ["sit-down", "Sit down.", "นั่งลง", "sit"],
  ["open-your-book", "Open your book.", "เปิดหนังสือ", "open-book"],
  ["close-your-book", "Close your book.", "ปิดหนังสือ", "close-book"],
  ["listen", "Listen.", "ฟัง", "listen"],
  ["look", "Look.", "ดู", "look"],
  ["repeat", "Repeat.", "พูดตาม", "repeat"],
  ["raise-your-hand", "Raise your hand.", "ยกมือ", "raise-hand"],
  ["line-up", "Line up.", "เข้าแถว", "line-up"],
  ["be-quiet", "Be quiet.", "เงียบ", "quiet"],
].map(([key, en, th, gesture]) => command(key, en, th, gesture));

const culture = [
  vocab("wai", "การไหว้", { pattern: "a wai", sentence: "It is a wai.", tts: "wai. What is it? It is a wai. Say hello politely." }),
  vocab("smile", "รอยยิ้ม", { pattern: "a smile" }),
  vocab("Songkran", "สงกรานต์", { key: "songkran", pattern: "Songkran", sentence: "It is Songkran.", audio: "songkran", image: "songkran", tts: "Songkran. What is it? It is Songkran." }),
  vocab("water bowl", "ขันน้ำ", { key: "water-bowl", pattern: "a water bowl" }),
  vocab("Loy Krathong", "ลอยกระทง", { key: "loy-krathong", pattern: "Loy Krathong", sentence: "It is Loy Krathong.", audio: "loy-krathong", image: "loy-krathong" }),
  vocab("krathong", "กระทง", { pattern: "a krathong" }),
  vocab("Christmas", "คริสต์มาส", { key: "christmas", pattern: "Christmas", sentence: "It is Christmas.", audio: "christmas", image: "christmas" }),
  vocab("gift", "ของขวัญ", { pattern: "a gift" }),
  vocab("New Year", "ปีใหม่", { key: "new-year", pattern: "New Year", sentence: "It is New Year.", audio: "new-year", image: "new-year" }),
  vocab("thank you", "ขอบคุณ", { key: "thank-you", pattern: "thank you", sentence: "We say thank you.", audio: "thank-you", image: "thank-you", tts: "Thank you. We say thank you." }),
];

const curriculum = JSON.parse(fs.readFileSync(curriculumPath, "utf8"));
curriculum.version = "20260604-en-p1-core-v2";
curriculum.author = "Codex + Claude Code";
curriculum.assetGuide.imageDir = "/assets/english-p1/images/";
curriculum.scope = {
  officialAlignment: [
    "หลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน 2551 กลุ่มสาระภาษาต่างประเทศ ป.1",
    "ต1.1 เข้าใจและตีความเรื่องที่ฟัง/อ่านจากสื่อใกล้ตัว",
    "ต1.2 ใช้ภาษาเพื่อสื่อสารในสถานการณ์ง่าย ๆ",
    "ต2.1 เข้าใจความสัมพันธ์ระหว่างภาษาและวัฒนธรรมของเจ้าของภาษาและไทย",
  ],
  externalBenchmark: "Cambridge English Starters-style vocabulary coverage for numbers 1-20 and classroom language",
  coreVocabCountExcludingPhonics: 138,
  note: "นับ core vocab ไม่รวม phonics letter cards 26 ใบ เพื่อให้ทั้ง ป.1 อยู่ในกรอบประมาณ 120-150 คำ",
};
curriculum.voice.note = "เพิ่ม audio key แล้ว แต่ไฟล์เสียงใหม่ให้ Claude/ElevenLabs gen และ cache ทีหลัง; ห้ามใช้ TTS สดบน production";
curriculum.missionTypes.sentence = "Q&A ป.1: What is it? It is a/an ... หรือ pattern ใกล้เคียงตามชนิดคำ; รูปประโยคชี้สิ่งของของ ป.2 ให้เก็บไปใช้ทีหลัง";
curriculum.missionTypes.tpr = "ฟังคำสั่งในห้องเรียนแล้วทำท่าหรือแตะภาพคำสั่ง เช่น Stand up / Sit down";
curriculum.missionTypes.culture = "เรียนคำง่าย ๆ เกี่ยวกับมารยาทและเทศกาลไทย/สากลตาม ต2.1 ผ่านรูป เสียง และเกมจับคู่";

curriculum.units = [
  {
    id: "u1-my-school-bag",
    order: 1,
    title: "My School Bag",
    theme: "classroom objects",
    status: "live",
    priority: "P0",
    routes: ["/mission/school-bag", "/mission/this-is", "/mission/say-it-back"],
    note: "Unit 1 live แล้ว ใช้เป็น reference ของ schema และใช้รูปแบบ ป.1: What is it? It is a/an ...",
    vocab: schoolBagVocab,
    lessonFlow: lessonFlow("My School Bag"),
    missions: [
      { type: "listen-tap", title: "Pack My School Bag", targetCount: 20 },
      { type: "sentence", title: "What Is It?", pattern: "What is it? It is a/an ..." },
      { type: "say-it-back", title: "Say It Back", note: "speaking practice ใช้ pattern ป.1 เป็น What is it?/It is... และใช้เสียงประโยค It is... ที่ cache ไว้" },
    ],
  },
  {
    id: "u2-abc-phonics",
    order: 2,
    title: "ABC Phonics",
    theme: "letter sounds",
    status: "ready-for-assets",
    priority: "P0",
    note: "สอนเสียงตัวอักษร a-z + keyword/ตัว ผ่าน chant/song และเกมจับคู่เสียง",
    items: phonicsItems,
    lessonFlow: lessonFlow("ABC Phonics", {
      qaPattern: "What sound? /a/ as in apple.",
      learn: "ฟังเสียงตัวอักษร + เห็นตัวอักษรใหญ่/เล็ก + keyword image",
      practice: "ฟังเสียงแล้วแตะตัวอักษรหรือรูป keyword",
      game: "จับคู่ letter-sound-keyword แบบเร็ว",
    }),
    missions: [
      { type: "phonics", title: "Letter Sounds A-Z", targetCount: 26 },
      { type: "listen-tap", title: "Find the Letter" },
      { type: "review", title: "Phonics Review" },
    ],
  },
  {
    id: "u3-hello",
    order: 3,
    title: "Hello!",
    theme: "greetings + self intro",
    status: "ready-for-assets",
    priority: "P0",
    vocab: [
      command("hello", "Hello!", "สวัสดี", "wave", { image: "hello", audio: "hello" }),
      command("hi", "Hi!", "ไฮ/สวัสดี", "wave", { image: "hi", audio: "hi" }),
      command("good-morning", "Good morning.", "อรุณสวัสดิ์", "morning"),
      command("goodbye", "Goodbye.", "ลาก่อน", "wave-bye"),
      command("whats-your-name", "What's your name?", "คุณชื่ออะไร", "ask-name"),
      command("my-name-is", "My name is ...", "ฉันชื่อ ...", "name-tag"),
      command("thank-you", "Thank you.", "ขอบคุณ", "thanks"),
      command("please", "Please.", "กรุณา/ได้โปรด", "polite"),
    ],
    lessonFlow: lessonFlow("Hello!", {
      qaPattern: "What's your name? My name is ...",
      learn: "มาสคอตทักทาย + ฝึก wave + ฟังคำทักทายต่างเวลา",
      practice: "ฟังคำทักทายแล้วแตะภาพ/สถานการณ์ที่ตรง",
      game: "จับคู่ hello/goodbye/thank you กับภาพ",
    }),
    missions: [
      { type: "listen-tap", title: "Say Hello" },
      { type: "say-it-back", title: "What's Your Name?" },
      { type: "review", title: "Polite Words" },
    ],
  },
  {
    id: "u4-classroom-commands",
    order: 4,
    title: "Classroom Commands",
    theme: "classroom language + TPR",
    status: "ready-for-assets",
    priority: "P0",
    note: "ย้ายขึ้นต้นหลักสูตรเพราะใช้ตั้งแต่ต้นเทอม เด็กต้องฟังคำสั่งครูได้เร็ว",
    vocab: commands,
    lessonFlow: lessonFlow("Classroom Commands", {
      qaPattern: "Listen and do. Stand up.",
      learn: "น้องฟิวเจอร์ทำท่าให้ดูทีละคำสั่ง",
      practice: "ฟังคำสั่งแล้วแตะภาพท่าทางหรือทำตาม",
      game: "Simon Says แบบไม่คัดออก เด็กทำตามเพื่อเก็บ XP",
    }),
    missions: [
      { type: "tpr", title: "Listen and Do", targetCount: 10 },
      { type: "listen-tap", title: "Tap the Command" },
      { type: "review", title: "Teacher Says" },
    ],
  },
  {
    id: "u5-numbers-1-20",
    order: 5,
    title: "Numbers 1-20",
    theme: "counting",
    status: "ready-for-assets",
    priority: "P0",
    note: "ขยายจาก 1-10 เป็น 1-20 เพื่อครอบคลุมตัวชี้วัด ป.1 และ Cambridge Starters-style counting",
    items: numbers,
    newAudioNeeded: numbers.filter((item) => item.digit >= 11).map((item) => `${item.audio}.mp3`),
    lessonFlow: lessonFlow("Numbers 1-20", {
      qaPattern: "How many? It is number ...",
      learn: "นับของ 1-20 ด้วยภาพและเสียงครูช้า ๆ",
      practice: "ฟังตัวเลขแล้วแตะจำนวน/ตัวเลข",
      game: "เก็บดาวจากการนับของบนจอแบบเร็ว",
    }),
    missions: [
      { type: "listen-tap", title: "Count With Me", targetCount: 20 },
      { type: "say-it-back", title: "Say the Number" },
      { type: "review", title: "Numbers Review" },
    ],
  },
  {
    id: "u6-colors",
    order: 6,
    title: "Colors",
    theme: "colors",
    status: "ready-for-assets",
    priority: "P1",
    vocab: colors,
    lessonFlow: lessonFlow("Colors", {
      qaPattern: "What color is it? It is red.",
      learn: "โชว์สีทีละสีบนวัตถุจริง ไม่ใช่ swatch ล้วน",
      practice: "ฟังสีแล้วแตะวัตถุสีตรงกัน",
      game: "paint bucket match เติมสีให้มาสคอต",
    }),
    missions: [
      { type: "listen-tap", title: "Tap the Color", targetCount: 10 },
      { type: "sentence", title: "What Color Is It?", pattern: "What color is it? It is ..." },
      { type: "say-it-back", title: "Say the Color" },
    ],
  },
  {
    id: "u7-my-family",
    order: 7,
    title: "My Family",
    theme: "family members",
    status: "ready-for-assets",
    priority: "P1",
    vocab: family,
    lessonFlow: lessonFlow("My Family", {
      qaPattern: "Who is it? It is my mother.",
      learn: "ภาพครอบครัวเรียบง่าย + เสียงคำเรียกสมาชิก",
      practice: "ฟังคำแล้วแตะสมาชิกในภาพ",
      game: "family photo match จับคู่คำกับคนในภาพ",
    }),
    missions: [
      { type: "listen-tap", title: "Find My Family", targetCount: 10 },
      { type: "sentence", title: "Who Is It?", pattern: "Who is it? It is my ..." },
      { type: "review", title: "Family Review" },
    ],
  },
  {
    id: "u8-my-body",
    order: 8,
    title: "My Body",
    theme: "body parts + TPR",
    status: "ready-for-assets",
    priority: "P1",
    vocab: body,
    lessonFlow: lessonFlow("My Body", {
      qaPattern: "What is it? It is a hand. / Touch your head.",
      learn: "มาสคอตชี้ส่วนต่าง ๆ ของร่างกาย เด็กทำตามได้",
      practice: "ฟังคำแล้วแตะภาพส่วนร่างกาย",
      game: "touch game แตะตามคำสั่งแบบช้าและสนุก",
    }),
    missions: [
      { type: "listen-tap", title: "Touch the Body Part", targetCount: 12 },
      { type: "tpr", title: "Touch Your Head" },
      { type: "review", title: "Body Review" },
    ],
  },
  {
    id: "u9-animals",
    order: 9,
    title: "Animals",
    theme: "pets + farm animals",
    status: "ready-for-assets",
    priority: "P2",
    vocab: animals,
    lessonFlow: lessonFlow("Animals", {
      qaPattern: "What is it? It is a cat.",
      learn: "ภาพสัตว์ชัด ๆ + เสียงชื่อสัตว์ + เสียงร้อง optional",
      practice: "ฟังชื่อสัตว์แล้วแตะรูป",
      game: "animal rescue เลือกสัตว์ให้กลับบ้าน",
    }),
    missions: [
      { type: "listen-tap", title: "Find the Animal", targetCount: 14 },
      { type: "sentence", title: "What Animal Is It?", pattern: "What is it? It is a/an ..." },
      { type: "review", title: "Animal Review" },
    ],
  },
  {
    id: "u10-fruits-food",
    order: 10,
    title: "Fruits & Food",
    theme: "food + I like ...",
    status: "ready-for-assets",
    priority: "P2",
    vocab: food,
    lessonFlow: lessonFlow("Fruits & Food", {
      qaPattern: "What is it? It is an apple. / I like apples.",
      learn: "โชว์อาหารใกล้ตัว เด็กฟังชื่อและเห็นภาพจริง",
      practice: "ฟังชื่ออาหารแล้วแตะรูป",
      game: "lunch tray match จัดอาหารใส่ถาด",
    }),
    missions: [
      { type: "listen-tap", title: "Find the Food", targetCount: 14 },
      { type: "sentence", title: "What Food Is It?", pattern: "What is it? It is a/an ..." },
      { type: "say-it-back", title: "I Like ..." },
    ],
  },
  {
    id: "u11-feelings",
    order: 11,
    title: "Feelings",
    theme: "emotions + I am ...",
    status: "ready-for-assets",
    priority: "P2",
    vocab: feelings,
    lessonFlow: lessonFlow("Feelings", {
      qaPattern: "How are you? I am happy.",
      learn: "มาสคอตแสดงสีหน้าแต่ละอารมณ์",
      practice: "ฟังอารมณ์แล้วแตะใบหน้าที่ตรง",
      game: "emotion mirror เลือกหน้าให้มาสคอต",
    }),
    missions: [
      { type: "listen-tap", title: "Find the Feeling", targetCount: 10 },
      { type: "sentence", title: "How Are You?", pattern: "How are you? I am ..." },
      { type: "review", title: "Feelings Review" },
    ],
  },
  {
    id: "u12-culture-festivals",
    order: 12,
    title: "Culture & Festivals",
    theme: "polite words + Thai/global festivals",
    status: "ready-for-assets",
    priority: "P2",
    standard: "ต2.1 ป.1",
    note: "เพิ่มเพื่อเติมช่องว่างภาษากับวัฒนธรรม: มารยาทง่าย ๆ + เทศกาลไทย/สากลแบบไม่ซับซ้อน",
    vocab: culture,
    lessonFlow: lessonFlow("Culture & Festivals", {
      qaPattern: "What is it? It is Songkran. / We say thank you.",
      learn: "ภาพเทศกาล/มารยาท 1 ภาพ 1 คำ พร้อมคำไทยช่วยเข้าใจ",
      practice: "ฟังคำแล้วแตะภาพเทศกาลหรือมารยาทที่ตรง",
      game: "festival card match จับคู่เทศกาลกับของ/คำพูด",
    }),
    missions: [
      { type: "culture", title: "Polite Words and Festivals", targetCount: 10 },
      { type: "listen-tap", title: "Find the Festival" },
      { type: "review", title: "Culture Review" },
    ],
  },
];

curriculum.pipeline.audioTodo = curriculum.units.flatMap((unit) => {
  const entries = unit.vocab || unit.items || [];
  return entries.map((entry) => `${entry.audio}.mp3`).filter(Boolean);
});
curriculum.pipeline.audioTodoNote = "รวม audio key สำหรับ production cache; ไฟล์ใหม่ให้ Claude/ElevenLabs gen หลัง owner เคาะ asset batch";
curriculum.pipeline.imageTodo = curriculum.units.flatMap((unit) => {
  const entries = unit.vocab || unit.items || [];
  return entries.map((entry) => entry.image).filter(Boolean);
});

fs.writeFileSync(curriculumPath, `${JSON.stringify(curriculum, null, 2)}\n`);

const lessonsForMap = [
  ["english-p1-unit1-school-bag", "Unit 1", 1, "Pack My School Bag", "/mission/school-bag?reset=1", "vocabulary", 20, ["listening", "school objects", "picture choice"]],
  ["english-p1-unit1-what-is-it", "Unit 1", 2, "What Is It?", "/mission/this-is?reset=1", "question-answer", 4, ["what is it", "it is", "school objects"]],
  ["english-p1-unit1-say-it-back", "Unit 1", 3, "Say It Back", "/mission/say-it-back?reset=1", "speaking", 4, ["speaking", "pronunciation", "simple sentence"]],
  ["english-p1-unit2-abc-phonics", "Unit 2", 4, "ABC Phonics", "/mission/lab?unit=2&reset=1", "phonics", 26, ["phonics", "letter sound", "chant"]],
  ["english-p1-unit3-hello", "Unit 3", 5, "Hello!", "/mission/lab?unit=3&reset=1", "conversation", 8, ["greeting", "name", "polite words"]],
  ["english-p1-unit4-classroom-commands", "Unit 4", 6, "Classroom Commands", "/mission/lab?unit=4&reset=1", "tpr", 10, ["listen and do", "classroom language", "TPR"]],
  ["english-p1-unit5-numbers-1-20", "Unit 5", 7, "Numbers 1-20", "/mission/lab?unit=5&reset=1", "numbers", 20, ["counting", "numbers 1-20", "how many"]],
  ["english-p1-unit6-colors", "Unit 6", 8, "Colors", "/mission/lab?unit=6&reset=1", "colors", 10, ["colors", "what color", "objects"]],
  ["english-p1-unit7-my-family", "Unit 7", 9, "My Family", "/mission/lab?unit=7&reset=1", "family", 10, ["family members", "who is it", "my"]],
  ["english-p1-unit8-my-body", "Unit 8", 10, "My Body", "/mission/lab?unit=8&reset=1", "body", 12, ["body parts", "touch", "TPR"]],
  ["english-p1-unit9-animals", "Unit 9", 11, "Animals", "/mission/lab?unit=9&reset=1", "animals", 14, ["pets", "farm animals", "what is it"]],
  ["english-p1-unit10-fruits-food", "Unit 10", 12, "Fruits & Food", "/mission/lab?unit=10&reset=1", "food", 14, ["food", "fruit", "I like"]],
  ["english-p1-unit11-feelings", "Unit 11", 13, "Feelings", "/mission/lab?unit=11&reset=1", "feelings", 10, ["feelings", "how are you", "I am"]],
  ["english-p1-unit12-culture-festivals", "Unit 12", 14, "Culture & Festivals", "/mission/lab?unit=12&reset=1", "culture", 10, ["ต2.1", "polite words", "festivals"]],
].map(([id, unit, order, title, route, type, totalQuestions, skillTags], index) => ({
  id,
  subject: "English",
  grade: "ป.1",
  unit,
  order,
  title,
  route,
  type,
  totalQuestions,
  locked: false,
  segments: ["Warm-up", "Learn", "Practice", "Game", "Review", "Celebration"],
  skillTags,
}));

let gamification = fs.readFileSync(gamificationPath, "utf8");
gamification = gamification
  .replace(/correct: "\/assets\/mascot\/futuree-[^"]+\.jpg",/, 'correct: "/assets/mascot/futuree-correct.jpg",')
  .replace(/celebrate: "\/assets\/mascot\/futuree-[^"]+\.jpg",/, 'celebrate: "/assets/mascot/futuree-celebrate.jpg",');

const start = gamification.indexOf("  const lessons = [");
const endMarker = "\n\n  let missionSession = null;";
const end = gamification.indexOf(endMarker, start);
if (start === -1 || end === -1) {
  throw new Error("Could not locate gamification lessons array");
}
const replacement = `  const lessons = ${JSON.stringify(lessonsForMap, null, 4).replace(/^/gm, "  ").trimStart()};`;
gamification = `${gamification.slice(0, start)}${replacement}${gamification.slice(end)}`;
fs.writeFileSync(gamificationPath, gamification);

console.log(JSON.stringify({
  units: curriculum.units.length,
  coreVocabCountExcludingPhonics: curriculum.scope.coreVocabCountExcludingPhonics,
  numbersMax: Math.max(...numbers.map((item) => item.digit)),
  commandsOrder: curriculum.units.find((unit) => unit.id === "u4-classroom-commands")?.order,
  cultureUnit: curriculum.units.find((unit) => unit.id === "u12-culture-festivals")?.title,
  gamificationLessons: lessonsForMap.length,
}, null, 2));

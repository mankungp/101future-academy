# 101 Future Voice Selection

Status: internal selection only. Do not put a public voice picker on the student mission page.

## Goal

Pick one warm, clear English teacher voice before replacing the browser speech prototype.

The voice should sound:

- Friendly for ป.1 students.
- Slow enough for first exposure.
- Clear American English.
- Like a teacher or learning app guide, not a chatbot assistant.
- Calm, not too cartoonish.

## Audition Script

Generate the same lines for every candidate voice:

```text
Tap the book.
No, this is a pencil.
Yes, correct. Book.
Tap the pencil.
Great job! You packed your school bag.
This is a book.
This is an eraser.
Yes, correct. This is a pencil.
Great job! You can say four school sentences.
```

Use slower delivery than normal speech. Target pacing: around 0.65-0.75x of ordinary adult conversation.

For ป.1, prefer short pauses:

```text
This is... a book.
This is... an eraser.
```

## Shortlist To Test

1. OpenAI GPT-4o mini TTS
   - Try voices: `marin`, `cedar`, `coral`, `nova`, `shimmer`.
   - Best when we want stable API, controllable tone, and generated audio files cached as lesson assets.

2. ElevenLabs
   - Use Voice Library filters: English, female or warm young adult, conversational, education/storytelling.
   - Best when highest human-like warmth matters more than vendor simplicity.

3. Google Cloud Text-to-Speech Chirp 3 HD
   - Try US English Chirp 3 HD voices, especially warmer female voices.
   - Best when we want enterprise cloud reliability and many voice/language options.

## Decision Rule

Do not ship the final voice until we compare 3-5 sample MP3 files side by side.

Recommended next action: generate sample files for the audition script, then let the owner choose one final voice.

# PitchPulse

**Your pitch has holes. Let's find them.**

PitchPulse is a voice-first AI advisory board where founders pitch their startup idea and get brutally honest, real-time spoken feedback from AI personas of legendary investors.

No slides. No forms. No chatbot. Just you, your voice, and 60 seconds to convince Paul Graham, Ben Horowitz, or Marc Andreessen that your startup is worth betting on.

**Live demo:** [pitch-pulse-vmqeaehnja-uc.a.run.app](https://pitch-pulse-vmqeaehnja-uc.a.run.app/)

---

## Why PitchPulse Exists

Pre-seed founders don't get real investor feedback before real meetings. Friends say "sounds great." VCs ghost. The first time most founders hear honest feedback is in the meeting that actually matters.

PitchPulse gives every founder access to "office hours with Paul Graham" -- a live voice conversation with an AI that thinks like the best investors in tech, applies their real frameworks, and tells you the truth about your pitch.

## How It Works

1. **Choose your advisor** -- Paul Graham (The Scalpel), Ben Horowitz (The Hammer), or Marc Andreessen (The Mirror)
2. **Pitch your startup** -- 45 or 60 seconds, voice only, no slides
3. **Get roasted** -- Immediate spoken feedback: gut reaction, signature framework applied to YOUR pitch, the question you can't answer, the one thing to fix
4. **Read your report** -- Scores across 7 dimensions, verdict in the advisor's voice, your pitch rewritten, and an ideal 60-second pitch written for you by a legendary investor

The entire experience takes under 3 minutes.

## What Makes PitchPulse Different

- **Voice-first, not text-first.** Real-time speech-to-speech conversation powered by Gemini Live API. You talk, they talk back. No typing.
- **Named personas, not generic AI.** Each advisor has distinct frameworks, speaking patterns, and evaluation criteria drawn from their real philosophies and published thinking.
- **Brutally honest.** A 3/10 pitch gets a 3/10. The system is designed to tell you the truth, not make you feel good.
- **Pitch rewrite + ideal pitch.** Every report includes your pitch rewritten in the advisor's voice, plus a ready-to-deliver 60-second ideal pitch written specifically for your company -- the crown jewel. If the idea isn't there yet, they'll tell you that too.
- **Live transcript.** Your words appear in real-time on screen as you speak, proving the AI is listening and capturing everything.

## Advisors

| Persona | Archetype | Focus |
|---------|-----------|-------|
| **Paul Graham** | The Scalpel | Founder quality, idea validation, product-market fit. "Make something people want." |
| **Ben Horowitz** | The Hammer | Execution, leadership, market timing. "The hard thing about hard things is that there is no formula." |
| **Marc Andreessen** | The Mirror | Market size, distribution, product-market fit binary. "You either have it or you don't." |

New personas are plug-and-play -- drop a `.md` file in the personas directory and it auto-appears. No code changes.

## Tech Stack

- **Voice pipeline:** Gemini Live API (`gemini-live-2.5-flash-native-audio`) via Google ADK for real-time speech-to-speech
- **Backend:** Python + FastAPI + WebSocket for bidirectional audio streaming
- **Frontend:** React 19 + Vite + Tailwind CSS
- **Audio:** PCM 16kHz mic capture with echo cancellation/noise suppression, 24kHz playback, Web Speech API for backup transcription
- **Design:** Editorial typography (Outfit + Instrument Serif), persona atmosphere color shifts, audio-reactive voice orb, glass cards, staggered reveal animations
- **Deploy:** Docker multi-stage build on Google Cloud Run

## Architecture

```
User (mic) --> AudioRecorder (PCM16, 16kHz)
  --> base64 --> WebSocket --> FastAPI
  --> Google ADK --> Gemini Live API
  <-- spoken feedback (PCM24, 24kHz)
  <-- generate_report tool call (scores + analysis)
  --> AudioStreamer (speaker) + BoardReport (UI)
```

Key design decisions:
- **Speak-first, report-second.** The advisor speaks immediately after the pitch ends -- no dead air. The report generates in the background while the user listens.
- **Dual transcription.** Both Gemini and browser Web Speech API capture the pitch transcript. The model gets both and picks the more accurate one.
- **Timer respects playback.** The pitch timer doesn't start until the greeting audio finishes playing, not when it finishes generating.

## Running Locally

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python app/main.py  # Starts on :8080

# Frontend (separate terminal)
cd frontend
npm install
npm run dev  # Starts on :5173, proxies to :8080
```

Requires a `.env` file:
```
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_GENAI_USE_VERTEXAI=True
MODEL_ID=gemini-live-2.5-flash-native-audio
```

## Docker

```bash
docker build -t pitch-pulse .
docker run -p 8080:8080 \
  -e GOOGLE_CLOUD_PROJECT=your-project-id \
  -e GOOGLE_CLOUD_LOCATION=us-central1 \
  -e GOOGLE_GENAI_USE_VERTEXAI=True \
  -e MODEL_ID=gemini-live-2.5-flash-native-audio \
  pitch-pulse
```

## Team

Built in 24 hours at **Build and Solve with AI** hackathon, San Francisco, March 2026.

- **Irina** -- Tech & Product
- **Cyriaque** -- Personas, Pitch & Sales

## License

MIT

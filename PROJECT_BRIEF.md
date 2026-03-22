# PitchPulse — AI Advisory Board for Founders

## Hackathon Context

**Event:** Build and Solve with AI: San Francisco Edition (Pre-RSAC)
**Dates:** March 21-22, 2026
**Location:** Frontier Tower, San Francisco
**Submission deadline:** Sunday March 22, 5:00 PM
**Presentation:** 3 minutes pitch + 1 minute Q&A
**Prizes:** $2,500+ cash, Google I/O tickets, pitch to AI Futures Fund

### Participation Rules
- Team of 2-4 members
- Must use: **RocketRide's IDE extension** + **1 Google product** (Gemini, Vertex, Google Cloud)
- Original work created during the hackathon
- Submit via form before deadline

### Judging Criteria (5 categories, optimize for ALL)

| Category | What They Want | High Score |
|---|---|---|
| **Impact** | Real, meaningful problem | Clear real-world use case with tangible value |
| **Innovation** | Creative or differentiated idea | Unique approach or fresh perspective |
| **Execution** | How well built and structured | Working prototype, solid flow, good system design |
| **Use of AI** | AI used meaningfully | AI is core to the solution and adds real value |
| **Presentation** | Clearly communicated | Clear, compelling demo and explanation |

---

## Team

- **Irina** — AI/tech, building the product
- **Cyriaque** — Sales/pitching expert, researching advisor persona frameworks and knowledge

---

## The Product: PitchPulse

### One-Liner
"Record your pitch. Get brutal, actionable feedback from an AI advisory board of the world's best startup minds — in 60 seconds, not 6 months of fundraising rejection."

### What It Really Is
A real-time voice conversation system where founders pitch and then receive spoken feedback from AI advisors modeled after world-class startup experts (Paul Graham, Ben Horowitz, Greg Isenberg, etc.). Each advisor uses their real, documented frameworks to evaluate the pitch.

The pitch is the input medium. The real output is **startup clarity.**

### Why It Wins
- **Meta-demo**: You pitch PitchPulse at the hackathon, then the AI advisor gives you feedback LIVE on stage
- **Audio-first multimodal**: Leverages Gemini's native speech-to-speech — AI is core, not bolted on
- **System, not a wrapper**: Multi-stage analysis pipeline with persona-based frameworks
- **Real problem**: Every founder pitches. Most get rejected without knowing why.
- **Authentic**: The team lives this problem

---

## User Experience Flow

### UI Design
Simple, clean interface inspired by ChatGPT voice mode:
- Mode selector: **Persona** (single advisor) or **Dream Team** (multiple advisors)
- Voice bubble (pulsing animation when active)
- Countdown timer (2 or 3 minutes, hard cutoff)
- Board report (structured output after conversation ends)

### Two-Phase Interaction

**PHASE 1: PITCH (Timer Running)**
- Founder selects advisor persona
- Taps the voice bubble → timer starts (2:00 or 3:00)
- Founder delivers their pitch verbally
- AI listens silently (like a real investor panel)
- Hard cutoff when timer hits zero — mic stops

**PHASE 2: ADVISE (Conversation)**
- AI advisor persona activates
- Advisor speaks first — delivers structured feedback using their frameworks
- Founder can respond, defend, clarify — real voice dialogue
- Back and forth until founder clicks "End Session"
- Agent generates structured board report

### Board Report Output (Final Deliverable)
- Each advisor's verdict with framework-specific analysis
- Pitch structure breakdown (Problem, Solution, Market, Business Model, Ask, Team)
- Delivery analysis (pacing, confidence, clarity)
- Killer questions the advisor would ask
- Top 3 actionable fixes ranked by impact
- Where advisors agree vs. disagree (Dream Team mode, future iteration)

---

## MVP Scope (What We Build for Hackathon)

### In Scope (MVP)
- Single persona mode (one advisor at a time)
- Speech-to-speech conversation via Gemini Live API
- Timer with hard cutoff
- Voice bubble UI
- Structured board report generation
- 3-4 advisor personas with curated framework knowledge

### Out of Scope (Next Iteration)
- Dream Team mode (multiple advisors, panel discussion)
- Multi-agent A2A architecture (Level 4 pattern)
- User accounts / persistence
- Pitch history / progress tracking

---

## Technical Architecture

### Tech Stack

| Component | Technology | Source |
|---|---|---|
| **AI Model** | `gemini-live-2.5-flash-native-audio` | Google — native speech-to-speech |
| **Agent Framework** | Google ADK (Agent Development Kit) | Google — agent orchestration |
| **Backend** | Python + FastAPI + WebSocket | Adapted from way-back-home Level 3 |
| **Frontend** | React + WebSocket | Adapted from way-back-home Level 3 |
| **Deployment** | Docker → Google Cloud Run | Google Cloud credits provided |
| **Pipeline** | RocketRide IDE extension | Required by hackathon rules |

### Speech-to-Speech Pipeline (Already Solved)

```
FOUNDER'S MIC                                              FOUNDER'S SPEAKER
     │                                                            ▲
     ▼                                                            │
PCM 16kHz capture                                     PCM 24kHz playback
     │                                                            ▲
     ▼                                                            │
Base64 encode                                          Base64 decode
     │                                                            ▲
     ▼                                                            │
WebSocket ──────────► FastAPI ──────────► Gemini Live API ────────┘
                    LiveRequestQueue      (native audio)
                    StreamingMode.BIDI    Transcription enabled
```

### System Architecture

```
┌──────────────────────────────────────┐
│            FRONTEND (React)          │
│                                      │
│   [Persona ○]  [Dream Team ●]       │
│   Select: [PG] [BH] [GI] [MA]      │
│                                      │
│          ┌──────────┐                │
│          │  ◉ PULSE │ ← voice bubble │
│          └──────────┘                │
│           2:47 remaining             │
│                                      │
│   ┌──────────────────────────┐       │
│   │    BOARD REPORT          │       │
│   │    (appears after)       │       │
│   └──────────────────────────┘       │
└──────────────┬───────────────────────┘
               │ WebSocket (ws://host/ws/{user_id}/{session_id})
               ▼
┌──────────────────────────────────────┐
│         BACKEND (FastAPI)            │
│                                      │
│  Phase 1: LISTEN (timer running)     │
│  → Agent silent, transcribes audio   │
│                                      │
│  Phase 2: ADVISE (timer done)        │
│  → Persona activated, voice dialogue │
│                                      │
│  Phase 3: REPORT (session ends)      │
│  → generate_report() tool called     │
│  → Structured JSON sent to frontend  │
└──────────────────────────────────────┘
```

---

## Reference Codebase: way-back-home Level 3

**Repo:** https://github.com/google-americas/way-back-home
**Codelab:** https://codelabs.developers.google.com/way-back-home-level-3/instructions#0
**Solutions:** https://github.com/google-americas/way-back-home/tree/main/solutions/level_3

### What We Reuse vs. Change

| File | Reuse | Changes Needed |
|---|---|---|
| `backend/app/main.py` | 90% — WebSocket server, session mgmt, upstream/downstream tasks, LiveRequestQueue | Strip image/video handling from upstream_task, add phase management (listen→advise), audio-only |
| `backend/app/biometric_agent/agent.py` | Structure only | Replace entirely — new agent instructions for advisor persona, new tools |
| `frontend/src/audioRecorder.js` | 100% as-is | None — mic capture → PCM 16kHz → base64 |
| `frontend/src/audioStreamer.js` | 100% as-is | None — base64 → PCM 24kHz → speaker playback |
| `frontend/src/useGeminiSocket.js` | 80% | Strip video capture, strip report_digit tool handling, add report event handling |
| `frontend/src/App.jsx` | Structure only | Complete redesign — new UI with bubble, timer, persona selector, report view |
| `Dockerfile` | 95% as-is | Minimal path changes |
| `requirements.txt` | 100% as-is | google-genai, websockets, python-dotenv, fastapi, uvicorn, google-adk |

### Key Backend Code (main.py) — Proven Patterns to Keep

**Runner & Session Setup:**
```python
session_service = InMemorySessionService()
runner = Runner(app_name=APP_NAME, agent=root_agent, session_service=session_service)
```

**RunConfig for Native Audio (speech-to-speech):**
```python
run_config = RunConfig(
    streaming_mode=StreamingMode.BIDI,
    response_modalities=["AUDIO"],
    input_audio_transcription=types.AudioTranscriptionConfig(),
    output_audio_transcription=types.AudioTranscriptionConfig(),
    session_resumption=types.SessionResumptionConfig(),
    proactivity=types.ProactivityConfig(proactive_audio=True),
)
```

**Upstream Task (client → AI) — audio only version:**
```python
async def upstream_task() -> None:
    try:
        while True:
            message = await websocket.receive()
            if "bytes" in message:
                audio_blob = types.Blob(
                    mime_type="audio/pcm;rate=16000", data=message["bytes"]
                )
                live_request_queue.send_realtime(audio_blob)
            elif "text" in message:
                json_message = json.loads(message["text"])
                if json_message.get("type") == "audio":
                    audio_data = base64.b64decode(json_message.get("data", ""))
                    audio_blob = types.Blob(
                        mime_type="audio/pcm;rate=16000", data=audio_data
                    )
                    live_request_queue.send_realtime(audio_blob)
                elif json_message.get("type") == "text":
                    content = types.Content(
                        parts=[types.Part(text=json_message["text"])]
                    )
                    live_request_queue.send_content(content)
    finally:
        pass
```

**Downstream Task (AI → client):**
```python
async def downstream_task() -> None:
    async for event in runner.run_live(
        user_id=user_id,
        session_id=session_id,
        live_request_queue=live_request_queue,
        run_config=run_config,
    ):
        # Log transcriptions
        input_transcription = getattr(event, "input_audio_transcription", None)
        if input_transcription and input_transcription.final_transcript:
            logger.info(f"USER: {input_transcription.final_transcript}")

        output_transcription = getattr(event, "output_audio_transcription", None)
        if output_transcription and output_transcription.final_transcript:
            logger.info(f"GEMINI: {output_transcription.final_transcript}")

        event_json = event.model_dump_json(exclude_none=True, by_alias=True)
        await websocket.send_text(event_json)
```

**Concurrent Execution:**
```python
try:
    await asyncio.gather(upstream_task(), downstream_task())
except WebSocketDisconnect:
    logger.info("Client disconnected")
finally:
    live_request_queue.close()
```

### Key Frontend Code — Audio Infrastructure (Reuse 100%)

**AudioRecorder (audioRecorder.js):**
- Captures mic at 16kHz PCM with echo cancellation, noise suppression, auto gain
- Converts float32 → Int16 PCM → base64
- Uses ScriptProcessor (4096 buffer, mono)
- Full class with start()/stop() methods

**AudioStreamer (audioStreamer.js):**
- Plays back at 24kHz PCM
- Converts base64 → Int16 → Float32 → AudioBuffer
- Queue-based playback with auto-chaining
- Handles suspended AudioContext (browser autoplay policy)
- Full class with addPCM16()/resume() methods

**useGeminiSocket.js — Key Pattern (strip video, keep audio):**
```javascript
// Connect to WebSocket
const ws = new WebSocket(`ws://${host}/ws/${userId}/${sessionId}`);

// Handle incoming messages
ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    let parts = [];
    if (msg.serverContent?.modelTurn?.parts) {
        parts = msg.serverContent.modelTurn.parts;
    } else if (msg.content?.parts) {
        parts = msg.content.parts;
    }
    parts.forEach(part => {
        // Handle tool calls (our generate_report)
        if (part.functionCall) {
            // Handle report generation
        }
        // Handle audio playback
        if (part.inlineData && part.inlineData.data) {
            audioStreamer.current.resume();
            audioStreamer.current.addPCM16(part.inlineData.data);
        }
    });
};

// Send audio from mic
await audioRecorder.current.start((base64Audio) => {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'audio',
            data: base64Audio,
            sampleRate: 16000
        }));
    }
});
```

---

## What We Build New

### 1. Agent: pitch_advisor/agent.py

New agent with:
- Persona-based system prompt loaded from Cyriaque's research
- Two-phase behavior: LISTEN silently during pitch, then ADVISE with voice feedback
- `generate_report` tool that structures the analysis into a board report

**Agent Instructions Template:**
```python
instruction="""
You are {PERSONA_NAME}, one of the world's most respected voices in {DOMAIN}.

YOUR PHILOSOPHY:
{CORE_PHILOSOPHY}

YOUR FRAMEWORKS:
{FRAMEWORKS}

WHAT YOU CARE MOST ABOUT: {WHAT_THEY_CARE_ABOUT}
WHAT YOU HATE / RED FLAGS: {WHAT_THEY_HATE}

YOUR SPEAKING STYLE: {SPEAKING_STYLE}

BEHAVIOR PROTOCOL:

PHASE 1 - LISTENING:
When the session starts, you are listening to a founder deliver their startup pitch.
Stay completely silent. Do not interrupt. Absorb everything.
Analyze: structure, content quality, delivery, gaps, strengths.

PHASE 2 - ADVISING:
When you receive the signal "PITCH_COMPLETE", activate.
Deliver your feedback VOCALLY, in character, using your frameworks.
Structure your response:
1. Overall impression (1 sentence — honest, direct)
2. What's strong (using your specific frameworks)
3. What's weak or missing (be specific, not generic)
4. The hardest question you would ask this founder
5. One concrete action to improve before the next pitch

Then engage in dialogue. The founder may push back, clarify, or ask follow-up questions.
Respond naturally, in character, as you would in a real conversation.

When the founder says "END SESSION" or the session closes, call the generate_report tool.
"""
```

**generate_report Tool:**
```python
def generate_report(
    overall_score: int,
    problem_clarity: int,
    solution_strength: int,
    market_understanding: int,
    business_model: int,
    ask_clarity: int,
    delivery_score: int,
    strengths: list[str],
    weaknesses: list[str],
    killer_questions: list[str],
    action_items: list[str],
    advisor_verdict: str
) -> dict:
    """Generate structured board report after pitch review session."""
    return {
        "scores": {
            "overall": overall_score,
            "problem_clarity": problem_clarity,
            "solution_strength": solution_strength,
            "market_understanding": market_understanding,
            "business_model": business_model,
            "ask_clarity": ask_clarity,
            "delivery": delivery_score
        },
        "strengths": strengths,
        "weaknesses": weaknesses,
        "killer_questions": killer_questions,
        "action_items": action_items,
        "advisor_verdict": advisor_verdict
    }
```

### 2. Frontend: New UI Components

**App.jsx — Main Flow:**
- Screen 1: Persona selector (grid of advisor cards)
- Screen 2: Voice session (bubble + timer)
- Screen 3: Board report display

**Timer Component:**
- Countdown from 2:00 or 3:00
- Visual pulse at 30s remaining
- Hard cutoff → sends "PITCH_COMPLETE" text message via WebSocket
- Stops mic recording

**Voice Bubble Component:**
- Pulsing animation when mic is active (Phase 1)
- Different animation when advisor is speaking (Phase 2)
- Tap to start, tap to end session

**Report Component:**
- Displays structured output from generate_report tool
- Score visualization (bars or radar chart)
- Strengths/weaknesses lists
- Killer questions
- Action items

### 3. Phase Management

**Frontend sends phase signals via WebSocket:**
```javascript
// When timer ends:
ws.send(JSON.stringify({
    type: 'text',
    text: 'PITCH_COMPLETE'
}));

// When user ends session:
ws.send(JSON.stringify({
    type: 'text',
    text: 'END_SESSION'
}));
```

**Backend can also handle phase via text content to LiveRequestQueue.**

---

## Persona Research Format (For Cyriaque)

For each advisor persona, Cyriaque should structure his research as follows:

```
PERSONA: [Full Name]
DOMAIN: [What they're the world expert in]
CORE PHILOSOPHY: [2-3 sentences — their worldview on startups/business]
KEY FRAMEWORKS:
  - [Framework 1 Name]: [How they evaluate/decide — be specific]
  - [Framework 2 Name]: [How they evaluate/decide — be specific]
  - [Framework 3 Name]: [How they evaluate/decide — be specific]
WHAT THEY CARE MOST ABOUT: [The #1 thing they always look for in a pitch/startup]
WHAT THEY HATE: [Red flags that would make them immediately lose interest]
SPEAKING STYLE: [Direct/analytical/provocative/warm/Socratic — how they actually talk]
SIGNATURE PHRASES: [Things they actually say — quotes from essays, talks, books]
SOURCES: [Specific essays, books, podcast episodes this is drawn from]
```

### Suggested MVP Personas (pick 3-4)

1. **Paul Graham** — Founder-problem fit, simplicity, growth (YC essays)
2. **Ben Horowitz** — Market timing, team, hard decisions (The Hard Thing About Hard Things)
3. **Greg Isenberg** — Community, distribution, modern growth (podcasts, tweets)
4. **Alex Hormozi** — Offer design, pricing, value creation ($100M Offers)
5. **Marc Andreessen** — Product-market fit, technical moats (blog posts)
6. **Reid Hoffman** — Network effects, blitzscaling (Blitzscaling book)

---

## 3-Minute Pitch Structure (For Cyriaque to Refine)

```
0:00 - 0:30  PROBLEM
"Every founder pitches. Most get rejected and never know why.
Getting real feedback costs months of failed meetings or $50K accelerator programs."

0:30 - 1:00  SOLUTION
"PitchPulse is your AI advisory board. Pick an advisor — Paul Graham,
Alex Hormozi, Ben Horowitz. Record your pitch. Get their real frameworks
applied to YOUR specific startup. In a live voice conversation."

1:00 - 2:30  LIVE DEMO
[Record a 30-second pitch on stage]
[Show timer counting down]
[Timer ends → AI advisor starts talking back with specific feedback]
[Brief back-and-forth dialogue]
[Show the board report appearing]

2:30 - 3:00  VISION
"We built this in 24 hours. Imagine what happens when every founder
has access to a world-class advisory board — not in 6 months, but in
6 minutes. That's PitchPulse."
```

### The Meta-Demo Moment
The killer move: you demo PitchPulse BY using it on your own hackathon pitch. The audience watches the AI advisor critique the pitch they just heard. Unforgettable.

---

## Build Plan (Estimated ~4 hours focused work)

### Step 1: Scaffold Project (~15 min)
- Clone way-back-home Level 3 solutions
- Rename and restructure for PitchPulse
- Verify dependencies install

### Step 2: Backend Agent (~45 min)
- Create `pitch_advisor/agent.py` with persona system prompt
- Implement `generate_report` tool
- Load persona context from config/JSON files
- Wire up persona selection via session or WebSocket message

### Step 3: Backend Server Adaptation (~30 min)
- Strip video/image handling from main.py
- Add phase management (listen → advise)
- Handle persona selection from frontend
- Handle report tool output forwarding

### Step 4: Frontend UI (~1.5 hours)
- Persona selector screen
- Voice bubble component with animations
- Countdown timer with hard cutoff
- Report display component
- Connect to adapted WebSocket hook

### Step 5: Integration & Polish (~30 min)
- End-to-end test: select persona → pitch → get feedback → see report
- Fix audio issues
- UI polish for demo

### Step 6: Deploy to Cloud Run (~30 min)
- Build Docker image
- Deploy with Google Cloud credits
- Test production URL

---

## Google Cloud Setup Requirements

```bash
# Required APIs to enable
gcloud services enable compute.googleapis.com \
    artifactregistry.googleapis.com \
    run.googleapis.com \
    cloudbuild.googleapis.com \
    iam.googleapis.com \
    aiplatform.googleapis.com

# Environment variables needed
GOOGLE_CLOUD_PROJECT=<project-id>
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_GENAI_USE_VERTEXAI=True
MODEL_ID=gemini-live-2.5-flash-native-audio
```

## Deployment Commands

```bash
# Build
export PROJECT_ID=<your-project-id>
export REGION=us-central1
export SERVICE_NAME=pitch-pulse
export IMAGE_PATH=gcr.io/${PROJECT_ID}/${SERVICE_NAME}

gcloud builds submit . --tag ${IMAGE_PATH}

# Deploy
gcloud run deploy ${SERVICE_NAME} \
  --image=${IMAGE_PATH} \
  --platform=managed \
  --region=${REGION} \
  --allow-unauthenticated \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=${PROJECT_ID}" \
  --set-env-vars="GOOGLE_CLOUD_LOCATION=${REGION}" \
  --set-env-vars="GOOGLE_GENAI_USE_VERTEXAI=True" \
  --set-env-vars="MODEL_ID=gemini-live-2.5-flash-native-audio"
```

---

## Level 4 Reference (For Dream Team Iteration — NOT MVP)

Level 4 adds multi-agent capabilities we'll need for Dream Team mode:
- **A2A Protocol**: Agent-to-Agent communication for multiple advisor personas
- **Agent-as-a-Tool**: Dispatch agent controls conversation, delegates to specialist advisors
- **Streaming Tools**: Background monitoring/analysis while conversation continues
- **RemoteA2aAgent**: Each advisor runs as independent agent with its own Agent Card
- **Codelab**: https://codelabs.developers.google.com/way-back-home-level-4/instructions

This is the pattern for assembling multiple advisors into a panel discussion in V2.

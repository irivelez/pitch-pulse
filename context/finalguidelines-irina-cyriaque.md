# Pitch Pulse
**Build with AI SF — March 21-22, 2026 · 995 Market St, San Francisco**

> Office hours with the world's best investors — before the real thing.

---

## The problem

Pre-seed and seed founders trying to raise funds don't have access to the right investors or the right feedback before the real meeting. Getting honest, experienced input on a fundraising pitch is a privilege — reserved for those already in the network.

Founders at growth stage already have VCs, advisors, and warm intros. Pre-seed founders have nothing. They practice in a vacuum, get generic feedback from friends, and walk into their first investor meeting unprepared — with no way to know if their pitch is actually fundable.

---

## The solution

Pitch Pulse is not an analysis tool. It's office hours with the world's best investors — before the real thing. A live conversation with world-class VCs and advisors, designed for one goal: increasing your probability of closing a round.

Think "office hours with Paul Graham" — not a feedback form. Not a chatbot. A real dialogue that tells you if your pitch is fundable, and exactly what to fix.

Each persona is built from deep research (essays, interviews, frameworks) and Twitter scraping — not generic prompting. When Paul Graham pushes back on your idea, it sounds like Paul Graham.

---

## The experience — step by step

1. **Open & pick** — Choose persona or Dream Team mode. Select your advisors.
2. **Hit the bubble** — Timer starts. 2-3 min. The clock is real — just like with investors.
3. **They talk back** — Timer ends. The advisor responds — voice, not text. Direct and honest.
4. **Real dialogue** — Respond, defend, clarify. It's a real back-and-forth conversation.
5. **Board report** — Session ends → structured written report drops. Are you fundable? What to fix before the real meeting.

---

## Two modes

### Mode 1 — Persona
One advisor. Deep, focused session from a single worldview.
> *"5 minutes with Paul Graham before your real pitch."*

### Mode 2 — Dream Team
Full panel. 360° coverage across every startup dimension.
> Sales · Marketing · Finance · Product · Recruiting · Investor

---

## The personas — v1 lineup

Structured JSON profiles: core beliefs, typical questions, known red flags, tone, evaluation framework.
Built from deep research + Twitter scraping.

| Persona | Lens |
|---|---|
| **Paul Graham** | Product · founder quality · do things that don't scale |
| **Marc Andreessen** | Market size · tech bet · software is eating the world |
| **Lenny Rachitsky** | Growth · distribution · PMF signals |
| **Patrick Campbell** | Pricing · revenue model · monetization |
| **People / recruiting lead** | Team composition · first hires · culture signals |
| **Early-stage angel** | Investability · narrative · risk / conviction |

---

## Technical pipeline

```
Voice input → Gemini Live (STT) → WebSocket → RocketRide pipeline → Persona JSON + Vertex AI → Voice output + board report
```

| Component | Role |
|---|---|
| **Gemini Live** | Bidirectional voice I/O |
| **WebSocket** | Real-time connection UI ↔ backend |
| **RocketRide** | Core pipeline orchestration |
| **Vertex AI** | Model inference + persona injection |
| **JSON personas** | Deep research + Twitter scraping |

---

## Division of work

**Cyriaque**
- Persona research + JSON files
- Problem framing
- Pitch narrative
- Demo script
- Presentation (3 min)

**Irina**
- RocketRide pipeline
- Gemini Live + WebSocket
- Vertex AI / Google Cloud
- Board report generation

---

## The demo — the moment

> *"Raise your hand if you've ever wished you could get 5 minutes with Paul Graham before your real pitch."*

You tap the bubble. You pitch Pitch Pulse itself — 2 minutes. Timer counts down live on screen. Time's up. "Paul Graham" starts talking back — live, in front of the judges. He challenges your market size. You respond. He pushes back.

The audience watches a live conversation with an AI Paul Graham about the product they're judging.

**That's not a demo. That's a moment.**

---

## Hackathon constraints — checklist

- [x] RocketRide as core pipeline
- [x] Google product (Gemini Live + Vertex AI)
- [x] Real problem, real impact
- [x] AI is the core — not a wrapper
- [x] Buildable in ~10h with 2 people
- [x] Meta demo (pitch Pitch Pulse to AI Paul Graham)
- [x] Submit before Sunday 5pm PT
- [x] 3 min pitch + 1 min Q&A ready

---

## Why it scores well — judging grid

| Criteria | Why we win |
|---|---|
| **Impact** | Universal for any early-stage founder. Democratizes access to world-class mentorship. |
| **Innovation** | Live conversation, not a feedback form. Persona-based, built on real frameworks. |
| **Execution** | Full voice pipeline. Timer mechanic. Board report output. Clean end-to-end flow. |
| **Use of AI** | AI is the product. Multimodal. Real-time dialogue. Persona injection. |
| **Presentation** | Meta demo live on stage. The audience watches you pitch to AI Paul Graham. Unforgettable. |

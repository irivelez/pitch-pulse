import asyncio
import base64
import json
import logging
import os
import warnings

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from google.adk.agents.live_request_queue import LiveRequestQueue
from google.adk.agents.run_config import RunConfig, StreamingMode
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

load_dotenv()

from pitch_advisor.agent import create_agent, discover_personas

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

logging.getLogger("websockets").setLevel(logging.WARNING)
logging.getLogger("google_adk").setLevel(logging.WARNING)
logging.getLogger("urllib3").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
warnings.filterwarnings("ignore", category=UserWarning, module="pydantic")

PORT = 8080
APP_NAME = "pitch-pulse"
FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/dist"))

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/personas")
async def get_personas():
    return discover_personas()


@app.websocket("/ws/{user_id}/{session_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: str,
    session_id: str,
) -> None:
    await websocket.accept()

    persona_key = websocket.query_params.get("persona", "paul_graham")
    logger.info(f"WebSocket connected: {user_id}/{session_id} | persona={persona_key}")

    agent = create_agent(persona_key)
    session_service = InMemorySessionService()
    runner = Runner(app_name=APP_NAME, agent=agent, session_service=session_service)

    run_config = RunConfig(
        streaming_mode=StreamingMode.BIDI,
        response_modalities=["AUDIO"],
        speech_config=types.SpeechConfig(
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(
                    voice_name="Charon"
                )
            )
        ),
        input_audio_transcription=types.AudioTranscriptionConfig(),
        output_audio_transcription=types.AudioTranscriptionConfig(),
        session_resumption=types.SessionResumptionConfig(),
        proactivity=types.ProactivityConfig(proactive_audio=True),
    )

    await session_service.create_session(
        app_name=APP_NAME, user_id=user_id, session_id=session_id
    )

    live_request_queue = LiveRequestQueue()

    # Collect pitch transcription segments for context injection
    pitch_transcripts = []
    pitch_complete_sent = False  # Prevent duplicate PITCH_COMPLETE

    # Initial stimulus — keep greeting ultra short so it doesn't eat pitch time
    live_request_queue.send_content(
        types.Content(
            parts=[
                types.Part(
                    text="A founder just sat down. Say ONE sentence to introduce yourself and tell them to pitch. Maximum 10 words. Then STOP and listen."
                )
            ]
        )
    )

    async def upstream_task() -> None:
        nonlocal pitch_complete_sent
        try:
            while True:
                message = await websocket.receive()

                if "bytes" in message:
                    audio_blob = types.Blob(
                        mime_type="audio/pcm;rate=16000", data=message["bytes"]
                    )
                    live_request_queue.send_realtime(audio_blob)

                elif "text" in message:
                    text_data = message["text"]
                    json_message = json.loads(text_data)

                    if json_message.get("type") == "audio":
                        audio_data = base64.b64decode(json_message.get("data", ""))
                        audio_blob = types.Blob(
                            mime_type="audio/pcm;rate=16000", data=audio_data
                        )
                        live_request_queue.send_realtime(audio_blob)

                    elif json_message.get("type") == "text":
                        text = json_message["text"]
                        logger.info(f"Text from client: {text}")

                        # When PITCH_COMPLETE arrives, inject the full transcript
                        if "PITCH_COMPLETE" in text:
                            # Prevent duplicate — frontend may fire this twice
                            if pitch_complete_sent:
                                logger.info("Ignoring duplicate PITCH_COMPLETE")
                                continue
                            pitch_complete_sent = True

                            gemini_transcript = " ".join(pitch_transcripts).strip()
                            logger.info(f"GEMINI TRANSCRIPT ({len(pitch_transcripts)} segments): {gemini_transcript[:300]}")

                            # Extract client-side Speech API transcript (sent after newlines)
                            client_transcript = ""
                            if "\n" in text:
                                raw = text.split("\n", 1)[1].strip()
                                # Strip "Pitch transcript: " prefix if present
                                if raw.lower().startswith("pitch transcript:"):
                                    raw = raw.split(":", 1)[1].strip()
                                client_transcript = raw
                            if client_transcript == "(no transcript captured)":
                                client_transcript = ""

                            logger.info(f"CLIENT TRANSCRIPT: {client_transcript[:300]}")

                            # Use the LONGER transcript — sometimes Gemini captures better, sometimes browser does
                            if len(gemini_transcript) > len(client_transcript):
                                best_transcript = gemini_transcript
                            elif client_transcript:
                                best_transcript = client_transcript
                            else:
                                best_transcript = "(No transcript captured)"

                            # If both exist and are different, combine them for maximum context
                            if gemini_transcript and client_transcript and gemini_transcript != client_transcript:
                                best_transcript = (
                                    f"[Transcription A]: {gemini_transcript}\n"
                                    f"[Transcription B]: {client_transcript}\n"
                                    f"(Use whichever version seems more accurate, or combine them for full context)"
                                )

                            logger.info(f"USING TRANSCRIPT ({len(best_transcript)} chars): {best_transcript[:300]}")

                            enriched_message = (
                                f"PITCH_COMPLETE. Mic is OFF. SPEAK NOW — react immediately, no pause. "
                                f"After speaking, call generate_report.\n\n"
                                f"TRANSCRIPT:\n{best_transcript}"
                            )
                            content = types.Content(
                                parts=[types.Part(text=enriched_message)]
                            )
                        elif "END_SESSION" in text:
                            # END_SESSION is now a fallback — report should auto-generate after PITCH_COMPLETE
                            logger.info("END_SESSION received — sending report reminder")
                            enriched_message = (
                                f"The session is over. If you haven't already, call the generate_report tool NOW "
                                f"with your analysis. Do not say anything else — just call the tool."
                            )
                            content = types.Content(
                                parts=[types.Part(text=enriched_message)]
                            )
                        else:
                            content = types.Content(
                                parts=[types.Part(text=text)]
                            )

                        live_request_queue.send_content(content)

                    elif json_message.get("type") == "ping":
                        await websocket.send_text(json.dumps({"type": "pong"}))
        finally:
            pass

    async def downstream_task() -> None:
        logger.info("Connecting to Gemini Live API...")
        async for event in runner.run_live(
            user_id=user_id,
            session_id=session_id,
            live_request_queue=live_request_queue,
            run_config=run_config,
        ):
            # Collect pitch transcriptions (what the user said)
            if event.input_transcription and event.input_transcription.text:
                transcript_text = event.input_transcription.text.strip()
                if transcript_text:
                    is_final = event.input_transcription.finished
                    logger.info(f"USER{'[final]' if is_final else '[partial]'}: {transcript_text}")
                    if is_final:
                        pitch_transcripts.append(transcript_text)
                    else:
                        # Store partial too — overwrite last partial with latest
                        if pitch_transcripts and not pitch_transcripts[-1].endswith('[FINAL]'):
                            pitch_transcripts[-1] = transcript_text
                        else:
                            pitch_transcripts.append(transcript_text)

            if event.output_transcription and event.output_transcription.text:
                if event.output_transcription.finished:
                    logger.info(f"ADVISOR: {event.output_transcription.text}")

            event_json = event.model_dump_json(exclude_none=True, by_alias=True)
            await websocket.send_text(event_json)

        logger.info("Gemini Live API connection closed.")

    try:
        await asyncio.gather(upstream_task(), downstream_task())
    except WebSocketDisconnect:
        logger.info("Client disconnected")
    except Exception as e:
        logger.error(f"Error: {e}", exc_info=False)
    finally:
        live_request_queue.close()


# Serve frontend static files
if os.path.isdir(FRONTEND_DIST):
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="static")
    logger.info(f"Serving frontend from: {FRONTEND_DIST}")
else:
    logger.warning(f"Frontend build not found at {FRONTEND_DIST}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=PORT)

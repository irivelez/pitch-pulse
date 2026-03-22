import { useState, useRef, useCallback, useEffect } from 'react';
import { AudioStreamer } from './audioStreamer';
import { AudioRecorder } from './audioRecorder';

export function usePitchSocket() {
    const [status, setStatus] = useState('DISCONNECTED');
    const [report, setReport] = useState(null);
    const [greetingDone, setGreetingDone] = useState(false);
    const ws = useRef(null);
    const audioStreamer = useRef(null);
    const audioRecorder = useRef(new AudioRecorder(16000));
    const heartbeatRef = useRef(null);
    const wakeLockRef = useRef(null);

    // Pre-created resources (from user gesture)
    const playbackContextRef = useRef(null);
    const micContextRef = useRef(null);
    const micStreamRef = useRef(null);

    const requestWakeLock = async () => {
        try {
            if ('wakeLock' in navigator) {
                wakeLockRef.current = await navigator.wakeLock.request('screen');
            }
        } catch (e) { /* not critical */ }
    };

    const releaseWakeLock = () => {
        if (wakeLockRef.current) {
            wakeLockRef.current.release();
            wakeLockRef.current = null;
        }
    };

    /**
     * Must be called during a user gesture (tap/click).
     * Creates AudioContexts and requests mic — all within gesture context for iOS.
     */
    const prepare = useCallback(async () => {
        // Create playback AudioContext (for AudioStreamer) — must be in user gesture
        if (!playbackContextRef.current || playbackContextRef.current.state === 'closed') {
            playbackContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: 24000,
            });
        }
        // Resume immediately in user gesture context
        if (playbackContextRef.current.state === 'suspended') {
            await playbackContextRef.current.resume();
        }

        // Create mic AudioContext (for AudioRecorder)
        if (!micContextRef.current || micContextRef.current.state === 'closed') {
            micContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: 16000,
            });
        }
        if (micContextRef.current.state === 'suspended') {
            await micContextRef.current.resume();
        }

        // Request mic access now — in user gesture context
        if (!micStreamRef.current || !micStreamRef.current.active) {
            micStreamRef.current = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                }
            });
        }

        console.log('[PitchSocket] Audio prepared — contexts and mic ready');
    }, []);

    const connect = useCallback((persona) => {
        if (ws.current?.readyState === WebSocket.OPEN) return;

        setGreetingDone(false);
        setReport(null);

        const userId = 'user_' + Math.random().toString(36).substr(2, 6);
        const sessionId = 'session_' + Date.now();
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const url = `${protocol}//${window.location.host}/ws/${userId}/${sessionId}?persona=${persona}`;

        ws.current = new WebSocket(url);

        ws.current.onopen = () => {
            setStatus('CONNECTED');
            requestWakeLock();
            heartbeatRef.current = setInterval(() => {
                if (ws.current?.readyState === WebSocket.OPEN) {
                    ws.current.send(JSON.stringify({ type: 'ping' }));
                }
            }, 15000);
        };

        ws.current.onclose = () => {
            setStatus('DISCONNECTED');
            clearInterval(heartbeatRef.current);
            releaseWakeLock();
        };

        ws.current.onerror = () => setStatus('ERROR');

        ws.current.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === 'pong') return;

                // Detect greeting complete — wait for audio playback to finish
                if (msg.turnComplete && !greetingDone) {
                    console.log('[PitchSocket] Turn complete — waiting for audio playback to finish');
                    if (audioStreamer.current) {
                        audioStreamer.current.markTurnComplete();
                    } else {
                        // No audio streamer yet means no audio was sent — greeting done immediately
                        setGreetingDone(true);
                    }
                }

                let parts = [];
                if (msg.serverContent?.modelTurn?.parts) {
                    parts = msg.serverContent.modelTurn.parts;
                } else if (msg.content?.parts) {
                    parts = msg.content.parts;
                }

                parts.forEach(part => {
                    // Handle tool calls (generate_report)
                    if (part.functionCall) {
                        console.log('[PitchSocket] Tool call:', part.functionCall.name, part.functionCall.args);
                        if (part.functionCall.name === 'generate_report') {
                            const args = part.functionCall.args || {};
                            const reportData = {
                                scores: {
                                    overall: args.overall_score || 0,
                                    problem_clarity: args.problem_clarity || 0,
                                    solution_strength: args.solution_strength || 0,
                                    market_understanding: args.market_understanding || 0,
                                    business_model: args.business_model || 0,
                                    ask_clarity: args.ask_clarity || 0,
                                    delivery: args.delivery_score || 0,
                                },
                                verdict: args.verdict || '',
                                top_strength: args.top_strength || '',
                                top_weakness: args.top_weakness || '',
                                killer_question: args.killer_question || '',
                                one_thing_to_fix: args.one_thing_to_fix || '',
                                pitch_rewrite: args.pitch_rewrite || '',
                                ideal_pitch: args.ideal_pitch || '',
                            };
                            setReport(reportData);
                        }
                    }

                    // Handle audio playback — use pre-created context
                    if (part.inlineData && part.inlineData.data) {
                        if (!audioStreamer.current) {
                            audioStreamer.current = new AudioStreamer(24000, playbackContextRef.current);
                            audioStreamer.current.onIdle = () => {
                                console.log('[PitchSocket] Audio playback idle — greeting audio finished');
                                setGreetingDone(true);
                            };
                        }
                        audioStreamer.current.resume();
                        audioStreamer.current.addPCM16(part.inlineData.data);
                    }
                });
            } catch (e) {
                // ignore parse errors
            }
        };
    }, []);

    const disconnect = useCallback(() => {
        clearInterval(heartbeatRef.current);
        audioRecorder.current.stop();
        if (audioStreamer.current) {
            audioStreamer.current.stop();
            audioStreamer.current = null;
        }
        if (ws.current) {
            ws.current.close();
            ws.current = null;
        }
        // Stop mic stream tracks
        if (micStreamRef.current) {
            micStreamRef.current.getTracks().forEach(t => t.stop());
            micStreamRef.current = null;
        }
        // Close contexts we created
        if (playbackContextRef.current && playbackContextRef.current.state !== 'closed') {
            playbackContextRef.current.close();
            playbackContextRef.current = null;
        }
        if (micContextRef.current && micContextRef.current.state !== 'closed') {
            micContextRef.current.close();
            micContextRef.current = null;
        }
        setStatus('DISCONNECTED');
        setGreetingDone(false);
        setReport(null);
        releaseWakeLock();
    }, []);

    const startMic = useCallback(async () => {
        await audioRecorder.current.start((base64Audio) => {
            if (ws.current?.readyState === WebSocket.OPEN) {
                ws.current.send(JSON.stringify({
                    type: 'audio',
                    data: base64Audio,
                    sampleRate: 16000,
                }));
            }
        }, {
            audioContext: micContextRef.current,
            stream: micStreamRef.current,
        });
    }, []);

    const stopMic = useCallback(() => {
        audioRecorder.current.stop();
    }, []);

    const sendText = useCallback((text) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: 'text', text }));
        }
    }, []);

    const getMicStream = useCallback(() => {
        return micStreamRef.current || audioRecorder.current.getStream();
    }, []);

    useEffect(() => {
        return () => disconnect();
    }, [disconnect]);

    return { status, report, greetingDone, prepare, connect, disconnect, startMic, stopMic, sendText, getMicStream };
}

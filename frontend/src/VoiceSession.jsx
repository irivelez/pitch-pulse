import { useState, useEffect, useRef, useCallback } from 'react';
import { useSpeechTranscript } from './useSpeechTranscript';
import { useAudioLevel } from './useAudioLevel';

const ORB_SIZE = 160;
const RING_R = 72;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R;

const PERSONA_STYLES = {
    paul_graham:     { accent: '#6B9BFF', label: 'The Scalpel' },
    ben_horowitz:    { accent: '#FF7A5C', label: 'The Hammer' },
    marc_andreessen: { accent: '#A78BFA', label: 'The Mirror' },
};

export default function VoiceSession({ persona, socket, onReport, onBack }) {
    const pitchDuration = persona?.duration || 60;
    const [phase, setPhase] = useState('READY');
    const [timeLeft, setTimeLeft] = useState(pitchDuration);
    const timerRef = useRef(null);
    const speechTranscript = useSpeechTranscript();
    const audioLevel = useAudioLevel();
    const orbRef = useRef(null);
    const rafRef = useRef(null);
    const transcriptEndRef = useRef(null);

    const pStyle = PERSONA_STYLES[persona?.key] || { accent: '#3B82F6', label: 'Advisor' };

    const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    const getTimerColor = () => {
        if (timeLeft <= 10) return '#EF4444';
        if (timeLeft <= 20) return '#F59E0B';
        return 'rgba(255, 255, 255, 0.25)';
    };

    const getTimerGlow = () => {
        if (timeLeft <= 10) return 'rgba(239, 68, 68, 0.4)';
        if (timeLeft <= 20) return 'rgba(245, 158, 11, 0.3)';
        return 'transparent';
    };

    // --- Orb animation loop ---
    const animateOrb = useCallback(() => {
        if (!orbRef.current) return;
        const level = audioLevel.getLevel();
        const orb = orbRef.current;
        const scale = 1 + level * 0.12;
        const glowSize = 10 + level * 40;
        orb.style.transform = `scale(${scale})`;
        orb.style.setProperty('--glow-size', `${glowSize}px`);
        rafRef.current = requestAnimationFrame(animateOrb);
    }, [audioLevel]);

    useEffect(() => {
        if (phase === 'PITCHING' || phase === 'ENDING') {
            rafRef.current = requestAnimationFrame(animateOrb);
        }
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [phase, animateOrb]);

    useEffect(() => {
        if (phase === 'PITCHING') {
            const stream = socket.getMicStream();
            if (stream) audioLevel.attach(stream);
        }
        return () => {
            if (phase === 'PITCHING') audioLevel.detach();
        };
    }, [phase]);

    // Auto-scroll transcript
    useEffect(() => {
        if (transcriptEndRef.current) {
            transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [speechTranscript.transcript]);

    // Watch for report
    useEffect(() => {
        if (socket.report) {
            clearInterval(timerRef.current);
            onReport(socket.report);
        }
    }, [socket.report, onReport]);

    // Safety nudge
    useEffect(() => {
        if (phase !== 'ENDING') return;
        const nudge = setTimeout(() => {
            if (!socket.report) {
                socket.sendText('Now call the generate_report tool with your complete analysis.');
            }
        }, 45000);
        return () => clearTimeout(nudge);
    }, [phase, socket]);

    // GREETING → PITCHING
    useEffect(() => {
        if (phase === 'GREETING' && socket.greetingDone) {
            speechTranscript.start();
            setPhase('PITCHING');
        }
    }, [phase, socket.greetingDone, speechTranscript]);

    // Timer
    useEffect(() => {
        if (phase !== 'PITCHING') return;
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    const pitchText = speechTranscript.stop();
                    socket.stopMic();
                    socket.sendText(`PITCH_COMPLETE\n\nPitch transcript: ${pitchText || '(no transcript captured)'}`);
                    setPhase('ENDING');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [phase, socket]);

    const handleStart = async () => {
        try {
            await socket.prepare();
            socket.connect(persona.key);
            await socket.startMic();
            setPhase('GREETING');
        } catch (e) {
            console.error('Session start error:', e);
        }
    };

    const handleBack = () => {
        socket.disconnect();
        audioLevel.detach();
        clearInterval(timerRef.current);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        onBack();
    };

    const progress = phase === 'PITCHING' ? timeLeft / pitchDuration : 1;
    const dashOffset = RING_CIRCUMFERENCE * (1 - progress);

    const getOrbBorder = () => {
        switch (phase) {
            case 'READY': return 'rgba(255,255,255,0.08)';
            case 'GREETING': return `${pStyle.accent}40`;
            case 'PITCHING': return timeLeft <= 10 ? 'rgba(239,68,68,0.4)' : timeLeft <= 20 ? 'rgba(245,158,11,0.3)' : `${pStyle.accent}30`;
            case 'ENDING': return `${pStyle.accent}40`;
            default: return 'rgba(255,255,255,0.08)';
        }
    };

    const getOrbGlow = () => {
        switch (phase) {
            case 'READY': return 'none';
            case 'GREETING': return `0 0 30px ${pStyle.accent}20`;
            case 'PITCHING': return `0 0 var(--glow-size, 10px) ${pStyle.accent}30`;
            case 'ENDING': return `0 0 var(--glow-size, 20px) ${pStyle.accent}25`;
            default: return 'none';
        }
    };

    const getOrbBg = () => {
        switch (phase) {
            case 'READY': return 'rgba(255,255,255,0.03)';
            case 'GREETING': return `${pStyle.accent}10`;
            case 'PITCHING': return `${pStyle.accent}08`;
            case 'ENDING': return `${pStyle.accent}10`;
            default: return 'rgba(255,255,255,0.03)';
        }
    };

    return (
        <div className="min-h-screen min-h-[100dvh] flex flex-col relative"
             data-persona={persona?.key || ''}>

            {/* Atmosphere */}
            <div className={`atmosphere transition-all duration-1000 ${
                phase === 'PITCHING' ? 'aurora-warm' : ''
            }`} style={phase !== 'PITCHING' ? undefined : undefined} />

            {/* Top bar */}
            <div className="relative z-20 flex items-center justify-between px-5 pt-5 safe-area-top">
                <button
                    onClick={handleBack}
                    className="text-[#5C5C72] hover:text-[#9393A8] transition-colors text-sm flex items-center gap-1"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                </button>

                {/* Timer badge — visible during PITCHING */}
                {phase === 'PITCHING' && (
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full glass text-sm font-mono tabular-nums animate-fade-in ${
                        timeLeft <= 10 ? 'text-red-400' : timeLeft <= 20 ? 'text-amber-400' : 'text-[#6B6B7B]'
                    }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                            timeLeft <= 10 ? 'bg-red-400' : timeLeft <= 20 ? 'bg-amber-400' : 'bg-emerald-400'
                        }`} style={{ animation: 'blink 1.5s ease-in-out infinite' }} />
                        {formatTime(timeLeft)}
                    </div>
                )}
            </div>

            {/* Main content */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">

                {/* Persona name + status */}
                <div className="text-center mb-8 animate-fade-in">
                    <p className="text-[10px] font-semibold tracking-[0.14em] uppercase mb-1"
                       style={{ color: pStyle.accent }}>
                        {pStyle.label}
                    </p>
                    <h2 className="font-serif text-[28px] text-[#E8E8ED] leading-tight">
                        {persona?.name || 'Advisor'}
                    </h2>
                    <p className="text-[13px] text-[#5C5C72] mt-1.5">
                        {phase === 'READY' && 'Ready when you are'}
                        {phase === 'GREETING' && 'Speaking...'}
                        {phase === 'PITCHING' && 'Listening to your pitch'}
                        {phase === 'ENDING' && 'Preparing your report...'}
                    </p>
                </div>

                {/* Orb container with timer ring */}
                <div className="relative mb-6" style={{ width: ORB_SIZE + 16, height: ORB_SIZE + 16 }}>
                    {/* SVG Timer Ring */}
                    {phase === 'PITCHING' && (
                        <svg
                            className="timer-ring absolute inset-0"
                            viewBox="0 0 176 176"
                            style={{ '--ring-glow': getTimerGlow() }}
                        >
                            <circle cx="88" cy="88" r={RING_R} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="2.5" />
                            <circle
                                cx="88" cy="88" r={RING_R} fill="none"
                                stroke={getTimerColor()}
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeDasharray={RING_CIRCUMFERENCE}
                                strokeDashoffset={dashOffset}
                            />
                        </svg>
                    )}

                    {/* The Orb */}
                    <div
                        ref={orbRef}
                        className="voice-orb absolute inset-2 rounded-full flex items-center justify-center transition-colors duration-500"
                        style={{
                            background: getOrbBg(),
                            border: `1px solid ${getOrbBorder()}`,
                            boxShadow: getOrbGlow(),
                        }}
                    >
                        {phase === 'READY' && (
                            <svg className="w-10 h-10 text-[#3E3E52]" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        )}

                        {phase === 'GREETING' && (
                            <div className="flex items-center gap-[3px]">
                                {[16, 24, 20, 28, 16].map((h, i) => (
                                    <div
                                        key={i}
                                        className="w-[3px] rounded-full animate-bounce"
                                        style={{
                                            height: h,
                                            background: pStyle.accent,
                                            opacity: 0.7,
                                            animationDelay: `${i * 100}ms`,
                                            animationDuration: '0.8s',
                                        }}
                                    />
                                ))}
                            </div>
                        )}

                        {phase === 'PITCHING' && (
                            <div className="text-center">
                                <div className={`text-[40px] font-mono font-bold tabular-nums leading-none transition-colors duration-500 ${
                                    timeLeft <= 10 ? 'text-red-400' : timeLeft <= 20 ? 'text-amber-400' : 'text-[#E8E8ED]'
                                }`}>
                                    {formatTime(timeLeft)}
                                </div>
                            </div>
                        )}

                        {phase === 'ENDING' && (
                            <div className="flex items-center gap-[3px]">
                                {[18, 28, 14, 24, 18].map((h, i) => (
                                    <div
                                        key={i}
                                        className="w-[3px] rounded-full animate-bounce"
                                        style={{
                                            height: h,
                                            background: pStyle.accent,
                                            opacity: 0.7,
                                            animationDelay: `${i * 80}ms`,
                                            animationDuration: '0.7s',
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Action area / Transcript */}
                <div className="w-full max-w-sm text-center">
                    {phase === 'READY' && (
                        <button
                            onClick={handleStart}
                            className="px-10 py-3.5 font-semibold rounded-full text-[15px] active:scale-[0.97] transition-all duration-150 animate-fade-in"
                            style={{
                                background: pStyle.accent,
                                color: '#08080C',
                                boxShadow: `0 0 24px ${pStyle.accent}20`,
                            }}
                        >
                            Start Session
                        </button>
                    )}

                    {phase === 'GREETING' && (
                        <div className="animate-fade-in">
                            <p className="text-[#5C5C72] text-[13px]">
                                Your advisor is introducing themselves...
                            </p>
                        </div>
                    )}

                    {phase === 'PITCHING' && (
                        <div className="animate-fade-in">
                            {/* Live transcript */}
                            <div className="max-h-[25vh] overflow-y-auto px-2 mb-3 scrollbar-thin">
                                {speechTranscript.transcript ? (
                                    <p className="text-[#8A8A9A] text-[15px] leading-relaxed font-light text-center">
                                        {speechTranscript.transcript}
                                        <span className="inline-block w-[2px] h-[0.9em] ml-1 cursor-blink"
                                              style={{ background: pStyle.accent, opacity: 0.6 }} />
                                    </p>
                                ) : (
                                    <p className="text-[#3E3E52] text-[14px] italic">
                                        Start speaking — your words will appear here...
                                    </p>
                                )}
                                <div ref={transcriptEndRef} />
                            </div>
                        </div>
                    )}

                    {phase === 'ENDING' && (
                        <div className="animate-fade-in space-y-3">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass">
                                <div className="w-2 h-2 rounded-full animate-pulse"
                                     style={{ background: pStyle.accent }} />
                                <span className="text-[13px] text-[#6B6B7B]">Analyzing your pitch...</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

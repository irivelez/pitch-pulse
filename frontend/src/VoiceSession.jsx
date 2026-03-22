import { useState, useEffect, useRef, useCallback } from 'react';
import { useSpeechTranscript } from './useSpeechTranscript';
import { useAudioLevel } from './useAudioLevel';

const ORB_SIZE = 160;
const RING_R = 72;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R;

export default function VoiceSession({ persona, socket, onReport, onBack }) {
    const pitchDuration = persona?.duration || 60;
    const [phase, setPhase] = useState('READY'); // READY → GREETING → PITCHING → ENDING
    const [timeLeft, setTimeLeft] = useState(pitchDuration);
    const timerRef = useRef(null);
    const speechTranscript = useSpeechTranscript();
    const audioLevel = useAudioLevel();
    const orbRef = useRef(null);
    const rafRef = useRef(null);

    const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    const getTimerColor = () => {
        if (timeLeft <= 10) return '#EF4444';
        if (timeLeft <= 20) return '#F59E0B';
        return 'rgba(255, 255, 255, 0.35)';
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

        // Scale: 1.0 at silence, up to 1.12 at max volume
        const scale = 1 + level * 0.12;
        // Glow: 10px at silence, up to 50px at max volume
        const glowSize = 10 + level * 40;

        orb.style.transform = `scale(${scale})`;
        orb.style.setProperty('--glow-size', `${glowSize}px`);
        orb.style.setProperty('--level', level.toFixed(3));

        rafRef.current = requestAnimationFrame(animateOrb);
    }, [audioLevel]);

    // Start/stop animation loop based on phase
    useEffect(() => {
        if (phase === 'PITCHING' || phase === 'ENDING') {
            rafRef.current = requestAnimationFrame(animateOrb);
        }
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [phase, animateOrb]);

    // Attach mic stream to audio analyser when mic starts
    useEffect(() => {
        if (phase === 'PITCHING') {
            const stream = socket.getMicStream();
            if (stream) audioLevel.attach(stream);
        }
        return () => {
            if (phase === 'PITCHING') audioLevel.detach();
        };
    }, [phase]);

    // Watch for report
    useEffect(() => {
        if (socket.report) {
            clearInterval(timerRef.current);
            onReport(socket.report);
        }
    }, [socket.report, onReport]);

    // Safety nudge for report
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

    // Timer countdown
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
        socket.connect(persona.key);
        setPhase('GREETING');
        setTimeout(async () => {
            try { await socket.startMic(); } catch (e) { console.error('Mic error:', e); }
        }, 1500);
    };

    const handleBack = () => {
        socket.disconnect();
        audioLevel.detach();
        clearInterval(timerRef.current);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        onBack();
    };

    // Timer progress (1 = full, 0 = empty)
    const progress = phase === 'PITCHING' ? timeLeft / pitchDuration : 1;
    const dashOffset = RING_CIRCUMFERENCE * (1 - progress);

    // Phase-specific orb styles
    const getOrbClasses = () => {
        switch (phase) {
            case 'READY':
                return 'bg-white/[0.03] border border-white/[0.08]';
            case 'GREETING':
                return 'bg-pulse-blue/10 border border-pulse-blue/30';
            case 'PITCHING':
                return 'bg-gradient-to-br from-amber-500/10 to-red-500/10 border border-red-500/30';
            case 'ENDING':
                return 'bg-pulse-blue/10 border border-pulse-blue/40';
            default:
                return '';
        }
    };

    const getOrbGlow = () => {
        switch (phase) {
            case 'READY': return '0 0 0 transparent';
            case 'GREETING': return '0 0 30px rgba(59, 130, 246, 0.15)';
            case 'PITCHING': return `0 0 var(--glow-size, 10px) rgba(245, 158, 11, 0.25)`;
            case 'ENDING': return '0 0 var(--glow-size, 20px) rgba(59, 130, 246, 0.25)';
            default: return 'none';
        }
    };

    const getAuroraClass = () => {
        if (phase === 'PITCHING') return 'aurora-warm';
        return 'aurora-blue';
    };

    const getStatusText = () => {
        switch (phase) {
            case 'READY': return 'Your Advisor';
            case 'GREETING': return 'Connecting';
            case 'PITCHING': return 'Listening';
            case 'ENDING': return 'Reviewing';
            default: return '';
        }
    };

    return (
        <div className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center px-6 relative">
            {/* Aurora background */}
            <div className={`${getAuroraClass()} transition-all duration-1000`} />

            {/* Back */}
            <button
                onClick={handleBack}
                className="absolute top-6 left-6 z-20 text-[#5C5C72] hover:text-[#9393A8] transition-colors text-sm flex items-center gap-1.5"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
            </button>

            <div className="relative z-10 flex flex-col items-center">
                {/* Status + Name */}
                <div className="text-center mb-10 animate-fade-in">
                    <p className="text-[#5C5C72] text-[11px] uppercase tracking-[0.14em] font-medium mb-1.5">
                        {getStatusText()}
                    </p>
                    <h2 className="text-[26px] font-bold text-[#F0F0F5] tracking-tight">
                        {persona?.name || 'Advisor'}
                    </h2>
                </div>

                {/* Orb container with timer ring */}
                <div className="relative mb-10" style={{ width: ORB_SIZE + 16, height: ORB_SIZE + 16 }}>
                    {/* SVG Timer Ring — only during PITCHING */}
                    {phase === 'PITCHING' && (
                        <svg
                            className="timer-ring absolute inset-0"
                            viewBox="0 0 176 176"
                            style={{ '--ring-glow': getTimerGlow() }}
                        >
                            {/* Track */}
                            <circle
                                cx="88" cy="88" r={RING_R}
                                fill="none"
                                stroke="rgba(255,255,255,0.06)"
                                strokeWidth="3"
                            />
                            {/* Progress */}
                            <circle
                                cx="88" cy="88" r={RING_R}
                                fill="none"
                                stroke={getTimerColor()}
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeDasharray={RING_CIRCUMFERENCE}
                                strokeDashoffset={dashOffset}
                            />
                        </svg>
                    )}

                    {/* The Orb */}
                    <div
                        ref={orbRef}
                        className={`voice-orb absolute inset-2 rounded-full flex items-center justify-center transition-colors duration-500 ${getOrbClasses()}`}
                        style={{ boxShadow: getOrbGlow() }}
                    >
                        {/* Inner content per phase */}
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
                                        className="w-[3px] bg-pulse-blue/70 rounded-full animate-bounce"
                                        style={{ height: h, animationDelay: `${i * 100}ms`, animationDuration: '0.8s' }}
                                    />
                                ))}
                            </div>
                        )}

                        {phase === 'PITCHING' && (
                            <div className="text-center">
                                <div className={`text-[40px] font-mono font-bold tabular-nums leading-none transition-colors duration-500 ${
                                    timeLeft <= 10 ? 'text-red-400' : timeLeft <= 20 ? 'text-amber-400' : 'text-[#F0F0F5]'
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
                                        className="w-[3px] bg-pulse-blue/70 rounded-full animate-bounce"
                                        style={{ height: h, animationDelay: `${i * 80}ms`, animationDuration: '0.7s' }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Action area */}
                <div className="text-center">
                    {phase === 'READY' && (
                        <button
                            onClick={handleStart}
                            className="px-10 py-3.5 bg-white text-[#08080C] font-semibold rounded-full text-[15px] active:scale-[0.97] transition-transform duration-150 shadow-[0_0_20px_rgba(255,255,255,0.06)] animate-fade-in"
                        >
                            Start Session
                        </button>
                    )}

                    {phase === 'GREETING' && (
                        <p className="text-[#5C5C72] text-[13px] animate-fade-in">
                            Your advisor is introducing themselves...
                        </p>
                    )}

                    {phase === 'PITCHING' && (
                        <p className="text-[#5C5C72] text-[13px] animate-fade-in">
                            Pitch now. The advisor is listening.
                        </p>
                    )}

                    {phase === 'ENDING' && (
                        <p className="text-[#5C5C72] text-[13px] animate-fade-in">
                            Advisor is reviewing your pitch...
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

import { useState, useEffect, useRef } from 'react';

// --- Animated counter hook ---
function useCountUp(target, duration = 1000, delay = 0) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        if (!target) return;
        const timeout = setTimeout(() => {
            const start = performance.now();
            const step = (now) => {
                const progress = Math.min((now - start) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
                setValue(Math.round(eased * target));
                if (progress < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        }, delay);
        return () => clearTimeout(timeout);
    }, [target, duration, delay]);
    return value;
}

// --- Score color helpers ---
function scoreColor(score) {
    if (score >= 7) return { bar: 'from-emerald-400 to-green-500', text: 'text-emerald-400', ring: '#22C55E' };
    if (score >= 5) return { bar: 'from-amber-400 to-yellow-500', text: 'text-amber-400', ring: '#F59E0B' };
    return { bar: 'from-red-400 to-rose-500', text: 'text-red-400', ring: '#EF4444' };
}

function scoreLabel(score) {
    if (score >= 8) return 'Strong';
    if (score >= 6) return 'Decent';
    if (score >= 4) return 'Needs Work';
    return 'Rethink';
}

// --- Animated Score Bar ---
function ScoreBar({ label, score, delay = 0 }) {
    const [mounted, setMounted] = useState(false);
    const displayScore = useCountUp(score, 700, delay);
    const color = scoreColor(score);

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), delay);
        return () => clearTimeout(t);
    }, [delay]);

    return (
        <div className="mb-3.5">
            <div className="flex justify-between text-[13px] mb-1.5">
                <span className="text-[#9393A8]">{label}</span>
                <span className={`font-semibold tabular-nums ${color.text}`}>{displayScore}/10</span>
            </div>
            <div className="h-[6px] bg-white/[0.06] rounded-full overflow-hidden">
                <div
                    className={`score-bar-fill h-full bg-gradient-to-r ${color.bar} rounded-full`}
                    style={{ width: mounted ? `${Math.max(score, 0.5) * 10}%` : '0%' }}
                />
            </div>
        </div>
    );
}

// --- Hero Score Ring (SVG) ---
function HeroScore({ score, delay = 200 }) {
    const [mounted, setMounted] = useState(false);
    const displayScore = useCountUp(score, 1000, delay);
    const color = scoreColor(score);

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), delay);
        return () => clearTimeout(t);
    }, [delay]);

    const r = 44;
    const circumference = 2 * Math.PI * r;
    const progress = mounted ? score / 10 : 0;
    const offset = circumference * (1 - progress);

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-28 h-28">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                    <circle
                        cx="50" cy="50" r={r} fill="none"
                        stroke={color.ring}
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        style={{
                            transition: `stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`,
                            filter: `drop-shadow(0 0 8px ${color.ring}40)`,
                        }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[36px] font-bold tabular-nums text-[#F0F0F5] leading-none">{displayScore}</span>
                    <span className="text-[11px] text-[#5C5C72] mt-0.5">/10</span>
                </div>
            </div>
            <span className={`text-[12px] font-medium mt-2 ${color.text}`}>{scoreLabel(score)}</span>
        </div>
    );
}

// --- Stagger wrapper ---
function Reveal({ delay = 0, children }) {
    return (
        <div
            className="stagger-enter"
            style={{ animationDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}

// --- Score Keys ---
const SCORES = [
    { key: 'problem_clarity', label: 'Problem Clarity' },
    { key: 'solution_strength', label: 'Solution Strength' },
    { key: 'market_understanding', label: 'Market Understanding' },
    { key: 'business_model', label: 'Business Model' },
    { key: 'ask_clarity', label: 'Ask Clarity' },
    { key: 'delivery', label: 'Delivery' },
];

// --- Main Component ---
export default function BoardReport({ data, personaName, onReset }) {
    if (!data) return null;

    const scores = data.scores || {};
    const overall = scores.overall || 0;

    return (
        <div className="min-h-screen min-h-[100dvh] px-5 py-10 max-w-lg mx-auto relative">
            {/* Aurora */}
            <div className="aurora" />

            <div className="relative z-10">
                {/* Header */}
                <Reveal delay={0}>
                    <div className="text-center mb-8">
                        <h1 className="text-[26px] font-bold text-[#F0F0F5] tracking-tight mb-1">Board Report</h1>
                        <p className="text-[#5C5C72] text-[13px]">
                            Feedback from <span className="text-[#9393A8] font-medium">{personaName || 'Advisor'}</span>
                        </p>
                    </div>
                </Reveal>

                {/* Hero Score */}
                <Reveal delay={100}>
                    <div className="flex justify-center mb-8">
                        <HeroScore score={overall} delay={300} />
                    </div>
                </Reveal>

                {/* Verdict */}
                {data.verdict && (
                    <Reveal delay={250}>
                        <div className="glass-elevated rounded-2xl p-5 mb-5">
                            <p className="text-[11px] text-[#5C5C72] uppercase tracking-[0.1em] font-medium mb-2.5">Advisor Verdict</p>
                            <p className="text-[#F0F0F5] text-[16px] leading-relaxed italic">
                                &ldquo;{data.verdict}&rdquo;
                            </p>
                        </div>
                    </Reveal>
                )}

                {/* Score Breakdown */}
                <Reveal delay={400}>
                    <div className="glass rounded-2xl p-5 mb-5">
                        <p className="text-[11px] text-[#5C5C72] uppercase tracking-[0.1em] font-medium mb-4">Score Breakdown</p>
                        {SCORES.map((s, i) => (
                            <ScoreBar
                                key={s.key}
                                label={s.label}
                                score={scores[s.key] || 0}
                                delay={500 + i * 80}
                            />
                        ))}
                    </div>
                </Reveal>

                {/* Strength & Weakness */}
                <div className="space-y-3 mb-5">
                    {data.top_strength && (
                        <Reveal delay={700}>
                            <div className="glass rounded-2xl p-5 border-l-[3px] border-l-emerald-500/60">
                                <p className="text-[11px] text-emerald-400 uppercase tracking-[0.1em] font-medium mb-2">Top Strength</p>
                                <p className="text-[#E0E0EA] text-[14px] leading-relaxed">{data.top_strength}</p>
                            </div>
                        </Reveal>
                    )}
                    {data.top_weakness && (
                        <Reveal delay={800}>
                            <div className="glass rounded-2xl p-5 border-l-[3px] border-l-red-500/60">
                                <p className="text-[11px] text-red-400 uppercase tracking-[0.1em] font-medium mb-2">Top Weakness</p>
                                <p className="text-[#E0E0EA] text-[14px] leading-relaxed">{data.top_weakness}</p>
                            </div>
                        </Reveal>
                    )}
                </div>

                {/* Killer Question */}
                {data.killer_question && (
                    <Reveal delay={900}>
                        <div className="glass rounded-2xl p-5 mb-5 border border-purple-500/20 bg-purple-500/[0.04]">
                            <p className="text-[11px] text-purple-400 uppercase tracking-[0.1em] font-medium mb-2">The Question You Must Answer</p>
                            <p className="text-[#F0F0F5] text-[15px] leading-relaxed">{data.killer_question}</p>
                        </div>
                    </Reveal>
                )}

                {/* Fix This First */}
                {data.one_thing_to_fix && (
                    <Reveal delay={1000}>
                        <div className="glass rounded-2xl p-5 mb-10 border-t-[3px] border-t-pulse-blue/50 bg-pulse-blue/[0.03]">
                            <p className="text-[11px] text-pulse-blue uppercase tracking-[0.1em] font-medium mb-2">Fix This First</p>
                            <p className="text-[#E0E0EA] text-[14px] leading-relaxed">{data.one_thing_to_fix}</p>
                        </div>
                    </Reveal>
                )}

                {/* Try Again */}
                <Reveal delay={1100}>
                    <div className="text-center pb-10 safe-area-bottom">
                        <button
                            onClick={onReset}
                            className="px-10 py-4 bg-white text-[#08080C] font-semibold rounded-full text-[15px] active:scale-[0.97] transition-transform duration-150 shadow-[0_0_20px_rgba(255,255,255,0.06)]"
                        >
                            Try Another Pitch
                        </button>
                    </div>
                </Reveal>
            </div>
        </div>
    );
}

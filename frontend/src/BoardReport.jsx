import { useState, useEffect } from 'react';

// --- Persona branding (matches PersonaSelector) ---
const PERSONA_BRAND = {
    paul_graham:     { emoji: '\u2694\uFE0F', accent: '#6B9BFF', label: 'The Scalpel' },
    ben_horowitz:    { emoji: '\uD83D\uDD28', accent: '#FF7A5C', label: 'The Hammer' },
    marc_andreessen: { emoji: '\uD83E\uDE9E', accent: '#A78BFA', label: 'The Mirror' },
};
const DEFAULT_BRAND = { emoji: '\uD83C\uDFAF', accent: '#3B82F6', label: 'Advisor' };

// --- Animated counter ---
function useCountUp(target, duration = 1000, delay = 0) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        if (!target) return;
        const timeout = setTimeout(() => {
            const start = performance.now();
            const step = (now) => {
                const progress = Math.min((now - start) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                setValue(Math.round(eased * target));
                if (progress < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        }, delay);
        return () => clearTimeout(timeout);
    }, [target, duration, delay]);
    return value;
}

// --- Score colors ---
function scoreColor(score) {
    if (score >= 7) return { bar: 'from-emerald-400 to-green-500', text: 'text-emerald-400', ring: '#22C55E' };
    if (score >= 5) return { bar: 'from-amber-400 to-yellow-500', text: 'text-amber-400', ring: '#F59E0B' };
    return { bar: 'from-red-400 to-rose-500', text: 'text-red-400', ring: '#EF4444' };
}

function scoreLabel(score) {
    if (score >= 8) return 'Investor Ready';
    if (score >= 6) return 'Getting There';
    if (score >= 4) return 'Needs Work';
    return 'Back to Drawing Board';
}

// --- Score Ring ---
function ScoreRing({ score, accent, delay = 200 }) {
    const [mounted, setMounted] = useState(false);
    const displayScore = useCountUp(score, 1200, delay);
    const color = scoreColor(score);

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), delay);
        return () => clearTimeout(t);
    }, [delay]);

    const r = 38;
    const circumference = 2 * Math.PI * r;
    const progress = mounted ? score / 10 : 0;
    const offset = circumference * (1 - progress);

    return (
        <div className="relative w-24 h-24">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                <circle
                    cx="50" cy="50" r={r} fill="none"
                    stroke={color.ring}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{
                        transition: `stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`,
                        filter: `drop-shadow(0 0 10px ${color.ring}50)`,
                    }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[32px] font-bold tabular-nums text-[#F0F0F5] leading-none">{displayScore}</span>
                <span className="text-[10px] text-[#5C5C72] mt-0.5">/10</span>
            </div>
        </div>
    );
}

// --- Mini Score Bar ---
function MiniBar({ label, score, delay = 0 }) {
    const [mounted, setMounted] = useState(false);
    const color = scoreColor(score);

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), delay);
        return () => clearTimeout(t);
    }, [delay]);

    return (
        <div className="flex items-center gap-3">
            <span className="text-[12px] text-[#5C5C72] w-[80px] shrink-0 truncate">{label}</span>
            <div className="flex-1 h-[5px] bg-white/[0.06] rounded-full overflow-hidden">
                <div
                    className={`score-bar-fill h-full bg-gradient-to-r ${color.bar} rounded-full`}
                    style={{ width: mounted ? `${Math.max(score, 0.5) * 10}%` : '0%' }}
                />
            </div>
            <span className={`text-[12px] font-semibold tabular-nums w-5 text-right ${color.text}`}>{score}</span>
        </div>
    );
}

// --- Reveal wrapper ---
function Reveal({ delay = 0, children }) {
    return (
        <div className="stagger-enter" style={{ animationDelay: `${delay}ms` }}>
            {children}
        </div>
    );
}

// --- Score keys ---
const SCORES = [
    { key: 'problem_clarity', label: 'Problem' },
    { key: 'solution_strength', label: 'Solution' },
    { key: 'market_understanding', label: 'Market' },
    { key: 'business_model', label: 'Biz Model' },
    { key: 'ask_clarity', label: 'The Ask' },
    { key: 'delivery', label: 'Delivery' },
];

// --- Main Component ---
export default function BoardReport({ data, personaName, personaKey, onReset }) {
    if (!data) return null;

    const scores = data.scores || {};
    const overall = scores.overall || 0;
    const color = scoreColor(overall);
    const brand = PERSONA_BRAND[personaKey] || DEFAULT_BRAND;

    return (
        <div className="min-h-screen min-h-[100dvh] px-5 py-8 max-w-lg mx-auto relative safe-area-top">
            <div className="aurora" />

            <div className="relative z-10">

                {/* ===== PERSONA HEADER + SCORE ===== */}
                <Reveal delay={0}>
                    <div className="flex items-center gap-5 mb-6">
                        {/* Score ring */}
                        <ScoreRing score={overall} accent={brand.accent} delay={300} />

                        {/* Persona identity */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xl">{brand.emoji}</span>
                                <span className="text-[11px] font-medium tracking-[0.12em] uppercase"
                                      style={{ color: brand.accent }}>
                                    {brand.label}
                                </span>
                            </div>
                            <h1 className="text-[22px] font-bold text-[#F0F0F5] tracking-tight leading-tight">
                                {personaName || 'Advisor'}
                            </h1>
                            <p className={`text-[13px] font-medium mt-1 ${color.text}`}>
                                {scoreLabel(overall)}
                            </p>
                        </div>
                    </div>
                </Reveal>

                {/* ===== VERDICT — THE HERO ===== */}
                {data.verdict && (
                    <Reveal delay={200}>
                        <div className="glass-elevated rounded-2xl p-5 mb-5"
                             style={{ borderLeft: `3px solid ${brand.accent}40` }}>
                            <p className="text-[#F0F0F5] text-[17px] leading-relaxed italic">
                                &ldquo;{data.verdict}&rdquo;
                            </p>
                        </div>
                    </Reveal>
                )}

                {/* ===== STRENGTH vs WEAKNESS ===== */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    {data.top_strength && (
                        <Reveal delay={400}>
                            <div className="glass rounded-xl p-4 h-full">
                                <div className="flex items-center gap-1.5 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                    <p className="text-[10px] text-emerald-400 uppercase tracking-[0.1em] font-semibold">Strength</p>
                                </div>
                                <p className="text-[#E0E0EA] text-[13px] leading-snug">{data.top_strength}</p>
                            </div>
                        </Reveal>
                    )}
                    {data.top_weakness && (
                        <Reveal delay={480}>
                            <div className="glass rounded-xl p-4 h-full">
                                <div className="flex items-center gap-1.5 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-red-400" />
                                    <p className="text-[10px] text-red-400 uppercase tracking-[0.1em] font-semibold">Weakness</p>
                                </div>
                                <p className="text-[#E0E0EA] text-[13px] leading-snug">{data.top_weakness}</p>
                            </div>
                        </Reveal>
                    )}
                </div>

                {/* ===== KILLER QUESTION ===== */}
                {data.killer_question && (
                    <Reveal delay={560}>
                        <div className="glass rounded-xl p-4 mb-4">
                            <p className="text-[10px] text-purple-400 uppercase tracking-[0.1em] font-semibold mb-2">
                                The Question You Can't Answer
                            </p>
                            <p className="text-[#F0F0F5] text-[14px] leading-relaxed">{data.killer_question}</p>
                        </div>
                    </Reveal>
                )}

                {/* ===== FIX THIS FIRST ===== */}
                {data.one_thing_to_fix && (
                    <Reveal delay={640}>
                        <div className="glass rounded-xl p-4 mb-4"
                             style={{ borderTop: `2px solid ${brand.accent}40` }}>
                            <p className="text-[10px] uppercase tracking-[0.1em] font-semibold mb-2"
                               style={{ color: brand.accent }}>
                                Fix This Before Your Next Pitch
                            </p>
                            <p className="text-[#E0E0EA] text-[14px] leading-relaxed">{data.one_thing_to_fix}</p>
                        </div>
                    </Reveal>
                )}

                {/* ===== SCORE BREAKDOWN — compact ===== */}
                <Reveal delay={720}>
                    <div className="glass rounded-xl p-4 mb-4">
                        <p className="text-[10px] text-[#5C5C72] uppercase tracking-[0.1em] font-semibold mb-3">Breakdown</p>
                        <div className="space-y-2.5">
                            {SCORES.map((s, i) => (
                                <MiniBar
                                    key={s.key}
                                    label={s.label}
                                    score={scores[s.key] || 0}
                                    delay={800 + i * 60}
                                />
                            ))}
                        </div>
                    </div>
                </Reveal>

                {/* ===== PITCH REWRITE — THE CROWN JEWEL ===== */}
                {data.pitch_rewrite && (
                    <Reveal delay={900}>
                        <div className="rounded-2xl p-5 mb-8"
                             style={{
                                 background: `linear-gradient(135deg, ${brand.accent}10, ${brand.accent}05)`,
                                 border: `1px solid ${brand.accent}25`,
                             }}>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-lg">{brand.emoji}</span>
                                <p className="text-[11px] font-semibold tracking-[0.1em] uppercase"
                                   style={{ color: brand.accent }}>
                                    Your Pitch, Rewritten by {personaName}
                                </p>
                            </div>
                            <p className="text-[#F0F0F5] text-[15px] leading-relaxed italic">
                                &ldquo;{data.pitch_rewrite}&rdquo;
                            </p>
                        </div>
                    </Reveal>
                )}

                {/* ===== ACTIONS ===== */}
                <Reveal delay={1000}>
                    <div className="flex flex-col items-center gap-3 pb-10 safe-area-bottom">
                        <button
                            onClick={onReset}
                            className="w-full max-w-xs py-3.5 bg-white text-[#08080C] font-semibold rounded-full text-[15px] active:scale-[0.97] transition-transform duration-150 shadow-[0_0_20px_rgba(255,255,255,0.06)]"
                        >
                            Try Another Advisor
                        </button>
                        <p className="text-[11px] text-[#3E3E52]">
                            Pitch<span style={{ color: brand.accent }}>Pulse</span>
                        </p>
                    </div>
                </Reveal>
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';

// --- Persona branding ---
const PERSONA_BRAND = {
    paul_graham:     { emoji: '⚔️', accent: '#6B9BFF', label: 'The Scalpel' },
    ben_horowitz:    { emoji: '🔨', accent: '#FF7A5C', label: 'The Hammer' },
    marc_andreessen: { emoji: '🪞', accent: '#A78BFA', label: 'The Mirror' },
};
const DEFAULT_BRAND = { emoji: '🎯', accent: '#3B82F6', label: 'Advisor' };

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
    if (score >= 7) return { bar: 'from-emerald-400 to-green-500', text: 'text-emerald-400', ring: '#22C55E', label: 'emerald' };
    if (score >= 5) return { bar: 'from-amber-400 to-yellow-500', text: 'text-amber-400', ring: '#F59E0B', label: 'amber' };
    return { bar: 'from-red-400 to-rose-500', text: 'text-red-400', ring: '#EF4444', label: 'red' };
}

function scoreLabel(score) {
    if (score >= 8) return 'Investor Ready';
    if (score >= 6) return 'Getting There';
    if (score >= 4) return 'Needs Work';
    return 'Back to Drawing Board';
}

// --- Score Ring ---
function ScoreRing({ score, delay = 200 }) {
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
        <div className="relative w-20 h-20">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="4" />
                <circle
                    cx="50" cy="50" r={r} fill="none"
                    stroke={color.ring}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{
                        transition: `stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`,
                        filter: `drop-shadow(0 0 8px ${color.ring}40)`,
                    }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[28px] font-bold tabular-nums text-[#E8E8ED] leading-none">{displayScore}</span>
                <span className="text-[9px] text-[#5C5C72] mt-0.5">/10</span>
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
            <span className="text-[12px] text-[#5C5C72] w-[72px] shrink-0 truncate">{label}</span>
            <div className="flex-1 h-[4px] bg-white/[0.04] rounded-full overflow-hidden">
                <div
                    className={`score-bar-fill h-full bg-gradient-to-r ${color.bar} rounded-full`}
                    style={{ width: mounted ? `${Math.max(score, 0.5) * 10}%` : '0%' }}
                />
            </div>
            <span className={`text-[12px] font-semibold tabular-nums w-5 text-right ${color.text}`}>{score}</span>
        </div>
    );
}

// --- Reveal ---
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
        <div className="min-h-screen min-h-[100dvh] relative safe-area-top"
             data-persona={personaKey || ''}>
            <div className="atmosphere" />

            <div className="relative z-10 px-6 py-8 max-w-lg mx-auto">

                {/* ===== HEADER: Score + Persona ===== */}
                <Reveal delay={0}>
                    <div className="flex items-center gap-4 mb-8">
                        <ScoreRing score={overall} delay={300} />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">{brand.emoji}</span>
                                <span className="text-[10px] font-semibold tracking-[0.12em] uppercase"
                                      style={{ color: brand.accent }}>
                                    {brand.label}
                                </span>
                            </div>
                            <h1 className="font-serif text-[24px] text-[#E8E8ED] leading-tight">
                                {personaName || 'Advisor'}
                            </h1>
                            <p className={`text-[13px] font-medium mt-0.5 ${color.text}`}>
                                {scoreLabel(overall)}
                            </p>
                        </div>
                    </div>
                </Reveal>

                {/* ===== VERDICT — Serif pull-quote ===== */}
                {data.verdict && (
                    <Reveal delay={200}>
                        <blockquote className="mb-8 pl-4" style={{ borderLeft: `2px solid ${brand.accent}40` }}>
                            <p className="font-serif text-[20px] text-[#E8E8ED] leading-[1.4] italic">
                                &ldquo;{data.verdict}&rdquo;
                            </p>
                        </blockquote>
                    </Reveal>
                )}

                {/* ===== STRENGTH & WEAKNESS — Inline, no cards ===== */}
                <Reveal delay={380}>
                    <div className="space-y-5 mb-8">
                        {data.top_strength && (
                            <div>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-emerald-400">
                                        What's working
                                    </span>
                                </div>
                                <p className="text-[#B0B0BE] text-[15px] leading-relaxed pl-3.5">
                                    {data.top_strength}
                                </p>
                            </div>
                        )}
                        {data.top_weakness && (
                            <div>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                    <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-red-400">
                                        What's not
                                    </span>
                                </div>
                                <p className="text-[#B0B0BE] text-[15px] leading-relaxed pl-3.5">
                                    {data.top_weakness}
                                </p>
                            </div>
                        )}
                    </div>
                </Reveal>

                <Reveal delay={480}>
                    <div className="divider mb-8" />
                </Reveal>

                {/* ===== KILLER QUESTION — Serif pull-quote ===== */}
                {data.killer_question && (
                    <Reveal delay={520}>
                        <div className="mb-8">
                            <span className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#5C5C72] mb-2 block">
                                The question you can't answer
                            </span>
                            <p className="font-serif text-[18px] text-[#E8E8ED] leading-[1.4] italic">
                                &ldquo;{data.killer_question}&rdquo;
                            </p>
                        </div>
                    </Reveal>
                )}

                {/* ===== FIX THIS FIRST ===== */}
                {data.one_thing_to_fix && (
                    <Reveal delay={600}>
                        <div className="mb-8 pl-4" style={{ borderLeft: `2px solid ${brand.accent}30` }}>
                            <span className="text-[10px] font-semibold tracking-[0.1em] uppercase mb-1.5 block"
                                  style={{ color: brand.accent }}>
                                Fix this before your next pitch
                            </span>
                            <p className="text-[#B0B0BE] text-[15px] leading-relaxed">
                                {data.one_thing_to_fix}
                            </p>
                        </div>
                    </Reveal>
                )}

                <Reveal delay={680}>
                    <div className="divider mb-8" />
                </Reveal>

                {/* ===== SCORE BREAKDOWN — Minimal ===== */}
                <Reveal delay={720}>
                    <div className="mb-8">
                        <span className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#5C5C72] mb-4 block">
                            Breakdown
                        </span>
                        <div className="space-y-3">
                            {SCORES.map((s, i) => (
                                <MiniBar
                                    key={s.key}
                                    label={s.label}
                                    score={scores[s.key] || 0}
                                    delay={780 + i * 50}
                                />
                            ))}
                        </div>
                    </div>
                </Reveal>

                {/* ===== PITCH REWRITE ===== */}
                {data.pitch_rewrite && (
                    <Reveal delay={900}>
                        <div className="mb-8 pt-2">
                            <div className="divider mb-8" />

                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-lg">{brand.emoji}</span>
                                <span className="text-[11px] font-semibold tracking-[0.1em] uppercase"
                                      style={{ color: brand.accent }}>
                                    Your pitch, rewritten by {personaName}
                                </span>
                            </div>

                            <p className="font-serif text-[19px] text-[#E8E8ED] leading-[1.5] italic">
                                &ldquo;{data.pitch_rewrite}&rdquo;
                            </p>
                        </div>
                    </Reveal>
                )}

                {/* ===== IDEAL PITCH — The Crown Jewel ===== */}
                {data.ideal_pitch && (
                    <Reveal delay={1000}>
                        <div className="mb-10 pt-2 pb-4">
                            <div className="divider mb-8" />

                            <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#5C5C72] block mb-1">
                                The pitch that gets the meeting
                            </span>
                            <p className="text-[13px] text-[#5C5C72] mb-5">
                                A ready-to-deliver version of your pitch, crafted by {personaName}.
                                Practice this one.
                            </p>

                            <div className="rounded-2xl px-5 py-6"
                                 style={{
                                     background: `linear-gradient(135deg, ${brand.accent}08, ${brand.accent}03)`,
                                     border: `1px solid ${brand.accent}18`,
                                 }}>
                                <p className="font-serif text-[18px] text-[#E8E8ED] leading-[1.55]"
                                   style={{ whiteSpace: 'pre-line' }}>
                                    {data.ideal_pitch}
                                </p>
                            </div>
                        </div>
                    </Reveal>
                )}

                {/* ===== CTA ===== */}
                <Reveal delay={1100}>
                    <div className="flex flex-col items-center gap-3 pb-10 safe-area-bottom">
                        <button
                            onClick={onReset}
                            className="w-full max-w-xs py-3.5 font-semibold rounded-full text-[15px] active:scale-[0.97] transition-all duration-150"
                            style={{
                                background: brand.accent,
                                color: '#08080C',
                                boxShadow: `0 0 24px ${brand.accent}20`,
                            }}
                        >
                            Try Another Advisor
                        </button>
                        <p className="text-[11px] text-[#3A3A48]">
                            Pitch<span style={{ color: brand.accent }}>Pulse</span>
                        </p>
                    </div>
                </Reveal>
            </div>
        </div>
    );
}

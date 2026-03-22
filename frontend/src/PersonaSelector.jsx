import { useState, useEffect, useRef } from 'react';

const PERSONA_STYLES = {
    paul_graham:       { emoji: '\u2694\uFE0F', accent: '#6B9BFF', bg: 'rgba(107,155,255,0.10)', label: 'The Scalpel' },
    ben_horowitz:      { emoji: '\uD83D\uDD28', accent: '#FF7A5C', bg: 'rgba(255,122,92,0.10)',  label: 'The Hammer' },
    marc_andreessen:   { emoji: '\uD83E\uDE9E', accent: '#A78BFA', bg: 'rgba(167,139,250,0.10)', label: 'The Mirror' },
};

const FALLBACK_STYLES = [
    { emoji: '\uD83C\uDFAF', accent: '#34D399', bg: 'rgba(52,211,153,0.10)', label: 'Advisor' },
    { emoji: '\uD83D\uDD25', accent: '#FB7185', bg: 'rgba(251,113,133,0.10)', label: 'Advisor' },
    { emoji: '\u26A1',       accent: '#38BDF8', bg: 'rgba(56,189,248,0.10)', label: 'Advisor' },
];

function getStyle(key, index) {
    return PERSONA_STYLES[key] || FALLBACK_STYLES[index % FALLBACK_STYLES.length];
}

const DURATIONS = [
    { label: '0:45', seconds: 45 },
    { label: '1:00', seconds: 60 },
];

export default function PersonaSelector({ onSelect }) {
    const [personas, setPersonas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [duration, setDuration] = useState(60);
    const advisorsRef = useRef(null);

    useEffect(() => {
        fetch('/api/personas')
            .then(res => res.json())
            .then(data => {
                const list = Object.entries(data).map(([key, meta], i) => ({
                    key,
                    name: meta.name,
                    tagline: meta.tagline,
                    style: getStyle(key, i),
                }));
                setPersonas(list);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const durationIndex = DURATIONS.findIndex(d => d.seconds === duration);

    const scrollToAdvisors = () => {
        advisorsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="min-h-screen min-h-[100dvh] relative">
            {/* Aurora background */}
            <div className="aurora" />

            {/* ===== HERO SECTION ===== */}
            <div className="relative z-10 min-h-screen min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center">

                {/* Logo — small, subtle */}
                <div className="stagger-enter mb-6">
                    <span className="text-[13px] font-medium tracking-[0.15em] uppercase text-[#5C5C72]">
                        Pitch<span className="text-pulse-blue">Pulse</span>
                    </span>
                </div>

                {/* Headline */}
                <h1 className="stagger-enter text-[36px] sm:text-[44px] font-bold tracking-tight text-[#F0F0F5] leading-[1.1] max-w-md"
                    style={{ animationDelay: '100ms' }}>
                    Your pitch has holes.{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-pulse-blue to-purple-400">
                        Let's find them.
                    </span>
                </h1>

                {/* Subline */}
                <p className="stagger-enter text-[16px] sm:text-[17px] text-[#9393A8] leading-relaxed max-w-sm mt-5"
                   style={{ animationDelay: '250ms' }}>
                    Pitch your startup. Get brutal, honest feedback from AI personas of legendary investors.
                </p>

                {/* CTA */}
                <button
                    onClick={scrollToAdvisors}
                    className="stagger-enter mt-8 px-10 py-4 bg-white text-[#08080C] font-semibold rounded-full text-[16px] active:scale-[0.97] transition-transform duration-150 shadow-[0_0_30px_rgba(255,255,255,0.08)]"
                    style={{ animationDelay: '400ms' }}
                >
                    Get Roasted
                </button>

                {/* Trust line */}
                <p className="stagger-enter text-[12px] text-[#3E3E52] mt-4"
                   style={{ animationDelay: '500ms' }}>
                    Free. No signup. 60 seconds to the truth.
                </p>

                {/* Scroll hint */}
                <div className="stagger-enter absolute bottom-8 animate-bounce"
                     style={{ animationDelay: '800ms' }}>
                    <svg className="w-5 h-5 text-[#3E3E52]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7" />
                    </svg>
                </div>
            </div>

            {/* ===== ADVISOR SELECTION ===== */}
            <div ref={advisorsRef} className="relative z-10 flex flex-col items-center px-5 pt-14 pb-8">
                <div className="flex flex-col items-center w-full max-w-sm">

                    {/* Section header */}
                    <p className="stagger-enter text-[11px] text-[#5C5C72] uppercase tracking-[0.15em] font-medium mb-6">
                        Choose Your Advisor
                    </p>

                    {/* Persona cards */}
                    <div className="w-full space-y-2.5">
                        {loading ? (
                            <div className="flex justify-center py-16">
                                <div className="w-6 h-6 border-2 border-white/10 border-t-pulse-blue rounded-full animate-spin" />
                            </div>
                        ) : personas.length === 0 ? (
                            <p className="text-[#5C5C72] text-center text-sm py-16">No advisors available</p>
                        ) : (
                            personas.map((persona, i) => {
                                const isSelected = selected?.key === persona.key;
                                const s = persona.style;
                                return (
                                    <button
                                        key={persona.key}
                                        onClick={() => setSelected(persona)}
                                        className={`stagger-enter w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-200 active:scale-[0.98] ${
                                            isSelected ? 'glass-selected' : 'glass hover:border-white/[0.12]'
                                        }`}
                                        style={{
                                            animationDelay: `${i * 80}ms`,
                                            borderColor: isSelected ? `${s.accent}40` : undefined,
                                        }}
                                    >
                                        {/* Emoji avatar */}
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 transition-all duration-200"
                                            style={{
                                                background: isSelected ? `${s.accent}20` : s.bg,
                                                boxShadow: isSelected ? `0 0 20px ${s.accent}15` : 'none',
                                            }}
                                        >
                                            {s.emoji}
                                        </div>

                                        {/* Text */}
                                        <div className="text-left min-w-0 flex-1">
                                            <div className="text-[#F0F0F5] text-[15px] font-semibold leading-tight">{persona.name}</div>
                                            <div className="text-[#5C5C72] text-[11px] leading-tight mt-1 font-medium tracking-wide uppercase">
                                                {s.label}
                                            </div>
                                        </div>

                                        {/* Selection indicator */}
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                                            isSelected ? 'border-transparent' : 'border-[#3E3E52]'
                                        }`}
                                            style={{
                                                background: isSelected ? s.accent : 'transparent',
                                            }}
                                        >
                                            {isSelected && (
                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Duration + Start — slide up when persona selected */}
                    <div className={`w-full mt-8 space-y-5 transition-all duration-500 ${
                        selected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                    }`}>
                        {/* Label */}
                        <p className="text-[#5C5C72] text-[11px] uppercase tracking-[0.12em] text-center font-medium">
                            Pitch Duration
                        </p>

                        {/* Segmented Control */}
                        <div className="relative flex glass rounded-full p-1 mx-auto w-fit">
                            {/* Sliding indicator */}
                            <div
                                className="segment-indicator absolute top-1 bottom-1 bg-pulse-blue rounded-full"
                                style={{
                                    width: `${100 / DURATIONS.length}%`,
                                    transform: `translateX(${durationIndex * 100}%)`,
                                }}
                            />
                            {DURATIONS.map((d) => (
                                <button
                                    key={d.seconds}
                                    onClick={() => setDuration(d.seconds)}
                                    className={`relative z-10 px-6 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                                        duration === d.seconds ? 'text-white' : 'text-[#5C5C72] hover:text-[#9393A8]'
                                    }`}
                                >
                                    {d.label}
                                </button>
                            ))}
                        </div>

                        {/* Start Button */}
                        <button
                            onClick={() => onSelect({ ...selected, duration })}
                            className="w-full py-3.5 bg-white text-[#08080C] font-semibold rounded-full text-[15px] active:scale-[0.97] transition-transform duration-150 shadow-[0_0_20px_rgba(255,255,255,0.06)]"
                        >
                            Start Session
                        </button>
                    </div>

                    {/* Footer */}
                    <p className="text-[#3E3E52] text-[11px] text-center mt-8 pb-8 safe-area-bottom">
                        {selected ? 'Choose duration, then start' : 'Select an advisor to begin'}
                    </p>
                </div>
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';

const PERSONA_STYLES = {
    paul_graham:       { emoji: '⚔️', accent: '#6B9BFF', bg: 'rgba(107,155,255,0.08)', label: 'The Scalpel', vibe: 'Idea clarity & founder quality' },
    ben_horowitz:      { emoji: '🔨', accent: '#FF7A5C', bg: 'rgba(255,122,92,0.08)',  label: 'The Hammer',  vibe: 'Execution & hard truths' },
    marc_andreessen:   { emoji: '🪞', accent: '#A78BFA', bg: 'rgba(167,139,250,0.08)', label: 'The Mirror',  vibe: 'Market fit & distribution' },
};

const FALLBACK_STYLES = [
    { emoji: '🎯', accent: '#34D399', bg: 'rgba(52,211,153,0.08)', label: 'Advisor', vibe: 'General feedback' },
    { emoji: '🔥', accent: '#FB7185', bg: 'rgba(251,113,133,0.08)', label: 'Advisor', vibe: 'General feedback' },
    { emoji: '⚡', accent: '#38BDF8', bg: 'rgba(56,189,248,0.08)', label: 'Advisor', vibe: 'General feedback' },
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

    return (
        <div className="min-h-screen min-h-[100dvh] relative flex flex-col"
             data-persona={selected?.key || ''}>

            {/* Atmosphere — shifts with persona selection */}
            <div className="atmosphere" />

            <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 py-12 safe-area-top safe-area-bottom">
                <div className="w-full max-w-sm flex flex-col items-center">

                    {/* Logo */}
                    <div className="stagger-enter mb-2">
                        <span className="text-[13px] font-medium tracking-[0.18em] uppercase text-[#5C5C72]">
                            Pitch<span className="text-[var(--persona-accent,#3B82F6)]">Pulse</span>
                        </span>
                    </div>

                    {/* Headline — Serif, editorial */}
                    <h1 className="stagger-enter font-serif text-[38px] sm:text-[44px] text-[#E8E8ED] leading-[1.05] text-center mb-3"
                        style={{ animationDelay: '80ms' }}>
                        Your pitch has holes.
                    </h1>

                    {/* Subline */}
                    <p className="stagger-enter text-[15px] text-[#6B6B7B] text-center mb-10"
                       style={{ animationDelay: '160ms' }}>
                        60 seconds. Brutal honesty. Pick your advisor.
                    </p>

                    {/* Advisor cards */}
                    <div className="w-full space-y-2.5 mb-2">
                        {loading ? (
                            <div className="flex justify-center py-16">
                                <div className="w-6 h-6 border-2 border-white/10 border-t-[var(--persona-accent,#3B82F6)] rounded-full animate-spin" />
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
                                        className={`stagger-enter w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 active:scale-[0.98] ${
                                            isSelected ? 'glass-selected' : 'glass hover:border-white/[0.12]'
                                        }`}
                                        style={{
                                            animationDelay: `${240 + i * 80}ms`,
                                            '--persona-glow': `${s.accent}12`,
                                            borderColor: isSelected ? `${s.accent}30` : undefined,
                                        }}
                                    >
                                        {/* Emoji avatar */}
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 transition-all duration-300"
                                            style={{
                                                background: isSelected ? `${s.accent}18` : s.bg,
                                                boxShadow: isSelected ? `0 0 24px ${s.accent}15` : 'none',
                                            }}
                                        >
                                            {s.emoji}
                                        </div>

                                        {/* Text */}
                                        <div className="text-left min-w-0 flex-1">
                                            <div className="text-[#E8E8ED] text-[15px] font-semibold leading-tight">{persona.name}</div>
                                            <div className="text-[#6B6B7B] text-[12px] leading-tight mt-1">
                                                {s.vibe}
                                            </div>
                                        </div>

                                        {/* Label badge */}
                                        <span className="text-[10px] font-semibold tracking-[0.08em] uppercase shrink-0 px-2 py-1 rounded-md transition-all duration-300"
                                              style={{
                                                  color: isSelected ? s.accent : '#5C5C72',
                                                  background: isSelected ? `${s.accent}12` : 'transparent',
                                              }}>
                                            {s.label}
                                        </span>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Duration + Start — appears when persona selected */}
                    <div className={`w-full mt-6 space-y-4 transition-all duration-500 ${
                        selected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
                    }`}>
                        {/* Segmented Control */}
                        <div className="flex items-center justify-center gap-4">
                            <span className="text-[11px] text-[#5C5C72] uppercase tracking-[0.1em]">Duration</span>
                            <div className="relative flex glass rounded-full p-1">
                                <div
                                    className="segment-indicator absolute top-1 bottom-1 rounded-full"
                                    style={{
                                        width: `${100 / DURATIONS.length}%`,
                                        transform: `translateX(${durationIndex * 100}%)`,
                                        background: `var(--persona-accent, #3B82F6)`,
                                    }}
                                />
                                {DURATIONS.map((d) => (
                                    <button
                                        key={d.seconds}
                                        onClick={() => setDuration(d.seconds)}
                                        className={`relative z-10 px-5 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 ${
                                            duration === d.seconds ? 'text-white' : 'text-[#5C5C72] hover:text-[#9393A8]'
                                        }`}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Start Button */}
                        <button
                            onClick={() => onSelect({ ...selected, duration })}
                            className="w-full py-3.5 font-semibold rounded-full text-[15px] active:scale-[0.97] transition-all duration-200"
                            style={{
                                background: selected?.style.accent || '#fff',
                                color: '#08080C',
                                boxShadow: `0 0 30px ${selected?.style.accent || '#fff'}20`,
                            }}
                        >
                            Start Session
                        </button>
                    </div>

                    {/* Footer */}
                    <p className="text-[#3A3A48] text-[11px] text-center mt-6">
                        Free. No signup. Voice-first feedback.
                    </p>
                </div>
            </div>
        </div>
    );
}

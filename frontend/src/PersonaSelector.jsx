import { useState, useEffect } from 'react';

const PERSONA_STYLES = {
    paul_graham:      { gradient: 'from-slate-400 to-blue-500',    ring: 'ring-blue-500/40' },
    'ben-horowitz':   { gradient: 'from-orange-500 to-red-600',    ring: 'ring-orange-500/40' },
    'marc-andreessen': { gradient: 'from-violet-500 to-indigo-600', ring: 'ring-violet-500/40' },
};

const FALLBACK_STYLES = [
    { gradient: 'from-emerald-500 to-teal-600', ring: 'ring-emerald-500/40' },
    { gradient: 'from-rose-500 to-pink-600',    ring: 'ring-rose-500/40' },
    { gradient: 'from-sky-500 to-cyan-600',     ring: 'ring-sky-500/40' },
    { gradient: 'from-fuchsia-500 to-purple-600', ring: 'ring-fuchsia-500/40' },
];

function getInitials(name) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getStyle(key, index) {
    return PERSONA_STYLES[key] || FALLBACK_STYLES[index % FALLBACK_STYLES.length];
}

const DURATIONS = [
    { label: '0:45', seconds: 45 },
    { label: '1:00', seconds: 60 },
    { label: '1:30', seconds: 90 },
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
                    initials: getInitials(meta.name),
                    style: getStyle(key, i),
                }));
                setPersonas(list);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const durationIndex = DURATIONS.findIndex(d => d.seconds === duration);

    return (
        <div className="min-h-screen min-h-[100dvh] flex flex-col items-center px-5 pt-14 pb-8 relative">
            {/* Aurora background */}
            <div className="aurora" />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center w-full max-w-sm flex-1">

                {/* Logo */}
                <div className="text-center mb-2">
                    <h1 className="text-[28px] font-bold tracking-tight text-[#F0F0F5]">
                        Pitch<span className="text-pulse-blue">Pulse</span>
                    </h1>
                </div>
                <p className="text-[#5C5C72] text-[13px] mb-10 tracking-wide">Your AI Advisory Board</p>

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
                            return (
                                <button
                                    key={persona.key}
                                    onClick={() => setSelected(persona)}
                                    className={`stagger-enter w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-200 active:scale-[0.98] ${
                                        isSelected ? 'glass-selected' : 'glass hover:border-white/[0.12]'
                                    }`}
                                    style={{ animationDelay: `${i * 80}ms` }}
                                >
                                    {/* Avatar */}
                                    <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${persona.style.gradient} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2)] transition-shadow duration-200 ${
                                        isSelected ? `ring-2 ${persona.style.ring} ring-offset-2 ring-offset-pulse-dark` : ''
                                    }`}>
                                        {persona.initials}
                                    </div>

                                    {/* Text */}
                                    <div className="text-left min-w-0 flex-1">
                                        <div className="text-[#F0F0F5] text-[15px] font-medium leading-tight">{persona.name}</div>
                                        <div className="text-[#5C5C72] text-xs leading-tight mt-0.5 truncate">{persona.tagline}</div>
                                    </div>

                                    {/* Indicator */}
                                    {isSelected ? (
                                        <div className="w-5 h-5 rounded-full bg-pulse-blue flex items-center justify-center shrink-0">
                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    ) : (
                                        <svg className="w-4 h-4 text-[#3E3E52] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    )}
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
                <p className="text-[#3E3E52] text-[11px] text-center mt-auto pt-8">
                    {selected ? 'Choose duration, then start' : 'Select an advisor to begin'}
                </p>
            </div>
        </div>
    );
}

import { useRef, useCallback, useEffect } from 'react';

/**
 * Provides a normalized 0-1 audio level from the mic stream.
 * Call getLevel() in a requestAnimationFrame loop for smooth orb reactivity.
 */
export function useAudioLevel() {
    const analyserRef = useRef(null);
    const contextRef = useRef(null);
    const sourceRef = useRef(null);
    const dataRef = useRef(null);
    const levelRef = useRef(0);

    const attach = useCallback((stream) => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.6;

            const source = ctx.createMediaStreamSource(stream);
            source.connect(analyser);

            contextRef.current = ctx;
            analyserRef.current = analyser;
            sourceRef.current = source;
            dataRef.current = new Uint8Array(analyser.frequencyBinCount);
        } catch (e) {
            console.warn('[useAudioLevel] Could not attach analyser:', e);
        }
    }, []);

    const getLevel = useCallback(() => {
        if (!analyserRef.current || !dataRef.current) return levelRef.current;

        analyserRef.current.getByteFrequencyData(dataRef.current);
        const data = dataRef.current;

        // Average the lower frequency bins (voice range ~85-300Hz)
        let sum = 0;
        const bins = Math.min(32, data.length);
        for (let i = 0; i < bins; i++) {
            sum += data[i];
        }
        const avg = sum / bins / 255; // normalize 0-1
        // Smooth with previous value
        levelRef.current = levelRef.current * 0.3 + avg * 0.7;
        return levelRef.current;
    }, []);

    const detach = useCallback(() => {
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }
        if (contextRef.current && contextRef.current.state !== 'closed') {
            contextRef.current.close();
            contextRef.current = null;
        }
        analyserRef.current = null;
        dataRef.current = null;
        levelRef.current = 0;
    }, []);

    useEffect(() => {
        return () => detach();
    }, [detach]);

    return { attach, getLevel, detach };
}

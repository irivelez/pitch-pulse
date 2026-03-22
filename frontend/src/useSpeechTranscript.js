import { useRef, useCallback, useState } from 'react';

/**
 * Browser-side speech recognition to capture pitch transcript.
 * Uses Web Speech API — works in Chrome, Edge, Safari 14.1+.
 * Exposes live transcript (final + interim) for real-time display,
 * and returns final-only text on stop() for backend use.
 */
export function useSpeechTranscript() {
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef(null);
    const fullTextRef = useRef('');

    const start = useCallback(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('[SpeechTranscript] Not supported in this browser');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            let finalText = '';
            let interimText = '';
            for (let i = 0; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalText += event.results[i][0].transcript + ' ';
                } else {
                    interimText += event.results[i][0].transcript;
                }
            }
            fullTextRef.current = finalText;
            // Live display: final + interim for real-time feel
            setTranscript((finalText + interimText).trim());
        };

        recognition.onerror = (event) => {
            console.warn('[SpeechTranscript] Error:', event.error);
            if (event.error === 'no-speech' || event.error === 'aborted') {
                try { recognition.start(); } catch (e) { /* already running */ }
            }
        };

        recognition.onend = () => {
            if (recognitionRef.current) {
                try { recognition.start(); } catch (e) { /* already running */ }
            }
        };

        recognitionRef.current = recognition;
        fullTextRef.current = '';
        setTranscript('');

        try {
            recognition.start();
            console.log('[SpeechTranscript] Started');
        } catch (e) {
            console.warn('[SpeechTranscript] Failed to start:', e);
        }
    }, []);

    const stop = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.onend = null;
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        return fullTextRef.current.trim();
    }, []);

    const getTranscript = useCallback(() => {
        return fullTextRef.current.trim();
    }, []);

    return { transcript, start, stop, getTranscript };
}

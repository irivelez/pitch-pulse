import { useRef, useCallback, useState } from 'react';

/**
 * Browser-side speech recognition to capture pitch transcript.
 * Uses Web Speech API as a reliable backup for server-side transcription.
 * Works in Chrome, Edge, Safari 14.1+.
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
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            let newText = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    newText += event.results[i][0].transcript + ' ';
                }
            }
            if (newText) {
                fullTextRef.current += newText;
                setTranscript(fullTextRef.current);
                console.log('[SpeechTranscript] Captured:', newText.trim());
            }
        };

        recognition.onerror = (event) => {
            console.warn('[SpeechTranscript] Error:', event.error);
            // Restart on recoverable errors
            if (event.error === 'no-speech' || event.error === 'aborted') {
                try { recognition.start(); } catch (e) { /* already running */ }
            }
        };

        recognition.onend = () => {
            // Auto-restart if not explicitly stopped
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
            recognitionRef.current.onend = null; // prevent auto-restart
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

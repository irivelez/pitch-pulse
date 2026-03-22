export class AudioRecorder {
    constructor(sampleRate = 16000) {
        this.sampleRate = sampleRate;
        this.stream = null;
        this.audioContext = null;
        this.source = null;
        this.processor = null;
        this.onAudioData = null;
    }

    async start(onAudioData) {
        this.onAudioData = onAudioData;

        try {
            console.log("[AudioRecorder] Requesting microphone access...");
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            console.log("[AudioRecorder] Microphone access granted.");

            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: this.sampleRate
            });
            console.log(`[AudioRecorder] AudioContext created. State: ${this.audioContext.state}, Rate: ${this.audioContext.sampleRate}`);

            if (this.audioContext.state === 'suspended') {
                console.log("[AudioRecorder] Context suspended. Resuming...");
                await this.audioContext.resume();
                console.log(`[AudioRecorder] Context resumed. New State: ${this.audioContext.state}`);
            }

            this.source = this.audioContext.createMediaStreamSource(this.stream);
            this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

            this.processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcm16 = this.floatTo16BitPCM(inputData);
                const base64 = this.arrayBufferToBase64(pcm16);

                if (this.onAudioData) {
                    this.onAudioData(base64);
                }
            };

            this.source.connect(this.processor);
            this.processor.connect(this.audioContext.destination);
            console.log("[AudioRecorder] Recording started.");

        } catch (error) {
            console.error("[AudioRecorder] Error starting audio recording:", error);
            throw error;
        }
    }

    getStream() {
        return this.stream;
    }

    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        if (this.source) {
            this.source.disconnect();
            this.source = null;
        }
        if (this.processor) {
            this.processor.disconnect();
            this.processor = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }

    floatTo16BitPCM(input) {
        const output = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
            const s = Math.max(-1, Math.min(1, input[i]));
            output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return output.buffer;
    }

    arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }
}

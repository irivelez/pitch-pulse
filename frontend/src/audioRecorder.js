export class AudioRecorder {
    constructor(sampleRate = 16000) {
        this.sampleRate = sampleRate;
        this.stream = null;
        this.audioContext = null;
        this.source = null;
        this.processor = null;
        this.onAudioData = null;
        this._ownsContext = false;
        this._ownsStream = false;
    }

    /**
     * Start recording. Accepts an existing AudioContext and MediaStream
     * so they can be created during a user gesture (required on iOS).
     */
    async start(onAudioData, { audioContext, stream } = {}) {
        this.onAudioData = onAudioData;

        try {
            // Use provided stream or request mic (fallback for non-iOS)
            if (stream) {
                this.stream = stream;
                this._ownsStream = false;
            } else {
                console.log("[AudioRecorder] Requesting microphone access...");
                this.stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                    }
                });
                console.log("[AudioRecorder] Microphone access granted.");
                this._ownsStream = true;
            }

            // Use provided AudioContext or create one
            if (audioContext) {
                this.audioContext = audioContext;
                this._ownsContext = false;
            } else {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                    sampleRate: this.sampleRate,
                });
                this._ownsContext = true;
            }
            console.log(`[AudioRecorder] AudioContext state: ${this.audioContext.state}, rate: ${this.audioContext.sampleRate}`);

            if (this.audioContext.state === 'suspended') {
                console.log("[AudioRecorder] Resuming suspended context...");
                await this.audioContext.resume();
                console.log(`[AudioRecorder] Resumed. State: ${this.audioContext.state}`);
            }

            this.source = this.audioContext.createMediaStreamSource(this.stream);

            // Try AudioWorkletNode first, fall back to ScriptProcessor
            if (this.audioContext.audioWorklet && typeof this.audioContext.audioWorklet.addModule === 'function') {
                try {
                    await this._setupWorklet();
                    console.log("[AudioRecorder] Using AudioWorklet.");
                } catch (e) {
                    console.warn("[AudioRecorder] AudioWorklet failed, falling back to ScriptProcessor:", e);
                    this._setupScriptProcessor();
                }
            } else {
                this._setupScriptProcessor();
            }

            console.log("[AudioRecorder] Recording started.");
        } catch (error) {
            console.error("[AudioRecorder] Error starting:", error);
            throw error;
        }
    }

    async _setupWorklet() {
        // Inline the worklet processor as a blob URL to avoid needing a separate file
        const workletCode = `
            class PCMProcessor extends AudioWorkletProcessor {
                process(inputs) {
                    const input = inputs[0];
                    if (input && input[0] && input[0].length > 0) {
                        this.port.postMessage(input[0]);
                    }
                    return true;
                }
            }
            registerProcessor('pcm-processor', PCMProcessor);
        `;
        const blob = new Blob([workletCode], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        await this.audioContext.audioWorklet.addModule(url);
        URL.revokeObjectURL(url);

        const workletNode = new AudioWorkletNode(this.audioContext, 'pcm-processor');
        workletNode.port.onmessage = (e) => {
            const inputData = e.data; // Float32Array
            const pcm16 = this.floatTo16BitPCM(inputData);
            const base64 = this.arrayBufferToBase64(pcm16);
            if (this.onAudioData) {
                this.onAudioData(base64);
            }
        };
        this.source.connect(workletNode);
        workletNode.connect(this.audioContext.destination);
        this.processor = workletNode;
    }

    _setupScriptProcessor() {
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
        console.log("[AudioRecorder] Using ScriptProcessor (fallback).");
    }

    getStream() {
        return this.stream;
    }

    stop() {
        if (this.stream && this._ownsStream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        this.stream = null;
        if (this.source) {
            this.source.disconnect();
            this.source = null;
        }
        if (this.processor) {
            if (this.processor.port) {
                // AudioWorkletNode
                this.processor.port.onmessage = null;
            }
            this.processor.disconnect();
            this.processor = null;
        }
        if (this.audioContext && this._ownsContext) {
            this.audioContext.close();
        }
        this.audioContext = null;
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

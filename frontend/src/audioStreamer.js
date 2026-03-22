export class AudioStreamer {
    /**
     * @param {number} sampleRate
     * @param {AudioContext} [audioContext] — pass a pre-created context (from user gesture) for iOS compatibility
     */
    constructor(sampleRate = 24000, audioContext) {
        if (audioContext) {
            this.context = audioContext;
            this._ownsContext = false;
        } else {
            this.context = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: sampleRate,
            });
            this._ownsContext = true;
        }
        this.audioQueue = [];
        this.isPlaying = false;
        this.sampleRate = sampleRate;
        this.onIdle = null; // callback when queue drains and playback stops
        this._turnComplete = false; // set when server signals turn is done
    }

    addPCM16(base64Data) {
        try {
            const cleaned = base64Data.replace(/-/g, '+').replace(/_/g, '/');
            const raw = atob(cleaned);
            const rawLength = raw.length;
            const array = new Int16Array(new ArrayBuffer(rawLength));

            for (let i = 0; i < rawLength / 2; i++) {
                const lower = raw.charCodeAt(i * 2);
                const upper = raw.charCodeAt(i * 2 + 1);
                let sample = (upper << 8) | lower;
                if (sample & 0x8000) {
                    sample = sample - 0x10000;
                }
                array[i] = sample;
            }

            const float32Data = new Float32Array(array.length);
            for (let i = 0; i < array.length; i++) {
                float32Data[i] = array[i] / 32768.0;
            }

            this.audioQueue.push(float32Data);
            this.playNext();
        } catch (e) {
            console.error('[AudioStreamer] Error in addPCM16:', e);
        }
    }

    async playNext() {
        if (this.isPlaying || this.audioQueue.length === 0) {
            return;
        }

        if (this.context.state === 'suspended') {
            try {
                await this.context.resume();
            } catch (e) {
                console.error("[AudioStreamer] Failed to resume", e);
            }
        }

        try {
            this.isPlaying = true;
            const audioData = this.audioQueue.shift();

            const buffer = this.context.createBuffer(1, audioData.length, this.sampleRate);
            buffer.getChannelData(0).set(audioData);

            const source = this.context.createBufferSource();
            source.buffer = buffer;
            source.connect(this.context.destination);
            source.onended = () => {
                this.isPlaying = false;
                if (this.audioQueue.length === 0 && this._turnComplete && this.onIdle) {
                    this._turnComplete = false;
                    this.onIdle();
                } else {
                    this.playNext();
                }
            };
            source.start();
        } catch (e) {
            console.error('[AudioStreamer] Error in playNext:', e);
            this.isPlaying = false;
            this.playNext();
        }
    }

    resume() {
        if (this.context.state === 'suspended') {
            this.context.resume();
        }
    }

    markTurnComplete() {
        // If already idle, fire immediately; otherwise wait for playback to drain
        if (!this.isPlaying && this.audioQueue.length === 0) {
            if (this.onIdle) this.onIdle();
        } else {
            this._turnComplete = true;
        }
    }

    stop() {
        this.audioQueue = [];
        this.isPlaying = false;
        this._turnComplete = false;
    }
}

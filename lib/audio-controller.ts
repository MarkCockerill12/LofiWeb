// Singleton to manage Audio Context and Analyser
// This avoids passing complex objects through Zustand or Context providers

export interface AmbientLoopHandle {
    setVolume: (volume: number) => void
    stop: () => void
}

class AudioController {
    private audioContext: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    // Use WeakMap to allow garbage collection of audio elements
    private readonly sourceParams: WeakMap<HTMLAudioElement, MediaElementAudioSourceNode> = new WeakMap();
    
    constructor() {
        if (typeof window !== 'undefined') {
            // Lazy init
        }
    }

    getAudioContext() {
        if (!this.audioContext) {
            // Safari still exposes the prefixed constructor.
            const win = globalThis as typeof globalThis & { webkitAudioContext?: typeof AudioContext };
            const AudioContextClass = win.AudioContext || win.webkitAudioContext;
            if (AudioContextClass) {
                this.audioContext = new AudioContextClass();
            }
        }
        return this.audioContext;
    }

    getAnalyser() {
        if (!this.analyser) {
            const ctx = this.getAudioContext();
            if (ctx) {
                this.analyser = ctx.createAnalyser();
                // Balanced FFT size for performance and visual clarity
                this.analyser.fftSize = 256; 
                this.analyser.smoothingTimeConstant = 0.8;
            }
        }
        return this.analyser;
    }

    connectSource(audioElement: HTMLAudioElement) {
        if (!audioElement) return;
        
        const ctx = this.getAudioContext();
        const analyser = this.getAnalyser();
        
        if (!ctx || !analyser) return;

        // Prevent double connection
        if (this.sourceParams.has(audioElement)) return;

        try {
            const source = ctx.createMediaElementSource(audioElement);
            source.connect(analyser);
            analyser.connect(ctx.destination);
            
            this.sourceParams.set(audioElement, source);
        } catch (e) {
            console.error("AudioController connect error:", e);
        }
    }
    
    // Resume context (browsers block auto-play audio contexts)
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    getFrequencyData(array: Uint8Array<ArrayBuffer>) {
        this.analyser?.getByteFrequencyData(array);
    }

    /** Decoded ambience buffers, cached so re-toggling a sound never refetches. */
    private readonly bufferCache: Map<string, Promise<AudioBuffer>> = new Map();

    private loadBuffer(url: string): Promise<AudioBuffer> {
        const cached = this.bufferCache.get(url);
        if (cached) return cached;

        const ctx = this.getAudioContext();
        if (!ctx) return Promise.reject(new Error("AudioContext unavailable"));

        const pending = fetch(url)
            .then((res) => {
                if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
                return res.arrayBuffer();
            })
            .then((data) => ctx.decodeAudioData(data))
            .catch((err) => {
                // Drop the failed entry so a later toggle can retry.
                this.bufferCache.delete(url);
                throw err;
            });

        this.bufferCache.set(url, pending);
        return pending;
    }

    /**
     * Starts a gapless looping ambience track. Web Audio loops the decoded buffer
     * sample-accurately, so no crossfade or watchdog polling is needed.
     * Returns a handle, or null if the context is unavailable.
     */
    async playLoop(url: string, volume: number): Promise<AmbientLoopHandle | null> {
        const ctx = this.getAudioContext();
        if (!ctx) return null;

        const buffer = await this.loadBuffer(url);

        const source = ctx.createBufferSource();
        const gain = ctx.createGain();

        source.buffer = buffer;
        source.loop = true;
        gain.gain.value = volume;

        source.connect(gain);
        gain.connect(ctx.destination);
        source.start(0);

        let stopped = false;

        return {
            setVolume(next: number) {
                if (stopped) return;
                // Short ramp avoids a click on abrupt gain changes.
                gain.gain.setTargetAtTime(next, ctx.currentTime, 0.02);
            },
            stop() {
                if (stopped) return;
                stopped = true;
                try {
                    source.stop();
                } catch {
                    // Already stopped.
                }
                source.disconnect();
                gain.disconnect();
            },
        };
    }

    playAlarm() {
        const ctx = this.getAudioContext();
        if (!ctx) return;
        this.resume();

        const t = ctx.currentTime;
        
        // Helper to create a partial
        const createPartial = (freq: number, peakGain: number, duration: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'sine'; // Sine is gentlest
            osc.frequency.setValueAtTime(freq, t);
            
            // Envelope
            gain.gain.setValueAtTime(0, t);
            // Softer attack (50ms)
            gain.gain.linearRampToValueAtTime(peakGain, t + 0.05); 
            // Long, smooth exponential delay
            gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
            
            osc.start(t);
            osc.stop(t + duration);
        };

        // Layer the sound: CMajor7-ish feel for valid positivity
        // Fundamental (C5)
        createPartial(523.25, 0.2, 2.5);
        // Fifth (G5) - adds stability
        createPartial(783.99, 0.15, 2.0);
        // Major Seventh (B5) - adds "dreamy" quality
        createPartial(987.77, 0.05, 1.8); 
        // Octave (C6) - adds brightness
        createPartial(1046.50, 0.05, 1.5);
    }
}

export const audioController = new AudioController();

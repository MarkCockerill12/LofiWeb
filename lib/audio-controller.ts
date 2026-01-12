// Singleton to manage Audio Context and Analyser
// This avoids passing complex objects through Zustand or Context providers

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
            const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
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
                this.analyser.fftSize = 256; // Balance between detail and performance
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

    getFrequencyData(array: Uint8Array) {
        if (this.analyser) {
            this.analyser.getByteFrequencyData(array as any);
        }
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

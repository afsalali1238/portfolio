import { CROWN_GLASS_REFRACTIVE_INDEX, VACUUM_REFRACTIVE_INDEX } from "./types";

/**
 * A deliberately small Web Audio graph for the instrument. It never touches browser APIs until
 * `initialize` (called from a React effect) or `activate` (called from a user gesture), so it is
 * safe to import from a TanStack Start route during SSR.
 */
export class OpticalAudioSynthesizer {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private humGain: GainNode | null = null;
  private humFilter: BiquadFilterNode | null = null;
  private humOscillator: OscillatorNode | null = null;
  private density = VACUUM_REFRACTIVE_INDEX;
  private muted = true;
  private disposed = false;

  /** Construct the suspended context and silent hum graph. Browser-only. */
  initialize() {
    if (typeof window === "undefined" || this.context || this.disposed) return;

    const AudioContextConstructor = window.AudioContext;
    if (!AudioContextConstructor) return;

    const context = new AudioContextConstructor();
    // New contexts are normally suspended by browser autoplay policy. Calling suspend is
    // intentional insurance for browsers that create a running context inside an event cycle.
    void context.suspend();

    const masterGain = context.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(context.destination);

    const humOscillator = context.createOscillator();
    humOscillator.type = "sine";
    humOscillator.frequency.value = 110;

    const humFilter = context.createBiquadFilter();
    humFilter.type = "lowpass";
    humFilter.Q.value = 2;

    const humGain = context.createGain();
    humGain.gain.value = 0;

    humOscillator.connect(humFilter);
    humFilter.connect(humGain);
    humGain.connect(masterGain);
    humOscillator.start();

    this.context = context;
    this.masterGain = masterGain;
    this.humGain = humGain;
    this.humFilter = humFilter;
    this.humOscillator = humOscillator;
    this.applyDensity();
    this.applyMute();
  }

  /** Must only be called by a pointer, keyboard, or range-input user gesture. */
  activate() {
    if (this.disposed || typeof window === "undefined") return;
    this.initialize();
    if (this.context?.state === "suspended") void this.context.resume();
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    this.applyMute();
  }

  setDensity(refractiveIndex: number) {
    this.density = Math.max(VACUUM_REFRACTIVE_INDEX, refractiveIndex);
    this.applyDensity();
  }

  /** A 2 ms band-pass noise impact for an interface crossing. */
  triggerBoundaryImpact() {
    const context = this.audibleContext();
    if (!context || !this.masterGain) return;

    const frames = Math.max(1, Math.ceil(context.sampleRate * 0.002));
    const buffer = context.createBuffer(1, frames, context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let index = 0; index < frames; index += 1) samples[index] = Math.random() * 2 - 1;

    const source = context.createBufferSource();
    source.buffer = buffer;
    const filter = context.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1800;
    filter.Q.value = 0.7;
    const gain = context.createGain();
    const now = context.currentTime;
    gain.gain.setValueAtTime(0.055, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start(now);
    source.stop(now + 0.02);
  }

  /** The three quiet sine notes that confirm a successful dispersion event. */
  triggerSpectrum() {
    const context = this.audibleContext();
    if (!context || !this.masterGain) return;
    const masterGain = this.masterGain;

    const now = context.currentTime;
    [440, 660, 880].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, now);

      const gain = context.createGain();
      const start = now + index * 0.028;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.026, start + 0.014);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);

      oscillator.connect(gain);
      gain.connect(masterGain);
      oscillator.start(start);
      oscillator.stop(start + 0.24);
    });
  }

  destroy() {
    this.disposed = true;
    if (this.humOscillator) {
      try {
        this.humOscillator.stop();
      } catch {
        // It may already have stopped while the page was suspended.
      }
    }
    this.humOscillator?.disconnect();
    this.humFilter?.disconnect();
    this.humGain?.disconnect();
    this.masterGain?.disconnect();
    if (this.context && this.context.state !== "closed") void this.context.close();

    this.context = null;
    this.masterGain = null;
    this.humGain = null;
    this.humFilter = null;
    this.humOscillator = null;
  }

  private audibleContext(): AudioContext | null {
    if (this.muted || !this.context || this.context.state !== "running") return null;
    return this.context;
  }

  private applyDensity() {
    if (!this.context || !this.humGain || !this.humFilter) return;

    const normalizedDensity = Math.min(
      1,
      Math.max(
        0,
        (this.density - VACUUM_REFRACTIVE_INDEX) /
          (CROWN_GLASS_REFRACTIVE_INDEX - VACUUM_REFRACTIVE_INDEX),
      ),
    );
    const now = this.context.currentTime;
    this.humFilter.frequency.setTargetAtTime(200 + 400 * (this.density - 1), now, 0.035);
    this.humGain.gain.setTargetAtTime(normalizedDensity * 0.035, now, 0.05);
  }

  private applyMute() {
    if (!this.context || !this.masterGain) return;
    this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.7, this.context.currentTime, 0.025);
  }
}

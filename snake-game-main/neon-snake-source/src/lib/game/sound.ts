/**
 * Lightweight synthesizer-based sound manager built on the Web Audio API.
 * All sounds are generated procedurally — no audio assets required.
 */
export class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled = true;

  constructor(enabled = true) {
    this.enabled = enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /** Must be called from a user gesture to unlock audio on mobile browsers. */
  unlock(): void {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      try {
        this.ctx = new Ctor();
      } catch {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
  }

  private tone(opts: {
    freq: number;
    dur: number;
    type?: OscillatorType;
    vol?: number;
    delay?: number;
    slideTo?: number;
  }): void {
    if (!this.enabled || !this.ctx) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime + (opts.delay ?? 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = opts.type ?? "sine";
    osc.frequency.setValueAtTime(Math.max(1, opts.freq), t0);
    if (opts.slideTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.slideTo), t0 + opts.dur);
    }
    const vol = opts.vol ?? 0.16;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + opts.dur + 0.05);
  }

  /** Short blip; pitch rises with the combo multiplier. */
  eat(combo: number): void {
    const base = 420 * Math.pow(1.059, Math.min(combo, 12) - 1);
    this.tone({ freq: base, dur: 0.09, type: "square", vol: 0.09 });
    if (combo >= 3) {
      this.tone({ freq: base * 1.5, dur: 0.08, type: "square", vol: 0.05, delay: 0.05 });
    }
  }

  /** Sparkly arpeggio for special foods. */
  special(): void {
    this.tone({ freq: 523, dur: 0.08, type: "triangle", vol: 0.1 });
    this.tone({ freq: 659, dur: 0.08, type: "triangle", vol: 0.1, delay: 0.06 });
    this.tone({ freq: 784, dur: 0.12, type: "triangle", vol: 0.1, delay: 0.12 });
  }

  levelUp(): void {
    const notes = [392, 523, 659, 784];
    notes.forEach((f, i) => {
      this.tone({ freq: f, dur: 0.12, type: "triangle", vol: 0.11, delay: i * 0.09 });
    });
  }

  gameOver(): void {
    this.tone({ freq: 320, dur: 0.5, type: "sawtooth", vol: 0.1, slideTo: 130 });
    this.tone({ freq: 160, dur: 0.6, type: "sine", vol: 0.12, slideTo: 60, delay: 0.12 });
  }

  newRecord(): void {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => {
      this.tone({ freq: f, dur: 0.14, type: "triangle", vol: 0.12, delay: 0.3 + i * 0.11 });
    });
  }

  click(): void {
    this.tone({ freq: 240, dur: 0.05, type: "sine", vol: 0.07 });
  }

  countdownTick(): void {
    this.tone({ freq: 440, dur: 0.09, type: "sine", vol: 0.1 });
  }

  go(): void {
    this.tone({ freq: 880, dur: 0.18, type: "square", vol: 0.09 });
  }

  destroy(): void {
    if (this.ctx) {
      void this.ctx.close().catch(() => undefined);
      this.ctx = null;
    }
  }
}

/**
 * Procedural WebAudio Sound Synthesizer
 * Generates crisp retro-modern space combat audio effects with zero external assets.
 */

export class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted = false;
  private volume = 0.7;

  constructor() {
    // Will be initialized upon first user interaction
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  getMuted(): boolean {
    return this.isMuted;
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  getVolume(): number {
    return this.volume;
  }

  // Laser zap with pitch variation
  playLaser(kind: 'basic' | 'x1' | 'x2' | 'x3' = 'x1', isPlayer = true) {
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const pitchMod = 0.92 + Math.random() * 0.16;
    const baseFreq = isPlayer ? (kind === 'x3' ? 950 : kind === 'x2' ? 820 : 700) : 480;

    osc.type = kind === 'x3' ? 'sawtooth' : isPlayer ? 'sine' : 'square';
    osc.frequency.setValueAtTime(baseFreq * pitchMod, t);
    osc.frequency.exponentialRampToValueAtTime(120 * pitchMod, t + 0.12);

    gain.gain.setValueAtTime(isPlayer ? 0.18 : 0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  // Rocket launch thrust whoosh
  playRocketLaunch(isPlayer = true) {
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(450, t + 0.25);

    gain.gain.setValueAtTime(isPlayer ? 0.22 : 0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.31);
  }

  // Impact on shield (resonant ping) or hull (metallic crunch)
  playHit(isShield = true, isPlayerTarget = false) {
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (isShield) {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480 + Math.random() * 80, t);
      osc.frequency.exponentialRampToValueAtTime(220, t + 0.1);
      gain.gain.setValueAtTime(isPlayerTarget ? 0.25 : 0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    } else {
      osc.type = 'square';
      osc.frequency.setValueAtTime(260 + Math.random() * 60, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.08);
      gain.gain.setValueAtTime(isPlayerTarget ? 0.28 : 0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    }

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.11);
  }

  // Deep explosion noise
  playExplosion(isLarge = false) {
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const dur = isLarge ? 0.8 : 0.45;

    // Sub-bass sweep
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isLarge ? 160 : 130, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + dur);

    oscGain.gain.setValueAtTime(isLarge ? 0.45 : 0.28, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + dur + 0.05);

    // Filtered noise burst
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isLarge ? 600 : 900, t);
    filter.frequency.exponentialRampToValueAtTime(100, t + dur);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(isLarge ? 0.35 : 0.2, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    whiteNoise.start(t);
    whiteNoise.stop(t + dur);
  }

  // Chime for collecting loot boxes
  playPickup(kind: string) {
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const f1 = kind === 'ore' ? 659.25 : kind === 'credits' ? 587.33 : 783.99;
    const f2 = f1 * 1.5;

    osc.frequency.setValueAtTime(f1, t);
    osc.frequency.setValueAtTime(f2, t + 0.07);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.23);
  }

  // Portal charge oscillation
  playPortalWarp() {
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.exponentialRampToValueAtTime(620, t + 0.6);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.62);
  }

  // Level-up triumphant flourish
  playLevelUp() {
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = t + idx * 0.09;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.2, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.24);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.25);
    });
  }

  // Clean UI tactile click
  playUiClick() {
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2400, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.03);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.035);
  }
}

export const soundManager = new SoundManager();

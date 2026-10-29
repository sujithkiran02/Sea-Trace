/**
 * Procedural Web Audio API sound generator for authentic ocean atmosphere and ship foghorn.
 * Requires no external audio files - 100% offline capable and instant.
 */

class OceanAudioSynthesizer {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private oceanGain: GainNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;

  public init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();
  }

  public toggle(): boolean {
    this.init();
    if (!this.ctx) return false;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  private start() {
    if (!this.ctx) return;

    // Create 5-second loop of brown/pink noise for ocean surf
    const bufferSize = this.ctx.sampleRate * 5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Brown noise integration
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.5;
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = buffer;
    this.noiseNode.loop = true;

    // Resonant lowpass filter to simulate water swell rumble
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);
    filter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    // LFO for rolling wave swell volume modulation
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.18, this.ctx.currentTime); // ~5.5s wave cycle
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

    this.oceanGain = this.ctx.createGain();
    this.oceanGain.gain.setValueAtTime(0.25, this.ctx.currentTime);

    lfo.connect(filter.frequency);
    this.noiseNode.connect(filter);
    filter.connect(this.oceanGain);
    this.oceanGain.connect(this.ctx.destination);

    this.noiseNode.start();
    lfo.start();
    this.isPlaying = true;
  }

  private stop() {
    if (this.oceanGain && this.ctx) {
      this.oceanGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.5);
      setTimeout(() => {
        if (this.noiseNode) {
          try { this.noiseNode.stop(); } catch { /* ignore */ }
          this.noiseNode = null;
        }
        this.isPlaying = false;
      }, 500);
    }
  }

  /**
   * Triggers a deep, majestic container ship foghorn blast.
   */
  public playFogHorn() {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const now = this.ctx.currentTime;

    // Dual-tone harmonic foghorn (115Hz & 172Hz)
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(115, now);
    osc2.frequency.setValueAtTime(172, now);

    // Reverb / low-pass acoustic filtering
    const hornFilter = this.ctx.createBiquadFilter();
    hornFilter.type = 'lowpass';
    hornFilter.frequency.setValueAtTime(450, now);

    const hornGain = this.ctx.createGain();
    hornGain.gain.setValueAtTime(0.001, now);
    hornGain.gain.exponentialRampToValueAtTime(0.35, now + 0.4);
    hornGain.gain.exponentialRampToValueAtTime(0.001, now + 3.2);

    osc1.connect(hornFilter);
    osc2.connect(hornFilter);
    hornFilter.connect(hornGain);
    hornGain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 3.4);
    osc2.stop(now + 3.4);
  }

  public getIsPlaying() {
    return this.isPlaying;
  }
}

export const oceanAudio = new OceanAudioSynthesizer();

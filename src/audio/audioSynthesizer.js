// Web Audio API Synthesizer for ArduPilot Commissioning Simulator

class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted) {
    this.muted = muted;
  }

  playNote(freq, type = 'sine', duration = 0.15, volume = 0.2, delay = 0) {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    setTimeout(() => {
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {
        console.error('Audio play error:', e);
      }
    }, delay * 1000);
  }

  // Plays authentic ArduPilot 6-note startup sequence
  playArduPilotBoot() {
    if (this.muted) return;
    this.initContext();
    
    // Notes: C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.50), E6 (1318.51), G6 (1567.98)
    const notes = [
      { freq: 523.25, time: 0, dur: 0.1 },
      { freq: 659.25, time: 0.12, dur: 0.1 },
      { freq: 783.99, time: 0.24, dur: 0.1 },
      { freq: 1046.50, time: 0.36, dur: 0.12 },
      { freq: 1318.51, time: 0.50, dur: 0.12 },
      { freq: 1567.98, time: 0.65, dur: 0.3 },
    ];

    notes.forEach(n => {
      this.playNote(n.freq, 'triangle', n.dur, 0.25, n.time);
    });
  }

  // ESC Throttle Calibration Initialization Beeps (3 rising chimes)
  playEscInitBeeps() {
    if (this.muted) return;
    this.initContext();
    
    this.playNote(880, 'square', 0.12, 0.2, 0);
    this.playNote(1174.66, 'square', 0.12, 0.2, 0.18);
    this.playNote(1760, 'square', 0.25, 0.25, 0.36);
  }

  // ESC Throttle Confirmation Beep (Long high note)
  playEscConfirmBeep() {
    if (this.muted) return;
    this.initContext();

    this.playNote(2093.00, 'square', 0.6, 0.3, 0);
  }

  // Calibration Success Chime (3 rising tones)
  playSuccessTone() {
    if (this.muted) return;
    this.initContext();

    this.playNote(587.33, 'sine', 0.1, 0.2, 0);
    this.playNote(739.99, 'sine', 0.1, 0.2, 0.12);
    this.playNote(880.00, 'sine', 0.3, 0.25, 0.24);
  }

  // Pre-Arm Warning / Error Beep
  playWarningBeep() {
    if (this.muted) return;
    this.initContext();

    this.playNote(440, 'sawtooth', 0.1, 0.25, 0);
    this.playNote(349.23, 'sawtooth', 0.2, 0.25, 0.12);
  }

  // Explosion / High Risk Safety Alert Alarm
  playExplosionAlarm() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      // Alarm siren + white noise blast
      const bufferSize = this.ctx.sampleRate * 0.8;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(800, this.ctx.currentTime);
      noiseFilter.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.8);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.8);

      whiteNoise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      whiteNoise.start();

      // Pulsing siren
      for (let i = 0; i < 3; i++) {
        this.playNote(220, 'sawtooth', 0.15, 0.3, i * 0.25);
        this.playNote(880, 'sawtooth', 0.15, 0.35, i * 0.25 + 0.1);
      }
    } catch (e) {
      console.error(e);
    }
  }

  // UI Click
  playClick() {
    this.playNote(1200, 'sine', 0.03, 0.05, 0);
  }
}

export const soundFx = new SoundManager();

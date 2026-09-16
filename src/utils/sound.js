// Web Audio API Sound Synthesizer for Recreation Master

class SoundManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
  }

  init() {
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

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  // Quick sound tone generator
  playTone(freq, type = 'sine', duration = 0.1, gainVal = 0.2) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // 1. Tick Sound (for timer / tap / block drop)
  playTick(freq = 600) {
    this.playTone(freq, 'triangle', 0.04, 0.15);
  }

  // 2. Countdown Beep (3, 2, 1, GO!)
  playCountdown(isFinal = false) {
    if (isFinal) {
      this.playTone(880, 'sine', 0.4, 0.3); // High pitch GO
    } else {
      this.playTone(440, 'sine', 0.2, 0.2); // Medium pitch 3..2..1
    }
  }

  // 3. Success Fanfare
  playSuccess() {
    if (this.isMuted) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'triangle', 0.25, 0.25);
      }, idx * 100);
    });
  }

  // 4. Error / Elimination Buzzer
  playError() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {}
  }

  // 5. Drumroll for Big Reveals
  playDrumroll(durationSec = 2) {
    if (this.isMuted) return;
    const steps = Math.floor(durationSec * 20);
    for (let i = 0; i < steps; i++) {
      setTimeout(() => {
        this.playTone(120 + Math.random() * 40, 'sine', 0.03, 0.1);
      }, (i / steps) * durationSec * 1000);
    }
  }

  // 6. Mafia Night Spooky Ambient Sound
  playSpookyNight() {
    if (this.isMuted) return;
    this.playTone(110, 'sine', 1.5, 0.1);
    setTimeout(() => this.playTone(116.54, 'sine', 1.5, 0.1), 300);
  }
}

export const soundFx = new SoundManager();

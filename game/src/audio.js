// Sound, synthesised: a warm drone for the desert, a glassy hum while the beam sinters, a bell
// per beacon lit, and the storm's low growl rising as it closes. No files, nothing to fetch.

const DRONE = [110, 164.81, 220, 277.18];

export class Sound {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.ready = false;
    this.muted = false;
    this.hum = null;
    this.humGain = null;
    this.stormGain = null;
    this.stormFilter = null;
  }

  unlock() {
    if (this.ready) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return;
    try {
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(this.ctx.destination);
      this.startDrone();
      this.startHum();
      this.startStorm();
      this.ready = true;
    } catch (error) {
      this.ready = false;
    }
  }

  startDrone() {
    const ctx = this.ctx;
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    gain.connect(this.master);
    DRONE.forEach((hz, index) => {
      const osc = ctx.createOscillator();
      const voice = ctx.createGain();
      osc.type = index < 2 ? 'sine' : 'triangle';
      osc.frequency.value = hz;
      osc.detune.value = index * 4 - 6;
      voice.gain.value = index === 0 ? 0.6 : 0.16;
      osc.connect(voice).connect(gain);
      osc.start();
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      lfo.frequency.value = 0.05 + index * 0.013;
      depth.gain.value = 4;
      lfo.connect(depth).connect(osc.detune);
      lfo.start();
    });
    gain.gain.linearRampToValueAtTime(0.11, ctx.currentTime + 3);
  }

  // The beam's hum: a filtered saw that opens while the player sinters.
  startHum() {
    const ctx = this.ctx;
    this.hum = ctx.createOscillator();
    this.hum.type = 'sawtooth';
    this.hum.frequency.value = 96;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 880;
    filter.Q.value = 3;
    this.humGain = ctx.createGain();
    this.humGain.gain.value = 0.0001;
    this.hum.connect(filter).connect(this.humGain).connect(this.master);
    this.hum.start();
  }

  startStorm() {
    const ctx = this.ctx;
    const length = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i += 1) {
      last = last * 0.94 + (Math.random() * 2 - 1) * 0.06;
      data[i] = last * 3;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    this.stormFilter = ctx.createBiquadFilter();
    this.stormFilter.type = 'lowpass';
    this.stormFilter.frequency.value = 300;
    this.stormGain = ctx.createGain();
    this.stormGain.gain.value = 0.0001;
    source.connect(this.stormFilter).connect(this.stormGain).connect(this.master);
    source.start();
  }

  setSintering(on, colour) {
    if (!this.ready) return;
    const now = this.ctx.currentTime;
    const target = on ? 0.1 : 0.0001;
    this.humGain.gain.setTargetAtTime(target, now, 0.06);
    this.hum.frequency.setTargetAtTime(colour === 'red' ? 128 : colour === 'blue' ? 84 : 96, now, 0.1);
  }

  setStorm(closeness) {
    if (!this.ready) return;
    const now = this.ctx.currentTime;
    this.stormGain.gain.setTargetAtTime(0.02 + closeness * closeness * 0.26, now, 0.4);
    this.stormFilter.frequency.setTargetAtTime(240 + closeness * 900, now, 0.4);
  }

  tone(hz, duration, type, volume, slideTo) {
    if (!this.ready) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(hz, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain).connect(this.master);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  beacon(step) {
    const scale = [0, 2, 4, 7, 9, 12][Math.min(5, step)];
    const hz = 392 * Math.pow(2, scale / 12);
    this.tone(hz, 0.6, 'triangle', 0.15);
    this.tone(hz * 1.5, 0.3, 'sine', 0.06);
  }

  break1() {
    this.tone(220, 0.3, 'square', 0.05, 90);
  }

  win() {
    [0, 4, 7, 12, 16, 19].forEach((step, index) => {
      const hz = 330 * Math.pow(2, step / 12);
      setTimeout(() => this.tone(hz, 0.7, 'triangle', 0.11), index * 120);
    });
  }

  lose() {
    this.tone(160, 1.4, 'sine', 0.18, 40);
    this.tone(80, 1.6, 'triangle', 0.12, 28);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  }
}
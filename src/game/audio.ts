// 100% Procedural Web Audio API synthesizer — zero external MP3/WAV dependencies

export type RadioStationId = 'Off' | 'Vice Wave FM' | 'Calle 8 Latin' | 'Leonida Talk Podcast';

class ViceAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private sirenOsc: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private rainNoiseGain: GainNode | null = null;
  private oceanWaveGain: GainNode | null = null;
  private oceanWaveFilter: BiquadFilterNode | null = null;

  private radioStation: RadioStationId = 'Off';
  private radioStepTimer = 0;
  private radioStepIdx = 0;

  private muted = false;
  private started = false;

  public init() {
    if (this.started) {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 0.35;
      this.masterGain.connect(this.ctx.destination);

      // Engine RPM Oscillator (car / bike / boat / heli / plane)
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.value = 55;
      const engineFilter = this.ctx.createBiquadFilter();
      engineFilter.type = 'lowpass';
      engineFilter.frequency.value = 260;
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = 0;
      this.engineOsc.connect(engineFilter);
      engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.masterGain);
      this.engineOsc.start();

      // Police Siren Oscillator
      this.sirenOsc = this.ctx.createOscillator();
      this.sirenOsc.type = 'triangle';
      this.sirenOsc.frequency.value = 660;
      this.sirenGain = this.ctx.createGain();
      this.sirenGain.gain.value = 0;
      this.sirenOsc.connect(this.sirenGain);
      this.sirenGain.connect(this.masterGain);
      this.sirenOsc.start();

      // Shared 2s procedural white-noise buffer for rain & ocean waves
      const bufSize = this.ctx.sampleRate * 2;
      const noiseBuf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const output = noiseBuf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) output[i] = Math.random() * 2 - 1;

      // Rain Loop
      const rainSrc = this.ctx.createBufferSource();
      rainSrc.buffer = noiseBuf;
      rainSrc.loop = true;
      const rainFilter = this.ctx.createBiquadFilter();
      rainFilter.type = 'bandpass';
      rainFilter.frequency.value = 1150;
      this.rainNoiseGain = this.ctx.createGain();
      this.rainNoiseGain.gain.value = 0;
      rainSrc.connect(rainFilter);
      rainFilter.connect(this.rainNoiseGain);
      this.rainNoiseGain.connect(this.masterGain);
      rainSrc.start();

      // Ocean Surf & Water Wave Loop
      const oceanSrc = this.ctx.createBufferSource();
      oceanSrc.buffer = noiseBuf;
      oceanSrc.loop = true;
      this.oceanWaveFilter = this.ctx.createBiquadFilter();
      this.oceanWaveFilter.type = 'lowpass';
      this.oceanWaveFilter.frequency.value = 340;
      this.oceanWaveGain = this.ctx.createGain();
      this.oceanWaveGain.gain.value = 0;
      oceanSrc.connect(this.oceanWaveFilter);
      this.oceanWaveFilter.connect(this.oceanWaveGain);
      this.oceanWaveGain.connect(this.masterGain);
      oceanSrc.start();

      this.started = true;
    } catch {
      // Ignore if AudioContext blocked
    }
  }

  public setMuted(m: boolean) {
    this.muted = m;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(m ? 0 : 0.35, this.ctx.currentTime, 0.05);
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setRadioStation(station: RadioStationId) {
    this.radioStation = station;
    this.radioStepIdx = 0;
  }

  public getRadioStation(): RadioStationId {
    return this.radioStation;
  }

  public updateContinuous(
    speedRatio: number,
    isDriving: boolean,
    wantedStars: number,
    timeSec: number,
    slowMo: boolean,
    rainIntensity = 0,
    oceanProximity = 0,
    vehicleMode: 'car' | 'bike' | 'heli' | 'plane' | 'boat' = 'car',
    radioAudible = false,
    dt = 0.016
  ) {
    if (!this.ctx || !this.engineGain || !this.engineOsc || !this.sirenGain || !this.sirenOsc) return;
    const now = this.ctx.currentTime;
    const rate = slowMo ? 0.55 : 1.0;

    if (isDriving) {
      let baseFreq = 52;
      let span = 118;
      let gainLevel = 0.055 + Math.abs(speedRatio) * 0.06;
      if (vehicleMode === 'bike') {
        baseFreq = 72;
        span = 165;
      } else if (vehicleMode === 'heli') {
        baseFreq = 26 + Math.sin(timeSec * 36) * 8;
        span = 30;
        gainLevel = 0.095;
      } else if (vehicleMode === 'plane') {
        baseFreq = 86;
        span = 130;
        gainLevel = 0.085;
      } else if (vehicleMode === 'boat') {
        baseFreq = 44;
        span = 88;
      }
      const targetFreq = (baseFreq + Math.abs(speedRatio) * span) * rate;
      this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.08);
      this.engineGain.gain.setTargetAtTime(gainLevel, now, 0.08);
    } else {
      this.engineGain.gain.setTargetAtTime(0, now, 0.08);
    }

    if (wantedStars > 0) {
      const wail = 640 + Math.sin(timeSec * 4.5) * 210;
      this.sirenOsc.frequency.setTargetAtTime(wail * rate, now, 0.04);
      this.sirenGain.gain.setTargetAtTime(0.025 + wantedStars * 0.004, now, 0.1);
    } else {
      this.sirenGain.gain.setTargetAtTime(0, now, 0.12);
    }

    if (this.rainNoiseGain) {
      this.rainNoiseGain.gain.setTargetAtTime(rainIntensity * 0.06, now, 0.3);
    }

    if (this.oceanWaveGain && this.oceanWaveFilter) {
      const swell = 0.55 + Math.sin(timeSec * 0.85) * 0.45;
      this.oceanWaveFilter.frequency.setTargetAtTime(240 + swell * 260, now, 0.25);
      this.oceanWaveGain.gain.setTargetAtTime(oceanProximity * (0.04 + swell * 0.045), now, 0.25);
    }

    // Vice FM Radio & Leonida Podcast procedural groove sequencer
    if (radioAudible && this.radioStation !== 'Off' && !this.muted) {
      this.radioStepTimer -= dt;
      if (this.radioStepTimer <= 0) {
        this.triggerRadioStep(now);
      }
    }
  }

  private triggerRadioStep(now: number) {
    if (!this.ctx || !this.masterGain) return;
    if (this.radioStation === 'Vice Wave FM') {
      this.radioStepTimer = 0.28;
      const synthBass = [110, 110, 146.83, 130.81, 98, 98, 130.81, 164.81];
      const freq = synthBass[this.radioStepIdx % synthBass.length];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 520;
      osc.connect(lp);
      lp.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.24);
    } else if (this.radioStation === 'Calle 8 Latin') {
      this.radioStepTimer = 0.24;
      const latinScale = [220, 261.63, 293.66, 329.63, 392, 329.63, 293.66, 246.94];
      const freq = latinScale[this.radioStepIdx % latinScale.length];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (this.radioStation === 'Leonida Talk Podcast') {
      this.radioStepTimer = 0.42;
      const talkCadence = [165, 190, 150, 210, 175, 145];
      const freq = talkCadence[this.radioStepIdx % talkCadence.length];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.linearRampToValueAtTime(freq * 1.12, now + 0.12);
      gain.gain.setValueAtTime(0.032, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.19);
    }
    this.radioStepIdx++;
  }

  public playDoorLatch() {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(75, now + 0.08);
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playExplosion() {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(135, now);
    osc.frequency.exponentialRampToValueAtTime(22, now + 0.65);
    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.72);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.75);
  }

  public playTreeSnap() {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.22);
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playThunder() {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(75, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 0.9);
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 1.15);
  }

  public playPhoneRing() {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    [740, 988, 740, 988].forEach((freq, i) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.09);
      gain.gain.setValueAtTime(0.12, now + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.08);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + i * 0.09);
      osc.stop(now + i * 0.09 + 0.085);
    });
  }

  public playGunshot(silenced = false) {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = silenced ? 'sine' : 'square';
    osc.frequency.setValueAtTime(silenced ? 260 : 180, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + (silenced ? 0.07 : 0.14));
    gain.gain.setValueAtTime(silenced ? 0.18 : 0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (silenced ? 0.08 : 0.16));
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  public playJamClick() {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.04);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  public playBlinkerTick() {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(920, now);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.035);
  }

  public playCashRegister() {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    [1046, 1318, 1568].forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.055);
      gain.gain.setValueAtTime(0.14, now + idx * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.055 + 0.22);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.055);
      osc.stop(now + idx * 0.055 + 0.23);
    });
  }

  public playHotwireSpark() {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.linearRampToValueAtTime(1180, now + 0.06);
    osc.frequency.linearRampToValueAtTime(220, now + 0.14);
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playSizzle() {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1850, now);
    osc.frequency.linearRampToValueAtTime(940, now + 0.16);
    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.19);
  }

  public playMop() {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.linearRampToValueAtTime(410, now + 0.12);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playSplash() {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.25);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.27);
  }

  public playUiChime(high = true) {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(high ? 660 : 440, now);
    osc.frequency.exponentialRampToValueAtTime(high ? 880 : 330, now + 0.09);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  public playImpact(heavy = false) {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(heavy ? 95 : 140, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + (heavy ? 0.18 : 0.09));
    gain.gain.setValueAtTime(heavy ? 0.25 : 0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (heavy ? 0.19 : 0.1));
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playHorn() {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    [392, 493.88].forEach((freq) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.085, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1400;
      osc.connect(lp);
      lp.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.28);
    });
  }

  public playMolotov() {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(95, now + 0.35);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  public playRocketLaunch() {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.linearRampToValueAtTime(90, now + 0.42);
    gain.gain.setValueAtTime(0.26, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.46);
  }

  private lastSpeechTime = 0;
  private npcPanicCooldown = new Map<string, number>();

  public playPanicScreamOnce(npcId: string, highPitch = false) {
    if (this.muted) return;
    const nowMs = performance.now();
    const lastMs = this.npcPanicCooldown.get(npcId) ?? -999999;
    if (nowMs - lastMs < 16000) return;
    this.npcPanicCooldown.set(npcId, nowMs);

    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      const baseF = highPitch ? 640 : 480;
      osc.frequency.setValueAtTime(baseF, now);
      osc.frequency.exponentialRampToValueAtTime(baseF * 1.38, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(baseF * 0.72, now + 0.24);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.14, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.26);
    }
  }

  public speakNpcLine(text: string, pitch = 1.0, rate = 1.05) {
    if (this.muted) return;
    const nowMs = performance.now();
    if (nowMs - this.lastSpeechTime < 2200) return;
    this.lastSpeechTime = nowMs;

    // Gentle synthesized chime cue so NPC speech feels responsive even if browser speechSynthesis is silent
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280 * pitch, now);
      osc.frequency.exponentialRampToValueAtTime(340 * pitch, now + 0.08);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.1);
    }

    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const synth = window.speechSynthesis;
        if (!synth.speaking) {
          const utt = new SpeechSynthesisUtterance(text);
          utt.volume = 0.55;
          utt.pitch = pitch;
          utt.rate = rate;
          synth.speak(utt);
        }
      }
    } catch {
      // Ignore if speechSynthesis unavailable
    }
  }
}

export const viceAudio = new ViceAudioEngine();

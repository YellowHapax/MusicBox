export const mtof = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

export type ChannelName = 'bass' | 'pluck' | 'pad' | 'drums' | 'cello' | 'flute' | 'guitar' | 'saxophone';
export type StanzaName = 'subdominant' | 'tonic' | 'dominant';

export const STANZA_DATA: Record<StanzaName, { roots: number[], chords: number[][], bachChords: number[][] }> = {
  subdominant: {
    roots: [45, 43, 48, 41], // Am, G, C, F
    chords: [
      [57, 60, 64],
      [55, 59, 62],
      [60, 64, 67],
      [53, 57, 60],
    ],
    bachChords: [
      [57, 60, 64, 67], // Am7
      [55, 59, 62, 65], // G7
      [60, 64, 67, 71], // Cmaj7
      [53, 57, 60, 64], // Fmaj7
    ]
  },
  tonic: {
    roots: [45, 41, 45, 40], // Am, F, Am, Em
    chords: [
      [57, 60, 64],
      [53, 57, 60],
      [57, 60, 64],
      [52, 55, 59],
    ],
    bachChords: [
      [57, 60, 64, 67], // Am7
      [53, 57, 60, 64], // Fmaj7
      [57, 60, 64, 67], // Am7
      [52, 55, 59, 62], // Em7
    ]
  },
  dominant: {
    roots: [48, 43, 45, 41], // C, G, Am, F
    chords: [
      [60, 64, 67],
      [55, 59, 62],
      [57, 60, 64],
      [53, 57, 60],
    ],
    bachChords: [
      [60, 64, 67, 71], // Cmaj7
      [55, 59, 62, 65], // G7
      [57, 60, 64, 67], // Am7
      [53, 57, 60, 64], // Fmaj7
    ]
  }
};

export const STANZA_NAMES = ['Ode to Joy', 'Für Elise', 'Greensleeves'] as const;
type StanzaNote = { step: number; note: number; dur: number };
export let STANZA_LIBRARY: { name: string; bars: StanzaNote[][] }[] = [
  {
    name: 'Ode to Joy',
    bars: [
      [{ step: 0, note: 76, dur: 1.5 }, { step: 6, note: 76, dur: 0.5 }, { step: 8, note: 77, dur: 1.0 }, { step: 12, note: 79, dur: 1.0 }],
      [{ step: 0, note: 79, dur: 1.5 }, { step: 6, note: 77, dur: 0.5 }, { step: 8, note: 76, dur: 1.0 }, { step: 12, note: 74, dur: 1.0 }],
      [{ step: 0, note: 72, dur: 1.5 }, { step: 6, note: 72, dur: 0.5 }, { step: 8, note: 74, dur: 1.0 }, { step: 12, note: 76, dur: 1.0 }],
      [{ step: 0, note: 76, dur: 1.5 }, { step: 6, note: 74, dur: 0.5 }, { step: 8, note: 74, dur: 2.0 }],
    ],
  },
  {
    name: 'Für Elise',
    bars: [
      [{ step: 0, note: 76, dur: 0.5 }, { step: 6, note: 75, dur: 0.5 }, { step: 8, note: 76, dur: 0.5 }, { step: 12, note: 71, dur: 0.5 }],
      [{ step: 0, note: 74, dur: 1.0 }, { step: 6, note: 72, dur: 0.5 }, { step: 8, note: 69, dur: 1.5 }],
      [{ step: 0, note: 76, dur: 0.5 }, { step: 6, note: 75, dur: 0.5 }, { step: 8, note: 76, dur: 0.5 }, { step: 12, note: 71, dur: 0.5 }],
      [{ step: 0, note: 74, dur: 1.0 }, { step: 6, note: 72, dur: 0.5 }, { step: 8, note: 69, dur: 2.0 }],
    ],
  },
  {
    name: 'Greensleeves',
    bars: [
      [{ step: 0, note: 69, dur: 1.5 }, { step: 6, note: 72, dur: 0.5 }, { step: 8, note: 74, dur: 1.0 }, { step: 12, note: 76, dur: 1.0 }],
      [{ step: 0, note: 79, dur: 1.5 }, { step: 6, note: 77, dur: 0.5 }, { step: 8, note: 76, dur: 1.0 }, { step: 12, note: 74, dur: 1.0 }],
      [{ step: 0, note: 72, dur: 1.5 }, { step: 6, note: 71, dur: 0.5 }, { step: 8, note: 67, dur: 1.0 }, { step: 12, note: 69, dur: 1.0 }],
      [{ step: 0, note: 76, dur: 1.5 }, { step: 6, note: 72, dur: 0.5 }, { step: 8, note: 74, dur: 1.0 }, { step: 12, note: 76, dur: 2.0 }],
    ],
  },
];

export type StepModes = { base: boolean; lead: boolean; bach: boolean; stanza: boolean };

export class MusicBoxEngine {
  ctx: AudioContext | null = null;
  masterGain: GainNode | null = null;
  isPlaying = false;
  tempo = 110;
  volume = 0.5;
  lookahead = 25.0; // ms
  scheduleAheadTime = 0.1; // s
  currentStep = 0;
  nextNoteTime = 0.0;
  timerID: number | null = null;

  currentStanza: StanzaName = 'subdominant';
  view: 'live' | 'grid' = 'live';
  compositionGrid: Record<ChannelName, StepModes[]> = {
    bass: Array(16).fill(null).map(() => ({ base: false, lead: false, bach: false, stanza: false })),
    pluck: Array(16).fill(null).map(() => ({ base: false, lead: false, bach: false, stanza: false })),
    pad: Array(16).fill(null).map(() => ({ base: false, lead: false, bach: false, stanza: false })),
    drums: Array(16).fill(null).map(() => ({ base: false, lead: false, bach: false, stanza: false })),
    cello: Array(16).fill(null).map(() => ({ base: false, lead: false, bach: false, stanza: false })),
    flute: Array(16).fill(null).map(() => ({ base: false, lead: false, bach: false, stanza: false })),
    guitar: Array(16).fill(null).map(() => ({ base: false, lead: false, bach: false, stanza: false })),
    saxophone: Array(16).fill(null).map(() => ({ base: false, lead: false, bach: false, stanza: false })),
  };
  viewStanzas: StanzaName[] = Array(16).fill('subdominant');

  stanzas: Record<ChannelName, boolean> = {
    bass: false, pluck: false, pad: false, drums: false,
    cello: false, flute: false, guitar: false, saxophone: false,
  };

  stanzaIndex: Record<ChannelName, number> = {
    bass: 0, pluck: 0, pad: 0, drums: 0,
    cello: 0, flute: 0, guitar: 0, saxophone: 0,
  };

  channels: Record<ChannelName, boolean> = {
    bass: true,
    pluck: true,
    pad: true,
    drums: false,
    cello: false,
    flute: false,
    guitar: false,
    saxophone: false,
  };

  leads: Record<ChannelName, boolean> = {
    bass: false,
    pluck: false,
    pad: false,
    drums: false,
    cello: false,
    flute: false,
    guitar: false,
    saxophone: false,
  };

  bachs: Record<ChannelName, boolean> = {
    bass: false,
    pluck: false,
    pad: false,
    drums: false,
    cello: false,
    flute: false,
    guitar: false,
    saxophone: false,
  };

  onStep?: (step: number) => void;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
    }
  }

  setVolume(val: number) {
    this.volume = val;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.05);
    }
  }

  toggleChannel(name: ChannelName) {
    this.channels[name] = !this.channels[name];
  }

  toggleLead(name: ChannelName) {
    this.leads[name] = !this.leads[name];
  }

  toggleBach(name: ChannelName) {
    this.bachs[name] = !this.bachs[name];
  }

  toggleStanza(name: ChannelName) {
    if (!this.stanzas[name]) {
      this.stanzas[name] = true;
      this.stanzaIndex[name] = 0;
    } else {
      const next = this.stanzaIndex[name] + 1;
      if (next >= STANZA_LIBRARY.length) {
        this.stanzas[name] = false;
        this.stanzaIndex[name] = 0;
      } else {
        this.stanzaIndex[name] = next;
      }
    }
  }

  playBass(midi: number, time: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.value = mtof(midi);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, time);
    filter.frequency.exponentialRampToValueAtTime(80, time + 0.4);

    gain.gain.setValueAtTime(0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.5);
  }

  playPluck(midi: number, time: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'square';
    osc.frequency.value = mtof(midi);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1500, time);
    filter.frequency.exponentialRampToValueAtTime(200, time + 0.15);

    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.3);
  }

  playPad(midis: number[], time: number, duration: number) {
    if (!this.ctx || !this.masterGain) return;
    midis.forEach(midi => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.value = mtof(midi);

      filter.type = 'lowpass';
      filter.frequency.value = 600;

      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.06, time + duration * 0.3);
      gain.gain.linearRampToValueAtTime(0, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(time);
      osc.stop(time + duration);
    });
  }

  playKick(time: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
    
    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(time);
    osc.stop(time + 0.5);
  }

  playSnare(time: number) {
    if (!this.ctx || !this.masterGain) return;
    
    const bufferSize = this.ctx.sampleRate * 0.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;
    
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    
    noise.start(time);
  }

  playHihat(time: number) {
    if (!this.ctx || !this.masterGain) return;
    
    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 5000;
    
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    
    noise.start(time);
  }

  playCello(midi: number, time: number, duration: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    const lfo = this.ctx.createOscillator();

    osc1.type = 'sawtooth';
    osc2.type = 'triangle';
    
    const freq = mtof(midi);
    osc1.frequency.value = freq;
    osc2.frequency.value = freq * 0.998;

    lfo.type = 'sine';
    lfo.frequency.value = 5;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = freq * 0.015;
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfoGain.connect(osc2.frequency);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, time);
    filter.frequency.linearRampToValueAtTime(800, time + duration * 0.5);
    filter.frequency.linearRampToValueAtTime(300, time + duration);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.15, time + duration * 0.2);
    gain.gain.setValueAtTime(0.15, time + duration * 0.8);
    gain.gain.linearRampToValueAtTime(0, time + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(time);
    osc2.start(time);
    lfo.start(time);
    
    osc1.stop(time + duration);
    osc2.stop(time + duration);
    lfo.stop(time + duration);
  }

  playFlute(midi: number, time: number, duration: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const lfo = this.ctx.createOscillator();

    osc.type = 'sine';
    
    const freq = mtof(midi);
    osc.frequency.value = freq;

    lfo.type = 'sine';
    lfo.frequency.value = 6;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(0, time);
    lfoGain.gain.linearRampToValueAtTime(freq * 0.02, time + 0.5);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = freq;
    noiseFilter.Q.value = 2;
    const noiseGain = this.ctx.createGain();

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.15, time + 0.1);
    gain.gain.setValueAtTime(0.15, time + duration - 0.1);
    gain.gain.linearRampToValueAtTime(0, time + duration);

    noiseGain.gain.setValueAtTime(0, time);
    noiseGain.gain.linearRampToValueAtTime(0.02, time + 0.1);
    noiseGain.gain.setValueAtTime(0.02, time + duration - 0.1);
    noiseGain.gain.linearRampToValueAtTime(0, time + duration);

    osc.connect(gain);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    
    gain.connect(this.masterGain);
    noiseGain.connect(this.masterGain);

    osc.start(time);
    lfo.start(time);
    noise.start(time);
    
    osc.stop(time + duration);
    lfo.stop(time + duration);
    noise.stop(time + duration);
  }

  playGuitar(midi: number, time: number, duration: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const osc3 = this.ctx.createOscillator();
    const preGain = this.ctx.createGain();
    const distortion = this.ctx.createWaveShaper();
    const filter = this.ctx.createBiquadFilter();
    const postGain = this.ctx.createGain();
    
    // Create a heavy distortion curve
    const amount = 400; // Increased for more fuzz/drive
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    distortion.curve = curve;
    distortion.oversample = '4x';

    osc1.type = 'sawtooth';
    osc2.type = 'square';
    osc3.type = 'triangle';
    
    const freq = mtof(midi);
    osc1.frequency.value = freq;
    osc2.frequency.value = freq * 0.501; // sub octave, slightly detuned
    osc3.frequency.value = freq * 1.002; // slightly detuned for thickness

    // Drive the distortion hard
    preGain.gain.value = 5.0;

    // Cabinet simulation (lowpass to remove harsh high frequencies)
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3500, time);
    filter.frequency.exponentialRampToValueAtTime(1200, time + duration * 0.8);
    filter.Q.value = 1.5;

    postGain.gain.setValueAtTime(0, time);
    postGain.gain.linearRampToValueAtTime(0.3, time + 0.02);
    postGain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc1.connect(preGain);
    osc2.connect(preGain);
    osc3.connect(preGain);
    
    preGain.connect(distortion);
    distortion.connect(filter);
    filter.connect(postGain);
    postGain.connect(this.masterGain);

    osc1.start(time);
    osc2.start(time);
    osc3.start(time);
    osc1.stop(time + duration);
    osc2.stop(time + duration);
    osc3.stop(time + duration);
  }

  playSaxophone(midi: number, time: number, duration: number) {
    if (!this.ctx || !this.masterGain) return;
    
    // Create a more complex sound for saxophone
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const osc3 = this.ctx.createOscillator(); // Sub oscillator for body
    
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    
    // Vibrato LFO
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();

    // Saxophone-like waveform mix
    osc1.type = 'sawtooth';
    osc2.type = 'square';
    osc3.type = 'triangle';
    
    const freq = mtof(midi);
    osc1.frequency.value = freq;
    osc2.frequency.value = freq;
    osc3.frequency.value = freq / 2; // Sub octave

    // Detune slightly for thickness
    osc2.detune.value = 8;
    
    // Vibrato setup (delayed onset)
    lfo.type = 'sine';
    lfo.frequency.value = 5.5; // 5.5 Hz vibrato
    lfoGain.gain.setValueAtTime(0, time);
    lfoGain.gain.linearRampToValueAtTime(0, time + 0.2); // Delay vibrato
    lfoGain.gain.linearRampToValueAtTime(15, time + 0.4); // Fade in vibrato
    
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfoGain.connect(osc2.frequency);

    // Filter setup for breathy/brassy tone
    filter.type = 'lowpass';
    // Envelope for the filter (adds the "wah" or breath attack)
    filter.frequency.setValueAtTime(freq * 1.5, time);
    filter.frequency.exponentialRampToValueAtTime(freq * 4, time + 0.1);
    filter.frequency.exponentialRampToValueAtTime(freq * 2, time + duration * 0.8);
    filter.Q.value = 2;

    // Mix oscillators
    const mix1 = this.ctx.createGain(); mix1.gain.value = 0.5;
    const mix2 = this.ctx.createGain(); mix2.gain.value = 0.3;
    const mix3 = this.ctx.createGain(); mix3.gain.value = 0.4;

    osc1.connect(mix1);
    osc2.connect(mix2);
    osc3.connect(mix3);
    
    mix1.connect(filter);
    mix2.connect(filter);
    mix3.connect(filter);
    
    filter.connect(gain);
    gain.connect(this.masterGain);

    // Saxophone amplitude envelope (slower attack than plucked, expressive decay)
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(this.volume * 0.8, time + 0.05); // Attack
    gain.gain.exponentialRampToValueAtTime(this.volume * 0.6, time + 0.2); // Decay
    gain.gain.setValueAtTime(this.volume * 0.6, time + duration - 0.1); // Sustain
    gain.gain.linearRampToValueAtTime(0.001, time + duration); // Release

    osc1.start(time);
    osc2.start(time);
    osc3.start(time);
    lfo.start(time);
    
    osc1.stop(time + duration);
    osc2.stop(time + duration);
    osc3.stop(time + duration);
    lfo.stop(time + duration);
  }

  nextNote() {
    const secondsPerBeat = 60.0 / this.tempo;
    this.nextNoteTime += 0.25 * secondsPerBeat;
    this.currentStep++;
    const maxSteps = this.view === 'grid' ? 256 : 64;
    if (this.currentStep >= maxSteps) {
      this.currentStep = 0;
    }
  }

  scheduleNote(stepNumber: number, time: number) {
    if (this.onStep) {
      const timeToPlay = time - this.ctx!.currentTime;
      if (timeToPlay > 0) {
        setTimeout(() => this.onStep?.(stepNumber), timeToPlay * 1000);
      } else {
        this.onStep(stepNumber);
      }
    }

    const bar = Math.floor(stepNumber / 16);
    const stepInBar = stepNumber % 16;
    const seqStep = bar % 16; // 16 measures in the sequence

    if (this.view === 'grid') {
      this.currentStanza = this.viewStanzas[seqStep];
    }

    const stanzaData = STANZA_DATA[this.currentStanza];
    const roots = stanzaData.roots;
    const chords = stanzaData.chords;
    const bachChords = stanzaData.bachChords;

    const root = roots[bar % 4];
    const chord = chords[bar % 4];
    const bChord = bachChords[bar % 4];

    const isModeActive = (name: ChannelName, mode: 'base' | 'lead' | 'bach' | 'stanza') => {
      if (this.view === 'grid') {
        return this.compositionGrid[name][seqStep][mode];
      }
      if (!this.channels[name]) return false;
      if (mode === 'stanza') return this.stanzas[name];
      if (mode === 'bach') return this.bachs[name];
      if (mode === 'lead') return this.leads[name];
      return !this.bachs[name] && !this.leads[name] && !this.stanzas[name];
    };

    const getBachRightHand = (step: number) => {
      let noteIdx = 0;
      let octave = 0;
      const barMod = bar % 4;
      if (barMod === 0) {
        noteIdx = step % 4;
        octave = Math.floor(step / 4) % 2 === 0 ? 0 : 12;
      } else if (barMod === 1) {
        noteIdx = 3 - (step % 4);
        octave = Math.floor(step / 4) % 2 === 0 ? 12 : 0;
      } else if (barMod === 2) {
        noteIdx = step % 2 === 0 ? 0 : (step % 4);
        octave = step % 2 === 0 ? -12 : 12;
      } else {
        const fib = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987];
        noteIdx = fib[step] % 4;
        octave = (fib[step] % 2) === 0 ? 12 : 0;
      }
      return bChord[noteIdx] + octave;
    };

    if (isModeActive('bass', 'bach')) {
      if (stepInBar % 2 === 0) {
        const lhStep = stepInBar / 2;
        const lhNotes = [bChord[0] - 12, bChord[2] - 12, bChord[1] - 12, bChord[3] - 24];
        this.playBass(lhNotes[lhStep % 4], time);
      }
    }
    if (isModeActive('bass', 'lead')) {
      const pat = [0, 2, 3, 4, 6, 8, 10, 11, 12, 14];
      if (pat.includes(stepInBar)) {
        const isOctave = stepInBar === 14 || stepInBar === 6;
        this.playBass(root + (isOctave ? 12 : 0), time);
      }
    }
    if (isModeActive('bass', 'base')) {
      if (stepInBar % 2 === 0) {
        if (stepInBar !== 14) {
          this.playBass(root, time);
        }
      } else if (stepInBar === 13) {
        this.playBass(root + 12, time);
      }
    }
    if (isModeActive('bass', 'stanza')) {
      const sLib = STANZA_LIBRARY[this.stanzaIndex.bass];
      const sEv = sLib.bars[bar % 4].find(p => p.step === stepInBar);
      if (sEv) this.playBass(sEv.note - 12, time);
    }

    if (isModeActive('pad', 'bach')) {
      if (stepInBar % 4 === 0) {
        this.playPad(bChord, time, (60.0 / this.tempo) * 1);
      }
    }
    if (isModeActive('pad', 'lead')) {
      if (stepInBar % 2 === 0) {
        this.playPad([root, ...chord], time, (60.0 / this.tempo) * 0.4);
      }
    }
    if (isModeActive('pad', 'base')) {
      if (stepInBar === 0) {
        this.playPad([root, ...chord], time, (60.0 / this.tempo) * 4);
      }
    }

    if (isModeActive('pluck', 'bach')) {
      this.playPluck(getBachRightHand(stepInBar), time);
    }
    if (isModeActive('pluck', 'lead')) {
      const noteIdx = stepInBar % 4;
      const arpNotes = [...chord, chord[1] + 12];
      this.playPluck(arpNotes[noteIdx], time);
    }
    if (isModeActive('pluck', 'base')) {
      const arpPattern = [0, 3, 6, 8, 11, 14];
      if (arpPattern.includes(stepInBar)) {
        const noteIdx = arpPattern.indexOf(stepInBar) % 3;
        this.playPluck(chord[noteIdx], time);
      }
    }

    if (isModeActive('drums', 'bach')) {
      let noteIdx = 0;
      const barMod = bar % 4;
      if (barMod === 0) noteIdx = stepInBar % 4;
      else if (barMod === 1) noteIdx = 3 - (stepInBar % 4);
      else if (barMod === 2) noteIdx = stepInBar % 2 === 0 ? 0 : (stepInBar % 4);
      else {
        const fib = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987];
        noteIdx = fib[stepInBar] % 4;
      }
      if (noteIdx === 0) this.playKick(time);
      else if (noteIdx === 1) this.playSnare(time);
      else if (noteIdx === 2) this.playHihat(time);
      else { this.playKick(time); this.playHihat(time); }
    }
    if (isModeActive('drums', 'lead')) {
      if (stepInBar % 2 === 0 || stepInBar === 15) this.playKick(time);
      if (stepInBar === 4 || stepInBar === 12 || stepInBar === 14) this.playSnare(time);
      this.playHihat(time);
    }
    if (isModeActive('drums', 'base')) {
      if (stepInBar % 4 === 0) {
        this.playKick(time);
      }
      if (stepInBar === 4 || stepInBar === 12) {
        this.playSnare(time);
      }
      if (stepInBar % 2 === 0) {
        this.playHihat(time);
      } else if (stepInBar === 15) {
        this.playHihat(time);
      }
    }

    if (isModeActive('cello', 'bach')) {
      if (stepInBar % 2 === 0) {
        const note = getBachRightHand(stepInBar);
        this.playCello(note - 12, time, (60.0 / this.tempo) * 0.5);
      }
    }
    if (isModeActive('cello', 'lead')) {
      if (stepInBar === 0) this.playCello(chord[0] - 12, time, (60.0 / this.tempo) * 1);
      if (stepInBar === 4) this.playCello(chord[1] - 12, time, (60.0 / this.tempo) * 1);
      if (stepInBar === 8) this.playCello(chord[2] - 12, time, (60.0 / this.tempo) * 1);
      if (stepInBar === 12) this.playCello(chord[1] - 12, time, (60.0 / this.tempo) * 1);
    }
    if (isModeActive('cello', 'base')) {
      if (stepInBar === 0) {
        this.playCello(root - 12, time, (60.0 / this.tempo) * 4);
      }
    }
    if (isModeActive('cello', 'stanza')) {
      const sLib = STANZA_LIBRARY[this.stanzaIndex.cello];
      const sEv = sLib.bars[bar % 4].find(p => p.step === stepInBar);
      if (sEv) this.playCello(sEv.note - 12, time, (60.0 / this.tempo) * sEv.dur);
    }

    if (isModeActive('flute', 'bach')) {
      // Gibbet Hill - Lament & Hornpipe variation (transposed to Am)
      const gibbetMelody = [
        [{ step: 0, note: 76, dur: 1.5 }, { step: 6, note: 81, dur: 0.5 }, { step: 8, note: 83, dur: 1.0 }, { step: 12, note: 84, dur: 0.5 }, { step: 14, note: 83, dur: 0.5 }],
        [{ step: 0, note: 81, dur: 1.5 }, { step: 6, note: 79, dur: 0.5 }, { step: 8, note: 81, dur: 1.0 }, { step: 12, note: 76, dur: 1.0 }],
        [{ step: 0, note: 79, dur: 1.5 }, { step: 6, note: 81, dur: 0.5 }, { step: 8, note: 83, dur: 1.0 }, { step: 12, note: 84, dur: 0.5 }, { step: 14, note: 83, dur: 0.5 }],
        [{ step: 0, note: 81, dur: 1.5 }, { step: 6, note: 79, dur: 0.5 }, { step: 8, note: 76, dur: 2.0 }]
      ];
      const noteEvent = gibbetMelody[bar % 4].find(p => p.step === stepInBar);
      if (noteEvent) {
        this.playFlute(noteEvent.note, time, (60.0 / this.tempo) * noteEvent.dur);
      }
    }
    if (isModeActive('flute', 'lead')) {
      const melodyPattern = [
        { step: 0, note: chord[2] + 12, dur: 0.25 },
        { step: 2, note: chord[1] + 12, dur: 0.25 },
        { step: 4, note: chord[2] + 12, dur: 0.25 },
        { step: 6, note: chord[0] + 12, dur: 0.25 },
        { step: 8, note: chord[2] + 12, dur: 0.5 },
        { step: 12, note: chord[1] + 12, dur: 0.5 },
      ];
      const noteEvent = melodyPattern.find(p => p.step === stepInBar);
      if (noteEvent) {
        this.playFlute(noteEvent.note, time, (60.0 / this.tempo) * noteEvent.dur);
      }
    }
    if (isModeActive('flute', 'base')) {
      const melodyPattern = [
        { step: 0, note: chord[2] + 12, dur: 1.5 },
        { step: 6, note: chord[1] + 12, dur: 0.5 },
        { step: 8, note: chord[2] + 12, dur: 1.0 },
        { step: 12, note: chord[1] + 12, dur: 1.0 },
      ];
      const noteEvent = melodyPattern.find(p => p.step === stepInBar);
      if (noteEvent) {
        this.playFlute(noteEvent.note, time, (60.0 / this.tempo) * noteEvent.dur);
      }
    }

    if (isModeActive('guitar', 'bach')) {
      const note = getBachRightHand(stepInBar);
      this.playGuitar(note - 12, time, (60.0 / this.tempo) * 0.25);
    }
    if (isModeActive('guitar', 'lead')) {
      // Heavy syncopated hits
      if ([0, 3, 6, 10, 14].includes(stepInBar)) {
        this.playGuitar(root - 12, time, (60.0 / this.tempo) * 0.5);
      }
    }
    if (isModeActive('guitar', 'base')) {
      // Chugging power chords (root and fifth)
      if (stepInBar % 2 === 0) {
        this.playGuitar(root - 12, time, (60.0 / this.tempo) * 0.25);
        this.playGuitar(root - 5, time, (60.0 / this.tempo) * 0.25);
      }
    }

    if (isModeActive('saxophone', 'bach')) {
      const note = getBachRightHand(stepInBar);
      this.playSaxophone(note, time, (60.0 / this.tempo) * 0.25);
    }
    if (isModeActive('saxophone', 'lead')) {
      // Folk melody variation
      const melodyPattern = [
        { step: 0, note: chord[2], dur: 0.5 },
        { step: 2, note: chord[1], dur: 0.25 },
        { step: 3, note: chord[2], dur: 0.25 },
        { step: 4, note: chord[0] + 12, dur: 0.5 },
        { step: 6, note: chord[2], dur: 0.5 },
        { step: 8, note: chord[1], dur: 0.5 },
        { step: 10, note: chord[0], dur: 0.5 },
        { step: 12, note: chord[2], dur: 1.0 },
      ];
      const noteEvent = melodyPattern.find(p => p.step === stepInBar);
      if (noteEvent) {
        this.playSaxophone(noteEvent.note, time, (60.0 / this.tempo) * noteEvent.dur);
      }
    }
    if (isModeActive('saxophone', 'base')) {
      // Drone on the root of the scale (A)
      if (stepInBar === 0) {
        this.playSaxophone(57, time, (60.0 / this.tempo) * 4); // A3 drone
    
    if (isModeActive('pad', 'stanza')) {
      const sLib = STANZA_LIBRARY[this.stanzaIndex.pad];
      const sEv = sLib.bars[bar % 4].find(p => p.step === stepInBar);
      if (sEv) this.playPad([sEv.note, sEv.note+4, sEv.note+7], time, (60.0 / this.tempo) * sEv.dur);
    }
    if (isModeActive('pluck', 'stanza')) {
      const sLib = STANZA_LIBRARY[this.stanzaIndex.pluck];
      const sEv = sLib.bars[bar % 4].find(p => p.step === stepInBar);
      if (sEv) this.playPluck(sEv.note, time);
    }
    if (isModeActive('drums', 'stanza')) {
      const sLib = STANZA_LIBRARY[this.stanzaIndex.drums];
      const sEv = sLib.bars[bar % 4].find(p => p.step === stepInBar);
      if (sEv) {
        const d = sEv.note % 4;
        if (d === 0) this.playKick(time);
        else if (d === 1) this.playSnare(time);
        else if (d === 2) this.playHihat(time);
        else { this.playKick(time); this.playHihat(time); }
      }
    }
    if (isModeActive('flute', 'stanza')) {
      const sLib = STANZA_LIBRARY[this.stanzaIndex.flute];
      const sEv = sLib.bars[bar % 4].find(p => p.step === stepInBar);
      if (sEv) this.playFlute(sEv.note, time, (60.0 / this.tempo) * sEv.dur);
    }
    if (isModeActive('guitar', 'stanza')) {
      const sLib = STANZA_LIBRARY[this.stanzaIndex.guitar];
      const sEv = sLib.bars[bar % 4].find(p => p.step === stepInBar);
      if (sEv) this.playGuitar(sEv.note - 24, time, (60.0 / this.tempo) * Math.max(sEv.dur, 1.0));
    }
    if (isModeActive('saxophone', 'stanza')) {
      const sLib = STANZA_LIBRARY[this.stanzaIndex.saxophone];
      const sEv = sLib.bars[bar % 4].find(p => p.step === stepInBar);
      if (sEv) this.playSaxophone(sEv.note, time, (60.0 / this.tempo) * Math.max(sEv.dur, 1.0));
    }
  }
  
    if (isModeActive('pad', 'stanza')) {
      const sLib = STANZA_LIBRARY[this.stanzaIndex.pad];
      const sEv = sLib.bars[bar % 4].find(p => p.step === stepInBar);
      if (sEv) this.playPad([sEv.note, sEv.note+4, sEv.note+7], time, (60.0 / this.tempo) * sEv.dur);
    }
    if (isModeActive('pluck', 'stanza')) {
      const sLib = STANZA_LIBRARY[this.stanzaIndex.pluck];
      const sEv = sLib.bars[bar % 4].find(p => p.step === stepInBar);
      if (sEv) this.playPluck(sEv.note, time);
    }
    if (isModeActive('drums', 'stanza')) {
      const sLib = STANZA_LIBRARY[this.stanzaIndex.drums];
      const sEv = sLib.bars[bar % 4].find(p => p.step === stepInBar);
      if (sEv) {
        const d = sEv.note % 4;
        if (d === 0) this.playKick(time);
        else if (d === 1) this.playSnare(time);
        else if (d === 2) this.playHihat(time);
        else { this.playKick(time); this.playHihat(time); }
      }
    }
    if (isModeActive('flute', 'stanza')) {
      const sLib = STANZA_LIBRARY[this.stanzaIndex.flute];
      const sEv = sLib.bars[bar % 4].find(p => p.step === stepInBar);
      if (sEv) this.playFlute(sEv.note, time, (60.0 / this.tempo) * sEv.dur);
    }
    if (isModeActive('guitar', 'stanza')) {
      const sLib = STANZA_LIBRARY[this.stanzaIndex.guitar];
      const sEv = sLib.bars[bar % 4].find(p => p.step === stepInBar);
      if (sEv) this.playGuitar(sEv.note - 24, time, (60.0 / this.tempo) * Math.max(sEv.dur, 1.0));
    }
    if (isModeActive('saxophone', 'stanza')) {
      const sLib = STANZA_LIBRARY[this.stanzaIndex.saxophone];
      const sEv = sLib.bars[bar % 4].find(p => p.step === stepInBar);
      if (sEv) this.playSaxophone(sEv.note, time, (60.0 / this.tempo) * Math.max(sEv.dur, 1.0));
    }
  }

    if (isModeActive('pad', 'stanza')) {
      const sLib = STANZA_LIBRARY[this.stanzaIndex.pad];
      const sEv = sLib.bars[bar % 4].find(p => p.step === stepInBar);
      if (sEv) this.playPad([sEv.note, sEv.note+4, sEv.note+7], time, (60.0 / this.tempo) * sEv.dur);
    }
    if (isModeActive('pluck', 'stanza')) {
      const sLib = STANZA_LIBRARY[this.stanzaIndex.pluck];
      const sEv = sLib.bars[bar % 4].find(p => p.step === stepInBar);
      if (sEv) this.playPluck(sEv.note, time);
    }
    if (isModeActive('drums', 'stanza')) {
      const sLib = STANZA_LIBRARY[this.stanzaIndex.drums];
      const sEv = sLib.bars[bar % 4].find(p => p.step === stepInBar);
      if (sEv) {
        const d = sEv.note % 4;
        if (d === 0) this.playKick(time);
        else if (d === 1) this.playSnare(time);
        else if (d === 2) this.playHihat(time);
        else { this.playKick(time); this.playHihat(time); }
      }
    }
    if (isModeActive('flute', 'stanza')) {
      const sLib = STANZA_LIBRARY[this.stanzaIndex.flute];
      const sEv = sLib.bars[bar % 4].find(p => p.step === stepInBar);
      if (sEv) this.playFlute(sEv.note, time, (60.0 / this.tempo) * sEv.dur);
    }
    if (isModeActive('guitar', 'stanza')) {
      const sLib = STANZA_LIBRARY[this.stanzaIndex.guitar];
      const sEv = sLib.bars[bar % 4].find(p => p.step === stepInBar);
      if (sEv) this.playGuitar(sEv.note - 24, time, (60.0 / this.tempo) * Math.max(sEv.dur, 1.0));
    }
    if (isModeActive('saxophone', 'stanza')) {
      const sLib = STANZA_LIBRARY[this.stanzaIndex.saxophone];
      const sEv = sLib.bars[bar % 4].find(p => p.step === stepInBar);
      if (sEv) this.playSaxophone(sEv.note, time, (60.0 / this.tempo) * Math.max(sEv.dur, 1.0));
    }
  }

  scheduler() {
    if (!this.ctx) return;
    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.currentStep, this.nextNoteTime);
      this.nextNote();
    }
    this.timerID = window.setTimeout(() => this.scheduler(), this.lookahead);
  }

  start() {
    if (this.isPlaying) return;
    this.init();
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
    this.isPlaying = true;
    this.currentStep = 0;
    this.nextNoteTime = this.ctx!.currentTime + 0.05;
    this.scheduler();
  }

  stop() {
    this.isPlaying = false;
    if (this.timerID !== null) {
      window.clearTimeout(this.timerID);
      this.timerID = null;
    }
  }
}

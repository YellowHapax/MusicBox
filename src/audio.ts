export const mtof = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

export type ChannelName = 'bass' | 'pluck' | 'pad' | 'drums' | 'cello' | 'flute' | 'guitar' | 'hornpipe';

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

  channels: Record<ChannelName, boolean> = {
    bass: true,
    pluck: true,
    pad: true,
    drums: false,
    cello: false,
    flute: false,
    guitar: false,
    hornpipe: false,
  };

  leads: Record<ChannelName, boolean> = {
    bass: false,
    pluck: false,
    pad: false,
    drums: false,
    cello: false,
    flute: false,
    guitar: false,
    hornpipe: false,
  };

  bachs: Record<ChannelName, boolean> = {
    bass: false,
    pluck: false,
    pad: false,
    drums: false,
    cello: false,
    flute: false,
    guitar: false,
    hornpipe: false,
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
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    const distortion = this.ctx.createWaveShaper();
    
    // Create a heavy distortion curve
    const amount = 50;
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
    
    const freq = mtof(midi);
    osc1.frequency.value = freq;
    osc2.frequency.value = freq * 0.5; // sub octave for thickness

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, time);
    filter.frequency.exponentialRampToValueAtTime(800, time + duration * 0.5);
    filter.Q.value = 2;

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.4, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(distortion);
    distortion.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration);
    osc2.stop(time + duration);
  }

  playHornpipe(midi: number, time: number, duration: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'square';
    osc2.type = 'sawtooth';
    
    const freq = mtof(midi);
    osc1.frequency.value = freq;
    osc2.frequency.value = freq * 1.005; // slight detune for reedy sound

    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    filter.Q.value = 1.5;

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.3, time + 0.05);
    gain.gain.setValueAtTime(0.3, time + duration - 0.1);
    gain.gain.linearRampToValueAtTime(0.01, time + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration);
    osc2.stop(time + duration);
  }

  nextNote() {
    const secondsPerBeat = 60.0 / this.tempo;
    this.nextNoteTime += 0.25 * secondsPerBeat;
    this.currentStep++;
    if (this.currentStep >= 64) {
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

    const roots = [45, 43, 48, 41];
    const chords = [
      [57, 60, 64],
      [55, 59, 62],
      [60, 64, 67],
      [53, 57, 60],
    ];

    const root = roots[bar];
    const chord = chords[bar];

    const bachChords = [
      [57, 60, 64, 67], // Am7
      [55, 59, 62, 65], // G7
      [60, 64, 67, 71], // Cmaj7
      [53, 57, 60, 64], // Fmaj7
    ];
    const bChord = bachChords[bar];

    const getBachRightHand = (step: number) => {
      let noteIdx = 0;
      let octave = 0;
      if (bar === 0) {
        noteIdx = step % 4;
        octave = Math.floor(step / 4) % 2 === 0 ? 0 : 12;
      } else if (bar === 1) {
        noteIdx = 3 - (step % 4);
        octave = Math.floor(step / 4) % 2 === 0 ? 12 : 0;
      } else if (bar === 2) {
        noteIdx = step % 2 === 0 ? 0 : (step % 4);
        octave = step % 2 === 0 ? -12 : 12;
      } else if (bar === 3) {
        const fib = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987];
        noteIdx = fib[step] % 4;
        octave = (fib[step] % 2) === 0 ? 12 : 0;
      }
      return bChord[noteIdx] + octave;
    };

    if (this.channels.bass) {
      if (this.bachs.bass) {
        if (stepInBar % 2 === 0) {
          const lhStep = stepInBar / 2;
          const lhNotes = [bChord[0] - 12, bChord[2] - 12, bChord[1] - 12, bChord[3] - 24];
          this.playBass(lhNotes[lhStep % 4], time);
        }
      } else if (this.leads.bass) {
        const pat = [0, 2, 3, 4, 6, 8, 10, 11, 12, 14];
        if (pat.includes(stepInBar)) {
          const isOctave = stepInBar === 14 || stepInBar === 6;
          this.playBass(root + (isOctave ? 12 : 0), time);
        }
      } else {
        if (stepInBar % 2 === 0) {
          if (stepInBar !== 14) {
            this.playBass(root, time);
          }
        } else if (stepInBar === 13) {
          this.playBass(root + 12, time);
        }
      }
    }

    if (this.channels.pad) {
      if (this.bachs.pad) {
        if (stepInBar % 4 === 0) {
          this.playPad(bChord, time, (60.0 / this.tempo) * 1);
        }
      } else if (this.leads.pad) {
        if (stepInBar % 2 === 0) {
          this.playPad([root, ...chord], time, (60.0 / this.tempo) * 0.4);
        }
      } else {
        if (stepInBar === 0) {
          this.playPad([root, ...chord], time, (60.0 / this.tempo) * 4);
        }
      }
    }

    if (this.channels.pluck) {
      if (this.bachs.pluck) {
        this.playPluck(getBachRightHand(stepInBar), time);
      } else if (this.leads.pluck) {
        const noteIdx = stepInBar % 4;
        const arpNotes = [...chord, chord[1] + 12];
        this.playPluck(arpNotes[noteIdx], time);
      } else {
        const arpPattern = [0, 3, 6, 8, 11, 14];
        if (arpPattern.includes(stepInBar)) {
          const noteIdx = arpPattern.indexOf(stepInBar) % 3;
          this.playPluck(chord[noteIdx], time);
        }
      }
    }

    if (this.channels.drums) {
      if (this.bachs.drums) {
        let noteIdx = 0;
        if (bar === 0) noteIdx = stepInBar % 4;
        else if (bar === 1) noteIdx = 3 - (stepInBar % 4);
        else if (bar === 2) noteIdx = stepInBar % 2 === 0 ? 0 : (stepInBar % 4);
        else {
          const fib = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987];
          noteIdx = fib[stepInBar] % 4;
        }
        if (noteIdx === 0) this.playKick(time);
        else if (noteIdx === 1) this.playSnare(time);
        else if (noteIdx === 2) this.playHihat(time);
        else { this.playKick(time); this.playHihat(time); }
      } else if (this.leads.drums) {
        if (stepInBar % 2 === 0 || stepInBar === 15) this.playKick(time);
        if (stepInBar === 4 || stepInBar === 12 || stepInBar === 14) this.playSnare(time);
        this.playHihat(time);
      } else {
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
    }

    if (this.channels.cello) {
      if (this.bachs.cello) {
        if (stepInBar % 2 === 0) {
          const note = getBachRightHand(stepInBar);
          this.playCello(note - 12, time, (60.0 / this.tempo) * 0.5);
        }
      } else if (this.leads.cello) {
        if (stepInBar === 0) this.playCello(chord[0] - 12, time, (60.0 / this.tempo) * 1);
        if (stepInBar === 4) this.playCello(chord[1] - 12, time, (60.0 / this.tempo) * 1);
        if (stepInBar === 8) this.playCello(chord[2] - 12, time, (60.0 / this.tempo) * 1);
        if (stepInBar === 12) this.playCello(chord[1] - 12, time, (60.0 / this.tempo) * 1);
      } else {
        if (stepInBar === 0) {
          this.playCello(root - 12, time, (60.0 / this.tempo) * 4);
        }
      }
    }

    if (this.channels.flute) {
      if (this.bachs.flute) {
        // Gibbet Hill - Lament & Hornpipe variation (transposed to Am)
        const gibbetMelody = [
          [{ step: 0, note: 76, dur: 1.5 }, { step: 6, note: 81, dur: 0.5 }, { step: 8, note: 83, dur: 1.0 }, { step: 12, note: 84, dur: 0.5 }, { step: 14, note: 83, dur: 0.5 }],
          [{ step: 0, note: 81, dur: 1.5 }, { step: 6, note: 79, dur: 0.5 }, { step: 8, note: 81, dur: 1.0 }, { step: 12, note: 76, dur: 1.0 }],
          [{ step: 0, note: 79, dur: 1.5 }, { step: 6, note: 81, dur: 0.5 }, { step: 8, note: 83, dur: 1.0 }, { step: 12, note: 84, dur: 0.5 }, { step: 14, note: 83, dur: 0.5 }],
          [{ step: 0, note: 81, dur: 1.5 }, { step: 6, note: 79, dur: 0.5 }, { step: 8, note: 76, dur: 2.0 }]
        ];
        const noteEvent = gibbetMelody[bar].find(p => p.step === stepInBar);
        if (noteEvent) {
          this.playFlute(noteEvent.note, time, (60.0 / this.tempo) * noteEvent.dur);
        }
      } else if (this.leads.flute) {
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
      } else {
        const melodyPattern = [
          { step: 0, note: chord[2] + 12, dur: 1.5 },
          { step: 6, note: chord[1] + 12, dur: 0.5 },
          { step: 8, note: chord[2] + 12, dur: 1.0 },
          { step: 12, note: chord[0] + 12, dur: 1.0 },
        ];
        const noteEvent = melodyPattern.find(p => p.step === stepInBar);
        if (noteEvent) {
          this.playFlute(noteEvent.note, time, (60.0 / this.tempo) * noteEvent.dur);
        }
      }
    }

    if (this.channels.guitar) {
      if (this.bachs.guitar) {
        const note = getBachRightHand(stepInBar);
        this.playGuitar(note - 12, time, (60.0 / this.tempo) * 0.25);
      } else if (this.leads.guitar) {
        // Heavy syncopated hits
        if ([0, 3, 6, 10, 14].includes(stepInBar)) {
          this.playGuitar(root - 12, time, (60.0 / this.tempo) * 0.5);
        }
      } else {
        // Chugging power chords (root and fifth)
        if (stepInBar % 2 === 0) {
          this.playGuitar(root - 12, time, (60.0 / this.tempo) * 0.25);
          this.playGuitar(root - 5, time, (60.0 / this.tempo) * 0.25);
        }
      }
    }

    if (this.channels.hornpipe) {
      if (this.bachs.hornpipe) {
        const note = getBachRightHand(stepInBar);
        this.playHornpipe(note, time, (60.0 / this.tempo) * 0.25);
      } else if (this.leads.hornpipe) {
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
          this.playHornpipe(noteEvent.note, time, (60.0 / this.tempo) * noteEvent.dur);
        }
      } else {
        // Drone on the root of the scale (A)
        if (stepInBar === 0) {
          this.playHornpipe(57, time, (60.0 / this.tempo) * 4); // A3 drone
        }
      }
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

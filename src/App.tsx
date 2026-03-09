import React, { useState, useEffect } from 'react';
import { Play, Square, Settings2, Music, Drum, Wind, Waves, Guitar, Layers, Volume2, Zap, Cpu, Flame, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { MusicBoxEngine, ChannelName, STANZA_NAMES } from './audio';

const engine = new MusicBoxEngine();

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tempo, setTempo] = useState(110);
  const [volume, setVolume] = useState(0.5);
  const [channels, setChannels] = useState<Record<ChannelName, boolean>>(engine.channels);
  const [leads, setLeads] = useState<Record<ChannelName, boolean>>(engine.leads);
  const [bachs, setBachs] = useState<Record<ChannelName, boolean>>(engine.bachs);
  const [stanzas, setStanzas] = useState<Record<ChannelName, boolean>>(engine.stanzas);
  const [stanzaIndex, setStanzaIndex] = useState<Record<ChannelName, number>>(engine.stanzaIndex);

  useEffect(() => {
    engine.onStep = (step) => {
      setCurrentStep(step);
    };
    return () => {
      engine.stop();
    };
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      engine.stop();
      setIsPlaying(false);
    } else {
      engine.tempo = tempo;
      engine.setVolume(volume);
      engine.start();
      setIsPlaying(true);
    }
  };

  const handleTempoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTempo = parseInt(e.target.value);
    setTempo(newTempo);
    engine.tempo = newTempo;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    engine.setVolume(newVol);
  };

  const toggleChannel = (name: ChannelName) => {
    engine.toggleChannel(name);
    setChannels({ ...engine.channels });
  };

  const toggleLead = (name: ChannelName) => {
    engine.toggleLead(name);
    setLeads({ ...engine.leads });
  };

  const toggleBach = (name: ChannelName) => {
    engine.toggleBach(name);
    setBachs({ ...engine.bachs });
  };

  const toggleStanza = (name: ChannelName) => {
    engine.toggleStanza(name);
    setStanzas({ ...engine.stanzas });
    setStanzaIndex({ ...engine.stanzaIndex });
  };

  const channelConfig = [
    { name: 'bass', icon: Waves, label: 'Bass' },
    { name: 'pluck', icon: Guitar, label: 'Pluck' },
    { name: 'pad', icon: Layers, label: 'Pad' },
    { name: 'drums', icon: Drum, label: 'Drums' },
    { name: 'cello', icon: Waves, label: 'Cello' },
    { name: 'flute', icon: Wind, label: 'Flute' },
    { name: 'guitar', icon: Flame, label: 'E. Guitar' },
    { name: 'hornpipe', icon: Music, label: 'Hornpipe' },
  ] as const;

  const bar = Math.floor(currentStep / 16);
  const stepInBar = currentStep % 16;
  const chords = ['Am', 'G', 'C', 'F'];
  const currentChord = chords[bar];

  // Calculate positions for 16 dots in a circle
  const radius = 120;
  const dots = Array.from({ length: 16 }).map((_, i) => {
    const angle = (i / 16) * Math.PI * 2 - Math.PI / 2;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  });

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-200 flex flex-col items-center justify-center font-sans selection:bg-indigo-500/30 relative overflow-hidden">
      
      {/* Background Atmosphere */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-900/20 rounded-full blur-[120px] opacity-50 mix-blend-screen" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-emerald-900/10 rounded-full blur-[80px] opacity-50 mix-blend-screen" />
      </div>

      <div className="z-10 flex flex-col items-center w-full max-w-md p-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="font-display text-4xl font-light tracking-tight text-white mb-2 flex items-center justify-center gap-3">
            <Music className="w-6 h-6 text-indigo-400" />
            The Mountain
          </h1>
          <p className="text-slate-500 text-sm tracking-widest uppercase">Hypnotic Groove Box</p>
        </div>

        {/* Visualizer */}
        <div className="relative w-[320px] h-[320px] flex items-center justify-center mb-16">
          {/* Outer Ring */}
          <div className="absolute inset-0 border border-white/5 rounded-full" />
          <div className="absolute inset-4 border border-white/5 rounded-full" />
          
          {/* Center Display */}
          <div className="absolute flex flex-col items-center justify-center">
            <motion.div 
              key={currentChord}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="font-display text-5xl font-bold text-white tracking-tighter"
            >
              {currentChord}
            </motion.div>
            <div className="text-xs text-indigo-400/80 tracking-widest uppercase mt-2 font-medium">
              Bar {bar + 1}/4
            </div>
          </div>

          {/* Sequence Dots */}
          {dots.map((pos, i) => {
            const isActive = isPlaying && stepInBar === i;
            const isPast = isPlaying && stepInBar > i;
            
            return (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  left: `calc(50% + ${pos.x}px)`,
                  top: `calc(50% + ${pos.y}px)`,
                  x: '-50%',
                  y: '-50%',
                  backgroundColor: isActive 
                    ? '#818cf8' // indigo-400
                    : isPast 
                      ? 'rgba(255,255,255,0.2)' 
                      : 'rgba(255,255,255,0.05)',
                  boxShadow: isActive ? '0 0 20px 4px rgba(129, 140, 248, 0.4)' : 'none',
                }}
                animate={{
                  scale: isActive ? 1.5 : 1,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              />
            );
          })}
        </div>

        {/* Controls */}
        <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col gap-6">
          
          {/* Play/Pause */}
          <div className="flex justify-center">
            <button
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white flex items-center justify-center transition-all shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] active:scale-95"
            >
              {isPlaying ? (
                <Square className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-7 h-7 fill-current ml-1" />
              )}
            </button>
          </div>

          {/* Channels */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {channelConfig.map(({ name, icon: Icon, label }) => {
              const isActive = channels[name];
              const isLead = leads[name];
              const isBach = bachs[name];
              const isStanza = stanzas[name];
              const sIdx = stanzaIndex[name];
              return (
                <div
                  key={name}
                  className={`relative flex flex-col items-center justify-center gap-2 p-3 rounded-xl transition-all border ${
                    isActive 
                      ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                      : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'
                  }`}
                >
                  <div className="absolute top-2 right-2 flex gap-0.5 z-10">
                    <button 
                      className="p-1 rounded-full hover:bg-white/10 transition-colors"
                      onClick={(e) => { e.stopPropagation(); toggleLead(name); }}
                      title="Toggle Lead Mode"
                    >
                      <Zap className={`w-3 h-3 ${isLead ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]' : 'text-slate-600'}`} />
                    </button>
                    <button 
                      className="p-1 rounded-full hover:bg-white/10 transition-colors"
                      onClick={(e) => { e.stopPropagation(); toggleBach(name); }}
                      title="Toggle Bach Mode"
                    >
                      <Cpu className={`w-3 h-3 ${isBach ? 'text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]' : 'text-slate-600'}`} />
                    </button>
                    <button 
                      className="p-1 rounded-full hover:bg-white/10 transition-colors"
                      onClick={(e) => { e.stopPropagation(); toggleStanza(name); }}
                      title={isStanza ? STANZA_NAMES[sIdx] : 'Toggle Stanza'}
                    >
                      <Sparkles className={`w-3 h-3 ${
                        !isStanza ? 'text-slate-600' :
                        sIdx === 0 ? 'text-violet-400 drop-shadow-[0_0_5px_rgba(167,139,250,0.8)]' :
                        sIdx === 1 ? 'text-rose-400 drop-shadow-[0_0_5px_rgba(251,113,133,0.8)]' :
                        'text-sky-400 drop-shadow-[0_0_5px_rgba(56,189,248,0.8)]'
                      }`} />
                    </button>
                  </div>
                  <button 
                    className="flex flex-col items-center gap-2 w-full h-full pt-2"
                    onClick={() => toggleChannel(name)}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px] uppercase tracking-wider font-medium">{label}</span>
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-4 mt-2">
            {/* Volume Slider */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs text-slate-400 uppercase tracking-wider font-medium">
                <span className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  Volume
                </span>
                <span className="font-mono text-indigo-300">{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-indigo-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(129,140,248,0.5)]"
              />
            </div>

            {/* Tempo Slider */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs text-slate-400 uppercase tracking-wider font-medium">
                <span className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4" />
                  Tempo
                </span>
                <span className="font-mono text-indigo-300">{tempo} BPM</span>
              </div>
              <input
                type="range"
                min="60"
                max="160"
                value={tempo}
                onChange={handleTempoChange}
                className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-indigo-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(129,140,248,0.5)]"
              />
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
}

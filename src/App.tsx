import React, { useState, useEffect } from 'react';
import { Play, Square, Settings2, Music, Drum, Wind, Waves, Guitar, Layers, Volume2, Zap, Cpu, Flame, Star, BookOpen, X } from 'lucide-react';
import { motion } from 'motion/react';
import { MusicBoxEngine, ChannelName, StanzaName, STANZA_DATA, STANZA_LIBRARY } from './audio';

const engine = new MusicBoxEngine();
// @ts-ignore
if (import.meta.hot) {
  // @ts-ignore
  import.meta.hot.dispose(() => {
    engine.stop();
  });
}

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tempo, setTempo] = useState(110);
  const [volume, setVolume] = useState(0.5);
  const [channels, setChannels] = useState<Record<ChannelName, boolean>>(engine.channels);
  const [leads, setLeads] = useState<Record<ChannelName, boolean>>(engine.leads);
  const [bachs, setBachs] = useState<Record<ChannelName, boolean>>(engine.bachs);
  const [liveStanza, setLiveStanza] = useState<StanzaName>(engine.liveStanza);
  const [view, setView] = useState<'live' | 'grid'>('live');
  const [stanzas, setStanzas] = useState<Record<ChannelName, boolean>>(engine.stanzas);
  const [showStory, setShowStory] = useState(false);
  // Force update for composition grid
  const [, setTick] = useState(0);

  // Auto-sync engine state with React state to survive Vite HMR reloads
  useEffect(() => {
    engine.view = view;
  }, [view]);

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

  const toggleStanzaLive = (name: ChannelName) => {
    engine.toggleStanza(name);
    setStanzas({ ...engine.stanzas });
    setTick(t => t + 1);
  };

  const channelConfig = [
    { name: 'bass', icon: Waves, label: 'Bass' },
    { name: 'pluck', icon: Guitar, label: 'Pluck' },
    { name: 'pad', icon: Layers, label: 'Pad' },
    { name: 'drums', icon: Drum, label: 'Drums' },
    { name: 'cello', icon: Waves, label: 'Cello' },
    { name: 'flute', icon: Wind, label: 'Flute' },
    { name: 'guitar', icon: Flame, label: 'E. Guitar' },
    { name: 'saxophone', icon: Music, label: 'Saxophone' },
  ] as const;

  const bar = Math.floor(currentStep / 16);
  const stepInBar = currentStep % 16;
  const seqStep = bar % 16;
  
  const activeStanza = view === 'grid' ? engine.viewStanzas[seqStep] : liveStanza;
  const chords = STANZA_DATA[activeStanza].names || ['Am', 'G', 'C', 'F'];
  const currentChord = chords[bar % 4];

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
    <div className="min-h-screen bg-[#0a0a0c] text-slate-200 flex items-center justify-center font-sans selection:bg-indigo-500/30 relative overflow-y-auto">

      {/* Screen-reader / LLM status region — always describes current musical state as plain text */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {isPlaying
          ? `Now playing — Chord: ${currentChord}, Bar ${seqStep + 1} of ${view === 'grid' ? 16 : 4}, Step ${stepInBar + 1}/16, ${tempo} BPM, ${activeStanza} stanza, ${view} mode. Active channels: ${Object.entries(channels).filter(([, v]) => v).map(([k]) => k).join(', ') || 'none'}.`
          : `Sequencer stopped — ${tempo} BPM, ${activeStanza} stanza, ${view} mode. Active channels: ${Object.entries(channels).filter(([, v]) => v).map(([k]) => k).join(', ') || 'none'}.`}
      </div>

      {/* Background Atmosphere */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-900/20 rounded-full blur-[120px] opacity-50 mix-blend-screen" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-emerald-900/10 rounded-full blur-[80px] opacity-50 mix-blend-screen" />
      </div>

      {/* Story Modal */}
      {showStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0f1115] border border-white/10 rounded-2xl max-w-2xl w-full p-8 shadow-2xl relative overflow-hidden"
          >
            <button 
              onClick={() => setShowStory(false)}
              aria-label="Close story"
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="space-y-4 text-slate-300 font-serif leading-relaxed h-[60vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <p>Long ago noble Uncus, son of noble chief Chingachgook, spoke and said in this wise:</p>
              <p>"My father, the land is vast, but I seek to know more than beyond our forests and prairies. I seek a challenge, that I might know more."</p>
              <p>And the chief reasoned, and spoke: "Go to the mountain peak in the distance. There you will find the challenge you seek."</p>
              <p>And noble Uncus heeded his father's quest, and set off prepared. He faced challenges. He hunted, he fought weather, he fought storm, and isolation, and challenges that none would aid in overcoming.</p>
              <p>And finally he stood upon the mountain, but to his shock he found the peak... snowy. Empty. Endless mountains spiraled out before him, each one as perilous.</p>
              <p>He worried that he had done something wrong. His father does not speak false. Lying just isn't in their culture, if he knew what a culture was.</p>
              <p>So Uncus... dragged his feet on his return. He felt confused.</p>
              <p>"Oh my father, I have traveled long and far seeking knowledge and found... nothing...?"</p>
              <p>This concerned the good chief, who then asked, "Well what did you see atop the mountain?"</p>
              <p>"Nothing. Everything. I saw home. I saw the forests and the prairies, but away I just saw more mountains," his son replied.</p>
              <p>And the chief nodded, and hugged his son.</p>
              <div className="pt-6 mt-6 border-t border-white/10 text-center font-sans tracking-widest text-indigo-300/80 text-sm">
                IN HONOR OF STEVEN "BUFFALO WIND" CASE
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <div className="z-10 flex flex-col xl:flex-row xl:justify-center xl:items-center items-center gap-12 w-full max-w-[1600px] mx-auto p-6 xl:p-10">

        {/* â”€â”€â”€ LEFT COLUMN: Visualizer + Transport â”€â”€â”€ */}
        <div className="flex flex-col items-center gap-6 w-full xl:w-[360px] shrink-0">

          {/* Header */}
          <div className="text-center group relative cursor-pointer" role="button" tabIndex={0} aria-label="Open story: The Mountain" onClick={() => setShowStory(true)} onKeyDown={(e) => e.key === 'Enter' && setShowStory(true)}>
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 rounded-2xl transition-colors -m-2" />
            <h1 className="font-display text-3xl font-light tracking-tight text-white flex items-center justify-center gap-3">
              <Music className="w-5 h-5 text-indigo-400" />
              The Mountain
              <BookOpen className="w-4 h-4 text-indigo-400/50 group-hover:text-indigo-400 transition-colors" />
            </h1>
            <p className="text-slate-500 text-xs tracking-widest uppercase mt-1">Hypnotic Groove Box</p>
          </div>

          {/* Visualizer */}
          <div
            className="relative w-[320px] h-[320px] flex items-center justify-center"
            role="img"
            aria-label={isPlaying ? `Sequencer orbit — ${currentChord}, step ${stepInBar + 1} of 16, bar ${seqStep + 1}` : 'Sequencer orbit — stopped'}
          >
            <div className="absolute inset-0 border border-white/5 rounded-full" />
            <div className="absolute inset-4 border border-white/5 rounded-full" />

            {/* Center chord label — closed before the dots so dots are siblings */}
            <div className="absolute flex flex-col items-center justify-center pointer-events-none">
              <motion.div
                key={currentChord}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="font-display text-5xl font-bold text-white tracking-tighter"
              >
                {currentChord}
              </motion.div>
              <div className="text-xs text-indigo-400/80 tracking-widest uppercase mt-2 font-medium">
                Bar {seqStep + 1}/{view === 'grid' ? 16 : 4}
              </div>
            </div>

            {/* Orbit dots — siblings of center label, positioned relative to the 320px ring container */}
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
                      ? '#818cf8'
                      : isPast
                        ? 'rgba(255,255,255,0.2)'
                        : 'rgba(255,255,255,0.05)',
                    boxShadow: isActive ? '0 0 20px 4px rgba(129, 140, 248, 0.4)' : 'none',
                  }}
                  animate={{ scale: isActive ? 1.5 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                />
              );
            })}
          </div>

          {/* Transport: Save / Play / Load */}
          <div className="flex items-center justify-center gap-4">
            <button
              aria-label="Save composition to browser storage"
              onClick={() => {
                localStorage.setItem('groovebox_composition', JSON.stringify(engine.compositionGrid));
                alert('Saved!');
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-lg text-xs uppercase tracking-widest font-medium transition-colors"
            >
              Save
            </button>
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? 'Stop sequencer' : 'Start sequencer'}
              aria-pressed={isPlaying}
              className="w-16 h-16 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white flex items-center justify-center transition-all shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] active:scale-95"
            >
              {isPlaying ? <Square className="w-6 h-6 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
            </button>
            <button
              aria-label="Load saved composition from browser storage"
              onClick={() => {
                const saved = localStorage.getItem('groovebox_composition');
                if (saved) {
                  try { engine.compositionGrid = JSON.parse(saved); setTick(t => t + 1); alert('Loaded!'); }
                  catch { alert('Failed to parse saved state'); }
                } else { alert('No saved state found'); }
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-lg text-xs uppercase tracking-widest font-medium transition-colors"
            >
              Load
            </button>
          </div>

          {/* Sliders */}
          <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs text-slate-400 uppercase tracking-wider font-medium">
                <span className="flex items-center gap-2"><Volume2 className="w-4 h-4" />Volume</span>
                <span className="font-mono text-indigo-300">{Math.round(volume * 100)}%</span>
              </div>
              <input type="range" min="0" max="1" step="0.01" value={volume} onChange={handleVolumeChange}
                aria-label="Volume"
                aria-valuetext={`${Math.round(volume * 100)} percent`}
                className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-indigo-400 [&::-webkit-slider-thumb]:rounded-full" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs text-slate-400 uppercase tracking-wider font-medium">
                <span className="flex items-center gap-2"><Settings2 className="w-4 h-4" />Tempo</span>
                <span className="font-mono text-indigo-300">{tempo} BPM</span>
              </div>
              <input type="range" min="60" max="160" value={tempo} onChange={handleTempoChange}
                aria-label="Tempo"
                aria-valuetext={`${tempo} beats per minute`}
                className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-indigo-400 [&::-webkit-slider-thumb]:rounded-full" />
            </div>
          </div>

        </div>

        {/* â”€â”€â”€ RIGHT COLUMN: Sequencer â”€â”€â”€ */}
        <div className="flex flex-col gap-4 w-full min-w-0">

          {/* Mode Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const m = view === 'live' ? 'grid' : 'live';
                engine.view = m;
                setView(m);
                // Stop and restart to flush any already-buffered notes from the previous mode
                if (isPlaying) {
                  engine.stop();
                  engine.start();
                }
              }}
              aria-label={view === 'grid' ? 'Switch to Live Mode — orbital visualizer' : 'Switch to Composition Mode — 16-bar grid'}
              aria-pressed={view === 'grid'}
              className="px-6 py-2 rounded-full text-xs font-medium border border-white/10 bg-white/5 hover:bg-white/10 transition-colors uppercase tracking-widest"
            >
              {view === 'grid' ? 'Live Mode' : 'Composition Mode'}
            </button>
          </div>

          {/* Stanza Selector (live mode) */}
          {view === 'live' && (
            <div className="flex gap-2">
              {(['subdominant', 'tonic', 'dominant'] as StanzaName[]).map((stanza) => (
                <button key={stanza}
                  onClick={() => { engine.liveStanza = stanza; setLiveStanza(stanza); }}
                  aria-label={`${stanza} — ${stanza === 'subdominant' ? 'Am G C F' : stanza === 'tonic' ? 'Am F Am Em' : 'C G Am F'}`}
                  aria-pressed={liveStanza === stanza}
                  className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                    liveStanza === stanza ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >{stanza}</button>
              ))}
            </div>
          )}

          {/* Composition Grid */}
          {view === 'grid' ? (
            <div className="overflow-x-auto pb-2">
              <div style={{ minWidth: '900px' }} className="flex flex-col gap-1">

                {/* Bar header */}
                <div className="flex gap-1 mb-1" style={{ paddingLeft: '192px' }}>
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className={`w-8 flex-shrink-0 text-center text-[9px] font-mono ${seqStep === i && isPlaying ? 'text-white' : 'text-slate-600'}`}>
                      {i + 1}
                    </div>
                  ))}
                </div>

                {/* Stanza Row */}
                <div className="flex gap-1 mb-2" style={{ paddingLeft: '192px' }}>
                  {Array.from({ length: 16 }).map((_, i) => (
                    <select key={i} value={engine.viewStanzas[i]}
                      onChange={(e) => { engine.viewStanzas[i] = e.target.value as StanzaName; setTick(t => t + 1); }}
                      aria-label={`Bar ${i + 1} harmony (D=subdominant Am·G·C·F, S=tonic Am·F·Am·Em, H=dominant C·G·Am·F)`}
                      className="w-8 flex-shrink-0 h-6 text-[9px] bg-white/5 border border-white/10 rounded text-slate-300 appearance-none text-center cursor-pointer hover:bg-white/10 font-bold"
                    >
                      <option value="subdominant">D</option>
                      <option value="tonic">S</option>
                      <option value="dominant">H</option>
                    </select>
                  ))}
                </div>

                {/* Channel rows */}
                {channelConfig.map(({ name, label }) => (
                  <div key={name} className="flex gap-1 items-center">
                    {/* Label + melody picker */}
                    <div className="flex items-center justify-end gap-2 flex-shrink-0" style={{ width: '188px', paddingRight: '4px' }}>
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{label}</span>
                      <select
                        value={engine.stanzaIndex[name]}
                        onChange={(e) => { engine.stanzaIndex[name] = parseInt(e.target.value); setTick(t => t + 1); }}
                        className="bg-white/5 border border-white/10 rounded px-1 py-0.5 text-[9px] text-slate-300 max-w-[72px] truncate cursor-pointer hover:bg-white/10"
                        title="Melody"
                        aria-label={`${label} stanza melody`}
                      >
                        {STANZA_LIBRARY.map((s, idx) => <option key={idx} value={idx}>{s.name}</option>)}
                      </select>
                    </div>
                    {/* Step cells */}
                    {Array.from({ length: 16 }).map((_, i) => {
                      const modes = engine.compositionGrid[name][i];
                      const isCurrent = seqStep === i && isPlaying;
                      return (
                        <div key={i} className={`w-8 flex-shrink-0 rounded flex flex-col gap-[1px] overflow-hidden transition-all ${isCurrent ? 'ring-2 ring-white/60' : ''}`}>
                          <button onClick={() => { engine.compositionGrid[name][i].base = !modes.base; setTick(t => t + 1); }}
                            aria-label={`${label} bar ${i + 1} base — ${modes.base ? 'on' : 'off'}`}
                            aria-pressed={modes.base}
                            className={`h-2 transition-all ${modes.base ? 'bg-indigo-500' : 'bg-white/5 hover:bg-white/15'}`} title="Base" />
                          <button onClick={() => { engine.compositionGrid[name][i].lead = !modes.lead; setTick(t => t + 1); }}
                            aria-label={`${label} bar ${i + 1} lead — ${modes.lead ? 'on' : 'off'}`}
                            aria-pressed={modes.lead}
                            className={`h-2 transition-all ${modes.lead ? 'bg-amber-500' : 'bg-white/5 hover:bg-white/15'}`} title="Lead" />
                          <button onClick={() => { engine.compositionGrid[name][i].bach = !modes.bach; setTick(t => t + 1); }}
                            aria-label={`${label} bar ${i + 1} Bach — ${modes.bach ? 'on' : 'off'}`}
                            aria-pressed={modes.bach}
                            className={`h-2 transition-all ${modes.bach ? 'bg-emerald-500' : 'bg-white/5 hover:bg-white/15'}`} title="Bach" />
                          <button onClick={() => { engine.compositionGrid[name][i].stanza = !modes.stanza; setTick(t => t + 1); }}
                            aria-label={`${label} bar ${i + 1} stanza (${STANZA_LIBRARY[engine.stanzaIndex[name]]?.name ?? 'none'}) — ${modes.stanza ? 'on' : 'off'}`}
                            aria-pressed={modes.stanza}
                            className={`h-2 transition-all ${modes.stanza ? 'bg-rose-500' : 'bg-white/5 hover:bg-white/15'}`} title={`Stanza: ${STANZA_LIBRARY[engine.stanzaIndex[name]]?.name}`} />
                        </div>
                      );
                    })}
                  </div>
                ))}

                {/* Legend */}
                <div className="flex gap-4 pt-3 pl-1">
                  {[['bg-indigo-500','Base'],['bg-amber-500','Lead'],['bg-emerald-500','Bach'],['bg-rose-500','Stanza']].map(([color, label]) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div className={`w-3 h-2 rounded-sm ${color}`} />
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider">{label}</span>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {channelConfig.map(({ name, icon: Icon, label }) => {
                const isActive = channels[name];
                const isLead = leads[name];
                const isBach = bachs[name];
                const isStanza = stanzas[name];
                const stanzaMelody = STANZA_LIBRARY[engine.stanzaIndex[name]]?.name;
                return (
                  <div key={name} className={`relative flex flex-col items-center justify-center gap-1 p-3 rounded-xl transition-all border ${
                    isActive ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'
                  }`}>
                    {/* Mode buttons: Lead / Bach / Stanza */}
                    <div className="absolute top-2 right-1 flex gap-0.5 z-10">
                      <button className="p-1 rounded-full hover:bg-white/10 transition-colors"
                        onClick={(e) => { e.stopPropagation(); toggleLead(name); }}
                        title="Lead"
                        aria-label={`${label} lead melody — ${isLead ? 'on' : 'off'}`}
                        aria-pressed={isLead}>
                        <Zap className={`w-3 h-3 ${isLead ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                      </button>
                      <button className="p-1 rounded-full hover:bg-white/10 transition-colors"
                        onClick={(e) => { e.stopPropagation(); toggleBach(name); }}
                        title="Bach"
                        aria-label={`${label} Bach harmony — ${isBach ? 'on' : 'off'}`}
                        aria-pressed={isBach}>
                        <Cpu className={`w-3 h-3 ${isBach ? 'text-emerald-400' : 'text-slate-600'}`} />
                      </button>
                      <button className="p-1 rounded-full hover:bg-white/10 transition-colors"
                        onClick={(e) => { e.stopPropagation(); toggleStanzaLive(name); }}
                        title={isStanza ? `Stanza: ${stanzaMelody} (click to cycle)` : 'Enable Stanza melody'}
                        aria-label={isStanza ? `${label} stanza melody: ${stanzaMelody} — on, click to cycle` : `${label} stanza melody — off`}
                        aria-pressed={isStanza}>
                        <Star className={`w-3 h-3 ${isStanza ? 'text-rose-400 fill-rose-400' : 'text-slate-600'}`} />
                      </button>
                    </div>
                    <button className="flex flex-col items-center gap-1.5 w-full h-full pt-3" onClick={() => toggleChannel(name)}
                      aria-label={`${label} channel — ${isActive ? 'active' : 'muted'}`}
                      aria-pressed={isActive}>
                      <Icon className="w-5 h-5" />
                      <span className="text-[10px] uppercase tracking-wider font-medium">{label}</span>
                    </button>
                    {/* Stanza melody indicator */}
                    {isStanza && (
                      <div className="text-[8px] text-rose-400 font-medium truncate max-w-full px-1 pb-0.5" title={stanzaMelody}>
                        ♪ {stanzaMelody}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

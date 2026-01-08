
import React, { useState, useEffect, useRef } from 'react';
import { 
  GameState, 
  Player, 
  CANADIAN_AVATARS, 
  GrammarTopic, 
  REGIONS,
  AvatarOption
} from './types';
import { generateGrammarQuestion, generateRegionVisual } from './services/geminiService';
import Board from './components/Board';
import QuestionCard from './components/QuestionCard';

const TOTAL_STEPS = 30;

// Audio Utilities
const playSound = (freq: number, type: OscillatorType = 'sine', duration: number = 0.1) => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.warn("Audio context not supported or blocked");
  }
};

const playHikingSound = () => {
  // A sequence of low thuds for steps
  [0, 150, 300, 450].forEach(delay => {
    setTimeout(() => playSound(100 + Math.random() * 50, 'triangle', 0.2), delay);
  });
};

const playSuccessSound = () => {
  [440, 554, 659].forEach((f, i) => {
    setTimeout(() => playSound(f, 'sine', 0.3), i * 100);
  });
};

const playFailSound = () => {
  [200, 150, 100].forEach((f, i) => {
    setTimeout(() => playSound(f, 'sawtooth', 0.4), i * 150);
  });
};

const App: React.FC = () => {
  const [state, setState] = useState<GameState>({
    players: [],
    currentPlayerIndex: 0,
    score: 0,
    currentQuestion: null,
    phase: 'SETUP',
    diceValue: 0,
    totalMapleLeaves: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [teamName, setTeamName] = useState('Maple Explorers');
  const [tempPlayers, setTempPlayers] = useState<{name: string, avatarId: string}[]>([
    { name: '', avatarId: 'beaver' }
  ]);

  // Initialize Region Image
  useEffect(() => {
    if (state.phase === 'PLAYING' && !state.currentRegionImage) {
      updateRegionVisual(REGIONS[0].name);
    }
  }, [state.phase]);

  const updateRegionVisual = async (regionName: string) => {
    const url = await generateRegionVisual(regionName);
    setState(prev => ({ ...prev, currentRegionImage: url }));
  };

  const addPlayerSlot = () => {
    if (tempPlayers.length < 4) {
      const nextAvatar = CANADIAN_AVATARS[tempPlayers.length % CANADIAN_AVATARS.length].id;
      setTempPlayers([...tempPlayers, { name: '', avatarId: nextAvatar }]);
      playSound(300, 'sine', 0.1);
    }
  };

  const removePlayerSlot = (index: number) => {
    if (tempPlayers.length > 1) {
      setTempPlayers(tempPlayers.filter((_, i) => i !== index));
      playSound(200, 'sine', 0.1);
    }
  };

  const startGame = () => {
    const validPlayers = tempPlayers
      .filter(p => p.name.trim() !== '')
      .map((p, idx) => {
        const avatar = CANADIAN_AVATARS.find(a => a.id === p.avatarId);
        return {
          id: `p-${idx}`,
          name: p.name,
          avatar: avatar?.icon || '🍁',
          avatarId: p.avatarId,
          position: 0
        };
      });
    
    if (validPlayers.length === 0) return;

    playSuccessSound();
    setState(prev => ({
      ...prev,
      players: validPlayers,
      phase: 'PLAYING'
    }));
  };

  const rollDice = () => {
    playSound(600, 'square', 0.05);
    const roll = Math.floor(Math.random() * 4) + 1;
    setState(prev => ({ ...prev, diceValue: roll }));
    
    setTimeout(() => {
      handleMove(roll);
    }, 1000);
  };

  const handleMove = async (steps: number) => {
    setIsLoading(true);
    playHikingSound();
    
    const currentPlayer = state.players[state.currentPlayerIndex];
    let newPosition = Math.min(currentPlayer.position + steps, TOTAL_STEPS);
    
    const regionBefore = REGIONS.find(r => currentPlayer.position >= r.start && currentPlayer.position <= r.end);
    const regionAfter = REGIONS.find(r => newPosition >= r.start && newPosition <= r.end);

    if (regionAfter && regionBefore?.name !== regionAfter.name) {
      await updateRegionVisual(regionAfter.name);
    }

    const updatedPlayers = state.players.map((p, idx) => 
      idx === state.currentPlayerIndex ? { ...p, position: newPosition } : p
    );

    const topics = Object.values(GrammarTopic);
    const topic = topics[Math.floor(Math.random() * topics.length)];
    
    try {
      const question = await generateGrammarQuestion(topic);
      setState(prev => ({
        ...prev,
        players: updatedPlayers,
        currentQuestion: question,
        phase: 'QUESTION'
      }));
    } catch (error) {
      console.error("Failed to load question", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (correct: boolean) => {
    if (correct) playSuccessSound();
    else playFailSound();

    setState(prev => {
      const isLastPlayer = prev.currentPlayerIndex === prev.players.length - 1;
      const allFinished = prev.players.every(p => p.position >= TOTAL_STEPS);
      
      return {
        ...prev,
        totalMapleLeaves: correct ? prev.totalMapleLeaves + 1 : prev.totalMapleLeaves,
        phase: allFinished ? 'FINISHED' : 'PLAYING',
        currentQuestion: null,
        currentPlayerIndex: isLastPlayer ? 0 : prev.currentPlayerIndex + 1
      };
    });
  };

  if (state.phase === 'SETUP') {
    return (
      <div className="min-h-screen canadian-red flex items-center justify-center p-6 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 text-9xl opacity-5 select-none -translate-x-10 -translate-y-10">🍁</div>
        <div className="absolute bottom-0 right-0 text-9xl opacity-5 select-none translate-x-10 translate-y-10">🌲</div>

        <div className="max-w-4xl w-full bg-white rounded-[3rem] shadow-2xl p-10 relative z-10 overflow-y-auto max-h-[95vh]">
          <div className="text-center mb-10">
            <h1 className="text-5xl font-extrabold canadian-text mb-2 tracking-tight">The Great Canadian</h1>
            <h2 className="text-3xl font-bold text-slate-700">Grammar Expedition</h2>
            <div className="flex justify-center items-center gap-2 mt-4">
               <span className="h-1 w-12 bg-red-600 rounded-full"></span>
               <p className="text-slate-500 italic font-medium">Prepare for your cross-country journey!</p>
               <span className="h-1 w-12 bg-red-600 rounded-full"></span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Team Settings */}
            <div className="lg:col-span-5 space-y-8">
              <section>
                <label className="block text-xs font-black text-slate-400 uppercase mb-3 tracking-widest">Expedition Name</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🏔️</span>
                  <input 
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold text-slate-800"
                    placeholder="Enter team name..."
                  />
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Explorers Team</label>
                  <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-full">
                    {tempPlayers.length}/4 Joined
                  </span>
                </div>
                
                <div className="space-y-3">
                  {tempPlayers.map((p, idx) => (
                    <div key={idx} className="group flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border-2 border-transparent hover:border-red-100 transition-all">
                      <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-2xl">
                        {CANADIAN_AVATARS.find(a => a.id === p.avatarId)?.icon}
                      </div>
                      <input 
                        placeholder={`Explorer ${idx + 1} Name`}
                        value={p.name}
                        autoFocus={idx === tempPlayers.length - 1 && idx > 0}
                        onChange={(e) => {
                          const newP = [...tempPlayers];
                          newP[idx].name = e.target.value;
                          setTempPlayers(newP);
                        }}
                        className="flex-1 bg-transparent border-none outline-none font-bold text-slate-700 placeholder:text-slate-300"
                      />
                      {tempPlayers.length > 1 && (
                        <button 
                          onClick={() => removePlayerSlot(idx)}
                          className="w-8 h-8 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {tempPlayers.length < 4 && (
                    <button 
                      onClick={addPlayerSlot}
                      className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:border-red-300 hover:text-red-400 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                    >
                      <span className="text-xl">+</span> Add Explorer
                    </button>
                  )}
                </div>
              </section>
            </div>

            {/* Avatar Selection */}
            <div className="lg:col-span-7 bg-slate-50 rounded-[2rem] p-8 border-2 border-slate-100">
               <label className="block text-xs font-black text-slate-400 uppercase mb-6 tracking-widest">Choose Your Characters</label>
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                 {CANADIAN_AVATARS.map((avatar) => {
                   const isSelectedBySomeone = tempPlayers.some(p => p.avatarId === avatar.id);
                   const isSelectedByCurrent = false; // We use simplified assignment logic
                   
                   return (
                     <button
                       key={avatar.id}
                       onClick={() => {
                         // Simple logic: Change the avatar of the last player or the one without a unique avatar
                         const newP = [...tempPlayers];
                         newP[newP.length - 1].avatarId = avatar.id;
                         setTempPlayers(newP);
                         playSound(400 + Math.random() * 100, 'sine', 0.1);
                       }}
                       className={`relative p-4 rounded-3xl transition-all border-4 flex flex-col items-center gap-2
                         ${avatar.color} ${isSelectedBySomeone ? 'border-red-400 ring-4 ring-red-100 shadow-lg' : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'}
                       `}
                     >
                        <span className="text-5xl mb-1">{avatar.icon}</span>
                        <span className="text-[10px] font-black uppercase text-slate-600 text-center leading-tight">{avatar.name}</span>
                        {isSelectedBySomeone && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] shadow-md">
                            ✓
                          </div>
                        )}
                     </button>
                   );
                 })}
               </div>
               <p className="mt-6 text-center text-xs text-slate-400 font-medium">
                 Tap an animal to assign it to your team's latest explorer.
               </p>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center gap-4">
            <button 
              onClick={startGame}
              disabled={tempPlayers.some(p => p.name.trim() === '')}
              className="w-full sm:w-auto px-16 py-6 canadian-red text-white rounded-[2rem] font-black text-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 group"
            >
              HIKE INTO THE WILD! <span className="inline-block group-hover:translate-x-2 transition-transform">🥾</span>
            </button>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Approx. 30 Minute Session</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex flex-col">
      {/* Background visual */}
      <div 
        className="absolute inset-0 opacity-15 bg-cover bg-center pointer-events-none transition-all duration-1000 blur-sm"
        style={{ backgroundImage: `url(${state.currentRegionImage})` }}
      />

      {/* Header bar */}
      <header className="relative z-10 bg-white/80 backdrop-blur-md shadow-sm px-8 py-5 flex justify-between items-center border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg text-2xl">🍁</div>
          <div>
            <h1 className="font-black text-2xl text-slate-800 tracking-tight">{teamName}</h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Expedition Active</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-10">
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Maple Collection</p>
            <div className="flex items-center justify-end gap-2">
              <span className="text-3xl font-black text-red-600">{state.totalMapleLeaves}</span>
              <span className="text-xl">🍁</span>
            </div>
          </div>
          <div className="flex -space-x-4">
            {state.players.map((p, idx) => (
              <div 
                key={p.id} 
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border-4 transition-all relative
                  ${idx === state.currentPlayerIndex ? 'border-red-500 bg-red-50 z-20 scale-110 shadow-xl' : 'border-white bg-white z-10 opacity-60'}
                `}
                title={p.name}
              >
                {p.avatar}
                {idx === state.currentPlayerIndex && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-ping"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 gap-8 overflow-y-auto">
        {state.phase === 'PLAYING' && (
          <div className="w-full max-w-7xl flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-10 duration-700">
            {/* Split layout: Region Visual & Info */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              <div className="lg:col-span-8 relative group overflow-hidden rounded-[2.5rem] shadow-2xl border-8 border-white bg-white aspect-video lg:aspect-auto h-[300px] lg:h-auto">
                {isLoading && (
                  <div className="absolute inset-0 z-10 bg-black/20 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-4">
                      <div className="w-6 h-6 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-black text-slate-800 uppercase tracking-widest text-sm">Mapping Territory...</span>
                    </div>
                  </div>
                )}
                <img 
                  src={state.currentRegionImage} 
                  className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-[2000ms]"
                  alt="Canadian Region"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
                <div className="absolute bottom-8 left-8 text-white">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-2">Current Expedition Site</p>
                  <h3 className="text-4xl font-black italic tracking-tighter drop-shadow-lg">
                    {REGIONS.find(r => state.players[state.currentPlayerIndex].position >= r.start && state.players[state.currentPlayerIndex].position <= r.end)?.name}
                  </h3>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col gap-4">
                <div className="bg-white rounded-[2rem] p-8 shadow-xl border-b-8 border-slate-100 flex-1 flex flex-col justify-center items-center text-center">
                  <div className="mb-6">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">On the Trail</p>
                    <div className="w-24 h-24 bg-red-50 rounded-[2rem] border-4 border-red-100 flex items-center justify-center text-6xl shadow-inner mb-4 mx-auto">
                      {state.players[state.currentPlayerIndex].avatar}
                    </div>
                    <h4 className="text-2xl font-black text-slate-800">{state.players[state.currentPlayerIndex].name}</h4>
                  </div>
                  
                  <div className="w-full space-y-4">
                    <button 
                      onClick={rollDice}
                      disabled={isLoading}
                      className="group w-full py-6 bg-slate-900 text-white rounded-[1.5rem] font-black text-xl shadow-xl hover:bg-black hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50 disabled:translate-y-0"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-3">
                          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          WALKING...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-3">
                          ROLL DICE 🎲
                        </span>
                      )}
                    </button>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Roll to advance 1-4 steps
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/40 backdrop-blur rounded-[3rem] p-4 shadow-inner">
               <Board players={state.players} totalSteps={TOTAL_STEPS} />
            </div>
          </div>
        )}

        {state.phase === 'QUESTION' && state.currentQuestion && (
          <div className="w-full max-w-4xl flex flex-col gap-6 animate-in zoom-in-95 duration-500">
             <div className="flex justify-center -mb-12 relative z-20">
                <div className="w-24 h-24 bg-white rounded-[2rem] shadow-2xl flex items-center justify-center text-5xl border-8 border-red-50 animate-bounce">
                  {state.players[state.currentPlayerIndex].avatar}
                </div>
             </div>
             <QuestionCard 
               question={state.currentQuestion} 
               onAnswer={handleAnswer}
               playerName={state.players[state.currentPlayerIndex].name}
             />
          </div>
        )}

        {state.phase === 'FINISHED' && (
          <div className="glass-card p-16 rounded-[4rem] text-center max-w-3xl border-8 border-white shadow-2xl animate-in zoom-in duration-700 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-white to-red-500"></div>
            <span className="text-9xl mb-8 block drop-shadow-2xl">🏆</span>
            <h1 className="text-6xl font-black text-slate-800 mb-6 tracking-tighter">Mission Accomplished!</h1>
            <p className="text-xl text-slate-500 mb-12 font-medium leading-relaxed">
              Incredible teamwork! You've navigated the diverse landscapes of Canada, mastered English grammar, and reached the <span className="font-black text-red-600">Golden Lighthouse</span>.
            </p>
            
            <div className="grid grid-cols-3 gap-8 mb-12">
              <div className="bg-blue-50 p-6 rounded-[2rem] border-b-4 border-blue-200">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Distance</p>
                <p className="text-3xl font-black text-blue-800">Coast-to-Coast</p>
              </div>
              <div className="bg-red-50 p-6 rounded-[2rem] border-b-4 border-red-200">
                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2">Leaves Collected</p>
                <p className="text-4xl font-black text-red-800">🍁 {state.totalMapleLeaves}</p>
              </div>
              <div className="bg-green-50 p-6 rounded-[2rem] border-b-4 border-green-200">
                <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-2">Status</p>
                <p className="text-3xl font-black text-green-800">Experts</p>
              </div>
            </div>

            <button 
              onClick={() => window.location.reload()}
              className="px-12 py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xl shadow-2xl hover:bg-black hover:scale-105 transition-all flex items-center gap-4 mx-auto"
            >
              NEW EXPEDITION 🪵
            </button>
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="relative z-10 px-8 py-4 flex justify-between items-center text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-t border-slate-100 bg-white/50">
        <span>The Great Canadian Grammar Expedition</span>
        <div className="flex gap-4">
          <span>{new Date().getFullYear()} Journey</span>
          <span className="text-red-300">|</span>
          <span>A2 Level ESL Learning</span>
        </div>
      </footer>
    </div>
  );
};

export default App;

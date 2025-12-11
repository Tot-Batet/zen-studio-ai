import React, { useState, useRef, useEffect } from 'react';
import { Smartphone, Volume2, Volume1, VolumeX, MousePointer2, Terminal, Battery, Wifi, Lock, Activity, Loader2 } from 'lucide-react';
import { MOCK_LOGS } from '../constants';
import { LogEntry } from '../types';
import { useStoryStore } from '../store';

const LogLine: React.FC<{ log: LogEntry }> = ({ log }) => {
  const colors = {
    info: 'text-slate-600 dark:text-slate-400',
    warn: 'text-amber-600 dark:text-amber-400',
    secure: 'text-emerald-600 dark:text-emerald-400',
  };

  return (
    <div className="font-mono text-[10px] leading-relaxed flex gap-3 hover:bg-slate-100 dark:hover:bg-white/5 px-2 rounded cursor-default animate-in fade-in slide-in-from-left-2 duration-300">
      <span className="text-slate-400 dark:text-slate-600 flex-shrink-0">{log.timestamp}</span>
      <span className={`${colors[log.level]} flex-1 break-all`}>
        {log.level === 'secure' && <span className="mr-1">🔒</span>}
        {log.message}
      </span>
    </div>
  );
};

const RightPanel: React.FC = () => {
  const { story, activeSegmentId, setActiveSegment, generateAudioForSegment } = useStoryStore();
  const [logs, setLogs] = useState<LogEntry[]>(MOCK_LOGS);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isTapAnimating, setIsTapAnimating] = useState(false);
  
  const logContainerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Derive current segment
  const activeSegment = activeSegmentId ? story.segments[activeSegmentId] : null;
  const currentIndex = activeSegmentId ? story.ui_segment_order.indexOf(activeSegmentId) : -1;
  const totalSegments = story.ui_segment_order.length;

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Audio Playback Logic
  useEffect(() => {
      // Function to trigger playback
      const playAudio = async () => {
          if (!activeSegment || isMuted || !activeSegment.text_content) {
            setIsSpeaking(false);
            return;
          }

          // 1. If we have a generated Gemini Audio URL, use it
          if (activeSegment.assets.audio && activeSegment.assets.audio.startsWith('blob:')) {
              if (audioRef.current) {
                  audioRef.current.src = activeSegment.assets.audio;
                  audioRef.current.play()
                    .then(() => setIsSpeaking(true))
                    .catch(e => console.error("Audio Playback error:", e));
              }
              return;
          }

          // 2. If no audio, try to generate it
          setIsGeneratingAudio(true);
          addLog('info', `[AI] Generating Neural Voice for {${activeSegment.id.substring(0,4)}}...`);
          
          const success = await generateAudioForSegment(activeSegment.id);
          setIsGeneratingAudio(false);

          if (success) {
               // Re-fetch segment to get new URL (implicit via store subscription/re-render)
               // The component re-renders, and the effect runs again, hitting case #1
          } else {
               // 3. Fallback to Web Speech API if generation fails
               addLog('warn', `[AI] Generation failed. Falling back to local synthesis.`);
               fallbackToWebSpeech(activeSegment.text_content);
          }
      };

      // Reset
      if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
      }
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      
      // Add Logs for context switch
      if (activeSegmentId) {
           const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
           setLogs(prev => [...prev, { 
               id: Date.now().toString(), 
               timestamp: time, 
               level: 'secure', 
               message: `[KERNEL] Loaded segment context {${activeSegmentId}}` 
           }]);
           
           // Small delay to prevent instant audio overlap on fast switch
           const timer = setTimeout(() => {
               playAudio();
           }, 300);
           return () => clearTimeout(timer);
      }

  }, [activeSegmentId, activeSegment, isMuted, generateAudioForSegment]);

  const fallbackToWebSpeech = (text: string) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
  };

  const addLog = (level: LogEntry['level'], message: string) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-GB', { hour12: false });
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: timeString,
      level,
      message,
    };
    setLogs((prev) => [...prev, newLog]);
  };

  const handleNavigation = (direction: 'next' | 'prev') => {
      if (currentIndex === -1 || !activeSegment) return;

      if (direction === 'next') {
          // 1. Check for explicit branching logic (ZEN v4.2 "next" array)
          // If the segment defines a specific target, we jump to it.
          if (activeSegment.next && activeSegment.next.length > 0) {
              const nextTargetId = activeSegment.next[0].target;
              
              // Verify target exists in the story to prevent crash
              if (story.segments[nextTargetId]) {
                  addLog('secure', `[KERNEL] Branching jump detected -> {${nextTargetId}}`);
                  setActiveSegment(nextTargetId);
                  return;
              }
          }

          // 2. Fallback: Linear Navigation (Visual Order in UI)
          if (currentIndex < totalSegments - 1) {
              const nextId = story.ui_segment_order[currentIndex + 1];
              setActiveSegment(nextId);
          }
      } else if (direction === 'prev' && currentIndex > 0) {
          // Debug Navigation: Always keep linear history for "Back" button
          const prevId = story.ui_segment_order[currentIndex - 1];
          setActiveSegment(prevId);
      }
  };

  const handleDoubleTap = () => {
    setIsTapAnimating(true);
    addLog('secure', 'Gesture Verified: DoubleTap (Confidence: 0.99)');
    setTimeout(() => setIsTapAnimating(false), 500);
  };

  const toggleMute = () => {
      setIsMuted(!isMuted);
      if (!isMuted) {
           if (audioRef.current) audioRef.current.pause();
           window.speechSynthesis.cancel();
           setIsSpeaking(false);
      }
  };

  return (
    <div className="flex flex-col h-full border-l border-slate-200 dark:border-glass-border bg-gradient-to-bl from-slate-50 via-slate-100 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
      
      {/* Hidden Native Audio Element */}
      <audio 
        ref={audioRef} 
        onEnded={() => setIsSpeaking(false)}
        onError={() => setIsSpeaking(false)}
        className="hidden"
      />

      {/* Header */}
      <div className="h-16 flex flex-col justify-center px-6 border-b border-slate-200 dark:border-glass-border">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
             <Smartphone size={16} />
             <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Step 3</span>
        </div>
        <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-white">3. DEVICE PREVIEW <span className="text-slate-500 font-normal">(Output)</span></h2>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                <Lock size={10} />
                ENCRYPTED STREAM
            </div>
        </div>
      </div>

      {/* Simulator Area */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-8 overflow-hidden group perspective-1000">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none transition-opacity duration-700 opacity-50 group-hover:opacity-80"></div>

        {/* 3D Phone Chassis */}
        <div className="relative z-10 w-[280px] h-[520px] bg-black rounded-[3rem] border-[6px] border-slate-800 shadow-2xl shadow-black/50 ring-1 ring-white/10 flex flex-col overflow-hidden transition-transform duration-500 hover:scale-[1.01]">
            
            {/* Double Tap Feedback */}
            <div className={`absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-300 ${isTapAnimating ? 'opacity-20' : 'opacity-0'}`}></div>

            {/* Mute Overlay */}
            {isMuted && (
                <div className="absolute top-12 left-1/2 -translate-x-1/2 z-40 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                    <VolumeX size={12} className="text-red-400" />
                    <span className="text-[10px] text-white font-mono">MUTED</span>
                </div>
            )}

            {/* Generating Audio Overlay */}
            {isGeneratingAudio && (
                <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 animate-in fade-in duration-300">
                    <Loader2 className="text-indigo-500 w-8 h-8 animate-spin" />
                    <div className="flex flex-col items-center">
                        <span className="text-xs text-indigo-400 font-mono tracking-widest uppercase">Gemini AI</span>
                        <span className="text-[10px] text-slate-400">Synthesizing Voice...</span>
                    </div>
                </div>
            )}

             {/* Speaker Animation */}
             {isSpeaking && !isMuted && (
                 <div className="absolute top-12 right-6 z-40 flex gap-0.5 items-end h-4">
                     <div className="w-1 bg-indigo-400 animate-[bounce_0.5s_infinite] h-2"></div>
                     <div className="w-1 bg-indigo-400 animate-[bounce_0.7s_infinite] h-4"></div>
                     <div className="w-1 bg-indigo-400 animate-[bounce_0.4s_infinite] h-1"></div>
                 </div>
             )}

            {/* Phone Status Bar */}
            <div className="h-8 px-6 flex justify-between items-center bg-black text-white/80 text-[10px] select-none z-20">
                <span>9:41</span>
                <div className="flex gap-1.5">
                    <Wifi size={10} />
                    <Battery size={10} />
                </div>
            </div>
            
            {/* Phone Screen Content */}
            <div className="flex-1 bg-black flex flex-col items-center justify-center relative overflow-hidden">
                 {/* Content Layer */}
                 {activeSegment ? (
                    <div className="w-full h-full flex flex-col animate-in fade-in duration-500">
                        {/* Image Area */}
                        <div className="h-3/5 w-full relative">
                            {activeSegment.assets.image ? (
                                <img src={activeSegment.assets.image} className="w-full h-full object-cover opacity-90" alt="Scene" />
                            ) : (
                                <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-700">
                                    <span className="text-xs">NO ASSET</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black"></div>
                            
                            {/* Segment Mood Indicator */}
                            <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md border border-white/10 px-2 py-1 rounded text-[10px] text-white/80 font-mono uppercase">
                                {activeSegment.source_data.mood || 'N/A'}
                            </div>
                        </div>

                        {/* Text Area */}
                        <div className="h-2/5 w-full bg-black p-6 flex flex-col items-center text-center">
                             <div className="flex-1 flex items-center justify-center">
                                <p className="text-slate-200 text-sm leading-relaxed font-serif tracking-wide opacity-90 line-clamp-6">
                                    {activeSegment.text_content || "..."}
                                </p>
                             </div>
                             
                             {/* Progress Dots */}
                             <div className="flex gap-1 mt-4 opacity-40">
                                {story.ui_segment_order.slice(0, 5).map((id, idx) => ( 
                                    <div key={id} className={`w-1.5 h-1.5 rounded-full ${id === activeSegmentId ? 'bg-indigo-400 scale-125' : 'bg-slate-600'}`}></div>
                                ))}
                             </div>
                        </div>
                    </div>
                 ) : (
                     /* Boot Screen */
                    <div className="flex flex-col items-center justify-center gap-4 opacity-50">
                        <div className="w-16 h-16 rounded-full border-2 border-white/10 flex items-center justify-center animate-pulse">
                             <span className="font-bold text-2xl text-white tracking-tighter">TB</span>
                        </div>
                        <span className="text-[10px] font-mono tracking-[0.2em] text-white/60">TOT & BATET</span>
                    </div>
                 )}
            </div>

            {/* Dynamic Island */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-b-2xl z-30 flex items-center justify-center pointer-events-none">
                 <div className="w-12 h-1 rounded-full bg-slate-900/50"></div>
            </div>
        </div>

        {/* Simulator Controls */}
        <div className="mt-8 flex items-center gap-4 p-2 bg-white/50 dark:bg-glass-100 rounded-full border border-slate-200 dark:border-glass-border backdrop-blur-md shadow-lg">
            <button 
                onClick={() => handleNavigation('prev')}
                className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10 active:scale-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed" 
                title="Previous Segment"
                disabled={currentIndex <= 0}
            >
                <Volume1 size={18} />
            </button>
            <div className="w-px h-4 bg-slate-300 dark:bg-white/10"></div>
            <button 
                onClick={handleDoubleTap}
                className="px-4 py-2 rounded-full flex items-center gap-2 text-xs font-medium text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] active:scale-95 transition-all"
            >
                <MousePointer2 size={14} /> Double Tap
            </button>
            <div className="w-px h-4 bg-slate-300 dark:bg-white/10"></div>
            <button 
                onClick={() => handleNavigation('next')}
                className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10 active:scale-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed" 
                title="Next Segment"
                // Disable next button ONLY if we are at the end AND there is no branching
                disabled={currentIndex >= totalSegments - 1 && (!activeSegment?.next || activeSegment.next.length === 0)}
            >
                <Volume2 size={18} />
            </button>
            <div className="w-px h-4 bg-slate-300 dark:bg-white/10"></div>
            <button 
                onClick={toggleMute}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isMuted ? 'text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20' : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10'}`}
                title={isMuted ? "Unmute" : "Mute"}
            >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
        </div>
      </div>

      {/* Security Logs Console */}
      <div className="h-1/3 border-t border-slate-200 dark:border-glass-border bg-white/50 dark:bg-black/40 backdrop-blur-md flex flex-col">
         <div className="h-8 flex items-center justify-between px-4 bg-slate-100 dark:bg-white/5 border-b border-slate-200 dark:border-white/5">
             <div className="flex items-center gap-2">
                 <Terminal size={12} className="text-emerald-600 dark:text-emerald-500" />
                 <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Security Kernel</span>
             </div>
             <div className="flex gap-1.5 opacity-50">
                 <div className="w-2 h-2 rounded-full bg-red-500/20 border border-red-500/50"></div>
                 <div className="w-2 h-2 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                 <div className="w-2 h-2 rounded-full bg-emerald-500/20 border border-emerald-500/50"></div>
             </div>
         </div>
         <div 
            ref={logContainerRef}
            className="flex-1 overflow-y-auto p-4 scrollbar-thin scroll-smooth"
         >
             <div className="font-mono text-[10px] text-slate-400 dark:text-slate-500 mb-2 opacity-50">--- Begin Session Log ---</div>
             {logs.map(log => <LogLine key={log.id} log={log} />)}
             <div className="animate-pulse font-mono text-[10px] text-emerald-600 dark:text-emerald-500 mt-1 flex items-center gap-1">
                 <Activity size={10} />
                 <span>Monitoring events...</span>
             </div>
         </div>
      </div>
    </div>
  );
};

export default RightPanel;
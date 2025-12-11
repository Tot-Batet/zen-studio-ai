import React, { useState } from 'react';
import { Layers, Trash2, Mic, Wand2, Clock, MoveVertical, Type, Code, FileJson, AudioWaveform, Loader2, Sparkles, Volume2 } from 'lucide-react';
import { ZenSegment } from '../types';
import { useStoryStore } from '../store';

const MoodBadge: React.FC<{ mood?: string }> = ({ mood = 'Neutral' }) => {
  const colors: Record<string, string> = {
    Joyful: 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20',
    Dark: 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700',
    Mysterious: 'bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20',
    Action: 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20',
    Calm: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
    Neutral: 'bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-500/20',
  };

  return (
    <span className={`px-2.5 py-1 rounded-md text-[10px] font-medium uppercase tracking-wide border ${colors[mood] || colors.Neutral}`}>
      {mood}
    </span>
  );
};

interface SegmentCardProps {
  segment: ZenSegment;
  index: number;
  isActive: boolean;
  isCodeMode: boolean;
  loadingOp: string | null; // 'rewrite' | 'audio' | null
  onSelect: () => void;
  onUpdate: (id: string, updates: Partial<ZenSegment>) => void;
  onDelete: (id: string) => void;
  onRewrite: (id: string) => void;
  onGenerateAudio: (id: string) => void;
  // DnD Props
  onDragStart: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
}

const SegmentCard: React.FC<SegmentCardProps> = ({ 
    segment, index, isActive, isCodeMode, loadingOp,
    onSelect, onUpdate, onDelete, onRewrite, onGenerateAudio, 
    onDragStart, onDragOver, onDrop 
}) => (
  <div 
    draggable={!isCodeMode}
    onDragStart={(e) => onDragStart(e, index)}
    onDragOver={onDragOver}
    onDrop={(e) => onDrop(e, index)}
    onClick={onSelect}
    className={`group relative p-4 rounded-2xl border transition-all duration-300 mb-4 shadow-sm hover:shadow-md animate-in fade-in slide-in-from-bottom-2 cursor-pointer ${
        isActive 
        ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/50 shadow-indigo-100 dark:shadow-indigo-500/20 ring-1 ring-indigo-500/30' 
        : 'bg-white/80 dark:bg-glass-100 border-slate-200 dark:border-glass-border hover:bg-white dark:hover:bg-glass-200 hover:border-indigo-300 dark:hover:border-indigo-500/30 shadow-slate-200/50 dark:shadow-black/20'
    }`}
  >
    {/* Drag Handle */}
    {!isCodeMode && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 cursor-grab active:cursor-grabbing transition-opacity z-10 p-1">
            <MoveVertical size={16} />
        </div>
    )}

    {isCodeMode ? (
        // --- JSON INSPECTOR MODE ---
        <div className="flex gap-4 h-32 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-1 opacity-50">
                 <FileJson size={14} className="text-emerald-500" />
             </div>
             <div className="flex-1 bg-slate-950 dark:bg-black/80 rounded-xl p-3 border border-emerald-500/20 shadow-inner overflow-auto custom-scrollbar">
                <pre className="font-mono text-[10px] leading-3 text-emerald-500 whitespace-pre">
                    {JSON.stringify(segment, null, 2)}
                </pre>
             </div>
        </div>
    ) : (
        // --- VISUAL EDITOR MODE ---
        <div className="flex gap-4">
            {/* Image Thumbnail */}
            <div className={`w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden border relative group-hover:scale-105 transition-transform duration-300 ml-4 bg-slate-200 dark:bg-slate-800 ${isActive ? 'border-indigo-400/50' : 'border-slate-200 dark:border-white/5'}`}>
            {segment.assets.image ? (
                <img src={segment.assets.image} alt="Segment" className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-600">
                    <span className="text-[10px]">No Image</span>
                </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <span className="absolute bottom-1 right-1 text-[10px] font-mono text-white/90 bg-black/40 px-1.5 rounded backdrop-blur-sm">
                {(index + 1).toString().padStart(2, '0')}
            </span>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col justify-between min-w-0">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 mb-2">
                    <MoodBadge mood={segment.source_data.mood} />
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono bg-slate-100 dark:bg-slate-900/50 px-2 py-0.5 rounded-full border border-slate-200 dark:border-white/5">
                        <Clock size={10} />
                        {segment.source_data.estimated_duration || '0s'}
                    </div>
                    {/* Segment Type Badge */}
                    <div className="flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-mono bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-500/20 capitalize">
                        <Type size={10} />
                        {segment.type}
                    </div>
                    {/* Audio Status */}
                    {segment.assets.audio && (
                        <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                            <Volume2 size={10} />
                            TTS READY
                        </div>
                    )}
                </div>
                {/* Delete Button */}
                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(segment.id); }}
                    className="text-slate-400 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 transition-colors p-1 opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Delete Segment"
                >
                <Trash2 size={14} />
                </button>
            </div>

            <textarea 
                className="w-full bg-transparent text-sm text-slate-800 dark:text-slate-200 resize-none outline-none placeholder-slate-400 dark:placeholder-slate-600 line-clamp-2 focus:line-clamp-none focus:bg-slate-100 dark:focus:bg-slate-900/30 focus:p-2 focus:-ml-2 rounded-md transition-all"
                value={segment.text_content}
                onChange={(e) => onUpdate(segment.id, { text_content: e.target.value })}
                rows={2}
                placeholder="Type the story narration here..."
                onClick={(e) => e.stopPropagation()} // Prevent card selection loop when clicking text
            />
            
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-white/5 opacity-60 group-hover:opacity-100 transition-opacity">
                
                {/* AI Rewrite Button */}
                <button 
                    onClick={(e) => { e.stopPropagation(); onRewrite(segment.id); }}
                    disabled={!!loadingOp}
                    className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors disabled:opacity-50"
                >
                    {loadingOp === 'rewrite' ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />} 
                    AI Rewrite
                </button>

                {/* Generate Audio Button */}
                <button 
                    onClick={(e) => { e.stopPropagation(); onGenerateAudio(segment.id); }}
                    disabled={!!loadingOp}
                    className={`flex items-center gap-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${segment.assets.audio ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                    {loadingOp === 'audio' ? <Loader2 size={12} className="animate-spin" /> : <Mic size={12} />} 
                    {segment.assets.audio ? 'Regenerate Audio (TTS)' : 'Record Audio (TTS)'}
                </button>
            </div>
            </div>
        </div>
    )}
  </div>
);

const CenterPanel: React.FC = () => {
  const { story, activeSegmentId, isCodeViewMode, setActiveSegment, addSegment, updateSegment, deleteSegment, toggleCodeViewMode, reorderSegments, rewriteSegment, generateAudioForSegment } = useStoryStore();
  const [loadingStates, setLoadingStates] = useState<Record<string, 'rewrite' | 'audio'>>({});

  // Reconstruct ordered list from ID array and Dictionary
  const orderedSegments = story.ui_segment_order
    .map(id => story.segments[id])
    .filter(Boolean);

  // Handle Drag Start
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle Drag Over
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle Drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (sourceIndex !== targetIndex) {
        reorderSegments(sourceIndex, targetIndex);
    }
  };

  // --- ACTIONS ---

  const handleRewrite = async (id: string) => {
    setLoadingStates(prev => ({ ...prev, [id]: 'rewrite' }));
    await rewriteSegment(id);
    setLoadingStates(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
    });
  };

  const handleGenerateAudio = async (id: string) => {
      setLoadingStates(prev => ({ ...prev, [id]: 'audio' }));
      await generateAudioForSegment(id);
      setLoadingStates(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
  };

  const handleCardClick = (segment: ZenSegment) => {
      setActiveSegment(segment.id);
      
      // Play Audio on click (if TTS exists -> play blob, else -> WebSpeech)
      window.speechSynthesis.cancel(); // Stop current
      
      if (segment.assets.audio) {
          const audio = new Audio(segment.assets.audio);
          audio.play().catch(e => console.error("Playback error", e));
      } else if (segment.text_content) {
          // Fallback Local TTS
          const utterance = new SpeechSynthesisUtterance(segment.text_content);
          window.speechSynthesis.speak(utterance);
      }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/20 backdrop-blur-3xl transition-colors duration-300">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-8 border-b border-slate-200 dark:border-glass-border">
        <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <AudioWaveform size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Step 2</span>
            </div>
            <div className="flex items-baseline gap-2">
                <h2 className="text-sm font-semibold text-slate-800 dark:text-white">2. AUDIO TRANSFORMATION</h2>
                <span className="text-[10px] text-slate-500 hidden xl:inline-block">Page-to-Audio Segment Conversion</span>
            </div>
        </div>
        
        <div className="flex items-center gap-4">
             {/* Explicit Code View Button */}
            <button 
                onClick={toggleCodeViewMode}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all border text-xs font-medium font-mono ${isCodeViewMode ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-500'}`}
                title="Toggle JSON Inspector"
            >
                <Code size={14} />
                <span>{isCodeViewMode ? 'CLOSE JSON' : '< > CODE'}</span>
            </button>
            
            <div className="h-4 w-px bg-slate-300 dark:bg-white/10"></div>
            
            <div className="text-[10px] text-slate-500 dark:text-slate-600 font-mono border border-slate-200 dark:border-white/5 px-2 py-1 rounded">
                v{story.engine_version}
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8 scrollbar-hide relative">
        {/* Connection Line */}
        <div className="absolute left-[3.25rem] top-8 bottom-8 w-0.5 bg-gradient-to-b from-indigo-500/0 via-indigo-200 dark:via-indigo-500/20 to-indigo-500/0 ml-4 pointer-events-none"></div>

        <div className="max-w-3xl mx-auto pb-10">
          {orderedSegments.map((segment, index) => (
            <SegmentCard 
                key={segment.id} 
                segment={segment} 
                index={index}
                isActive={segment.id === activeSegmentId}
                isCodeMode={isCodeViewMode}
                loadingOp={loadingStates[segment.id] || null}
                onSelect={() => handleCardClick(segment)}
                onUpdate={updateSegment}
                onDelete={deleteSegment}
                onRewrite={handleRewrite}
                onGenerateAudio={handleGenerateAudio}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            />
          ))}
          
          {/* Add New Segment Button */}
          <div className="flex justify-center mt-6 ml-4">
            <button 
                onClick={addSegment}
                className="flex items-center justify-center w-12 h-12 rounded-full border border-dashed border-slate-400 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-white hover:border-indigo-400 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all duration-300 active:scale-95"
            >
                <span className="text-2xl font-light">+</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CenterPanel;
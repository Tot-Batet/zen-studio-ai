import React, { useEffect, useState } from 'react';
import LeftPanel from './components/LeftPanel';
import CenterPanel from './components/CenterPanel';
import RightPanel from './components/RightPanel';
import SettingsModal from './components/SettingsModal';
import { Settings, UserCircle2, Moon, Sun, AlertTriangle } from 'lucide-react';
import { useStoryStore } from './store';

export default function App() {
  const { theme, toggleTheme, apiKey } = useStoryStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Effect to apply theme class to html or body
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className={`relative w-full h-screen overflow-hidden flex flex-col font-sans selection:bg-indigo-500/30 transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
      
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Global Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Gradients adapted for both themes */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 dark:bg-indigo-800/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 dark:bg-purple-900/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen"></div>
        <div className="absolute top-[20%] right-[30%] w-[20%] h-[20%] bg-cyan-500/10 dark:bg-cyan-900/10 rounded-full blur-[80px] mix-blend-multiply dark:mix-blend-screen"></div>
        {/* Noise Texture Overlay */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
      </div>

      {/* Top Navbar (Thin) */}
      <header className="relative z-50 h-12 flex items-center justify-between px-6 border-b border-slate-200 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md transition-colors duration-300">
        <div className="flex items-center gap-3">
            {/* Tot & Batet Logo Link */}
            <a 
              href="https://www.totetbatet.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group relative w-8 h-8 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20 overflow-hidden hover:ring-2 ring-indigo-500/50 hover:scale-105 transition-all duration-300"
              title="Visit Tot & Batet"
            >
               <img 
                 src="icone_bleue.png" 
                 alt="Tot & Batet" 
                 className="w-full h-full object-cover"
                 onError={(e) => {
                   // Fallback visual if image fails
                   e.currentTarget.style.display = 'none';
                   const fallback = document.getElementById('logo-fallback');
                   if (fallback) fallback.style.display = 'flex';
                 }}
               />
               <div id="logo-fallback" className="hidden absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 items-center justify-center">
                  <span className="font-bold text-white text-xs">TB</span>
               </div>
            </a>

            <h1 className="text-sm font-semibold tracking-wide text-slate-800 dark:text-white"><span className="opacity-50 font-normal">ZEN</span> STUDIO <span className="text-[10px] bg-indigo-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-200 ml-1">AI BETA</span></h1>
        </div>
        <div className="flex items-center gap-4">
             {/* API Key Warning */}
             {!apiKey && (
                 <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[10px] text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors animate-pulse">
                     <AlertTriangle size={12} />
                     <span>Missing API Key</span>
                 </button>
             )}

             {/* Theme Toggle */}
             <button 
                onClick={toggleTheme}
                className="text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-white transition-colors p-1"
                title="Toggle Theme"
             >
                 {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
             </button>

             <button 
                onClick={() => setIsSettingsOpen(true)}
                className="text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-white transition-colors"
             >
                 <Settings size={18} />
             </button>
             <button className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                 <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-white/10 flex items-center justify-center overflow-hidden">
                     <UserCircle2 size={24} className="text-slate-400" />
                 </div>
                 <span>Lead Dev</span>
             </button>
        </div>
      </header>

      {/* Main Grid Layout (Single Pane of Glass) */}
      <main className="relative z-10 flex-1 flex overflow-hidden">
        {/* Left Panel: Ingestion (20%) */}
        <div className="w-1/5 min-w-[250px] h-full">
            <LeftPanel />
        </div>

        {/* Center Panel: Narrative (40%) */}
        <div className="w-2/5 h-full">
            <CenterPanel />
        </div>

        {/* Right Panel: Simulation (40%) */}
        <div className="w-2/5 h-full">
            <RightPanel />
        </div>
      </main>
    </div>
  );
}
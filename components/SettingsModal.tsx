import React, { useState } from 'react';
import { X, Key, ShieldCheck, AlertCircle } from 'lucide-react';
import { useStoryStore } from '../store';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { apiKey, setApiKey } = useStoryStore();
  const [inputKey, setInputKey] = useState(apiKey);

  if (!isOpen) return null;

  const handleSave = () => {
    setApiKey(inputKey.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Key className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">API Configuration</h3>
              <p className="text-xs text-slate-500">Bring Your Own Key (BYOK)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg p-3 flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
              ZEN Studio uses <strong>Google Gemini 2.5 Flash</strong> for OCR & Mood analysis. Your key is stored locally in your browser and sent directly to Google APIs.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Google Gemini API Key</label>
            <div className="relative">
              <input 
                type="password" 
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors font-mono"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <ShieldCheck size={16} />
              </div>
            </div>
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noreferrer"
              className="text-xs text-indigo-500 hover:text-indigo-600 underline"
            >
              Get a free key from Google AI Studio
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 flex justify-end">
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
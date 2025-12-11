import React, { useState, useRef } from 'react';
import { Upload, CheckCircle2, Loader2, BookOpen, PlusCircle, ScanLine, Image as ImageIcon, AlertCircle, Trash2 } from 'lucide-react';
import { UploadedFile } from '../types';
import { useStoryStore } from '../store';

const FileItem: React.FC<{ file: UploadedFile; onClick: () => void; onDelete: () => void }> = ({ file, onClick, onDelete }) => (
  <div 
    onClick={file.status === 'analyzed' ? onClick : undefined}
    className={`w-full group flex items-center gap-3 p-3 rounded-xl border transition-all mb-3 relative overflow-hidden text-left ${
        file.status === 'processing' 
        ? 'bg-slate-100 border-slate-200 dark:bg-slate-800/20 dark:border-slate-800 opacity-70 cursor-wait' 
        : file.status === 'error'
        ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-500/20'
        : 'bg-white/60 dark:bg-glass-100 border-slate-200 dark:border-glass-border hover:bg-white dark:hover:bg-glass-200 hover:border-indigo-400/50 dark:hover:border-indigo-500/30 cursor-pointer shadow-sm dark:shadow-none'
    }`}
  >
    {/* Hover Actions Overlay */}
    <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white via-white/80 to-transparent dark:from-slate-900 dark:via-slate-900/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 pr-2 z-10">
        
        {/* Add Button (Only if analyzed) */}
        {file.status === 'analyzed' && (
            <button 
                onClick={(e) => { e.stopPropagation(); onClick(); }}
                className="p-1.5 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white shadow-md hover:scale-110 transition-transform"
                title="Add to Story"
            >
                <PlusCircle size={14} />
            </button>
        )}

        {/* Delete Button (Always visible on hover) */}
        <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 rounded-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-200 dark:border-red-500/30 hover:border-red-500 shadow-sm transition-all hover:scale-110"
            title="Remove from Library"
        >
            <Trash2 size={14} />
        </button>
    </div>

    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 flex-shrink-0 border border-slate-300 dark:border-white/5">
      {file.thumbnail ? (
        <img src={file.thumbnail} alt={file.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
            <ImageIcon size={16} className="text-slate-400 dark:text-slate-600" />
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-white transition-colors">{file.name}</p>
      <div className="flex items-center gap-1.5 mt-1">
        {file.status === 'analyzed' ? (
          <span className="flex items-center text-[10px] text-emerald-600 dark:text-emerald-400 font-mono uppercase tracking-wider">
            <CheckCircle2 size={10} className="mr-1" /> OCR Ready
          </span>
        ) : file.status === 'error' ? (
            <span className="flex items-center text-[10px] text-red-500 font-mono uppercase tracking-wider">
            <AlertCircle size={10} className="mr-1" /> {file.stageMessage || 'Failed'}
          </span>
        ) : (
          <span className="flex items-center text-[10px] text-indigo-600 dark:text-indigo-400 font-mono uppercase tracking-wider animate-pulse">
            <Loader2 size={10} className="mr-1 animate-spin" /> {file.stageMessage || 'Analyzing...'}
          </span>
        )}
      </div>
    </div>
  </div>
);

const LeftPanel: React.FC = () => {
  const { library, addLibraryFile, updateLibraryFile, deleteLibraryFile, addAnalyzedSegment, apiKey } = useStoryStore();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileClick = (file: UploadedFile) => {
      // Allow adding if analyzed, even if extractedData is missing (fallback for mocks)
      if (file.status === 'analyzed') {
          addAnalyzedSegment({
              text: file.extractedData?.text || "Mock text content for this page (No real OCR data available in mock).",
              mood: file.extractedData?.mood || "Neutral",
              imageUrl: file.thumbnail || ""
          });
      }
  };

  const handleDelete = (id: string) => {
      // Removed window.confirm to ensure instant responsiveness
      deleteLibraryFile(id);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Safety check for files
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    setIsUploading(true);
    
    const tempId = Date.now().toString();
    const objectUrl = URL.createObjectURL(file);

    // 1. Add to Library IMMEDIATELY (Visual Feedback)
    const newFile: UploadedFile = {
        id: tempId,
        name: file.name,
        status: 'processing',
        thumbnail: objectUrl,
        stageMessage: 'Preparing upload...'
    };
    addLibraryFile(newFile);

    // Check API Key *after* showing the card to give visual feedback
    if (!apiKey) {
        // Delay slightly for UX smoothness then show error
        setTimeout(() => {
            updateLibraryFile(tempId, { 
                status: 'error', 
                stageMessage: 'Missing API Key (Check Settings)' 
            });
            setIsUploading(false);
        }, 500);
        
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
    }

    try {
        updateLibraryFile(tempId, { status: 'processing', stageMessage: 'Reading image...' });

        // 2. Read File as Base64
        const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                // Remove Data URL prefix (e.g., "data:image/jpeg;base64,")
                if (result.includes(',')) {
                    const base64 = result.split(',')[1];
                    resolve(base64);
                } else {
                    reject(new Error("Failed to read file format"));
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

        // 3. Call Gemini API (Real fetch)
        updateLibraryFile(tempId, { status: 'processing', stageMessage: 'Sending to Gemini Vision...' });
        const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        
        const prompt = `
            Analyze this book page image.
            1. Extract the narrative text perfectly.
            2. Determine the emotional mood (Joyful, Dark, Mysterious, Action, Calm, or Neutral).
            
            Return ONLY valid JSON in this format:
            {
                "text_content": "Extracted text here...",
                "mood": "Detected mood"
            }
        `;

        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        { 
                            inline_data: { 
                                mime_type: file.type, 
                                data: base64Data 
                            } 
                        }
                    ]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API Error: ${response.status} ${response.statusText}`);
        }

        updateLibraryFile(tempId, { status: 'processing', stageMessage: 'Parsing AI Response...' });
        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawText) throw new Error("No text generated from Gemini");

        // Clean JSON markdown if present
        const jsonString = rawText.replace(/```json\n|\n```/g, '').trim();
        const parsedData = JSON.parse(jsonString);

        // 4. Success: Update Library with Extracted Data & Create Segment
        updateLibraryFile(tempId, { 
            status: 'analyzed', 
            stageMessage: 'Complete',
            extractedData: {
                text: parsedData.text_content,
                mood: parsedData.mood
            }
        });
        
        // Add the analyzed segment automatically
        addAnalyzedSegment({
            text: parsedData.text_content,
            mood: parsedData.mood,
            imageUrl: objectUrl
        });

    } catch (error) {
        console.error("OCR Failed:", error);
        updateLibraryFile(tempId, { status: 'error', stageMessage: 'Error: ' + (error as Error).message });
    } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
    }
  };

  return (
    <div className="flex flex-col h-full border-r border-slate-200 dark:border-glass-border bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl transition-colors duration-300">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />

      {/* Header */}
      <div className="h-16 flex flex-col justify-center px-6 border-b border-slate-200 dark:border-glass-border">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
             <BookOpen size={16} />
             <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Step 1</span>
        </div>
        <h2 className="text-sm font-semibold text-slate-800 dark:text-white truncate">1. BOOK INGESTION <span className="text-slate-500 font-normal">(Real OCR)</span></h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
        {/* Upload Zone */}
        <div className="mb-8">
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={`w-full h-32 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 group relative overflow-hidden ${
                isUploading 
                ? 'border-indigo-500/50 bg-indigo-50 dark:bg-indigo-500/5 cursor-wait' 
                : 'border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-800/30 hover:bg-white dark:hover:bg-slate-800/50 hover:border-indigo-400 dark:hover:border-indigo-500/50 cursor-pointer'
            }`}
          >
            {isUploading && (
                 <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/50 backdrop-blur-[1px] z-10 flex items-center justify-center flex-col gap-2">
                     <Loader2 className="w-6 h-6 text-indigo-500 dark:text-indigo-400 animate-spin" />
                     <span className="text-[10px] text-indigo-600 dark:text-indigo-300 font-mono animate-pulse">
                         CALLING GEMINI 2.5...
                     </span>
                 </div>
            )}
            
            <div className={`p-3 rounded-full transition-transform duration-500 ${isUploading ? 'scale-0' : 'bg-slate-100 dark:bg-slate-800 group-hover:scale-110'}`}>
              <Upload className="w-5 h-5 text-slate-400 dark:text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400" />
            </div>
            <span className={`text-xs font-medium text-slate-500 dark:text-slate-400 transition-opacity duration-300 ${isUploading ? 'opacity-0' : 'group-hover:text-slate-700 dark:group-hover:text-slate-300'}`}>
              Click to Upload Page
            </span>
            <span className={`text-[10px] text-slate-400 dark:text-slate-500 transition-opacity duration-300 ${isUploading ? 'opacity-0' : ''}`}>
               Supports JPG, PNG (Gemini Vision)
            </span>
          </button>
        </div>

        {/* Files List */}
        <div>
          <div className="flex justify-between items-end mb-4 pl-1">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Scanned Pages</h3>
              <div className="flex items-center gap-1 text-[10px] text-indigo-500 dark:text-indigo-400/80">
                  <ScanLine size={10} />
                  <span>Auto-Crop Active</span>
              </div>
          </div>
          
          <div className="space-y-1">
            {library.map((file) => (
                <FileItem 
                    key={file.id} 
                    file={file} 
                    onClick={() => handleFileClick(file)}
                    onDelete={() => handleDelete(file.id)}
                />
            ))}
          </div>

          {/* Empty state hint if library is empty */}
          {library.length === 0 && (
              <div className="text-center py-8 opacity-40">
                  <div className="inline-block p-3 rounded-full bg-slate-200 dark:bg-slate-800 mb-2">
                      <ImageIcon size={20} className="text-slate-500" />
                  </div>
                  <p className="text-xs text-slate-500">No pages scanned yet</p>
              </div>
          )}
        </div>
      </div>
      
      {/* Footer / Stats */}
      <div className="p-4 border-t border-slate-200 dark:border-glass-border bg-white/50 dark:bg-glass-100">
        <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
          <span>Scan Buffer</span>
          <span className="font-mono text-indigo-600 dark:text-indigo-300">{(library.length * 15)}%</span>
        </div>
        <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
            <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, library.length * 15)}%` }}
            ></div>
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ZenStory, ZenSegment, UploadedFile } from './types';
import { MOCK_STORY, MOCK_FILES } from './constants';

interface StoryState {
  story: ZenStory;
  library: UploadedFile[];
  activeSegmentId: string | null;
  isCodeViewMode: boolean;
  theme: 'dark' | 'light';
  apiKey: string;
  
  // Story Actions
  setActiveSegment: (id: string) => void;
  addSegment: () => void;
  addAnalyzedSegment: (data: { text: string; mood: string; imageUrl: string }) => void;
  updateSegment: (id: string, updates: Partial<ZenSegment>) => void;
  deleteSegment: (id: string) => void;
  reorderSegments: (fromIndex: number, toIndex: number) => void;
  rewriteSegment: (id: string) => Promise<boolean>;

  // Audio Action
  generateAudioForSegment: (segmentId: string) => Promise<boolean>;

  // Library Actions
  addLibraryFile: (file: UploadedFile) => void;
  updateLibraryFile: (id: string, updates: Partial<UploadedFile>) => void;
  deleteLibraryFile: (id: string) => void;

  // UI Actions
  toggleCodeViewMode: () => void;
  toggleTheme: () => void;
  setApiKey: (key: string) => void;
}

// --- AUDIO HELPERS ---

// Convert Base64 to Uint8Array
const base64ToUint8Array = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Add WAV Header to Raw PCM Data
// Specs: 24kHz, 16-bit, Mono (as returned by Gemini 2.5 Flash TTS)
const pcmToWavBlob = (pcmData: Uint8Array, sampleRate: number = 24000): Blob => {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  // 1. RIFF Chunk Descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + pcmData.length, true); // File size - 8
  writeString(view, 8, 'WAVE');

  // 2. fmt Sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true);   // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // 3. data Sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, pcmData.length, true);

  // Combine Header + PCM Data
  return new Blob([header, pcmData], { type: 'audio/wav' });
};

const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

// --- STORE IMPLEMENTATION ---

export const useStoryStore = create<StoryState>()(
  persist(
    (set, get) => ({
      story: MOCK_STORY,
      library: MOCK_FILES,
      activeSegmentId: 's1', 
      isCodeViewMode: false,
      theme: 'dark',
      apiKey: '',

      setActiveSegment: (id) => set({ activeSegmentId: id }),

      toggleCodeViewMode: () => set((state) => ({ isCodeViewMode: !state.isCodeViewMode })),
      
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

      setApiKey: (key) => set({ apiKey: key }),

      addSegment: () =>
        set((state) => {
          const newId = crypto.randomUUID();
          const newSegment: ZenSegment = {
            id: newId,
            type: 'narration',
            assets: {
              image: 'https://picsum.photos/400/300?grayscale',
            },
            text_content: '',
            source_data: {
              mood: 'Neutral',
              estimated_duration: '0s'
            }
          };

          return {
            activeSegmentId: newId, // Auto-select new segment
            story: {
              ...state.story,
              segments: {
                ...state.story.segments,
                [newId]: newSegment
              },
              ui_segment_order: [...state.story.ui_segment_order, newId]
            }
          };
        }),

      addAnalyzedSegment: ({ text, mood, imageUrl }) =>
        set((state) => {
          const newId = crypto.randomUUID();
          const wordCount = text.split(' ').length;
          // Rough estimation: 2.5 words per second
          const duration = Math.ceil(wordCount / 2.5) + 's';

          const newSegment: ZenSegment = {
            id: newId,
            type: 'narration',
            assets: {
              image: imageUrl
            },
            text_content: text,
            source_data: {
              mood: mood,
              estimated_duration: duration
            }
          };

          return {
            activeSegmentId: newId,
            story: {
              ...state.story,
              segments: {
                ...state.story.segments,
                [newId]: newSegment
              },
              ui_segment_order: [...state.story.ui_segment_order, newId]
            }
          };
        }),

      updateSegment: (id, updates) =>
        set((state) => {
            const currentSegment = state.story.segments[id];
            if (!currentSegment) return state;

            const updatedSegment = {
                ...currentSegment,
                ...updates,
                assets: { ...currentSegment.assets, ...updates.assets },
                source_data: { ...currentSegment.source_data, ...updates.source_data }
            };

            return {
                story: {
                    ...state.story,
                    segments: {
                        ...state.story.segments,
                        [id]: updatedSegment
                    }
                }
            };
        }),

      deleteSegment: (id) =>
        set((state) => {
          const newSegments = { ...state.story.segments };
          delete newSegments[id];
          const newOrder = state.story.ui_segment_order.filter((segmentId) => segmentId !== id);
          
          let nextActive = state.activeSegmentId;
          if (state.activeSegmentId === id) {
              nextActive = newOrder.length > 0 ? newOrder[0] : null;
          }

          return {
            activeSegmentId: nextActive,
            story: {
              ...state.story,
              segments: newSegments,
              ui_segment_order: newOrder
            }
          };
        }),
      
      reorderSegments: (fromIndex, toIndex) => 
        set((state) => {
          const newOrder = [...state.story.ui_segment_order];
          const [movedItem] = newOrder.splice(fromIndex, 1);
          newOrder.splice(toIndex, 0, movedItem);
          
          return {
            story: {
              ...state.story,
              ui_segment_order: newOrder
            }
          };
        }),
      
      rewriteSegment: async (id) => {
          const state = get();
          const segment = state.story.segments[id];

          if (!segment || !state.apiKey) return false;

          try {
              const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${state.apiKey}`;
              
              const prompt = `
                Rewrite the following story segment to strongly reflect a "${segment.source_data.mood}" mood.
                Keep it concise (approx same length).
                Text: "${segment.text_content}"
                Return only the rewritten text.
              `;

              const response = await fetch(GEMINI_API_URL, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      contents: [{ parts: [{ text: prompt }] }]
                  })
              });

              if (!response.ok) throw new Error("API Error");

              const data = await response.json();
              const newText = data.candidates?.[0]?.content?.parts?.[0]?.text;

              if (newText) {
                  state.updateSegment(id, { text_content: newText.trim() });
                  return true;
              }
              return false;
          } catch (e) {
              console.error("Rewrite failed", e);
              return false;
          }
      },

      generateAudioForSegment: async (segmentId) => {
          const state = get();
          const segment = state.story.segments[segmentId];
          
          if (!segment || !segment.text_content || !state.apiKey) {
              return false;
          }

          // If already has a blob generated, don't re-generate (Cache)
          if (segment.assets.audio && segment.assets.audio.startsWith('blob:')) {
              return true;
          }

          try {
              // Updated Model to TTS Preview
              const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${state.apiKey}`;
              
              const payload = {
                  contents: [{ parts: [{ text: segment.text_content }] }],
                  generationConfig: {
                      responseModalities: ["AUDIO"], // Required for TTS model
                      speechConfig: {
                        voiceConfig: {
                          prebuiltVoiceConfig: {
                            voiceName: "Kore" // 'Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'
                          }
                        }
                      }
                  }
              };

              const response = await fetch(GEMINI_API_URL, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload)
              });

              if (!response.ok) {
                  const errorText = await response.text();
                  throw new Error(`API Error ${response.status}: ${errorText}`);
              }

              const data = await response.json();
              const base64Audio = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

              if (!base64Audio) throw new Error("No audio data returned");

              // 1. Decode Base64 -> Raw PCM (Uint8Array)
              const pcmData = base64ToUint8Array(base64Audio);

              // 2. Wrap PCM in WAV Container (24kHz, 16-bit, Mono)
              const wavBlob = pcmToWavBlob(pcmData, 24000);

              // 3. Create URL
              const audioUrl = URL.createObjectURL(wavBlob);

              // Update segment with new audio URL
              state.updateSegment(segmentId, {
                  assets: { audio: audioUrl }
              });

              return true;

          } catch (error) {
              console.error("Gemini TTS Error:", error);
              return false;
          }
      },

      addLibraryFile: (file) => 
        set((state) => ({ 
            library: [file, ...state.library] 
        })),

      updateLibraryFile: (id, updates) => 
        set((state) => ({
            library: state.library.map(f => f.id === id ? { ...f, ...updates } : f)
        })),

      deleteLibraryFile: (id) => 
        set((state) => ({
            library: state.library.filter((f) => f.id !== id)
        })),
    }),
    {
      name: 'zen-studio-storage-v5', 
      partialize: (state) => ({ 
        story: state.story, 
        library: state.library,
        activeSegmentId: state.activeSegmentId,
        theme: state.theme,
        apiKey: state.apiKey
      }),
    }
  )
);
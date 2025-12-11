export interface UploadedFile {
  id: string;
  name: string;
  status: 'processing' | 'analyzed' | 'error';
  thumbnail?: string;
  stageMessage?: string; // Message d'étape (ex: "Sending to API...")
  extractedData?: {
    text: string;
    mood: string;
  };
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'secure';
  message: string;
}

// --- ZEN FORMAT v4.2 SPECIFICATIONS ---

export type SegmentType = "beginning" | "narration" | "choice" | "ending";

export interface ZenSegment {
  id: string;
  type: SegmentType;
  // Bloc 1 : Assets
  assets: {
    audio?: string; // URL blob or local
    image?: string; // URL blob or local
    subs?: string;
  };
  // Bloc 2 : Display (Editor content)
  text_content: string; 
  // Bloc 3 : Source Data (AI regeneration context)
  source_data: {
    mood?: string; // ex: "Sombre", "Joyeux"
    image_prompt?: string;
    estimated_duration?: string; // Kept for UI display
  };
  // Bloc 4 : Navigation
  next?: Array<{ target: string; condition?: string }>;
}

export interface ZenStory {
  engine_version: "4.2";
  global_config: {
    normalization_lufs: number;
    idle_timeout_sec: number;
  };
  variables: Record<string, any>;
  segments: Record<string, ZenSegment>; // Dictionary ID -> Segment
  ui_segment_order: string[]; // Order for UI display
}
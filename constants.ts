import { LogEntry, UploadedFile, ZenStory } from './types';

export const MOCK_FILES: UploadedFile[] = [
  { id: '1', name: 'scan_page_04_forest.jpg', status: 'analyzed', thumbnail: 'https://picsum.photos/id/10/100/100' },
  { id: '2', name: 'scan_page_05_wolf.jpg', status: 'analyzed', thumbnail: 'https://picsum.photos/id/237/100/100' },
];

export const MOCK_STORY: ZenStory = {
  engine_version: "4.2",
  global_config: {
    normalization_lufs: -16,
    idle_timeout_sec: 300
  },
  variables: {
    has_basket: true,
    met_wolf: false
  },
  ui_segment_order: ['s1', 's2', 's3'],
  segments: {
    's1': {
      id: 's1',
      type: 'beginning',
      text_content: "Little Red Riding Hood walked through the deep, dark woods. The trees whispered in the wind, but she wasn't afraid. She held her basket tightly.",
      assets: {
        image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80'
      },
      source_data: {
        mood: 'Mysterious',
        estimated_duration: '10s'
      }
    },
    's2': {
      id: 's2',
      type: 'narration',
      text_content: "Suddenly, a shadow moved behind the great oak tree. A Wolf stepped out! 'Where are you going, little girl?' he asked in a low, gruff voice.",
      assets: {
        image: 'https://picsum.photos/seed/wolf/800/600'
      },
      source_data: {
        mood: 'Dark',
        estimated_duration: '12s'
      }
    },
    's3': {
      id: 's3',
      type: 'choice',
      text_content: "She hesitated. Should she tell him about Grandma's house, or keep walking silently?",
      assets: {
        image: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=800&q=80'
      },
      source_data: {
        mood: 'Action',
        estimated_duration: '08s'
      }
    }
  }
};

export const MOCK_LOGS: LogEntry[] = [
  { id: 'l1', timestamp: '10:01:23', level: 'secure', message: 'TEE Initialized successfully.' },
  { id: 'l2', timestamp: '10:01:24', level: 'info', message: 'OCR Engine: Loaded (English).' },
  { id: 'l3', timestamp: '10:01:25', level: 'secure', message: 'Content Provenance Check passed.' },
];
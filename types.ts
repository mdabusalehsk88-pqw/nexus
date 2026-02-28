
export enum AppTab {
  CHAT = 'chat',
  IMAGES = 'images',
  VIDEOS = 'videos',
  LIVE = 'live',
  GALLERY = 'gallery'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  groundingUrls?: Array<{ uri: string; title: string }>;
  image?: string;
}

export interface GeneratedAsset {
  id: string;
  type: 'image' | 'video';
  url: string;
  prompt: string;
  timestamp: number;
}

export interface LiveTranscription {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export type AppState = 'disconnected' | 'connecting' | 'listening' | 'speaking' | 'error';

export type LanguageOption = 'hi' | 'hinglish' | 'en' | 'es' | 'fr' | 'de';
export type AIGenderOption = 'female' | 'male';
export type VoiceOption = 'Kore' | 'Aoede' | 'Puck' | 'Fenrir';
export type ConnectionMode = 'online' | 'offline';

export interface AppSettings {
  language: LanguageOption;
  aiGender: AIGenderOption;
  voice: VoiceOption;
  aiName: string; // "Roxy" or "Rex"
  connectionMode?: ConnectionMode;
  customApiKey?: string;
  apiKeyName?: string;
  responseSpeed?: 'fast' | 'balanced' | 'precise';
  temperature?: number;
  speakingRate?: number; // Speaking rate speed multiplier: e.g. 0.5x to 2.0x (120 to 300 WPM)
  
  // Feature On/Off Switches
  continuousMemory?: boolean;
  soundEffects?: boolean;
  audioVisualizer?: boolean;
  autoLanguageDetect?: boolean;
  fastStreamMode?: boolean;
  offlineFallback?: boolean;
  autoMuteBackground?: boolean;
}

export type ThemePreset = 
  | 'neon-pink' 
  | 'cyber-purple' 
  | 'electric-cyan' 
  | 'crimson-fire' 
  | 'emerald-glow' 
  | 'gold-amber';

export interface ThemeConfig {
  id: ThemePreset;
  name: string;
  primary: string; // Tailwind color or hex
  glowColor: string;
  gradient: string;
  bgRadial: string;
}

export interface FunctionCallItem {
  name: string;
  args: Record<string, any>;
  id?: string;
}

export interface ToolActionNotification {
  id: string;
  timestamp: string;
  toolName: string;
  title: string;
  description: string;
  url?: string;
  status: 'executing' | 'completed' | 'error';
}

export interface ConversationMessage {
  id: string;
  sender: 'user' | 'roxy' | 'system' | 'tool';
  text: string;
  timestamp: string;
  toolCallName?: string;
}

export interface AudioMetrics {
  volume: number; // 0 to 1
  frequencies: Uint8Array;
}

export interface OcrClickTarget {
  id: string;
  label: string;
  type: 'button' | 'link' | 'input' | 'icon' | 'text' | 'tab' | 'menu';
  box2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000 normalized
  center: { x: number; y: number }; // percentage 0-100
  confidence: number;
  description?: string;
  suggestedAction?: string;
}

export interface OcrAnalysisResult {
  rawText: string;
  elements: OcrClickTarget[];
  summary: string;
  deviceType?: 'mobile' | 'desktop' | 'tablet' | 'app';
  timestamp: string;
}

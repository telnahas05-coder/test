export interface Message {
  role: 'user' | 'model';
  text: string;
  type: 'text' | 'image' | 'grounding';
  sources?: Array<{ uri: string; title: string }>;
}

export type BackgroundTheme = 
  | 'Restore & Colorize' 
  | 'Passport Photo'
  | 'Nature' 
  | 'River Side' 
  | 'Ocean/Beach' 
  | 'Forest' 
  | 'Studio Lighting'
  | 'Urban/City'
  | 'Sunset'
  | 'Winter/Snow'
  | 'Luxury Interior'
  | 'Fantasy'
  | 'AI Smart Edit'
  | 'Age: Child'
  | 'Age: Young'
  | 'Age: Middle-aged'
  | 'Age: Old';

export interface AppState {
  originalImage: string | null;
  generatedImage: string | null;
  isLoading: boolean;
  chatHistory: Message[];
  selectedStyle: BackgroundTheme;
  activeTab: 'design' | 'chat';
}
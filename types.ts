
export enum GrammarTopic {
  QUESTION_TAGS = 'Question Tags',
  SIMPLE_VS_CONTINUOUS = 'Present Simple vs Continuous',
  QUANTIFIERS = 'Much, Many, Little, Few',
  COMPARISONS = 'Comparisons',
  READING_COMPREHENSION = 'Arctic Archives (Reading)'
}

export interface Question {
  id: string;
  topic: GrammarTopic;
  text: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  readingPassage?: string;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  avatarId: string;
  position: number;
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  score: number;
  currentQuestion: Question | null;
  phase: 'SETUP' | 'PLAYING' | 'QUESTION' | 'REWARD' | 'FINISHED';
  currentRegionImage?: string;
  diceValue: number;
  totalMapleLeaves: number;
}

export interface AvatarOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

export const CANADIAN_AVATARS: AvatarOption[] = [
  { id: 'beaver', name: 'Buddy the Beaver', icon: '🦫', description: 'Hardworking and fast!', color: 'bg-amber-100' },
  { id: 'moose', name: 'Monty the Moose', icon: '🫎', description: 'Strong and steady.', color: 'bg-orange-100' },
  { id: 'polarbear', name: 'Pip the Polar Bear', icon: '🐻‍❄️', description: 'Cool and collected.', color: 'bg-blue-50' },
  { id: 'loon', name: 'Luna the Loon', icon: '🦆', description: 'Wise and elegant.', color: 'bg-slate-100' },
  { id: 'goose', name: 'Gary the Goose', icon: '🪿', description: 'Determined and loud!', color: 'bg-gray-100' },
  { id: 'raccoon', name: 'Rick the Raccoon', icon: '🦝', description: 'Clever and curious.', color: 'bg-zinc-200' }
];

export const REGIONS = [
  { name: 'The Maritimes', start: 0, end: 6, color: 'bg-blue-400' },
  { name: 'The Great Lakes', start: 7, end: 12, color: 'bg-cyan-500' },
  { name: 'The Prairies', start: 13, end: 18, color: 'bg-yellow-400' },
  { name: 'The Rockies', start: 19, end: 24, color: 'bg-emerald-600' },
  { name: 'The Arctic', start: 25, end: 30, color: 'bg-indigo-200' }
];

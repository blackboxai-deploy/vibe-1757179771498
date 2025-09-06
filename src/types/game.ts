// Game type definitions for Balloon Pop Ultimate

export interface GameSettings {
  difficulty: 'easy' | 'medium' | 'hard';
  soundEnabled: boolean;
  userId?: string;
}

export interface GameState {
  running: boolean;
  score: number;
  highScore: number;
  lives: number;
  level: number;
  combo: number;
  gameStarted: boolean;
  gameOver: boolean;
}

export interface BalloonType {
  type: 'normal' | 'special' | 'heart' | 'bomb' | 'slow' | 'multiplier' | 'freeze' | 'magnet' | 'defuser';
  points: number;
  emoji: string;
  description: string;
}

export interface Balloon {
  id: string;
  x: number;
  y: number;
  r: number;
  speed: number;
  type: BalloonType['type'];
  birth: number;
  lifespan: number;
  vx: number;
  vy: number;
  color: [number, number, number];
  xOffset: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  color: [number, number, number];
  alpha: number;
  life: number;
}

export interface PowerUp {
  type: 'slow' | 'multiplier' | 'freeze' | 'magnet' | 'defuser';
  duration: number;
  active: boolean;
  timeLeft: number;
}

export interface GameConfig {
  spawnRate: Record<GameSettings['difficulty'], number>;
  baseSpeed: Record<GameSettings['difficulty'], number>;
  bombChance: Record<GameSettings['difficulty'], number>;
  powerupChance: Record<GameSettings['difficulty'], number>;
  powerupDuration: number;
  maxLives: number;
  comboTimeout: number;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

export interface UserData {
  userId: string;
  highScore: number;
  gamesPlayed: number;
  totalScore: number;
  lastPlayed: Date;
}

export interface GameEvents {
  onBalloonPop: (balloon: Balloon, points: number) => void;
  onPowerUpActivate: (powerUp: PowerUp) => void;
  onLifeLost: () => void;
  onLifeGained: () => void;
  onGameOver: (finalScore: number) => void;
  onCombo: (comboCount: number) => void;
  onScoreUpdate: (score: number, multiplier: number) => void;
}

export interface ModalState {
  startModal: boolean;
  gameOverModal: boolean;
  settingsModal: boolean;
  howToPlayModal: boolean;
}

export interface AudioConfig {
  enabled: boolean;
  volume: number;
  effects: {
    pop: { frequency: number; duration: number; type: OscillatorType };
    miss: { frequency: number; duration: number; type: OscillatorType };
    powerup: { frequency: number; duration: number; type: OscillatorType };
    combo: { frequency: number; duration: number; type: OscillatorType };
  };
}

export interface GameDimensions {
  width: number;
  height: number;
  dpr: number;
}

export interface InputEvent {
  x: number;
  y: number;
  type: 'click' | 'touch';
  timestamp: number;
}

export const BALLOON_TYPES: Record<BalloonType['type'], BalloonType> = {
  normal: { type: 'normal', points: 1, emoji: '', description: 'Regular balloon' },
  special: { type: 'special', points: 5, emoji: '⭐', description: 'Extra points!' },
  heart: { type: 'heart', points: 0, emoji: '❤️', description: 'Restores one life' },
  bomb: { type: 'bomb', points: -1, emoji: '☠️', description: 'Lose a life!' },
  slow: { type: 'slow', points: 10, emoji: '⏳', description: 'Slows down all balloons' },
  multiplier: { type: 'multiplier', points: 10, emoji: '✨', description: 'Doubles your score' },
  freeze: { type: 'freeze', points: 10, emoji: '❄️', description: 'Stops all balloons' },
  magnet: { type: 'magnet', points: 10, emoji: '➡️', description: 'Pulls balloons to center' },
  defuser: { type: 'defuser', points: 10, emoji: '💣', description: 'Makes bombs safe' }
};

export const DEFAULT_GAME_CONFIG: GameConfig = {
  spawnRate: { easy: 600, medium: 400, hard: 250 },
  baseSpeed: { easy: 0.8, medium: 1.2, hard: 1.8 },
  bombChance: { easy: 0.05, medium: 0.1, hard: 0.15 },
  powerupChance: { easy: 0.05, medium: 0.08, hard: 0.1 },
  powerupDuration: 10,
  maxLives: 3,
  comboTimeout: 1000
};

export const DEFAULT_AUDIO_CONFIG: AudioConfig = {
  enabled: true,
  volume: 0.2,
  effects: {
    pop: { frequency: 500, duration: 0.1, type: 'sine' },
    miss: { frequency: 100, duration: 0.2, type: 'square' },
    powerup: { frequency: 800, duration: 0.2, type: 'triangle' },
    combo: { frequency: 600, duration: 0.3, type: 'sine' }
  }
};
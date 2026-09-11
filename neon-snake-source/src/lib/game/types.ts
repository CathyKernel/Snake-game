export type Direction = "up" | "down" | "left" | "right";

export type GameMode = "classic" | "wrap" | "obstacles";

export type Difficulty = "easy" | "medium" | "hard" | "insane";

export type FoodType = "apple" | "golden" | "speed" | "slow" | "shrink" | "star";

export type GameStatus = "menu" | "countdown" | "running" | "paused" | "dying" | "gameover";

export type DeathCause = "wall" | "self" | "obstacle" | null;

export interface Point {
  x: number;
  y: number;
}

export interface Food {
  id: number;
  type: FoodType;
  pos: Point;
  /** state.time (ms) at which this food disappears; null = permanent */
  expiresAt: number | null;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  bornAt: number;
  size: "sm" | "lg";
}

export interface ActiveEffects {
  /** ms remaining */
  speedBoost: number;
  slowDown: number;
  starPower: number;
}

export interface GameState {
  status: GameStatus;
  mode: GameMode;
  difficulty: Difficulty;

  cols: number;
  rows: number;

  snake: Point[];
  prevSnake: Point[];
  direction: Direction;
  inputQueue: Direction[];
  pendingGrowth: number;

  foods: Food[];
  obstacles: Point[];

  score: number;
  highScore: number;
  level: number;
  applesEaten: number;
  totalEaten: number;
  maxCombo: number;

  combo: number;
  /** state.time at which the current combo window closes */
  comboExpireAt: number;

  effects: ActiveEffects;

  /** gameplay clock (ms), paused while paused */
  time: number;
  /** ms accumulated toward the next movement tick */
  moveAcc: number;

  countdownEnd: number;
  dyingSince: number;
  shakeUntil: number;

  particles: Particle[];
  texts: FloatingText[];
  deathCause: DeathCause;
  newRecord: boolean;
}

export interface EffectChip {
  key: "speed" | "slow" | "star";
  label: string;
  remaining: number;
  total: number;
}

export interface HudData {
  status: GameStatus;
  score: number;
  highScore: number;
  level: number;
  length: number;
  combo: number;
  comboRatio: number;
  applesToNext: number;
  effects: EffectChip[];
  countdown: number | null;
  mode: GameMode;
  difficulty: Difficulty;
}

export interface RunResult {
  score: number;
  level: number;
  length: number;
  maxCombo: number;
  totalEaten: number;
  newRecord: boolean;
  cause: DeathCause;
}

export interface GameCallbacks {
  onSync?: (state: GameState) => void;
  onGameOver?: (state: GameState) => void;
}

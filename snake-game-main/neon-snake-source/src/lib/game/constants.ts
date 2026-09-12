import type { Difficulty, Direction, FoodType, GameMode, Point } from "./types";

/** Grid dimensions (square board) */
export const COLS = 24;
export const ROWS = 24;

/** Combo system */
export const COMBO_WINDOW = 2600;
export const MAX_COMBO = 8;

/** Level progression */
export const APPLES_PER_LEVEL = 5;
export const LEVEL_SPEEDUP = 0.962;
export const LEVEL_BONUS = 25;

/** Countdown before a run starts / resumes */
export const COUNTDOWN_STEP_MS = 640;

/** Death animation duration */
export const DEATH_ANIM_MS = 950;

/** Active effect durations (ms) */
export const EFFECT_DURATIONS = {
  speedBoost: 6000,
  slowDown: 6000,
  starPower: 8000,
} as const;

/** Movement interval modifiers while effects are active */
export const INTERVAL_MODIFIERS = {
  boost: 0.62,
  slow: 1.55,
} as const;

/** Special food spawning */
export const SPECIAL_SPAWN_CHANCE = 0.5;
export const MAX_SPECIALS = 2;

export const DIR_VECTORS: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export const OPPOSITE: Record<Direction, Direction> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

function point(x: number, y: number): Point {
  return { x, y };
}

export interface DifficultyConfig {
  label: string;
  description: string;
  baseInterval: number;
  minInterval: number;
  obstacleClusters: number;
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: {
    label: "Easy",
    description: "Relaxed pace",
    baseInterval: 175,
    minInterval: 95,
    obstacleClusters: 6,
  },
  medium: {
    label: "Medium",
    description: "Balanced arcade feel",
    baseInterval: 140,
    minInterval: 76,
    obstacleClusters: 9,
  },
  hard: {
    label: "Hard",
    description: "Fast and demanding",
    baseInterval: 108,
    minInterval: 60,
    obstacleClusters: 13,
  },
  insane: {
    label: "Insane",
    description: "Reflexes only. Good luck.",
    baseInterval: 84,
    minInterval: 46,
    obstacleClusters: 18,
  },
};

export interface ModeConfig {
  label: string;
  description: string;
}

export const MODES: Record<GameMode, ModeConfig> = {
  classic: {
    label: "Classic",
    description: "Walls are deadly. Stay inside.",
  },
  wrap: {
    label: "Wrap",
    description: "Edges teleport you to the other side.",
  },
  obstacles: {
    label: "Obstacles",
    description: "Walls plus random rock clusters.",
  },
};

export interface FoodConfig {
  name: string;
  points: number;
  grow: number;
  /** ms before despawn; null = permanent */
  lifetime: number | null;
  /** relative spawn weight for special foods */
  weight: number;
  color: string;
}

export const FOOD_CONFIG: Record<FoodType, FoodConfig> = {
  apple: {
    name: "Apple",
    points: 10,
    grow: 1,
    lifetime: null,
    weight: 0,
    color: "#ef4444",
  },
  golden: {
    name: "Golden Apple",
    points: 50,
    grow: 2,
    lifetime: 8500,
    weight: 30,
    color: "#f59e0b",
  },
  speed: {
    name: "Zap Berry",
    points: 20,
    grow: 1,
    lifetime: 8000,
    weight: 22,
    color: "#d946ef",
  },
  slow: {
    name: "Chill Berry",
    points: 20,
    grow: 1,
    lifetime: 8000,
    weight: 18,
    color: "#8b5cf6",
  },
  shrink: {
    name: "Diamond",
    points: 30,
    grow: 0,
    lifetime: 8000,
    weight: 12,
    color: "#fb7185",
  },
  star: {
    name: "Star",
    points: 25,
    grow: 1,
    lifetime: 7000,
    weight: 18,
    color: "#facc15",
  },
};

/** Snake body gradient (head → tail) */
export const SNAKE_HEAD_COLOR = "#a7f3d0";
export const SNAKE_BODY_FROM = "#34d399";
export const SNAKE_BODY_TO = "#065f46";

export { point };

import type { Difficulty, GameMode } from "./types";

const KEY_SCORES = "neon-snake:scores";
const KEY_STATS = "neon-snake:stats";
const KEY_SOUND = "neon-snake:sound";
const KEY_PREFS = "neon-snake:prefs";

export interface LifetimeStats {
  gamesPlayed: number;
  totalScore: number;
  totalApples: number;
  bestCombo: number;
}

export interface Prefs {
  mode: GameMode;
  difficulty: Difficulty;
  soundOn: boolean;
}

const DEFAULT_STATS: LifetimeStats = {
  gamesPlayed: 0,
  totalScore: 0,
  totalApples: 0,
  bestCombo: 1,
};

const DEFAULT_PREFS: Prefs = {
  mode: "classic",
  difficulty: "medium",
  soundOn: true,
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as Partial<T>) };
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage may be unavailable (private mode); ignore
  }
}

function scoreKey(mode: GameMode, difficulty: Difficulty): string {
  return `${mode}:${difficulty}`;
}

export function getHighScore(mode: GameMode, difficulty: Difficulty): number {
  const scores = readJson<Record<string, number>>(KEY_SCORES, {});
  return scores[scoreKey(mode, difficulty)] ?? 0;
}

export function setHighScore(mode: GameMode, difficulty: Difficulty, score: number): void {
  const scores = readJson<Record<string, number>>(KEY_SCORES, {});
  scores[scoreKey(mode, difficulty)] = score;
  writeJson(KEY_SCORES, scores);
}

export function getAllHighScores(): Record<string, number> {
  return readJson<Record<string, number>>(KEY_SCORES, {});
}

export function getStats(): LifetimeStats {
  return readJson<LifetimeStats>(KEY_STATS, DEFAULT_STATS);
}

export function bumpStats(run: { score: number; apples: number; maxCombo: number }): void {
  const s = getStats();
  s.gamesPlayed += 1;
  s.totalScore += run.score;
  s.totalApples += run.apples;
  s.bestCombo = Math.max(s.bestCombo, run.maxCombo);
  writeJson(KEY_STATS, s);
}

export function getSoundEnabled(): boolean {
  return readJson<{ enabled: boolean }>(KEY_SOUND, { enabled: true }).enabled;
}

export function setSoundEnabled(enabled: boolean): void {
  writeJson(KEY_SOUND, { enabled });
}

export function getPrefs(): Prefs {
  return readJson<Prefs>(KEY_PREFS, DEFAULT_PREFS);
}

export function setPrefs(prefs: Prefs): void {
  writeJson(KEY_PREFS, prefs);
}

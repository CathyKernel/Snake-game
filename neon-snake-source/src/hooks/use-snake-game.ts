"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { COMBO_WINDOW, COUNTDOWN_STEP_MS, EFFECT_DURATIONS } from "@/lib/game/constants";
import { SnakeGame } from "@/lib/game/engine";
import { SoundManager } from "@/lib/game/sound";
import {
  getPrefs,
  setPrefs as persistPrefs,
  setSoundEnabled,
} from "@/lib/game/storage";
import type {
  Difficulty,
  Direction,
  EffectChip,
  GameMode,
  GameState,
  HudData,
  RunResult,
} from "@/lib/game/types";

interface UseSnakeGameReturn {
  canvasRef: (node: HTMLCanvasElement | null) => void;
  hud: HudData;
  lastRun: RunResult | null;
  prefs: { mode: GameMode; difficulty: Difficulty; soundOn: boolean };
  statsKey: number;
  actions: {
    start: () => void;
    togglePause: () => void;
    backToMenu: () => void;
    setDirection: (dir: Direction) => void;
    setMode: (mode: GameMode) => void;
    setDifficulty: (difficulty: Difficulty) => void;
    toggleSound: () => void;
  };
}

function buildEffectChips(state: GameState): EffectChip[] {
  const chips: EffectChip[] = [];
  if (state.effects.speedBoost > 0) {
    chips.push({
      key: "speed",
      label: "Speed Boost",
      remaining: state.effects.speedBoost,
      total: EFFECT_DURATIONS.speedBoost,
    });
  }
  if (state.effects.slowDown > 0) {
    chips.push({
      key: "slow",
      label: "Slow-Mo",
      remaining: state.effects.slowDown,
      total: EFFECT_DURATIONS.slowDown,
    });
  }
  if (state.effects.starPower > 0) {
    chips.push({
      key: "star",
      label: "Double Points",
      remaining: state.effects.starPower,
      total: EFFECT_DURATIONS.starPower,
    });
  }
  return chips;
}

const INITIAL_HUD: HudData = {
  status: "menu",
  score: 0,
  highScore: 0,
  level: 1,
  length: 3,
  combo: 1,
  comboRatio: 0,
  applesToNext: 5,
  effects: [],
  countdown: null,
  mode: "classic",
  difficulty: "medium",
};

export function useSnakeGame(): UseSnakeGameReturn {
  const gameRef = useRef<SnakeGame | null>(null);
  const soundRef = useRef<SoundManager | null>(null);
  const lastSigRef = useRef("");
  const lastPushRef = useRef(0);
  const prefsRef = useRef<{ mode: GameMode; difficulty: Difficulty }>({
    mode: "classic",
    difficulty: "medium",
  });

  const [hud, setHud] = useState<HudData>(INITIAL_HUD);
  const [lastRun, setLastRun] = useState<RunResult | null>(null);
  const [statsKey, setStatsKey] = useState(0);
  const [prefs, setPrefsState] = useState<{
    mode: GameMode;
    difficulty: Difficulty;
    soundOn: boolean;
  }>({ mode: "classic", difficulty: "medium", soundOn: true });

  const pushHud = useCallback((state: GameState) => {
    const now = performance.now();
    const countdown =
      state.status === "countdown"
        ? Math.max(1, Math.ceil((state.countdownEnd - now) / COUNTDOWN_STEP_MS))
        : null;
    const effects = buildEffectChips(state);
    const comboRemaining = Math.max(0, state.comboExpireAt - state.time);
    const sig = [
      state.status,
      state.score,
      state.level,
      state.combo,
      state.snake.length,
      state.highScore,
      state.applesEaten,
      countdown,
      effects.map((e) => Math.ceil(e.remaining / 100)).join(","),
    ].join("|");

    if (sig === lastSigRef.current && now - lastPushRef.current < 150) return;
    lastSigRef.current = sig;
    lastPushRef.current = now;

    setHud({
      status: state.status,
      score: state.score,
      highScore: state.highScore,
      level: state.level,
      length: state.snake.length,
      combo: state.combo,
      comboRatio: state.combo > 1 ? comboRemaining / COMBO_WINDOW : 0,
      applesToNext: 5 - (state.applesEaten % 5),
      effects,
      countdown,
      mode: state.mode,
      difficulty: state.difficulty,
    });
  }, []);

  const handleGameOver = useCallback((state: GameState) => {
    setLastRun({
      score: state.score,
      level: state.level,
      length: state.snake.length,
      maxCombo: state.maxCombo,
      totalEaten: state.totalEaten,
      newRecord: state.newRecord,
      cause: state.deathCause,
    });
    setStatsKey((k) => k + 1);
  }, []);

  // ------------------------------------------------------------- engine setup

  const canvasRef = useCallback(
    (node: HTMLCanvasElement | null) => {
      if (!node) {
        gameRef.current?.destroy();
        gameRef.current = null;
        soundRef.current?.destroy();
        soundRef.current = null;
        return;
      }
      if (gameRef.current) return;

      const stored = getPrefs();
      prefsRef.current = { mode: stored.mode, difficulty: stored.difficulty };
      const sound = new SoundManager(stored.soundOn);
      soundRef.current = sound;
      setPrefsState(stored);

      gameRef.current = new SnakeGame(node, {
        mode: stored.mode,
        difficulty: stored.difficulty,
        sound,
        callbacks: { onSync: pushHud, onGameOver: handleGameOver },
      });

      if (process.env.NODE_ENV !== "production") {
        (window as unknown as { __snakeGame?: SnakeGame }).__snakeGame = gameRef.current;
      }
    },
    [pushHud, handleGameOver],
  );

  // ------------------------------------------------------------ keyboard input

  useEffect(() => {
    const directionKeys: Record<string, Direction> = {
      arrowup: "up",
      w: "up",
      arrowdown: "down",
      s: "down",
      arrowleft: "left",
      a: "left",
      arrowright: "right",
      d: "right",
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const game = gameRef.current;
      if (!game) return;
      const key = e.key.toLowerCase();

      if (key === " " || key.startsWith("arrow")) e.preventDefault();

      soundRef.current?.unlock();

      if (directionKeys[key]) {
        game.queueDirection(directionKeys[key]);
        return;
      }
      if (key === " ") {
        game.togglePause();
        return;
      }
      if (key === "p") {
        game.togglePause();
        return;
      }
      if (key === "enter") {
        const status = game.getStatus();
        if (status === "menu" || status === "gameover") game.startRun();
        return;
      }
      if (key === "r") {
        const status = game.getStatus();
        if (status !== "menu") game.startRun();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // --------------------------------------------- auto pause on blur / hide

  useEffect(() => {
    const onBlur = () => {
      const game = gameRef.current;
      if (game && game.getStatus() === "running") game.pause();
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") onBlur();
    };
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // ---------------------------------------------------------------- actions

  const actions = useMemo(
    () => ({
      start: () => {
        soundRef.current?.unlock();
        gameRef.current?.startRun();
      },
      togglePause: () => {
        soundRef.current?.unlock();
        gameRef.current?.togglePause();
      },
      backToMenu: () => {
        const game = gameRef.current;
        if (!game) return;
        game.configure(prefsRef.current.mode, prefsRef.current.difficulty);
      },
      setDirection: (dir: Direction) => {
        gameRef.current?.queueDirection(dir);
      },
      setMode: (mode: GameMode) => {
        prefsRef.current = { ...prefsRef.current, mode };
        gameRef.current?.configure(mode, prefsRef.current.difficulty);
        soundRef.current?.click();
        setPrefsState((p) => ({ ...p, mode }));
        const stored = getPrefs();
        persistPrefs({ ...stored, mode });
        setLastRun(null);
      },
      setDifficulty: (difficulty: Difficulty) => {
        prefsRef.current = { ...prefsRef.current, difficulty };
        gameRef.current?.configure(prefsRef.current.mode, difficulty);
        soundRef.current?.click();
        setPrefsState((p) => ({ ...p, difficulty }));
        const stored = getPrefs();
        persistPrefs({ ...stored, difficulty });
        setLastRun(null);
      },
      toggleSound: () => {
        setPrefsState((p) => {
          const next = !p.soundOn;
          soundRef.current?.setEnabled(next);
          setSoundEnabled(next);
          if (next) soundRef.current?.unlock();
          return { ...p, soundOn: next };
        });
      },
    }),
    [],
  );

  return { canvasRef, hud, lastRun, prefs, statsKey, actions };
}

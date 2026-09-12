"use client";

import { Home, Pause, Play, RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DIFFICULTIES, MODES } from "@/lib/game/constants";
import type { HudData, RunResult } from "@/lib/game/types";

interface OverlaysProps {
  hud: HudData;
  lastRun: RunResult | null;
  onPlay: () => void;
  onResume: () => void;
  onMenu: () => void;
}

const CAUSE_TEXT: Record<string, string> = {
  wall: "You crashed into the wall.",
  self: "You bit your own tail.",
  obstacle: "You smashed into an obstacle.",
};

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="rounded border border-zinc-700 bg-zinc-800/80 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-zinc-300">
      {children}
    </kbd>
  );
}

export function GameOverlays({ hud, lastRun, onPlay, onResume, onMenu }: OverlaysProps) {
  const { status } = hud;

  if (status === "running" || status === "dying") return null;

  if (status === "countdown") {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <span
            key={hud.countdown}
            className="countdown-num font-mono text-8xl font-black text-emerald-400 drop-shadow-[0_0_25px_rgba(16,185,129,0.7)]"
          >
            {hud.countdown}
          </span>
          <span className="text-xs font-medium uppercase tracking-[0.3em] text-zinc-400">
            Get Ready
          </span>
        </div>
      </div>
    );
  }

  if (status === "paused") {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950/70 backdrop-blur-[3px]">
        <div className="animate-pop flex flex-col items-center gap-5 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900">
            <Pause className="h-6 w-6 text-emerald-400" aria-hidden />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-[0.25em] text-zinc-100">PAUSED</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Score {hud.score} &middot; Level {hud.level}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={onResume}
              className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
              size="lg"
            >
              <Play className="mr-1 h-4 w-4" aria-hidden /> Resume
            </Button>
            <Button onClick={onMenu} variant="outline" className="border-zinc-700 bg-transparent">
              <Home className="mr-1 h-4 w-4" aria-hidden /> Menu
            </Button>
          </div>
          <p className="text-xs text-zinc-600">
            Press <Kbd>Space</Kbd> to resume
          </p>
        </div>
      </div>
    );
  }

  if (status === "gameover") {
    const run = lastRun;
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-[3px]">
        <div className="animate-pop w-full max-w-xs rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 text-center shadow-2xl">
          {run?.newRecord ? (
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-amber-500/50 bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-400">
              <Trophy className="h-3.5 w-3.5" aria-hidden /> New Record
            </div>
          ) : null}
          <h2 className="text-2xl font-black tracking-[0.2em] text-red-400">GAME OVER</h2>
          <p className="mt-1 h-4 text-xs text-zinc-500">
            {run?.cause ? CAUSE_TEXT[run.cause] : ""}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2 text-left">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500">Score</div>
              <div className="font-mono text-xl font-bold text-emerald-400">{run?.score ?? hud.score}</div>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500">Best</div>
              <div className="font-mono text-xl font-bold text-amber-400">{hud.highScore}</div>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500">Level</div>
              <div className="font-mono text-sm font-bold text-zinc-200">{run?.level ?? hud.level}</div>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500">Max Combo</div>
              <div className="font-mono text-sm font-bold text-zinc-200">×{run?.maxCombo ?? 1}</div>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <Button
              onClick={onPlay}
              className="flex-1 bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
            >
              <RotateCcw className="mr-1 h-4 w-4" aria-hidden /> Play Again
            </Button>
            <Button
              onClick={onMenu}
              variant="outline"
              className="border-zinc-700 bg-transparent"
              aria-label="Back to main menu"
            >
              <Home className="h-4 w-4" aria-hidden />
            </Button>
          </div>
          <p className="mt-3 text-xs text-zinc-600">
            <Kbd>Enter</Kbd> quick restart &middot; <Kbd>R</Kbd> replay
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------- menu
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950/85 p-4 backdrop-blur-[3px]">
      <div className="animate-pop w-full max-w-sm text-center">
        <h1 className="neon-title font-mono text-4xl font-black tracking-[0.18em] text-emerald-400">
          NEON SNAKE
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          {MODES[hud.mode].label} &middot; {DIFFICULTIES[hud.difficulty].label}
        </p>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-1.5">
          <Trophy className="h-4 w-4 text-amber-400" aria-hidden />
          <span className="text-sm font-semibold text-amber-300">
            High Score: {hud.highScore}
          </span>
        </div>

        <div className="mt-6">
          <Button
            onClick={onPlay}
            size="lg"
            className="h-14 w-full bg-emerald-500 text-lg font-bold tracking-widest text-zinc-950 shadow-[0_0_35px_-8px_rgba(16,185,129,0.8)] hover:bg-emerald-400"
          >
            <Play className="mr-2 h-5 w-5" aria-hidden /> PLAY
          </Button>
        </div>

        <div className="mt-6 space-y-2 text-left text-xs text-zinc-500">
          <p className="flex items-center justify-center gap-2 text-center">
            <Kbd>↑</Kbd> <Kbd>←</Kbd> <Kbd>↓</Kbd> <Kbd>→</Kbd>
            <span className="text-zinc-600">or</span> <Kbd>W</Kbd> <Kbd>A</Kbd> <Kbd>S</Kbd>{" "}
            <Kbd>D</Kbd> <span className="text-zinc-600">to steer</span>
          </p>
          <p className="text-center">
            <Kbd>Space</Kbd> <span className="text-zinc-600">pause &middot;</span> <Kbd>R</Kbd>{" "}
            <span className="text-zinc-600">restart &middot; swipe on mobile</span>
          </p>
        </div>
      </div>
    </div>
  );
}

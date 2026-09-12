"use client";

import { useCallback, useRef } from "react";
import { Gamepad2 } from "lucide-react";
import { GameHud } from "@/components/game/hud";
import { LegendCard } from "@/components/game/legend-card";
import { MobileControls } from "@/components/game/mobile-controls";
import { GameOverlays } from "@/components/game/overlays";
import { SettingsPanel } from "@/components/game/settings-panel";
import { StatsPanel } from "@/components/game/stats-panel";
import { useSnakeGame } from "@/hooks/use-snake-game";
import type { Direction } from "@/lib/game/types";

export default function Home() {
  const { canvasRef, hud, lastRun, prefs, statsKey, actions } = useSnakeGame();
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleSwipeStart = useCallback((x: number, y: number) => {
    touchStartRef.current = { x, y };
  }, []);

  const handleSwipeMove = useCallback(
    (x: number, y: number) => {
      const start = touchStartRef.current;
      if (!start) return;
      const dx = x - start.x;
      const dy = y - start.y;
      if (Math.hypot(dx, dy) < 24) return;
      const dir: Direction =
        Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
      actions.setDirection(dir);
      touchStartRef.current = { x, y };
    },
    [actions],
  );

  const handleSwipeEnd = useCallback(() => {
    touchStartRef.current = null;
  }, []);

  return (
    <div className="dark flex min-h-screen flex-col bg-zinc-950 text-zinc-100 [color-scheme:dark]">
      {/* ---------------------------------------------------------- header */}
      <header className="border-b border-zinc-800/70 bg-zinc-950/90">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10">
            <Gamepad2 className="h-5 w-5 text-emerald-400" aria-hidden />
          </div>
          <div>
            <h1 className="font-mono text-lg font-black tracking-[0.22em] text-emerald-400">
              NEON SNAKE
            </h1>
            <p className="text-[11px] text-zinc-500">
              Classic arcade, supercharged — combos, power foods &amp; three modes
            </p>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------ main */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
          {/* game column */}
          <section aria-label="Game board" className="min-w-0">
            <GameHud hud={hud} />

            <div
              className="relative mt-3 aspect-square w-full touch-none overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-[0_0_70px_-20px_rgba(16,185,129,0.35)]"
              onTouchStart={(e) => {
                const t = e.touches[0];
                handleSwipeStart(t.clientX, t.clientY);
              }}
              onTouchMove={(e) => {
                const t = e.touches[0];
                handleSwipeMove(t.clientX, t.clientY);
              }}
              onTouchEnd={handleSwipeEnd}
            >
              <canvas ref={canvasRef} className="block h-full w-full" aria-label="Snake game canvas" />
              <GameOverlays
                hud={hud}
                lastRun={lastRun}
                onPlay={actions.start}
                onResume={actions.togglePause}
                onMenu={actions.backToMenu}
              />
            </div>

            <MobileControls onDirection={actions.setDirection} className="mt-4 lg:hidden" />

            <p className="mt-3 hidden items-center justify-center gap-2 text-xs text-zinc-600 sm:flex">
              <span className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px]">
                ↑ ← ↓ →
              </span>
              or
              <span className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px]">
                WASD
              </span>
              steer ·
              <span className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px]">
                Space
              </span>
              pause ·
              <span className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px]">
                R
              </span>
              restart
            </p>
          </section>

          {/* sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-5" aria-label="Game settings and statistics">
            <SettingsPanel
              mode={prefs.mode}
              difficulty={prefs.difficulty}
              soundOn={prefs.soundOn}
              onModeChange={actions.setMode}
              onDifficultyChange={actions.setDifficulty}
              onToggleSound={actions.toggleSound}
            />
            <LegendCard />
            <StatsPanel refreshKey={statsKey} />
          </aside>
        </div>
      </main>

      {/* ---------------------------------------------------------- footer */}
      <footer className="mt-auto border-t border-zinc-800/70 bg-zinc-950/90 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-6xl px-4 py-4 text-center text-xs text-zinc-600">
          Neon Snake — built with Next.js, TypeScript &amp; Canvas. High scores are saved locally
          in your browser.
        </div>
      </footer>
    </div>
  );
}

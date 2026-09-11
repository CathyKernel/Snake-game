"use client";

import { Rabbit, Star, Turtle, Zap } from "lucide-react";
import type { EffectChip, HudData } from "@/lib/game/types";
import { cn } from "@/lib/utils";

interface HudProps {
  hud: HudData;
}

const EFFECT_ICONS: Record<EffectChip["key"], typeof Zap> = {
  speed: Rabbit,
  slow: Turtle,
  star: Star,
};

const EFFECT_COLORS: Record<EffectChip["key"], string> = {
  speed: "text-fuchsia-400 border-fuchsia-500/40 bg-fuchsia-500/10",
  slow: "text-violet-400 border-violet-500/40 bg-violet-500/10",
  star: "text-yellow-400 border-yellow-500/40 bg-yellow-500/10",
};

const EFFECT_BARS: Record<EffectChip["key"], string> = {
  speed: "bg-fuchsia-400",
  slow: "bg-violet-400",
  star: "bg-yellow-400",
};

function StatTile({
  label,
  value,
  accent,
  pop,
}: {
  label: string;
  value: string | number;
  accent?: string;
  pop?: boolean;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2">
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </div>
      <div
        key={pop ? String(value) : undefined}
        className={cn(
          "font-mono text-xl font-bold leading-7 tabular-nums",
          pop && "score-pop",
          accent ?? "text-zinc-100",
        )}
      >
        {value}
      </div>
    </div>
  );
}

export function GameHud({ hud }: HudProps) {
  return (
    <div aria-label="Game statistics" className="space-y-2" role="status">
      <div className="grid grid-cols-4 gap-2">
        <StatTile label="Score" value={hud.score} accent="text-emerald-400" pop />
        <StatTile label="Best" value={hud.highScore} accent="text-amber-400" />
        <StatTile label="Level" value={hud.level} accent="text-zinc-100" />
        <StatTile label="Length" value={hud.length} accent="text-zinc-100" />
      </div>

      <div className="flex min-h-9 flex-wrap items-center gap-2" aria-live="polite">
        {hud.combo > 1 && (
          <div className="flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1">
            <span className="text-xs font-bold tracking-wide text-amber-400">
              COMBO ×{hud.combo}
            </span>
            <span className="relative h-1.5 w-14 overflow-hidden rounded-full bg-zinc-800">
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-amber-400 transition-[width] duration-100"
                style={{ width: `${Math.round(hud.comboRatio * 100)}%` }}
              />
            </span>
          </div>
        )}

        {hud.effects.map((chip) => {
          const Icon = EFFECT_ICONS[chip.key];
          return (
            <div
              key={chip.key}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1",
                EFFECT_COLORS[chip.key],
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              <span className="text-xs font-semibold">{chip.label}</span>
              <span className="relative h-1.5 w-10 overflow-hidden rounded-full bg-zinc-800">
                <span
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full transition-[width] duration-100",
                    EFFECT_BARS[chip.key],
                  )}
                  style={{ width: `${Math.round((chip.remaining / chip.total) * 100)}%` }}
                />
              </span>
              <span className="font-mono text-[10px] tabular-nums opacity-80">
                {(chip.remaining / 1000).toFixed(1)}s
              </span>
            </div>
          );
        })}

        {hud.status === "running" && hud.combo <= 1 && hud.effects.length === 0 && (
          <div className="flex items-center gap-2 px-1 text-xs text-zinc-600">
            <Zap className="h-3.5 w-3.5" aria-hidden />
            Next level in {hud.applesToNext} {hud.applesToNext === 1 ? "apple" : "apples"}
          </div>
        )}
      </div>
    </div>
  );
}

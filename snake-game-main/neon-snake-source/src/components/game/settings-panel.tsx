"use client";

import { Boxes, Repeat, Square, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DIFFICULTIES, MODES } from "@/lib/game/constants";
import type { Difficulty, GameMode } from "@/lib/game/types";
import { cn } from "@/lib/utils";

interface SettingsPanelProps {
  mode: GameMode;
  difficulty: Difficulty;
  soundOn: boolean;
  onModeChange: (mode: GameMode) => void;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onToggleSound: () => void;
}

const MODE_ICONS: Record<GameMode, typeof Square> = {
  classic: Square,
  wrap: Repeat,
  obstacles: Boxes,
};

const DIFFICULTY_SPEED_DOTS: Record<Difficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
  insane: 4,
};

export function SettingsPanel({
  mode,
  difficulty,
  soundOn,
  onModeChange,
  onDifficultyChange,
  onToggleSound,
}: SettingsPanelProps) {
  return (
    <Card className="border-zinc-800 bg-zinc-900/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-400">
          Game Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <div className="mb-2 text-xs font-medium text-zinc-500">Game Mode</div>
          <div className="grid gap-2" role="radiogroup" aria-label="Game mode">
            {(Object.keys(MODES) as GameMode[]).map((m) => {
              const Icon = MODE_ICONS[m];
              const active = mode === m;
              return (
                <Button
                  key={m}
                  variant="outline"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onModeChange(m)}
                  className={cn(
                    "h-auto justify-start border-zinc-800 bg-zinc-950/50 px-3 py-2.5 text-left",
                    active
                      ? "border-emerald-500/60 bg-emerald-500/10 hover:bg-emerald-500/15"
                      : "hover:border-zinc-700 hover:bg-zinc-900",
                  )}
                >
                  <Icon
                    className={cn("mr-2.5 h-4 w-4 shrink-0", active ? "text-emerald-400" : "text-zinc-500")}
                    aria-hidden
                  />
                  <span className="min-w-0">
                    <span
                      className={cn(
                        "block text-sm font-semibold",
                        active ? "text-emerald-300" : "text-zinc-300",
                      )}
                    >
                      {MODES[m].label}
                    </span>
                    <span className="block text-xs font-normal text-zinc-500">
                      {MODES[m].description}
                    </span>
                  </span>
                </Button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-medium text-zinc-500">Difficulty</div>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Difficulty">
            {(Object.keys(DIFFICULTIES) as Difficulty[]).map((d) => {
              const active = difficulty === d;
              const dots = DIFFICULTY_SPEED_DOTS[d];
              return (
                <Button
                  key={d}
                  variant="outline"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onDifficultyChange(d)}
                  className={cn(
                    "h-auto flex-col items-start gap-1 border-zinc-800 bg-zinc-950/50 px-3 py-2",
                    active
                      ? "border-emerald-500/60 bg-emerald-500/10 hover:bg-emerald-500/15"
                      : "hover:border-zinc-700 hover:bg-zinc-900",
                  )}
                >
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      active ? "text-emerald-300" : "text-zinc-300",
                    )}
                  >
                    {DIFFICULTIES[d].label}
                  </span>
                  <span className="flex w-full items-center justify-between gap-1">
                    <span className="text-[10px] font-normal text-zinc-500">
                      {DIFFICULTIES[d].description}
                    </span>
                    <span className="flex shrink-0 gap-0.5" aria-hidden>
                      {[1, 2, 3, 4].map((i) => (
                        <span
                          key={i}
                          className={cn(
                            "h-1 w-1 rounded-full",
                            i <= dots ? "bg-emerald-400" : "bg-zinc-700",
                          )}
                        />
                      ))}
                    </span>
                  </span>
                </Button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
          <div>
            <div className="text-sm font-semibold text-zinc-300">Sound Effects</div>
            <div className="text-xs text-zinc-500">Synthesized retro SFX</div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={onToggleSound}
            aria-label={soundOn ? "Mute sound effects" : "Unmute sound effects"}
            className={cn(
              "border-zinc-800 bg-zinc-950/50",
              soundOn ? "text-emerald-400" : "text-zinc-500",
            )}
          >
            {soundOn ? <Volume2 className="h-4 w-4" aria-hidden /> : <VolumeX className="h-4 w-4" aria-hidden />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

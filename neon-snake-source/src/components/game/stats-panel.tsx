"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getStats, type LifetimeStats } from "@/lib/game/storage";

interface StatsPanelProps {
  /** Increment to force a re-read after a run ends. */
  refreshKey: number;
}

export function StatsPanel({ refreshKey }: StatsPanelProps) {
  const [stats, setStats] = useState<LifetimeStats | null>(null);

  useEffect(() => {
    // Defer the localStorage read to after paint (avoids synchronous setState in effect).
    const timer = window.setTimeout(() => setStats(getStats()), 0);
    return () => window.clearTimeout(timer);
  }, [refreshKey]);

  const rows = [
    { label: "Games Played", value: stats?.gamesPlayed ?? 0 },
    { label: "Total Score", value: stats?.totalScore ?? 0 },
    { label: "Apples Eaten", value: stats?.totalApples ?? 0 },
    { label: "Best Combo", value: stats ? `×${stats.bestCombo}` : "×1" },
  ];

  return (
    <Card className="border-zinc-800 bg-zinc-900/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-400">
          Lifetime Stats
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-2">
          {rows.map((row) => (
            <div
              key={row.label}
              className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2"
            >
              <dt className="text-[10px] uppercase tracking-wider text-zinc-500">{row.label}</dt>
              <dd className="font-mono text-lg font-bold tabular-nums text-zinc-200">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

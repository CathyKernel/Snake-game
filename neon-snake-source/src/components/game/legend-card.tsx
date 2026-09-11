"use client";

import { Apple, Gem, Star, Turtle, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ITEMS = [
  {
    icon: "apple",
    color: "text-red-400",
    name: "Apple",
    detail: "+10 pts · grow longer",
  },
  {
    icon: "golden",
    color: "text-amber-400",
    name: "Golden Apple",
    detail: "+50 pts · grow by 2 · fleeting",
  },
  {
    icon: "speed",
    color: "text-fuchsia-400",
    name: "Zap Berry",
    detail: "+20 pts · speed boost 6s",
  },
  {
    icon: "slow",
    color: "text-violet-400",
    name: "Chill Berry",
    detail: "+20 pts · slow-mo 6s",
  },
  {
    icon: "shrink",
    color: "text-rose-400",
    name: "Diamond",
    detail: "+30 pts · shrink by 3",
  },
  {
    icon: "star",
    color: "text-yellow-400",
    name: "Star",
    detail: "+25 pts · 2× points 8s",
  },
] as const;

function ItemIcon({ icon, className }: { icon: (typeof ITEMS)[number]["icon"]; className?: string }) {
  switch (icon) {
    case "apple":
      return <Apple className={className} aria-hidden />;
    case "golden":
      return <Apple className={className} aria-hidden />;
    case "speed":
      return <Zap className={className} aria-hidden />;
    case "slow":
      return <Turtle className={className} aria-hidden />;
    case "shrink":
      return <Gem className={className} aria-hidden />;
    case "star":
      return <Star className={className} aria-hidden />;
  }
}

export function LegendCard() {
  return (
    <Card className="border-zinc-800 bg-zinc-900/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-400">
          Power Foods
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2.5">
          {ITEMS.map((item) => (
            <li key={item.name} className="flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950/70">
                <ItemIcon icon={item.icon} className={`h-3.5 w-3.5 ${item.color}`} />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-zinc-300">{item.name}</span>
                <span className="block text-[11px] text-zinc-500">{item.detail}</span>
              </span>
            </li>
          ))}
          <li className="flex items-center gap-3 border-t border-zinc-800/70 pt-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10">
              <span className="font-mono text-[10px] font-black text-amber-400">×N</span>
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-zinc-300">Combo Chain</span>
              <span className="block text-[11px] text-zinc-500">
                Eat quickly in a row — up to ×8 multiplier
              </span>
            </span>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}

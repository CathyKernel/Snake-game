"use client";

import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import type { Direction } from "@/lib/game/types";
import { cn } from "@/lib/utils";

interface MobileControlsProps {
  onDirection: (dir: Direction) => void;
  className?: string;
}

function PadButton({
  dir,
  onPress,
  icon: Icon,
  label,
  className,
}: {
  dir: Direction;
  onPress: (dir: Direction) => void;
  icon: typeof ChevronUp;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={`Move ${label}`}
      onPointerDown={(e) => {
        e.preventDefault();
        onPress(dir);
      }}
      className={cn(
        "flex h-14 w-14 touch-none select-none items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80 text-emerald-400 shadow-lg active:scale-95 active:bg-emerald-500/20",
        className,
      )}
    >
      <Icon className="h-6 w-6" aria-hidden />
    </button>
  );
}

export function MobileControls({ onDirection, className }: MobileControlsProps) {
  return (
    <div className={cn("flex justify-center", className)} aria-label="Touch controls">
      <div className="grid grid-cols-3 gap-2">
        <span />
        <PadButton dir="up" onPress={onDirection} icon={ChevronUp} label="up" />
        <span />
        <PadButton dir="left" onPress={onDirection} icon={ChevronLeft} label="left" />
        <span className="flex items-center justify-center">
          <span className="h-2 w-2 rounded-full bg-zinc-800" aria-hidden />
        </span>
        <PadButton dir="right" onPress={onDirection} icon={ChevronRight} label="right" />
        <span />
        <PadButton dir="down" onPress={onDirection} icon={ChevronDown} label="down" />
        <span />
      </div>
    </div>
  );
}

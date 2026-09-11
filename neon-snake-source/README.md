# Neon Snake 🐍

A feature-complete Snake arcade game built with **Next.js 16 + TypeScript + Canvas**, featuring combos, power foods, three game modes, synthesized sound effects, and persistent high scores.

![Tech](https://img.shields.io/badge/Next.js-16-black) ![Tech](https://img.shields.io/badge/TypeScript-5-blue) ![Tech](https://img.shields.io/badge/Canvas-2D-green)

## Features

- **3 Game Modes**
  - `Classic` — walls are deadly, stay inside the board
  - `Wrap` — edges teleport you to the other side
  - `Obstacles` — walls plus randomly generated rock clusters
- **4 Difficulty Levels** — Easy / Medium / Hard / Insane (tick speed presets)
- **Combo System** — eat quickly to chain up to **x8** score multipliers
- **5 Special Foods** with limited lifetimes & blinking warnings:
  - 🍎 Apple (normal food) · ⭐ Golden Star (double points) · ⚡ Lightning (speed boost) · 💎 Diamond (bonus points) · 🍇 Grape (shrink your tail by 3)
- **Level Progression** — every 5 apples, speed ramps up, "LEVEL UP" toast
- **Juicy Feedback** — interpolated snake movement, glow effects, particles, floating score texts, death animation
- **Procedural SFX** — Web Audio API synthesized sounds (eat / special / level up / game over / new record / countdown), no audio files needed
- **Persistence** — high scores per mode+difficulty, lifetime stats, and preferences saved in `localStorage`
- **Full Controls** — Arrow keys / WASD, Space (pause), R (restart), Enter (start); touch swipe + on-screen D-pad on mobile
- **Auto-pause** when the window loses focus

## Quick Start

```bash
# 1. Install dependencies (bun recommended, npm/pnpm also work)
bun install

# 2. Set up the database (only needed for the placeholder API route)
bun run db:push

# 3. Start the dev server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) and play.

> The game is 100% client-side — no database or backend is required for gameplay.

## Deploy to Netlify

The repo ships with a ready-to-use `netlify.toml`, so **zero Netlify UI config is needed**.

### ⚠️ Important: repository structure

All files must sit at the **repository root** — do not upload the enclosing folder.
The repo must look exactly like this:

```
Snake-game/            ← repository root
├── src/
│   ├── app/           ← Next.js App Router (page.tsx, layout.tsx, globals.css)
│   ├── components/
│   ├── hooks/
│   └── lib/
├── public/
├── package.json
├── next.config.ts
├── netlify.toml       ← included
├── tsconfig.json
└── bun.lock
```

If `src/` ends up inside a subfolder (e.g. `Snake-game/neon-snake-source/src/`),
the build fails with *"Couldn't find any `pages` or `app` directory"*.

### Deploy steps

1. Push this project (with the structure above) to GitHub.
2. On Netlify: **Add new site → Import an existing project → GitHub → select the repo**.
3. Leave the build settings as detected — `netlify.toml` already sets:
   - Build command: `next build`
   - Publish directory: `.next`
   - Plugin: `@netlify/plugin-nextjs` (auto-installed)
4. Deploy. Done ✅

### Fixing the "Couldn't find any `pages` or `app` directory" error

This error means the Next.js source folders are nested in a subdirectory of the repo.
Fix with git:

```bash
# from inside your local clone of the repo
mv neon-snake-source/* .          # move everything up to the repo root
mv neon-snake-source/.* . 2>/dev/null || true
rmdir neon-snake-source

git add -A
git commit -m "Move project files to repository root"
git push origin main
```

Or simply delete the repo contents on github.com and re-upload the files from
the flat zip (`Select all → drag to the Upload files area`).


## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout + metadata (English)
│   ├── page.tsx                # Main page: layout, swipe handling, composition
│   ├── globals.css             # Tailwind + neon keyframe animations
│   └── api/route.ts            # Placeholder API (not needed by the game)
├── components/
│   ├── game/
│   │   ├── hud.tsx             # Score/Best/Level/Length tiles + combo & effect chips
│   │   ├── overlays.tsx        # Menu / countdown / paused / game-over screens
│   │   ├── settings-panel.tsx  # Mode / difficulty / sound settings
│   │   ├── legend-card.tsx     # Power-foods guide
│   │   ├── stats-panel.tsx     # Lifetime statistics
│   │   └── mobile-controls.tsx # Touch D-pad
│   └── ui/                     # shadcn/ui component library
├── hooks/
│   └── use-snake-game.ts       # React bridge: engine lifecycle, input, HUD sync
└── lib/
    ├── game/
    │   ├── types.ts            # All game type definitions
    │   ├── constants.ts        # Grid size, difficulties, foods, tuning
    │   ├── engine.ts           # SnakeGame class: loop, collisions, combos, levels
    │   ├── renderer.ts         # Canvas renderer: DPR-aware, glow, particles
    │   ├── sound.ts            # SoundManager: procedural Web Audio synth
    │   └── storage.ts          # localStorage: scores, stats, prefs
    └── utils.ts                # cn() helper
```

## Controls

| Key | Action |
| --- | --- |
| `↑ ← ↓ →` / `W A S D` | Steer the snake |
| `Space` | Pause / resume |
| `Enter` | Start game (from menu / game over) |
| `R` | Restart instantly |
| Swipe (mobile) | Steer |
| D-pad (mobile) | Steer |

## Tech Notes

- **Game loop**: `requestAnimationFrame` with fixed-tick movement and per-frame interpolation for buttery-smooth motion at any refresh rate.
- **Input queue**: 3-deep direction buffer with anti-reverse protection — fast double-turns never drop.
- **Rendering**: DPR-aware canvas (crisp on retina), checkerboard board, glowing food pulses, wrap-aware edge drawing, snake eyes that face the travel direction.
- **Sound**: All effects are synthesized with oscillators + gain envelopes at runtime; zero audio assets.

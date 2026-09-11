import {
  APPLES_PER_LEVEL,
  COLS,
  COMBO_WINDOW,
  COUNTDOWN_STEP_MS,
  DEATH_ANIM_MS,
  DIFFICULTIES,
  DIR_VECTORS,
  EFFECT_DURATIONS,
  FOOD_CONFIG,
  INTERVAL_MODIFIERS,
  LEVEL_BONUS,
  LEVEL_SPEEDUP,
  MAX_COMBO,
  MAX_SPECIALS,
  OPPOSITE,
  ROWS,
  SPECIAL_SPAWN_CHANCE,
} from "./constants";
import { GameRenderer } from "./renderer";
import { SoundManager } from "./sound";
import { getHighScore, setHighScore, bumpStats } from "./storage";
import type {
  Direction,
  Food,
  FoodType,
  GameCallbacks,
  GameState,
  Particle,
  Point,
} from "./types";

const INITIAL_LENGTH = 3;

function makeParticles(head: Point, color: string, count: number, speed = 1): Particle[] {
  const out: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const v = (0.0018 + Math.random() * 0.005) * speed;
    out.push({
      x: head.x + 0.5,
      y: head.y + 0.5,
      vx: Math.cos(angle) * v,
      vy: Math.sin(angle) * v,
      life: 420 + Math.random() * 380,
      maxLife: 800,
      size: 0.06 + Math.random() * 0.1,
      color,
    });
  }
  return out;
}

/**
 * Self-contained Snake game engine. Owns the game state, runs the
 * requestAnimationFrame loop, delegates rendering to GameRenderer and
 * notifies React through callbacks.
 */
export class SnakeGame {
  private state: GameState;
  private renderer: GameRenderer;
  private sound: SoundManager;
  private cbs: GameCallbacks;
  private rafId = 0;
  private lastFrame = 0;
  private destroyed = false;
  private nextFoodId = 1;
  private lastTickSecond = -1;

  constructor(
    canvas: HTMLCanvasElement,
    opts: { mode: GameState["mode"]; difficulty: GameState["difficulty"]; sound: SoundManager; callbacks: GameCallbacks },
  ) {
    this.renderer = new GameRenderer(canvas);
    this.sound = opts.sound;
    this.cbs = opts.callbacks;
    this.state = this.freshState(opts.mode, opts.difficulty, "menu");
    this.loop = this.loop.bind(this);
    this.rafId = requestAnimationFrame(this.loop);
  }

  // ------------------------------------------------------------------ lifecycle

  destroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.rafId);
    this.renderer.destroy();
  }

  getStatus(): GameState["status"] {
    return this.state.status;
  }

  getState(): GameState {
    return this.state;
  }

  /** Change mode/difficulty and return to the menu screen. */
  configure(mode: GameState["mode"], difficulty: GameState["difficulty"]): void {
    this.state = this.freshState(mode, difficulty, "menu");
  }

  /** Begin a new run from the menu or after game over. */
  startRun(): void {
    const s = this.freshState(this.state.mode, this.state.difficulty, "countdown");
    s.highScore = this.state.highScore;
    this.state = s;
    this.sound.countdownTick();
    this.lastTickSecond = 3;
  }

  pause(): void {
    const s = this.state;
    if (s.status !== "running") return;
    s.status = "paused";
    this.sound.click();
  }

  resume(): void {
    const s = this.state;
    if (s.status !== "paused") return;
    s.status = "countdown";
    s.countdownEnd = performance.now() + 3 * COUNTDOWN_STEP_MS;
    s.prevSnake = s.snake.map((p) => ({ ...p }));
    s.inputQueue = [];
    s.moveAcc = 0;
    this.lastTickSecond = 3;
    this.sound.countdownTick();
  }

  togglePause(): void {
    if (this.state.status === "running") this.pause();
    else if (this.state.status === "paused") this.resume();
  }

  queueDirection(dir: Direction): void {
    const s = this.state;
    if (s.status !== "running") return;
    const last = s.inputQueue.length > 0 ? s.inputQueue[s.inputQueue.length - 1] : s.direction;
    if (dir === last || OPPOSITE[dir] === last) return;
    if (s.inputQueue.length >= 3) s.inputQueue.shift();
    s.inputQueue.push(dir);
  }

  // ------------------------------------------------------------------ main loop

  private loop(timestamp: number): void {
    if (this.destroyed) return;
    const dt = Math.min(timestamp - (this.lastFrame || timestamp), 100);
    this.lastFrame = timestamp;
    this.update(dt, performance.now());
    const t = this.interpolationT();
    this.renderer.render(this.state, t, performance.now());
    this.cbs.onSync?.(this.state);
    this.rafId = requestAnimationFrame(this.loop);
  }

  private interpolationT(): number {
    const s = this.state;
    if (s.status !== "running") return 1;
    const interval = this.currentInterval();
    return Math.max(0, Math.min(1, s.moveAcc / interval));
  }

  private update(dt: number, now: number): void {
    const s = this.state;
    switch (s.status) {
      case "countdown": {
        const remaining = s.countdownEnd - now;
        const step = Math.ceil(remaining / COUNTDOWN_STEP_MS);
        if (step < this.lastTickSecond && step > 0) {
          this.lastTickSecond = step;
          this.sound.countdownTick();
        }
        if (remaining <= 0) {
          s.status = "running";
          this.sound.go();
        }
        break;
      }
      case "running": {
        s.time += dt;
        this.updateEffects(dt);
        s.moveAcc += dt;
        let guard = 0;
        while (s.moveAcc >= this.currentInterval() && s.status === "running" && guard < 4) {
          s.moveAcc -= this.currentInterval();
          this.tick();
          guard++;
        }
        this.expireFoods();
        this.updateFx(dt, now);
        break;
      }
      case "dying": {
        this.updateFx(dt, now);
        if (now - s.dyingSince > DEATH_ANIM_MS) {
          this.finishGameOver();
        }
        break;
      }
      default:
        break;
    }
  }

  private updateEffects(dt: number): void {
    const s = this.state;
    if (s.effects.speedBoost > 0) s.effects.speedBoost = Math.max(0, s.effects.speedBoost - dt);
    if (s.effects.slowDown > 0) s.effects.slowDown = Math.max(0, s.effects.slowDown - dt);
    if (s.effects.starPower > 0) s.effects.starPower = Math.max(0, s.effects.starPower - dt);
    if (s.combo > 1 && s.time > s.comboExpireAt) {
      s.combo = 1;
    }
  }

  private updateFx(dt: number, now: number): void {
    const s = this.state;
    for (const p of s.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.995;
      p.vy *= 0.995;
      p.life -= dt;
    }
    s.particles = s.particles.filter((p) => p.life > 0).slice(-160);
    s.texts = s.texts.filter((tx) => now - tx.bornAt < 850);
  }

  // --------------------------------------------------------------------- logic

  private currentInterval(): number {
    const s = this.state;
    const cfg = DIFFICULTIES[s.difficulty];
    let interval = cfg.baseInterval * Math.pow(LEVEL_SPEEDUP, s.level - 1);
    interval = Math.max(interval, cfg.minInterval);
    if (s.effects.speedBoost > 0) interval *= INTERVAL_MODIFIERS.boost;
    if (s.effects.slowDown > 0) interval *= INTERVAL_MODIFIERS.slow;
    return interval;
  }

  private tick(): void {
    const s = this.state;

    // consume one queued direction per tick
    while (s.inputQueue.length > 0) {
      const d = s.inputQueue.shift()!;
      if (d !== s.direction && OPPOSITE[d] !== s.direction) {
        s.direction = d;
        break;
      }
    }

    const v = DIR_VECTORS[s.direction];
    const head = s.snake[0];
    let nx = head.x + v.x;
    let ny = head.y + v.y;

    if (s.mode === "wrap") {
      nx = ((nx % COLS) + COLS) % COLS;
      ny = ((ny % ROWS) + ROWS) % ROWS;
    } else if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) {
      this.die("wall", head);
      return;
    }

    const willEat = s.foods.some((f) => f.pos.x === nx && f.pos.y === ny);

    // self collision (the tail cell is safe when it will move away this tick)
    const body = willEat || s.pendingGrowth > 0 ? s.snake : s.snake.slice(0, -1);
    if (body.some((seg) => seg.x === nx && seg.y === ny)) {
      this.die("self", head);
      return;
    }

    // obstacle collision
    if (s.obstacles.some((o) => o.x === nx && o.y === ny)) {
      this.die("obstacle", head);
      return;
    }

    s.prevSnake = s.snake.map((p) => ({ ...p }));
    s.snake.unshift({ x: nx, y: ny });

    if (s.pendingGrowth > 0) {
      s.pendingGrowth -= 1;
    } else {
      s.snake.pop();
    }

    const foodIdx = s.foods.findIndex((f) => f.pos.x === nx && f.pos.y === ny);
    if (foodIdx >= 0) {
      this.onEat(s.foods[foodIdx]);
    }
  }

  private onEat(food: Food): void {
    const s = this.state;
    s.foods = s.foods.filter((f) => f.id !== food.id);
    const cfg = FOOD_CONFIG[food.type];

    // combo
    s.combo = s.time <= s.comboExpireAt ? Math.min(s.combo + 1, MAX_COMBO) : 1;
    s.comboExpireAt = s.time + COMBO_WINDOW;
    if (s.combo > s.maxCombo) s.maxCombo = s.combo;

    const multiplier = s.combo * (s.effects.starPower > 0 ? 2 : 1);
    const pts = cfg.points * multiplier;
    s.score += pts;
    s.totalEaten += 1;
    s.pendingGrowth += cfg.grow;

    const head = s.snake[0];
    const star = s.effects.starPower > 0;

    // apply effects
    if (food.type === "speed") s.effects.speedBoost = EFFECT_DURATIONS.speedBoost;
    if (food.type === "slow") s.effects.slowDown = EFFECT_DURATIONS.slowDown;
    if (food.type === "star") s.effects.starPower = EFFECT_DURATIONS.starPower;
    if (food.type === "shrink" && s.snake.length > 3) {
      const keep = Math.max(3, s.snake.length - 3);
      s.snake = s.snake.slice(0, keep);
      s.prevSnake = s.snake.map((p) => ({ ...p }));
      s.pendingGrowth = 0;
    }

    // fx
    const isSpecial = food.type !== "apple";
    s.particles.push(
      ...makeParticles(food.pos, cfg.color, isSpecial ? 18 : 12, isSpecial ? 1.2 : 1),
    );
    const text = pts > 0 ? `+${pts}` : "-3";
    s.texts.push({
      x: food.pos.x,
      y: food.pos.y,
      text: s.combo > 2 ? `${text} x${s.combo}` : text,
      color: cfg.color,
      bornAt: performance.now(),
      size: isSpecial ? "lg" : "sm",
    });

    if (isSpecial) {
      this.sound.special();
    } else {
      this.sound.eat(s.combo);
      s.applesEaten += 1;
      if (s.applesEaten % APPLES_PER_LEVEL === 0) {
        this.levelUp(head);
      }
    }

    // respawn / spawn
    if (food.type === "apple") {
      this.spawnFood(s, "apple");
    }
    this.maybeSpawnSpecial(s);
  }

  private levelUp(at: Point): void {
    const s = this.state;
    s.level += 1;
    s.score += LEVEL_BONUS;
    s.texts.push({
      x: at.x,
      y: Math.max(2, at.y - 2),
      text: `LEVEL ${s.level}!`,
      color: "#34d399",
      bornAt: performance.now(),
      size: "lg",
    });
    s.particles.push(...makeParticles(at, "#34d399", 22, 1.4));
    this.sound.levelUp();
  }

  private maybeSpawnSpecial(s: GameState): void {
    const specials = s.foods.filter((f) => f.type !== "apple");
    if (specials.length >= MAX_SPECIALS) return;
    if (Math.random() > SPECIAL_SPAWN_CHANCE) return;

    const pool: { type: FoodType; weight: number }[] = (
      Object.keys(FOOD_CONFIG) as FoodType[]
    )
      .filter((t) => t !== "apple")
      .map((t) => ({ type: t, weight: FOOD_CONFIG[t].weight }));
    const total = pool.reduce((sum, p) => sum + p.weight, 0);
    let roll = Math.random() * total;
    let picked: FoodType = "golden";
    for (const p of pool) {
      roll -= p.weight;
      if (roll <= 0) {
        picked = p.type;
        break;
      }
    }
    this.spawnFood(s, picked);
  }

  private spawnFood(state: GameState, type: FoodType): void {
    const s = state;
    const occupied = new Set<string>();
    for (const p of s.snake) occupied.add(`${p.x},${p.y}`);
    for (const o of s.obstacles) occupied.add(`${o.x},${o.y}`);
    for (const f of s.foods) occupied.add(`${f.pos.x},${f.pos.y}`);

    // keep a small safety buffer in front of the head
    const head = s.snake[0];
    const v = DIR_VECTORS[s.direction];
    for (let k = 1; k <= 2; k++) {
      occupied.add(`${head.x + v.x * k},${head.y + v.y * k}`);
    }

    for (let attempt = 0; attempt < 600; attempt++) {
      const x = Math.floor(Math.random() * COLS);
      const y = Math.floor(Math.random() * ROWS);
      if (occupied.has(`${x},${y}`)) continue;
      const cfg = FOOD_CONFIG[type];
      s.foods.push({
        id: this.nextFoodId++,
        type,
        pos: { x, y },
        expiresAt: cfg.lifetime !== null ? s.time + cfg.lifetime : null,
      });
      return;
    }
  }

  private expireFoods(): void {
    const s = this.state;
    s.foods = s.foods.filter((f) => f.expiresAt === null || f.expiresAt > s.time);
    if (!s.foods.some((f) => f.type === "apple")) {
      this.spawnFood(s, "apple");
    }
  }

  private die(cause: NonNullable<GameState["deathCause"]>, head: Point): void {
    const s = this.state;
    s.status = "dying";
    s.dyingSince = performance.now();
    s.deathCause = cause;
    s.shakeUntil = performance.now() + 320;
    const color = cause === "wall" ? "#ef4444" : cause === "obstacle" ? "#a1a1aa" : "#f97316";
    s.particles.push(...makeParticles(head, color, 34, 1.8));
    this.sound.gameOver();
  }

  private finishGameOver(): void {
    const s = this.state;
    const isRecord = s.score > s.highScore && s.score > 0;
    s.status = "gameover";
    s.newRecord = isRecord;
    if (isRecord) {
      s.highScore = s.score;
      setHighScore(s.mode, s.difficulty, s.score);
      this.sound.newRecord();
    }
    bumpStats({ score: s.score, apples: s.applesEaten, maxCombo: s.maxCombo });
    this.cbs.onGameOver?.(this.state);
  }

  // ----------------------------------------------------------------- state init

  private initialSnake(): Point[] {
    const cx = Math.floor(COLS / 2);
    const cy = Math.floor(ROWS / 2);
    return [
      { x: cx, y: cy },
      { x: cx - 1, y: cy },
      { x: cx - 2, y: cy },
    ];
  }

  private generateObstacles(count: number): Point[] {
    const obstacles: Point[] = [];
    const occupied = new Set<string>();
    const cx = Math.floor(COLS / 2);
    const cy = Math.floor(ROWS / 2);

    const blocked = (x: number, y: number): boolean =>
      x < 2 || y < 2 || x >= COLS - 2 || y >= ROWS - 2 ||
      Math.abs(x - cx) + Math.abs(y - cy) < 6 ||
      occupied.has(`${x},${y}`);

    for (let c = 0; c < count; c++) {
      let sx = 0;
      let sy = 0;
      let found = false;
      for (let attempt = 0; attempt < 80; attempt++) {
        const x = 2 + Math.floor(Math.random() * (COLS - 4));
        const y = 2 + Math.floor(Math.random() * (ROWS - 4));
        if (!blocked(x, y)) {
          sx = x;
          sy = y;
          found = true;
          break;
        }
      }
      if (!found) continue;
      const clusterSize = 1 + Math.floor(Math.random() * 3);
      let px = sx;
      let py = sy;
      for (let i = 0; i < clusterSize; i++) {
        if (blocked(px, py)) break;
        obstacles.push({ x: px, y: py });
        occupied.add(`${px},${py}`);
        const dirs = [
          { x: 1, y: 0 },
          { x: -1, y: 0 },
          { x: 0, y: 1 },
          { x: 0, y: -1 },
        ];
        const d = dirs[Math.floor(Math.random() * dirs.length)];
        px += d.x;
        py += d.y;
      }
    }
    return obstacles;
  }

  private freshState(
    mode: GameState["mode"],
    difficulty: GameState["difficulty"],
    status: GameState["status"],
  ): GameState {
    const snake = this.initialSnake();
    const state: GameState = {
      status,
      mode,
      difficulty,
      cols: COLS,
      rows: ROWS,
      snake,
      prevSnake: snake.map((p) => ({ ...p })),
      direction: "right",
      inputQueue: [],
      pendingGrowth: 0,
      foods: [],
      obstacles: mode === "obstacles" ? this.generateObstacles(DIFFICULTIES[difficulty].obstacleClusters) : [],
      score: 0,
      highScore: getHighScore(mode, difficulty),
      level: 1,
      applesEaten: 0,
      totalEaten: 0,
      maxCombo: 1,
      combo: 1,
      comboExpireAt: 0,
      effects: { speedBoost: 0, slowDown: 0, starPower: 0 },
      time: 0,
      moveAcc: 0,
      countdownEnd: performance.now() + 3 * COUNTDOWN_STEP_MS,
      dyingSince: 0,
      shakeUntil: 0,
      particles: [],
      texts: [],
      deathCause: null,
      newRecord: false,
    };
    this.spawnFood(state, "apple");
    return state;
  }
}

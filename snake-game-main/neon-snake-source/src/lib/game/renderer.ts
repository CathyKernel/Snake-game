import {
  COLS,
  DIR_VECTORS,
  ROWS,
  SNAKE_BODY_FROM,
  SNAKE_BODY_TO,
  SNAKE_HEAD_COLOR,
} from "./constants";
import type { Direction, GameState, Point } from "./types";

/** Pre-computed body gradient stops from head to tail. */
const BODY_GRADIENT = buildGradient(SNAKE_BODY_FROM, SNAKE_BODY_TO, 14);
const STAR_GRADIENT = buildGradient("#fef08a", "#f59e0b", 14);

function buildGradient(from: string, to: string, steps: number): string[] {
  const f = hexToRgb(from);
  const t = hexToRgb(to);
  const out: string[] = [];
  for (let i = 0; i < steps; i++) {
    const k = steps === 1 ? 0 : i / (steps - 1);
    const r = Math.round(f.r + (t.r - f.r) * k);
    const g = Math.round(f.g + (t.g - f.g) * k);
    const b = Math.round(f.b + (t.b - f.b) * k);
    out.push(`rgb(${r},${g},${b})`);
  }
  return out;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, radius);
    return;
  }
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/**
 * Canvas renderer. Draws the board, snake (with interpolated motion),
 * foods with glow/pulse effects, particles and floating texts.
 */
export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private size = 0;
  private cell = 0;
  private dpr = 1;
  private ro: ResizeObserver | null = null;

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    this.ctx = ctx;
    this.observe();
  }

  private observe(): void {
    if (typeof ResizeObserver !== "undefined") {
      this.ro = new ResizeObserver(() => this.resize());
      this.ro.observe(this.canvas);
    }
    this.resize();
  }

  private resize(): void {
    const w = this.canvas.clientWidth;
    if (!w) return;
    this.dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2);
    this.size = w;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(w * this.dpr);
    this.cell = w / COLS;
  }

  destroy(): void {
    this.ro?.disconnect();
    this.ro = null;
  }

  render(state: GameState, t: number, now: number): void {
    if (!this.size) this.resize();
    const { ctx } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.size, this.size);
    ctx.save();

    if (now < state.shakeUntil) {
      const strength = ((state.shakeUntil - now) / 320) * 5;
      ctx.translate((Math.random() * 2 - 1) * strength, (Math.random() * 2 - 1) * strength);
    }

    this.drawBackground();
    this.drawBorder(state);
    this.drawObstacles(state);
    this.drawFoods(state, now);
    this.drawSnake(state, t, now);
    this.drawParticles(state);
    this.drawTexts(state, now);

    ctx.restore();
  }

  // ---------------------------------------------------------------- background

  private drawBackground(): void {
    const { ctx, cell } = this;
    ctx.fillStyle = "#09090b";
    ctx.fillRect(0, 0, this.size, this.size);
    ctx.fillStyle = "rgba(255,255,255,0.016)";
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if ((x + y) % 2 === 0) {
          ctx.fillRect(x * cell, y * cell, cell, cell);
        }
      }
    }
  }

  private drawBorder(state: GameState): void {
    const { ctx } = this;
    const inset = 2;
    const w = this.size - inset * 2;
    ctx.lineWidth = 3;

    if (state.mode === "wrap") {
      const grad = ctx.createLinearGradient(0, 0, this.size, this.size);
      grad.addColorStop(0, "#10b981");
      grad.addColorStop(0.5, "#8b5cf6");
      grad.addColorStop(1, "#10b981");
      ctx.strokeStyle = grad;
      ctx.setLineDash([10, 8]);
    } else if (state.effects.starPower > 0) {
      ctx.strokeStyle = "rgba(250,204,21,0.75)";
      ctx.shadowColor = "rgba(250,204,21,0.8)";
      ctx.shadowBlur = 18;
    } else {
      ctx.strokeStyle = "#27272a";
    }

    roundRectPath(ctx, inset, inset, w, w, 14);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
  }

  // ----------------------------------------------------------------- obstacles

  private drawObstacles(state: GameState): void {
    const { ctx, cell } = this;
    for (const o of state.obstacles) {
      const x = o.x * cell;
      const y = o.y * cell;
      ctx.fillStyle = "#3f3f46";
      roundRectPath(ctx, x + 1.5, y + 1.5, cell - 3, cell - 3, 4);
      ctx.fill();
      ctx.strokeStyle = "#52525b";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.07)";
      ctx.fillRect(x + 4, y + 4, cell - 8, 2);
    }
  }

  // --------------------------------------------------------------------- foods

  private drawFoods(state: GameState, now: number): void {
    for (const food of state.foods) {
      let alpha = 1;
      if (food.expiresAt !== null) {
        const remaining = food.expiresAt - state.time;
        if (remaining < 2400) {
          alpha = 0.35 + 0.65 * Math.abs(Math.sin(now / 110));
        }
      }
      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      switch (food.type) {
        case "apple":
          this.drawApple(food.pos, now);
          break;
        case "golden":
          this.drawGolden(food.pos, now);
          break;
        case "speed":
          this.drawSpeedBerry(food.pos, now);
          break;
        case "slow":
          this.drawSlowBerry(food.pos, now);
          break;
        case "shrink":
          this.drawShrink(food.pos, now);
          break;
        case "star":
          this.drawStar(food.pos, now);
          break;
      }
      this.ctx.restore();
    }
  }

  private center(pos: Point): { cx: number; cy: number } {
    return { cx: (pos.x + 0.5) * this.cell, cy: (pos.y + 0.5) * this.cell };
  }

  private drawApple(pos: Point, now: number): void {
    const { ctx, cell } = this;
    const { cx, cy } = this.center(pos);
    const pulse = 1 + 0.07 * Math.sin(now / 200);
    const r = cell * 0.3 * pulse;

    ctx.shadowColor = "rgba(239,68,68,0.85)";
    ctx.shadowBlur = 14;
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.beginPath();
    ctx.arc(cx - r * 0.32, cy - r * 0.34, r * 0.22, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#92400e";
    ctx.lineWidth = Math.max(1.5, cell * 0.05);
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.85);
    ctx.lineTo(cx + r * 0.12, cy - r * 1.25);
    ctx.stroke();

    ctx.fillStyle = "#22c55e";
    ctx.beginPath();
    ctx.ellipse(
      cx + r * 0.42,
      cy - r * 1.08,
      r * 0.4,
      r * 0.18,
      -Math.PI / 5,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  private drawGolden(pos: Point, now: number): void {
    const { ctx, cell } = this;
    const { cx, cy } = this.center(pos);
    const pulse = 1 + 0.1 * Math.sin(now / 160);
    const r = cell * 0.27 * pulse;

    ctx.shadowColor = "rgba(245,158,11,0.95)";
    ctx.shadowBlur = 20;
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = Math.max(1.5, cell * 0.055);
    const spin = now / 500;
    for (let i = 0; i < 8; i++) {
      const a = spin + (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r * 1.15, cy + Math.sin(a) * r * 1.15);
      ctx.lineTo(cx + Math.cos(a) * r * 1.7, cy + Math.sin(a) * r * 1.7);
      ctx.stroke();
    }

    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#fde68a";
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath();
    ctx.arc(cx - r * 0.3, cy - r * 0.3, r * 0.18, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawSpeedBerry(pos: Point, now: number): void {
    const { ctx, cell } = this;
    const { cx, cy } = this.center(pos);
    const r = cell * 0.28 * (1 + 0.08 * Math.sin(now / 170));

    ctx.shadowColor = "rgba(217,70,239,0.9)";
    ctx.shadowBlur = 16;
    ctx.fillStyle = "#d946ef";
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#ffffff";
    const s = r * 0.5;
    for (const off of [-s * 0.9, s * 0.35]) {
      ctx.beginPath();
      ctx.moveTo(cx + off, cy - s);
      ctx.lineTo(cx + off + s * 0.75, cy);
      ctx.lineTo(cx + off, cy + s);
      ctx.lineTo(cx + off + s * 0.28, cy);
      ctx.closePath();
      ctx.fill();
    }
  }

  private drawSlowBerry(pos: Point, now: number): void {
    const { ctx, cell } = this;
    const { cx, cy } = this.center(pos);
    const r = cell * 0.28 * (1 + 0.08 * Math.sin(now / 230));

    ctx.shadowColor = "rgba(139,92,246,0.9)";
    ctx.shadowBlur = 16;
    ctx.fillStyle = "#8b5cf6";
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = Math.max(1.5, cell * 0.05);
    const cr = r * 0.58;
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy - cr * 0.75);
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + cr * 0.55, cy + cr * 0.25);
    ctx.stroke();
  }

  private drawShrink(pos: Point, now: number): void {
    const { ctx, cell } = this;
    const { cx, cy } = this.center(pos);
    const r = cell * 0.3 * (1 + 0.08 * Math.sin(now / 190));

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 4 + Math.sin(now / 500) * 0.15);
    ctx.shadowColor = "rgba(251,113,133,0.9)";
    ctx.shadowBlur = 16;
    ctx.fillStyle = "#fb7185";
    roundRectPath(ctx, -r * 0.75, -r * 0.75, r * 1.5, r * 1.5, r * 0.25);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = Math.max(1.2, cell * 0.04);
    roundRectPath(ctx, -r * 0.36, -r * 0.36, r * 0.72, r * 0.72, r * 0.12);
    ctx.stroke();
    ctx.restore();
  }

  private drawStar(pos: Point, now: number): void {
    const { ctx, cell } = this;
    const { cx, cy } = this.center(pos);
    const outer = cell * 0.34 * (1 + 0.06 * Math.sin(now / 180));
    const inner = outer * 0.45;
    const rot = now / 900;

    ctx.shadowColor = "rgba(250,204,21,0.95)";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 === 0 ? outer : inner;
      const a = rot + (i * Math.PI) / 5 - Math.PI / 2;
      const px = cx + Math.cos(a) * rad;
      const py = cy + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.beginPath();
    ctx.arc(cx, cy, outer * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // --------------------------------------------------------------------- snake

  private lerpSegments(prev: Point, curr: Point, t: number): Point {
    let dx = curr.x - prev.x;
    let dy = curr.y - prev.y;
    if (dx > 1.5) dx -= COLS;
    else if (dx < -1.5) dx += COLS;
    if (dy > 1.5) dy -= ROWS;
    else if (dy < -1.5) dy += ROWS;
    let x = prev.x + dx * t;
    let y = prev.y + dy * t;
    x = ((x % COLS) + COLS) % COLS;
    y = ((y % ROWS) + ROWS) % ROWS;
    return { x, y };
  }

  private drawSnake(state: GameState, t: number, now: number): void {
    const { ctx, cell } = this;
    const len = state.snake.length;
    const dying = state.status === "dying";
    const star = state.effects.starPower > 0 && !dying;
    const gradient = star ? STAR_GRADIENT : BODY_GRADIENT;

    for (let i = len - 1; i >= 0; i--) {
      const curr = state.snake[i];
      const prev = state.prevSnake[Math.min(i, state.prevSnake.length - 1)] ?? curr;
      const p = this.lerpSegments(prev, curr, t);
      const positions = this.unwrapPositions(p, state.mode === "wrap");

      const ratio = len <= 1 ? 0 : i / (len - 1);
      const colorIdx = Math.min(gradient.length - 1, Math.round(ratio * (gradient.length - 1)));
      const isHead = i === 0;

      let color = isHead ? SNAKE_HEAD_COLOR : gradient[colorIdx];
      let alpha = 1;
      if (dying) {
        color = Math.floor(now / 90) % 2 === 0 ? "#ef4444" : "#7f1d1d";
        alpha = 0.55 + 0.45 * Math.abs(Math.sin(now / 90));
      }

      const seg = (isHead ? 0.86 : 0.74) * cell;
      ctx.save();
      ctx.globalAlpha = alpha;
      if (isHead || star) {
        ctx.shadowColor = star ? "rgba(250,204,21,0.9)" : "rgba(16,185,129,0.8)";
        ctx.shadowBlur = isHead ? 16 : 10;
      }
      ctx.fillStyle = color;
      for (const pos of positions) {
        const x = (pos.x + 0.5) * cell;
        const y = (pos.y + 0.5) * cell;
        roundRectPath(ctx, x - seg / 2, y - seg / 2, seg, seg, seg * 0.38);
        ctx.fill();
      }
      ctx.restore();

      if (isHead && !dying) {
        this.drawEyes(p, state.direction, star);
        if (state.effects.speedBoost > 0) {
          this.drawSpeedTrail(p, state.direction);
        }
      }
    }
  }

  /** In wrap mode, draw a second copy of a segment when it straddles an edge. */
  private unwrapPositions(p: Point, wrap: boolean): Point[] {
    if (!wrap) return [p];
    const out: Point[] = [p];
    if (p.x < 1) out.push({ x: p.x + COLS, y: p.y });
    else if (p.x > COLS - 1) out.push({ x: p.x - COLS, y: p.y });
    if (p.y < 1) out.push({ x: p.x, y: p.y + ROWS });
    else if (p.y > ROWS - 1) out.push({ x: p.x, y: p.y - ROWS });
    return out;
  }

  private drawEyes(head: Point, dir: Direction, star: boolean): void {
    const { ctx, cell } = this;
    const v = DIR_VECTORS[dir];
    const cx = (head.x + 0.5) * cell;
    const cy = (head.y + 0.5) * cell;
    const px = -v.y;
    const py = v.x;
    const eyeR = cell * 0.1;
    const pupilR = eyeR * 0.52;

    const eyeColor = star ? "#78350f" : "#022c22";
    for (const s of [-1, 1]) {
      const ex = cx + v.x * cell * 0.16 + px * s * cell * 0.17;
      const ey = cy + v.y * cell * 0.16 + py * s * cell * 0.17;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = eyeColor;
      ctx.beginPath();
      ctx.arc(ex + v.x * eyeR * 0.35, ey + v.y * eyeR * 0.35, pupilR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawSpeedTrail(head: Point, dir: Direction): void {
    const { ctx, cell } = this;
    const v = DIR_VECTORS[dir];
    const cx = (head.x + 0.5) * cell;
    const cy = (head.y + 0.5) * cell;
    for (let k = 1; k <= 3; k++) {
      ctx.fillStyle = `rgba(52,211,153,${0.18 - k * 0.05})`;
      ctx.beginPath();
      ctx.arc(cx - v.x * k * cell * 0.55, cy - v.y * k * cell * 0.55, cell * 0.32, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ------------------------------------------------------------ fx: particles

  private drawParticles(state: GameState): void {
    const { ctx } = this;
    for (const p of state.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x * this.cell, p.y * this.cell, p.size * (0.4 + 0.6 * alpha), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private drawTexts(state: GameState, now: number): void {
    const { ctx } = this;
    for (const text of state.texts) {
      const age = (now - text.bornAt) / 850;
      if (age < 0 || age > 1) continue;
      const x = (text.x + 0.5) * this.cell;
      const y = (text.y + 0.5) * this.cell - age * 36;
      ctx.globalAlpha = 1 - age;
      ctx.font = `bold ${text.size === "lg" ? 22 : 14}px "Geist Mono", ui-monospace, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(0,0,0,0.75)";
      ctx.strokeText(text.text, x, y);
      ctx.fillStyle = text.color;
      ctx.fillText(text.text, x, y);
    }
    ctx.globalAlpha = 1;
  }
}

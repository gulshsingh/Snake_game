import { Direction, GoldenApple, Obstacle, Point, Status, ThemeConfig } from "./types";
import { drawLionWarriorHead } from "./snakeHeadRenderer";

export interface SerpentRenderParams {
  ctx: CanvasRenderingContext2D;
  snake: Point[];
  prevSnake: Point[];
  dir: Direction;
  food: Point;
  golden: GoldenApple | null;
  bulges: { index: number; progress: number }[];
  c: number;
  interp: number;
  timeNow: number;
  theme: ThemeConfig;
  status: Status;
  hasStartedMoving: boolean;
  tongueTimer: number;
  mouthOpen: number;
  obstacles?: Obstacle[];
  cols?: number;
  rows?: number;
  speedMs?: number;
  goldenAuraUntil?: number;
}

interface RenderNode {
  x: number;
  y: number;
  radius: number;
  index: number;
}

const COLORS = {
  outline: "#4b2c86",
  suitDark: "#4f3b9c",
  suit: "#7a57bd",
  armor: "#a97ad3",
  armorLight: "#e2b8ee",
  rim: "#f0c4ea",
  skin: "#fbc06b",
};

function radial(
  ctx: CanvasRenderingContext2D, x: number, y: number, r: number,
  light: string, mid: string, dark: string
) {
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.4, r * 0.05, x, y, r * 1.15);
  g.addColorStop(0, light);
  g.addColorStop(0.5, mid);
  g.addColorStop(1, dark);
  return g;
}

function fillStroke(
  ctx: CanvasRenderingContext2D, fill: string | CanvasGradient,
  stroke: string, width: number
) {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.stroke();
}

function drawSpeedTrail(
  ctx: CanvasRenderingContext2D, tail: RenderNode, dir: Direction, c: number, speedMs: number
) {
  if (speedMs > 125) return;
  const intensity = Math.min(1, (130 - speedMs) / 55);
  ctx.save();
  ctx.strokeStyle = `rgba(216, 180, 254, ${0.22 + 0.25 * intensity})`;
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(1.2, c * 0.06);
  for (let s = -1; s <= 1; s++) {
    const off = s * c * 0.2;
    const perpX = -dir.y * off;
    const perpY = dir.x * off;
    const len = c * (0.45 + 0.4 * intensity) * (s === 0 ? 1.2 : 0.85);
    ctx.beginPath();
    ctx.moveTo(tail.x + perpX - dir.x * c * 0.15, tail.y + perpY - dir.y * c * 0.15);
    ctx.lineTo(tail.x + perpX - dir.x * (c * 0.15 + len), tail.y + perpY - dir.y * (c * 0.15 + len));
    ctx.stroke();
  }
  ctx.restore();
}

function drawTail(
  ctx: CanvasRenderingContext2D, nodes: RenderNode[], c: number, timeNow: number, fastWag: boolean
) {
  if (nodes.length < 2) return;
  const end = nodes[nodes.length - 1];
  const before = nodes[nodes.length - 2];

  ctx.save();
  ctx.translate(end.x, end.y);
  ctx.rotate(Math.atan2(end.y - before.y, end.x - before.x));
  const wag = Math.sin(timeNow * (fastWag ? 0.014 : 0.007)) * c * (fastWag ? 0.14 : 0.1);

  ctx.lineCap = "round";
  const stalk = () => {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(c * 0.34, -wag, c * 0.58, wag);
    ctx.stroke();
  };
  ctx.strokeStyle = "#a85a3a";
  ctx.lineWidth = c * 0.17;
  stalk();
  ctx.strokeStyle = COLORS.skin;
  ctx.lineWidth = c * 0.11;
  stalk();

  ctx.translate(c * 0.58, wag);
  ctx.beginPath();
  ctx.moveTo(-c * 0.04, 0);
  ctx.bezierCurveTo(c * 0.02, -c * 0.26, c * 0.27, -c * 0.2, c * 0.4, 0);
  ctx.bezierCurveTo(c * 0.27, c * 0.2, c * 0.02, c * 0.26, -c * 0.04, 0);
  ctx.closePath();
  fillStroke(ctx, radial(ctx, c * 0.15, 0, c * 0.24, "#efc0f0", "#a76fd0", "#66439f"), COLORS.outline, Math.max(1, c * 0.03));
  ctx.restore();
}

function drawArmorBody(
  ctx: CanvasRenderingContext2D, nodes: RenderNode[], c: number,
  timeNow: number, isGoldenAura: boolean, fastWag: boolean
) {
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  if ("filter" in ctx) {
    try {
      ctx.filter = `blur(${Math.max(2, c * 0.08)}px)`;
    } catch {}
  }
  nodes.forEach((node) => {
    ctx.beginPath();
    ctx.ellipse(node.x, node.y + c * 0.16, node.radius * 1.05, node.radius * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  drawTail(ctx, nodes, c, timeNow, fastWag || isGoldenAura);

  for (let i = nodes.length - 1; i >= 1; i--) {
    const curr = nodes[i];
    const next = nodes[i - 1];
    const dist = Math.hypot(next.x - curr.x, next.y - curr.y);
    const angle = Math.atan2(next.y - curr.y, next.x - curr.x);
    const R = curr.radius;
    const line = Math.max(0.85, c * 0.025);
    const softOutline = isGoldenAura ? "rgba(217, 119, 6, 0.72)" : "rgba(75, 44, 134, 0.56)";
    const len = dist > c * 2 ? 0 : dist;

    ctx.save();
    ctx.translate(curr.x, curr.y);
    ctx.rotate(angle);

    const nr = len ? next.radius * (i === 1 ? 0.9 : 1) : R;
    ctx.beginPath();
    ctx.arc(0, 0, R, Math.PI / 2, Math.PI * 1.5);
    ctx.lineTo(len, -nr);
    ctx.arc(len, 0, nr, -Math.PI / 2, Math.PI / 2);
    ctx.closePath();
    const suit = ctx.createLinearGradient(0, -R, 0, R);
    suit.addColorStop(0, COLORS.suitDark);
    suit.addColorStop(0.45, COLORS.suit);
    suit.addColorStop(1, COLORS.suitDark);
    fillStroke(ctx, suit, softOutline, line);

    for (const offset of len && i > 1 ? [len * 0.5, 0] : [0]) {
      ctx.save();
      ctx.translate(offset, 0);
      ctx.beginPath();
      ctx.moveTo(-R * 0.55, -R * 0.82);
      ctx.quadraticCurveTo(R * 0.3, -R * 1.06, R * 0.55, -R * 0.55);
      ctx.quadraticCurveTo(R * 0.98, 0, R * 0.55, R * 0.55);
      ctx.quadraticCurveTo(R * 0.3, R * 1.06, -R * 0.55, R * 0.82);
      ctx.quadraticCurveTo(-R * 0.15, 0, -R * 0.55, -R * 0.82);
      ctx.closePath();
      fillStroke(ctx, radial(ctx, 0, 0, R, COLORS.armorLight, COLORS.armor, "#7650b4"), softOutline, line);

      ctx.beginPath();
      ctx.ellipse(R * 0.28, -R * 0.38, R * 0.22, R * 0.11, 0.4, 0, Math.PI * 2);
      ctx.fillStyle = isGoldenAura ? "rgba(254, 240, 138, 0.8)" : "rgba(255, 232, 250, 0.65)";
      ctx.fill();

      ctx.strokeStyle = isGoldenAura ? "#fde047" : COLORS.rim;
      ctx.lineWidth = Math.max(0.9, R * 0.12);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-R * 0.44, -R * 0.7);
      ctx.quadraticCurveTo(-R * 0.03, 0, -R * 0.44, R * 0.7);
      ctx.stroke();
      ctx.restore();
    }

    if (len > 0) {
      ctx.strokeStyle = isGoldenAura ? "rgba(254, 240, 138, 0.36)" : "rgba(255, 232, 255, 0.26)";
      ctx.lineWidth = Math.max(1.2, R * 0.24);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, -R * 0.24);
      ctx.lineTo(len, -nr * 0.24);
      ctx.stroke();
    }

    if (i === Math.min(2, nodes.length - 1)) {
      ctx.beginPath();
      ctx.roundRect(-R * 0.2, -R * 0.98, R * 0.4, R * 1.96, R * 0.18);
      fillStroke(ctx, isGoldenAura ? "#facc15" : "#b788da", softOutline, line);
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.45, 0, Math.PI * 2);
      fillStroke(ctx, radial(ctx, 0, 0, R * 0.45, "#f6d3f2", "#b583da", "#7a52b5"), softOutline, line);
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.24, 0, Math.PI * 2);
      fillStroke(ctx, "#a672cd", isGoldenAura ? "#fef08a" : COLORS.rim, line);
    }

    if (i === 1) {
      [-1, 1].forEach((side) => {
        const y = side * R * 1.02;
        ctx.beginPath();
        ctx.ellipse(R * 0.35, y, R * 0.68, R * 0.5, side * 0.25, 0, Math.PI * 2);
        fillStroke(ctx, radial(ctx, R * 0.35, y, R * 0.65, "#f8d6f4", "#b985dc", "#7550b3"), softOutline, line);
        ctx.strokeStyle = isGoldenAura ? "#fde047" : COLORS.rim;
        ctx.lineWidth = Math.max(0.9, R * 0.12);
        ctx.beginPath();
        ctx.ellipse(R * 0.35, y, R * 0.52, R * 0.35, side * 0.25, Math.PI * 0.55, Math.PI * 1.45);
        ctx.stroke();
      });
    }
    ctx.restore();
  }
}

function checkHeadDanger(
  head: Point, dir: Direction, snake: Point[],
  obstacles?: Obstacle[], cols?: number, rows?: number
): boolean {
  const nx = head.x + dir.x;
  const ny = head.y + dir.y;
  if (cols && rows && (nx < 0 || ny < 0 || nx >= cols || ny >= rows)) return true;
  if (obstacles?.some((o) => o.x === nx && o.y === ny)) return true;
  return snake.slice(1, -1).some((s) => s.x === nx && s.y === ny);
}

/**
 * Renders the Purple-Maned Lion Warrior Snake with expressions, aura, and 4-way heads.
 */
export function drawSerpent(params: SerpentRenderParams): number {
  const {
    ctx, snake, prevSnake, dir, food, golden, bulges, c, interp, timeNow,
    status, hasStartedMoving, mouthOpen: prevMouthOpen,
    obstacles, cols, rows, speedMs = 140, goldenAuraUntil = 0,
  } = params;
  const snakeLen = snake.length;
  const headPosCurrent = snake[0];
  const targetFood = golden && golden.active ? golden : food;
  const dxFood = targetFood.x - headPosCurrent.x;
  const dyFood = targetFood.y - headPosCurrent.y;
  const distToFood = Math.hypot(dxFood, dyFood);

  const targetMouthOpen = distToFood <= 2.2 ? Math.min(1, (2.2 - distToFood) / 1.4) : 0;
  const mouthOpen = prevMouthOpen + (targetMouthOpen - prevMouthOpen) * 0.2;

  const isIdle = !hasStartedMoving || status !== "playing";
  const breatheScale = isIdle && status !== "over" ? 1 + 0.025 * Math.sin(timeNow * 0.0045) : 1;

  const nodes: RenderNode[] = [];
  for (let i = 0; i < snakeLen; i++) {
    const curr = snake[i];
    const prev = prevSnake[i] || curr;
    let px = prev.x + (curr.x - prev.x) * interp;
    let py = prev.y + (curr.y - prev.y) * interp;

    if (status === "playing" && hasStartedMoving && i > 0) {
      const wavePhase = timeNow * 0.01 + i * 0.72;
      const tNorm = i / Math.max(2, snakeLen - 1);
      const waveAmp = c * 0.085 * Math.sin(tNorm * Math.PI * 0.9 + 0.18);
      const refPrev = snake[i - 1] ?? curr;
      const segDirX = refPrev.x - curr.x;
      const segDirY = refPrev.y - curr.y;
      const len = Math.hypot(segDirX, segDirY) || 1;
      px += ((-segDirY / len) * waveAmp * Math.sin(wavePhase)) / c;
      py += ((segDirX / len) * waveAmp * Math.sin(wavePhase)) / c;
    }

    const taper = i === 0 ? 0.94 : 0.42 + 0.54 * (1 - i / snakeLen);
    let radius = c * 0.44 * taper * breatheScale;
    const activeBulge = bulges.find((b) => Math.abs(b.index - i) < 1.3);
    if (activeBulge) {
      radius *= 1 + 0.35 * (1 - Math.abs(activeBulge.index - i) / 1.3);
    }

    nodes.push({ x: (px + 0.5) * c, y: (py + 0.5) * c, radius, index: i });
  }

  const isGoldenAura = goldenAuraUntil > Date.now();
  if (status === "playing" && hasStartedMoving && nodes.length >= 1) {
    drawSpeedTrail(ctx, nodes[nodes.length - 1], dir, c, speedMs);
  }
  drawArmorBody(ctx, nodes, c, timeNow, isGoldenAura, speedMs <= 125);

  const inDanger = status === "playing" && hasStartedMoving && checkHeadDanger(headPosCurrent, dir, snake, obstacles, cols, rows);
  const rawLookX = distToFood > 0.2 && distToFood <= 4 ? dxFood / distToFood : dir.x;
  const rawLookY = distToFood > 0.2 && distToFood <= 4 ? dyFood / distToFood : dir.y;
  drawLionWarriorHead(ctx, nodes[0], dir, c, mouthOpen, rawLookX, rawLookY, {
    timeNow, status, inDanger, breatheScale,
  });

  return mouthOpen;
}

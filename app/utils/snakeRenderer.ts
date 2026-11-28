import { Direction, GoldenApple, Point, Status, ThemeConfig } from "./types";

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
}

/**
 * Renders the hyper-realistic slithering serpent (Shadow, Continuous Tubular Body, Viper Head).
 * Returns the updated mouthOpen interpolation value.
 */
export function drawSerpent({
  ctx,
  snake,
  prevSnake,
  dir,
  food,
  golden,
  bulges,
  c,
  interp,
  timeNow,
  theme,
  status,
  hasStartedMoving,
  tongueTimer,
  mouthOpen: prevMouthOpen,
}: SerpentRenderParams): number {
  const snakeLen = snake.length;

  // Distance from snake head to target food for Gaping Jaws animation
  const headPosCurrent = snake[0];
  const targetFood = golden && golden.active ? golden : food;
  const distToFood = Math.hypot(
    headPosCurrent.x - targetFood.x,
    headPosCurrent.y - targetFood.y
  );

  const targetMouthOpen = distToFood <= 2.2 ? Math.min(1, (2.2 - distToFood) / 1.4) : 0;
  const mouthOpen = prevMouthOpen + (targetMouthOpen - prevMouthOpen) * 0.2;

  // Pre-calculate interpolated smooth points with natural lateral spine undulation
  type RenderNode = { x: number; y: number; radius: number; index: number };
  const nodes: RenderNode[] = [];

  for (let i = 0; i < snakeLen; i++) {
    const curr = snake[i];
    const prev = prevSnake[i] || curr;

    let px = prev.x + (curr.x - prev.x) * interp;
    let py = prev.y + (curr.y - prev.y) * interp;

    // Serpentine lateral spine wave
    if (status === "playing" && hasStartedMoving && i > 0 && i < snakeLen - 1) {
      const wavePhase = timeNow * 0.009 + i * 0.65;
      const waveAmp = c * 0.07 * Math.sin((i / snakeLen) * Math.PI);
      const segDirX = curr.x - (snake[i + 1]?.x || curr.x);
      const segDirY = curr.y - (snake[i + 1]?.y || curr.y);
      const len = Math.hypot(segDirX, segDirY) || 1;
      const perpX = -segDirY / len;
      const perpY = segDirX / len;

      px += (perpX * waveAmp * Math.sin(wavePhase)) / c;
      py += (perpY * waveAmp * Math.sin(wavePhase)) / c;
    }

    const segX = (px + 0.5) * c;
    const segY = (py + 0.5) * c;

    const taper = i === 0 ? 0.95 : 0.45 + 0.55 * (1 - i / snakeLen);
    let radius = c * 0.42 * taper;

    // Digestion bulge swell
    const activeBulge = bulges.find((b) => Math.abs(b.index - i) < 1.3);
    if (activeBulge) {
      const bulgeStrength = 1 - Math.abs(activeBulge.index - i) / 1.3;
      radius *= 1 + 0.35 * bulgeStrength;
    }

    nodes.push({ x: segX, y: segY, radius, index: i });
  }

  // PASS 1: Ambient soft shadow cast under entire snake
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
  if ("filter" in ctx) {
    try {
      ctx.filter = `blur(${Math.max(2, c * 0.08)}px)`;
    } catch {}
  }
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    ctx.beginPath();
    ctx.ellipse(
      node.x,
      node.y + c * 0.14,
      node.radius * 1.05,
      node.radius * 0.85,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  ctx.restore();

  // PASS 2: CONTINUOUS CONNECTED TUBULAR REPTILE BODY
  for (let i = nodes.length - 1; i >= 1; i--) {
    const currNode = nodes[i];
    const nextNode = nodes[i - 1];

    const dx = nextNode.x - currNode.x;
    const dy = nextNode.y - currNode.y;
    const dist = Math.hypot(dx, dy) || 1;
    const nx = -dy / dist;
    const ny = dx / dist;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(currNode.x + nx * currNode.radius, currNode.y + ny * currNode.radius);
    ctx.lineTo(nextNode.x + nx * nextNode.radius, nextNode.y + ny * nextNode.radius);
    ctx.arc(nextNode.x, nextNode.y, nextNode.radius, Math.atan2(ny, nx), Math.atan2(-ny, -nx));
    ctx.lineTo(currNode.x - nx * currNode.radius, currNode.y - ny * currNode.radius);
    ctx.arc(currNode.x, currNode.y, currNode.radius, Math.atan2(-ny, -nx), Math.atan2(ny, nx));
    ctx.closePath();

    const bodyGrad = ctx.createLinearGradient(
      currNode.x - nx * currNode.radius,
      currNode.y - ny * currNode.radius,
      currNode.x + nx * currNode.radius,
      currNode.y + ny * currNode.radius
    );

    bodyGrad.addColorStop(0, theme.snakeBodyEnd);
    bodyGrad.addColorStop(0.35, theme.snakeBodyStart);
    bodyGrad.addColorStop(0.65, theme.snakeBelly);
    bodyGrad.addColorStop(1, theme.snakeBodyEnd);

    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // Dorsal Diamondback / Saddle Pattern
    if (i % 2 === 0) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
      ctx.beginPath();
      ctx.ellipse(
        currNode.x,
        currNode.y,
        currNode.radius * 0.45,
        currNode.radius * 0.7,
        Math.atan2(dy, dx),
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
      ctx.beginPath();
      ctx.ellipse(
        currNode.x,
        currNode.y,
        currNode.radius * 0.22,
        currNode.radius * 0.35,
        Math.atan2(dy, dx),
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Wet Cylindrical Spine Highlight
    ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
    ctx.lineWidth = Math.max(1.5, currNode.radius * 0.25);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(currNode.x + nx * (currNode.radius * 0.3), currNode.y + ny * (currNode.radius * 0.3));
    ctx.lineTo(nextNode.x + nx * (nextNode.radius * 0.3), nextNode.y + ny * (nextNode.radius * 0.3));
    ctx.stroke();

    ctx.restore();
  }

  // PASS 3: VIPER HEAD WITH GAPING MOUTH & FANGS
  const headNode = nodes[0];
  const headAngle = Math.atan2(dir.y, dir.x);

  ctx.save();
  ctx.translate(headNode.x, headNode.y);
  ctx.rotate(headAngle);

  if (mouthOpen > 0.05) {
    ctx.fillStyle = "#7f1d1d";
    ctx.beginPath();
    ctx.ellipse(c * 0.35, 0, c * 0.3 * mouthOpen, c * 0.35 * mouthOpen, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fb7185";
    ctx.beginPath();
    ctx.ellipse(c * 0.28, 0, c * 0.15 * mouthOpen, c * 0.2 * mouthOpen, 0, 0, Math.PI * 2);
    ctx.fill();

    const fangSpread = c * 0.28 * mouthOpen;
    const fangLen = c * 0.22 * mouthOpen;

    ctx.fillStyle = "#fdfbf7";
    [-1, 1].forEach((side) => {
      ctx.beginPath();
      ctx.moveTo(c * 0.4, side * fangSpread);
      ctx.lineTo(c * 0.4 + fangLen, side * (fangSpread * 0.7));
      ctx.lineTo(c * 0.34, side * (fangSpread * 0.85));
      ctx.closePath();
      ctx.fill();
    });
  }

  // Upper Head Cranium
  const headGrad = ctx.createRadialGradient(c * 0.1, -c * 0.1, c * 0.05, 0, 0, c * 0.6);
  headGrad.addColorStop(0, theme.snakeHead);
  headGrad.addColorStop(0.5, theme.snakeBodyStart);
  headGrad.addColorStop(1, theme.snakeBodyEnd);

  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.moveTo(c * 0.55, 0);
  ctx.quadraticCurveTo(c * 0.42, c * 0.42, -c * 0.28, c * 0.45);
  ctx.quadraticCurveTo(-c * 0.52, c * 0.22, -c * 0.45, 0);
  ctx.quadraticCurveTo(-c * 0.52, -c * 0.22, -c * 0.28, -c * 0.45);
  ctx.quadraticCurveTo(c * 0.42, -c * 0.42, c * 0.55, 0);
  ctx.closePath();
  ctx.fill();

  // Supraocular Brow Ridges
  ctx.strokeStyle = "rgba(0, 0, 0, 0.45)";
  ctx.lineWidth = Math.max(1.8, c * 0.05);
  [-1, 1].forEach((side) => {
    ctx.beginPath();
    ctx.arc(c * 0.12, side * c * 0.28, c * 0.16, -0.6 * side, 1.2 * side, side < 0);
    ctx.stroke();
  });

  // Nostrils & Loreal Pits
  ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
  [-1, 1].forEach((side) => {
    ctx.beginPath();
    ctx.arc(c * 0.42, side * c * 0.11, c * 0.035, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(c * 0.28, side * c * 0.22, c * 0.03, 0, Math.PI * 2);
    ctx.fill();
  });

  // Predatory Eyes
  [-c * 0.28, c * 0.28].forEach((ey) => {
    ctx.fillStyle = "#fffbeb";
    ctx.beginPath();
    ctx.ellipse(c * 0.1, ey, c * 0.15, c * 0.11, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = theme.snakeEyeIris;
    ctx.beginPath();
    ctx.arc(c * 0.12, ey, c * 0.085, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#09090b";
    ctx.beginPath();
    ctx.ellipse(c * 0.13, ey, c * 0.026, c * 0.075, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.beginPath();
    ctx.arc(c * 0.09, ey - c * 0.03, c * 0.028, 0, Math.PI * 2);
    ctx.fill();
  });

  // Forked Tongue
  const shouldFlickTongue = tongueTimer % 130 < 45 || distToFood <= 3.5;
  if (shouldFlickTongue && mouthOpen < 0.6 && status === "playing") {
    const tongueProgress = (tongueTimer % 45) / 45;
    const ext = Math.sin(tongueProgress * Math.PI);
    const tongueLen = c * 0.55 * ext;
    const quiver = Math.sin(timeNow * 0.05) * (c * 0.06);

    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = Math.max(1.8, c * 0.05);
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(c * 0.52, 0);
    ctx.lineTo(c * 0.52 + tongueLen * 0.65, quiver);
    ctx.moveTo(c * 0.52 + tongueLen * 0.65, quiver);
    ctx.lineTo(c * 0.52 + tongueLen, quiver - c * 0.14);
    ctx.moveTo(c * 0.52 + tongueLen * 0.65, quiver);
    ctx.lineTo(c * 0.52 + tongueLen, quiver + c * 0.14);
    ctx.stroke();
  }

  ctx.restore();
  return mouthOpen;
}

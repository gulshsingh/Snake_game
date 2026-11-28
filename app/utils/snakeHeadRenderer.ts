import { Direction, Status } from "./types";

export const HEAD_COLORS = {
  outline: "#4b2c86", skinLight: "#ffe0a3", skin: "#fbc06b", skinDark: "#e39254",
};
interface HeadExpr { timeNow: number; status: Status; isBlinking: boolean; inDanger: boolean; }

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

function drawLock(
  ctx: CanvasRenderingContext2D, r: number,
  x1: number, y1: number, x2: number, y2: number, w: number
) {
  const len = Math.hypot(x2 - x1, y2 - y1) * r;
  const W = w * r;
  ctx.save();
  ctx.translate(x1 * r, y1 * r);
  ctx.rotate(Math.atan2(y2 - y1, x2 - x1));
  ctx.beginPath();
  ctx.moveTo(0, -W * 0.7);
  ctx.bezierCurveTo(len * 0.5, -W * 1.25, len * 0.98, -W * 0.8, len, 0);
  ctx.bezierCurveTo(len * 0.9, W * 0.9, len * 0.4, W * 1.15, 0, W * 0.7);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, -W, len * 0.3, W);
  g.addColorStop(0, "#d59ae4");
  g.addColorStop(0.5, "#9a65c9");
  g.addColorStop(1, "#5a409b");
  fillStroke(ctx, g, HEAD_COLORS.outline, Math.max(0.9, r * 0.03));
  ctx.strokeStyle = "rgba(255, 214, 250, 0.55)";
  ctx.lineWidth = Math.max(1, W * 0.3);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(len * 0.42, -W * 0.52);
  ctx.quadraticCurveTo(len * 0.68, -W * 0.68, len * 0.84, -W * 0.34);
  ctx.stroke();
  ctx.restore();
}

function drawEarAt(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, scale = 0.31) {
  ctx.beginPath();
  ctx.arc(x, y, scale * r, 0, Math.PI * 2);
  fillStroke(
    ctx,
    radial(ctx, x, y, scale * r, HEAD_COLORS.skinLight, HEAD_COLORS.skin, HEAD_COLORS.skinDark),
    "rgba(154, 83, 64, 0.72)",
    Math.max(0.85, r * 0.032)
  );
  ctx.beginPath();
  ctx.arc(x, y + 0.01 * r, scale * 0.58 * r, 0, Math.PI * 2);
  ctx.fillStyle = radial(ctx, x, y, scale * 0.58 * r, "#f58bb0", "#dc6597", "#a9477f");
  ctx.fill();
}

function drawEyeFeature(
  ctx: CanvasRenderingContext2D, x: number, y: number, r: number,
  rx: number, ry: number, ir: number, lookX: number, lookY: number, expr: HeadExpr
) {
  if (expr.status === "over") {
    ctx.strokeStyle = "#35142a";
    ctx.lineWidth = Math.max(1.4, r * 0.06);
    ctx.lineCap = "round";
    const s = rx * 0.55;
    ctx.beginPath();
    ctx.moveTo(x - s, y - s);
    ctx.lineTo(x + s, y + s);
    ctx.moveTo(x + s, y - s);
    ctx.lineTo(x - s, y + s);
    ctx.stroke();
    return;
  }

  if (expr.isBlinking) {
    ctx.strokeStyle = "#35142a";
    ctx.lineWidth = Math.max(1.2, r * 0.055);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x - rx, y + ry * 0.15);
    ctx.quadraticCurveTo(x, y + ry * 0.48, x + rx, y + ry * 0.15);
    ctx.stroke();
    return;
  }

  const eyeScale = expr.inDanger ? 1.12 : 1;
  const shape = () => {
    ctx.beginPath();
    ctx.ellipse(x, y, rx * eyeScale, ry * eyeScale, 0, 0, Math.PI * 2);
  };
  shape();
  ctx.fillStyle = "#fff8ee";
  ctx.fill();

  ctx.save();
  shape();
  ctx.clip();
  const ix = x + lookX * 0.045 * r;
  const iy = y + 0.01 * r + lookY * 0.035 * r;
  const irisR = ir * (expr.inDanger ? 0.85 : 1);
  ctx.beginPath();
  ctx.arc(ix, iy, irisR, 0, Math.PI * 2);
  ctx.fillStyle = expr.inDanger ? "#6b21a8" : "#39246b";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(ix, iy, irisR * (expr.inDanger ? 0.45 : 0.6), 0, Math.PI * 2);
  ctx.fillStyle = "#170c36";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(ix + irisR * 0.3, iy - irisR * 0.35, Math.max(1, irisR * 0.3), 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = "#35142a";
  ctx.lineWidth = Math.max(1, r * 0.045);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.ellipse(x, y, rx * eyeScale, ry * eyeScale, 0, Math.PI * 1.08, Math.PI * 1.92);
  ctx.stroke();
}

function drawDizzyStars(ctx: CanvasRenderingContext2D, r: number, timeNow: number) {
  for (let k = 0; k < 3; k++) {
    const a = timeNow * 0.005 + (k * Math.PI * 2) / 3;
    ctx.fillStyle = k % 2 === 0 ? "#fde047" : "#f472b6";
    ctx.beginPath();
    ctx.arc(Math.cos(a) * r * 0.72, -1.25 * r + Math.sin(a) * r * 0.16, Math.max(1.8, r * 0.1), 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ------------------------ VIEW 1: FRONT (MOVING DOWN) ------------------------ */

function drawFrontHead(
  ctx: CanvasRenderingContext2D, r: number, mouthOpen: number,
  lookX: number, lookY: number, expr: HeadExpr
) {
  ctx.beginPath();
  ctx.ellipse(0, -0.06 * r, 1.04 * r, 1.0 * r, 0, 0, Math.PI * 2);
  fillStroke(ctx, radial(ctx, 0, -0.2 * r, 1.1 * r, "#b57fd8", "#7e55b8", "#4b378c"), HEAD_COLORS.outline, Math.max(1, r * 0.038));
  [-1, 1].forEach((s) => {
    drawLock(ctx, r, s * 0.4, 0.45, s * 0.98, 1.02, 0.25);
    drawLock(ctx, r, s * 0.5, 0.22, s * 1.25, 0.62, 0.27);
    drawLock(ctx, r, s * 0.55, -0.08, s * 1.33, 0.14, 0.28);
    drawLock(ctx, r, s * 0.52, -0.38, s * 1.27, -0.38, 0.29);
    drawLock(ctx, r, s * 0.4, -0.6, s * 1.06, -0.9, 0.29);
  });

  ctx.beginPath();
  ctx.moveTo(0, -0.7 * r);
  ctx.bezierCurveTo(0.55 * r, -0.72 * r, 0.76 * r, -0.52 * r, 0.76 * r, -0.12 * r);
  ctx.lineTo(0.76 * r, 0.26 * r);
  ctx.bezierCurveTo(0.76 * r, 0.7 * r, 0.46 * r, 0.86 * r, 0, 0.86 * r);
  ctx.bezierCurveTo(-0.46 * r, 0.86 * r, -0.76 * r, 0.7 * r, -0.76 * r, 0.26 * r);
  ctx.lineTo(-0.76 * r, -0.12 * r);
  ctx.bezierCurveTo(-0.76 * r, -0.52 * r, -0.55 * r, -0.72 * r, 0, -0.7 * r);
  ctx.closePath();
  ctx.save();
  ctx.shadowColor = "rgba(58, 22, 110, 0.28)";
  ctx.shadowBlur = Math.max(2, r * 0.12);
  fillStroke(ctx, radial(ctx, 0, 0, 0.95 * r, HEAD_COLORS.skinLight, HEAD_COLORS.skin, HEAD_COLORS.skinDark), "rgba(154, 83, 64, 0.65)", Math.max(0.85, r * 0.028));
  ctx.restore();

  [-1, 1].forEach((side) => drawEarAt(ctx, side * 0.72 * r, -0.58 * r, r));

  ctx.beginPath();
  ctx.moveTo(-0.57 * r, -0.57 * r);
  ctx.bezierCurveTo(-0.78 * r, -1.02 * r, -0.54 * r, -1.28 * r, -0.28 * r, -1.2 * r);
  ctx.bezierCurveTo(-0.24 * r, -1.48 * r, 0.2 * r, -1.5 * r, 0.27 * r, -1.26 * r);
  ctx.bezierCurveTo(0.62 * r, -1.32 * r, 0.8 * r, -1.0 * r, 0.57 * r, -0.57 * r);
  ctx.quadraticCurveTo(0.3 * r, -0.65 * r, 0.14 * r, -0.57 * r);
  ctx.lineTo(0, -0.45 * r);
  ctx.lineTo(-0.14 * r, -0.57 * r);
  ctx.quadraticCurveTo(-0.3 * r, -0.65 * r, -0.57 * r, -0.57 * r);
  ctx.closePath();
  const cg = ctx.createLinearGradient(-0.5 * r, -1.4 * r, 0.3 * r, -0.5 * r);
  cg.addColorStop(0, "#c88ee2");
  cg.addColorStop(0.45, "#e5a9e8");
  cg.addColorStop(1, "#8f5cc4");
  fillStroke(ctx, cg, "rgba(75, 44, 134, 0.78)", Math.max(0.9, r * 0.032));

  [-1, 1].forEach((side) => {
    const x = side * 0.37 * r;
    drawEyeFeature(ctx, x, -0.04 * r, r, 0.19 * r, 0.18 * r, 0.135 * r, lookX, lookY, expr);
    const lift = expr.inDanger ? -0.06 * r : 0;
    ctx.beginPath();
    ctx.moveTo(side * 0.64 * r, -0.28 * r + lift);
    ctx.quadraticCurveTo(side * 0.45 * r, -0.52 * r + lift, side * 0.13 * r, -0.33 * r + lift);
    ctx.quadraticCurveTo(side * 0.09 * r, -0.22 * r + lift, side * 0.18 * r, -0.21 * r + lift);
    ctx.quadraticCurveTo(side * 0.42 * r, -0.36 * r + lift, side * 0.64 * r, -0.28 * r + lift);
    ctx.closePath();
    fillStroke(ctx, "#9566c8", "#63429d", Math.max(1, r * 0.025));
  });

  ctx.fillStyle = "rgba(255, 230, 180, 0.75)";
  [-1, 1].forEach((side) => {
    ctx.beginPath();
    ctx.ellipse(side * 0.17 * r, 0.4 * r, 0.25 * r, 0.21 * r, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.strokeStyle = "#4a1c22";
  ctx.lineWidth = Math.max(1, r * 0.045);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 0.34 * r);
  ctx.lineTo(0, 0.49 * r);
  ctx.stroke();

  if (mouthOpen > 0.18 && expr.status !== "over") {
    ctx.beginPath();
    ctx.ellipse(0, 0.6 * r, 0.2 * r * mouthOpen, 0.17 * r * mouthOpen, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#6b152a";
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, 0.65 * r, 0.11 * r * mouthOpen, 0.08 * r * mouthOpen, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#fb7185";
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(-0.4 * r, 0.45 * r);
    ctx.quadraticCurveTo(-0.2 * r, expr.status === "over" ? 0.39 * r : 0.57 * r, 0, 0.49 * r);
    ctx.quadraticCurveTo(0.22 * r, expr.status === "over" ? 0.39 * r : 0.58 * r, 0.42 * r, 0.42 * r);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(-0.23 * r, 0.16 * r);
  ctx.quadraticCurveTo(0, 0.08 * r, 0.23 * r, 0.16 * r);
  ctx.quadraticCurveTo(0.2 * r, 0.26 * r, 0, 0.37 * r);
  ctx.quadraticCurveTo(-0.2 * r, 0.26 * r, -0.23 * r, 0.16 * r);
  ctx.closePath();
  fillStroke(ctx, radial(ctx, 0, 0.21 * r, 0.24 * r, "#c99be8", "#7c4cb0", "#53308a"), "#45246f", Math.max(1, r * 0.02));
}

/* --------------------- VIEW 2: SIDE / 3-4 (LEFT & RIGHT) --------------------- */

function drawSideHead(
  ctx: CanvasRenderingContext2D, r: number, mouthOpen: number,
  lookX: number, lookY: number, expr: HeadExpr
) {
  drawEarAt(ctx, 0.24 * r, -0.62 * r, r, 0.24);
  ctx.beginPath();
  ctx.ellipse(-0.24 * r, -0.04 * r, 0.82 * r, 0.9 * r, 0, 0, Math.PI * 2);
  fillStroke(ctx, radial(ctx, -0.2 * r, -0.2 * r, 0.95 * r, "#b57fd8", "#7e55b8", "#4b378c"), HEAD_COLORS.outline, Math.max(0.9, r * 0.036));
  drawLock(ctx, r, -0.35, 0.42, -0.95, 0.92, 0.25);
  drawLock(ctx, r, -0.45, 0.18, -1.16, 0.48, 0.27);
  drawLock(ctx, r, -0.48, -0.1, -1.24, 0.04, 0.28);
  drawLock(ctx, r, -0.44, -0.38, -1.14, -0.46, 0.28);
  drawLock(ctx, r, -0.3, -0.62, -0.92, -0.96, 0.28);

  ctx.beginPath();
  ctx.moveTo(-0.34 * r, -0.58 * r);
  ctx.bezierCurveTo(0.18 * r, -0.74 * r, 0.6 * r, -0.52 * r, 0.64 * r, -0.1 * r);
  ctx.bezierCurveTo(0.84 * r, 0.02 * r, 0.88 * r, 0.34 * r, 0.66 * r, 0.56 * r);
  ctx.bezierCurveTo(0.46 * r, 0.78 * r, 0.04 * r, 0.8 * r, -0.26 * r, 0.64 * r);
  ctx.bezierCurveTo(-0.48 * r, 0.44 * r, -0.5 * r, -0.26 * r, -0.34 * r, -0.58 * r);
  ctx.closePath();
  ctx.save();
  ctx.shadowColor = "rgba(58, 22, 110, 0.26)";
  ctx.shadowBlur = Math.max(1.8, r * 0.1);
  fillStroke(ctx, radial(ctx, 0.18 * r, -0.04 * r, 0.92 * r, HEAD_COLORS.skinLight, HEAD_COLORS.skin, HEAD_COLORS.skinDark), "rgba(154, 83, 64, 0.65)", Math.max(0.85, r * 0.028));
  ctx.restore();

  ctx.fillStyle = "rgba(255, 232, 185, 0.72)";
  ctx.beginPath();
  ctx.ellipse(0.48 * r, 0.32 * r, 0.3 * r, 0.22 * r, -0.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-0.46 * r, -0.52 * r);
  ctx.bezierCurveTo(-0.66 * r, -0.98 * r, -0.3 * r, -1.26 * r, -0.02 * r, -1.16 * r);
  ctx.bezierCurveTo(0.14 * r, -1.42 * r, 0.54 * r, -1.26 * r, 0.46 * r, -0.54 * r);
  ctx.quadraticCurveTo(0.14 * r, -0.62 * r, -0.16 * r, -0.52 * r);
  ctx.closePath();
  const cg = ctx.createLinearGradient(-0.4 * r, -1.3 * r, 0.4 * r, -0.5 * r);
  cg.addColorStop(0, "#c88ee2");
  cg.addColorStop(0.5, "#e5a9e8");
  cg.addColorStop(1, "#8f5cc4");
  fillStroke(ctx, cg, "rgba(75, 44, 134, 0.78)", Math.max(0.9, r * 0.032));

  drawEarAt(ctx, -0.24 * r, -0.5 * r, r, 0.28);

  drawEyeFeature(ctx, 0.52 * r, -0.08 * r, r, 0.11 * r, 0.17 * r, 0.095 * r, lookX, lookY, expr);
  drawEyeFeature(ctx, 0.16 * r, -0.05 * r, r, 0.2 * r, 0.21 * r, 0.138 * r, lookX, lookY, expr);

  const lift = expr.inDanger ? -0.05 * r : 0;
  ctx.beginPath();
  ctx.moveTo(-0.08 * r, -0.28 * r + lift);
  ctx.quadraticCurveTo(0.18 * r, -0.46 * r + lift, 0.42 * r, -0.27 * r + lift);
  ctx.quadraticCurveTo(0.42 * r, -0.18 * r + lift, 0.34 * r, -0.18 * r + lift);
  ctx.quadraticCurveTo(0.16 * r, -0.32 * r + lift, -0.08 * r, -0.28 * r + lift);
  ctx.closePath();
  fillStroke(ctx, "#9566c8", "#63429d", Math.max(0.9, r * 0.025));

  ctx.beginPath();
  ctx.moveTo(0.56 * r, 0.06 * r);
  ctx.quadraticCurveTo(0.76 * r, 0.04 * r, 0.8 * r, 0.16 * r);
  ctx.quadraticCurveTo(0.74 * r, 0.28 * r, 0.6 * r, 0.25 * r);
  ctx.closePath();
  fillStroke(ctx, radial(ctx, 0.68 * r, 0.14 * r, 0.18 * r, "#c99be8", "#7c4cb0", "#53308a"), "#45246f", Math.max(0.85, r * 0.02));

  if (mouthOpen > 0.18 && expr.status !== "over") {
    ctx.beginPath();
    ctx.ellipse(0.62 * r, 0.42 * r, 0.18 * r * mouthOpen, 0.14 * r * mouthOpen, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#6b152a";
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0.65 * r, 0.46 * r, 0.1 * r * mouthOpen, 0.07 * r * mouthOpen, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#fb7185";
    ctx.fill();
  } else {
    ctx.strokeStyle = "#4a1c22";
    ctx.lineWidth = Math.max(1, r * 0.042);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0.71 * r, 0.25 * r);
    ctx.lineTo(0.71 * r, 0.36 * r);
    ctx.quadraticCurveTo(0.5 * r, expr.status === "over" ? 0.31 * r : 0.48 * r, 0.28 * r, 0.38 * r);
    ctx.stroke();
  }
}

/* ------------------------ VIEW 3: BACK / CROWN (MOVING UP) ------------------------ */

function drawUpHead(ctx: CanvasRenderingContext2D, r: number) {
  [-1, 1].forEach((side) => drawEarAt(ctx, side * 0.7 * r, -0.4 * r, r, 0.3));
  ctx.beginPath();
  ctx.ellipse(0, 0, 1.0 * r, 0.96 * r, 0, 0, Math.PI * 2);
  fillStroke(ctx, radial(ctx, 0, -0.25 * r, 1.08 * r, "#d59ae4", "#8a57c6", "#4b378c"), HEAD_COLORS.outline, Math.max(1, r * 0.036));
  [-1, 1].forEach((s) => {
    drawLock(ctx, r, s * 0.32, 0.32, s * 0.88, 0.92, 0.28);
    drawLock(ctx, r, s * 0.46, 0.05, s * 1.18, 0.46, 0.29);
    drawLock(ctx, r, s * 0.44, -0.28, s * 1.12, -0.26, 0.29);
    drawLock(ctx, r, s * 0.28, -0.54, s * 0.86, -0.92, 0.28);
  });
  drawLock(ctx, r, 0, -0.35, 0, -1.16, 0.34);
}

/**
 * Draws the 4-direction Lion Warrior Head with blinking, danger alert, and KO stars.
 */
export function drawLionWarriorHead(
  ctx: CanvasRenderingContext2D, head: { x: number; y: number }, dir: Direction,
  c: number, mouthOpen: number, lookX: number, lookY: number,
  options: { timeNow: number; status: Status; inDanger: boolean; breatheScale: number }
) {
  const r = c * 0.6 * options.breatheScale;
  const expr: HeadExpr = {
    timeNow: options.timeNow,
    status: options.status,
    isBlinking: options.status !== "over" && !options.inDanger && options.timeNow % 3800 < 140,
    inDanger: options.inDanger,
  };

  ctx.save();
  ctx.translate(head.x, head.y);

  if (Math.abs(dir.x) >= Math.abs(dir.y)) {
    const facingLeft = dir.x < 0;
    if (facingLeft) ctx.scale(-1, 1);
    drawSideHead(ctx, r, mouthOpen, facingLeft ? -lookX : lookX, lookY, expr);
  } else if (dir.y < 0) {
    drawUpHead(ctx, r);
  } else {
    drawFrontHead(ctx, r, mouthOpen, lookX, lookY, expr);
  }

  if (options.status === "over") {
    drawDizzyStars(ctx, r, options.timeNow);
  }

  ctx.restore();
}

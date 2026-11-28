import {
  Direction,
  FloatingText,
  GoldenApple,
  Particle,
  Point,
  ThemeConfig,
} from "./types";

export function pushJuiceParticles(
  particles: Particle[],
  x: number,
  y: number,
  color: string,
  count = 16
) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const speed = Math.random() * 3.5 + 1.2;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color,
      size: Math.random() * 3.5 + 1.5,
      alpha: 1,
      decay: Math.random() * 0.03 + 0.015,
      gravity: 0.08,
    });
  }
}

export function pushGoldenStars(
  particles: Particle[],
  x: number,
  y: number,
  count = 26
) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 4.5 + 2;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: i % 2 === 0 ? "#fbbf24" : "#fef08a",
      size: Math.random() * 4 + 2,
      alpha: 1,
      decay: Math.random() * 0.02 + 0.01,
      gravity: 0.04,
    });
  }
}

export function pushDeathParticles(
  particles: Particle[],
  x: number,
  y: number,
  color: string
) {
  for (let i = 0; i < 35; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 5 + 1.5;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: i % 3 === 0 ? "#ef4444" : color,
      size: Math.random() * 4 + 2,
      alpha: 1,
      decay: Math.random() * 0.025 + 0.01,
      gravity: 0.12,
    });
  }
}

export function pushFloatingText(
  floatingTexts: FloatingText[],
  text: string,
  x: number,
  y: number,
  color = "#ffffff"
) {
  floatingTexts.push({
    id: Date.now() + Math.random(),
    text,
    x,
    y,
    color,
    alpha: 1,
    vy: -1.2,
    scale: 1,
  });
}

export function drawApples(
  ctx: CanvasRenderingContext2D,
  food: Point,
  golden: GoldenApple | null,
  c: number,
  theme: ThemeConfig,
  timeNow: number
) {
  // Golden Apple
  if (golden && golden.active) {
    const gx = (golden.x + 0.5) * c;
    const gy = (golden.y + 0.5) * c;
    const bob = Math.sin(timeNow * 0.007) * (c * 0.08);

    const aura = ctx.createRadialGradient(gx, gy + bob, c * 0.1, gx, gy + bob, c * 0.85);
    aura.addColorStop(0, "rgba(250, 204, 21, 0.55)");
    aura.addColorStop(1, "rgba(250, 204, 21, 0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(gx, gy + bob, c * 0.85, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(0,0,0,0.32)";
    ctx.beginPath();
    ctx.ellipse(gx, gy + c * 0.35, c * 0.38, c * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();

    const goldGrad = ctx.createRadialGradient(
      gx - c * 0.1,
      gy + bob - c * 0.1,
      c * 0.05,
      gx,
      gy + bob,
      c * 0.42
    );
    goldGrad.addColorStop(0, "#fef08a");
    goldGrad.addColorStop(0.5, "#eab308");
    goldGrad.addColorStop(1, "#a16207");
    ctx.fillStyle = goldGrad;
    ctx.beginPath();
    ctx.arc(gx, gy + bob, c * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(gx - c * 0.12, gy + bob - c * 0.12, c * 0.07, 0, Math.PI * 2);
    ctx.fill();

    const progress = golden.timeLeft / golden.maxTime;
    ctx.strokeStyle = "#fef08a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(gx, gy + bob, c * 0.5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
    ctx.stroke();
  }

  // Regular 3D Apple
  const ax = (food.x + 0.5) * c;
  const ay = (food.y + 0.5) * c;
  const appleBob = Math.sin(timeNow * 0.005) * (c * 0.06);

  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.ellipse(ax, ay + c * 0.35, c * 0.34, c * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();

  const appleGrad = ctx.createRadialGradient(
    ax - c * 0.12,
    ay + appleBob - c * 0.1,
    c * 0.05,
    ax,
    ay + appleBob,
    c * 0.38
  );
  appleGrad.addColorStop(0, theme.appleHighlight);
  appleGrad.addColorStop(0.35, theme.appleColor);
  appleGrad.addColorStop(1, "#831843");

  ctx.fillStyle = appleGrad;
  ctx.beginPath();
  ctx.arc(ax, ay + appleBob + c * 0.04, c * 0.38, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
  ctx.beginPath();
  ctx.ellipse(
    ax - c * 0.14,
    ay + appleBob - c * 0.08,
    c * 0.1,
    c * 0.05,
    -Math.PI / 4,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.strokeStyle = "#78350f";
  ctx.lineWidth = Math.max(2.5, c * 0.08);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(ax, ay + appleBob - c * 0.28);
  ctx.quadraticCurveTo(
    ax + c * 0.08,
    ay + appleBob - c * 0.45,
    ax + c * 0.15,
    ay + appleBob - c * 0.48
  );
  ctx.stroke();

  ctx.fillStyle = "#22c55e";
  ctx.beginPath();
  ctx.ellipse(
    ax + c * 0.18,
    ay + appleBob - c * 0.4,
    c * 0.15,
    c * 0.08,
    Math.PI / 5,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

export function drawParticlesAndTexts(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  floatingTexts: FloatingText[],
  c: number
) {
  for (let pIdx = particles.length - 1; pIdx >= 0; pIdx--) {
    const p = particles[pIdx];
    p.x += p.vx;
    p.y += p.vy;
    if (p.gravity) p.vy += p.gravity;
    p.vx *= 0.96;
    p.vy *= 0.96;
    p.alpha -= p.decay;

    if (p.alpha <= 0) {
      particles.splice(pIdx, 1);
      continue;
    }

    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.alpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  for (let tIdx = floatingTexts.length - 1; tIdx >= 0; tIdx--) {
    const ft = floatingTexts[tIdx];
    ft.y += ft.vy;
    ft.alpha -= 0.018;

    if (ft.alpha <= 0) {
      floatingTexts.splice(tIdx, 1);
      continue;
    }

    ctx.save();
    ctx.font = `900 ${Math.round(c * 0.7)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(0,0,0,0.85)";
    ctx.lineWidth = Math.max(2.5, c * 0.14);
    ctx.globalAlpha = ft.alpha;
    ctx.strokeText(ft.text, ft.x, ft.y);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  }
}

export function drawReadyHint(
  ctx: CanvasRenderingContext2D,
  cols: number,
  rows: number,
  c: number,
  timeNow: number
) {
  ctx.save();
  const pulse = 0.8 + Math.sin(timeNow * 0.006) * 0.2;
  ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
  ctx.font = `bold ${Math.max(12, Math.round(c * 0.52))}px sans-serif`;
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0,0,0,0.9)";
  ctx.shadowBlur = 6;
  ctx.fillText("👆 Swipe or tap D-Pad to move", (cols * c) / 2, Math.round((rows - 2.5) * c));
  ctx.restore();
}

export function drawResumeGraceOverlay(
  ctx: CanvasRenderingContext2D,
  head: Point,
  dir: Direction,
  width: number,
  height: number,
  c: number,
  accent: string,
  graceMs: number
) {
  const countNum = Math.ceil(graceMs / 400);
  const hx = (head.x + dir.x * 1.15 + 0.5) * c;
  const hy = (head.y + dir.y * 1.15 + 0.5) * c;

  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(Math.atan2(dir.y, dir.x));
  ctx.fillStyle = "rgba(52, 211, 153, 0.85)";
  ctx.beginPath();
  ctx.moveTo(c * 0.28, 0);
  ctx.lineTo(-c * 0.14, -c * 0.18);
  ctx.lineTo(-c * 0.14, c * 0.18);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, Math.max(24, c * 1.15), 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = `900 ${Math.max(22, Math.round(c * 1.1))}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(countNum), width / 2, height / 2 + 1);
  ctx.restore();
}

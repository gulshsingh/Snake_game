import { Obstacle, ThemeConfig } from "./types";

let cachedBoardCanvas: HTMLCanvasElement | null = null;
let cachedBoardKey = "";

function buildStaticBoardCanvas(
  cols: number,
  rows: number,
  c: number,
  theme: ThemeConfig
): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  const width = cols * c;
  const height = rows * c;
  if (!cachedBoardCanvas) {
    cachedBoardCanvas = document.createElement("canvas");
  }
  if (cachedBoardCanvas.width !== width) cachedBoardCanvas.width = width;
  if (cachedBoardCanvas.height !== height) cachedBoardCanvas.height = height;

  const off = cachedBoardCanvas.getContext("2d");
  if (!off) return null;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      off.fillStyle = (x + y) % 2 === 0 ? theme.boardBg1 : theme.boardBg2;
      off.fillRect(x * c, y * c, c, c);

      const hash = (x * 31 + y * 17 + x * y * 7) % 29;
      const px = x * c;
      const py = y * c;

      switch (theme.id) {
        case "jungle": {
          if (hash === 0 || hash === 11) {
            off.fillStyle = "rgba(134, 239, 172, 0.08)";
            off.beginPath();
            off.ellipse(px + c * 0.35, py + c * 0.45, c * 0.16, c * 0.07, -0.5, 0, Math.PI * 2);
            off.fill();
          } else if (hash === 5) {
            off.fillStyle = "rgba(255, 255, 255, 0.04)";
            off.fillRect(px + c * 0.35, py + c * 0.35, c * 0.08, c * 0.28);
          }
          break;
        }
        case "desert": {
          if (hash % 7 === 0) {
            off.strokeStyle = "rgba(254, 243, 199, 0.08)";
            off.lineWidth = Math.max(1, c * 0.04);
            off.beginPath();
            off.moveTo(px + c * 0.15, py + c * 0.55);
            off.quadraticCurveTo(px + c * 0.5, py + c * 0.38, px + c * 0.85, py + c * 0.55);
            off.stroke();
          }
          break;
        }
        case "ice": {
          if (hash === 2 || hash === 14) {
            off.strokeStyle = "rgba(224, 242, 254, 0.14)";
            off.lineWidth = Math.max(1, c * 0.04);
            off.beginPath();
            off.moveTo(px + c * 0.25, py + c * 0.25);
            off.lineTo(px + c * 0.65, py + c * 0.6);
            off.lineTo(px + c * 0.78, py + c * 0.45);
            off.stroke();
          } else if (hash === 9) {
            off.fillStyle = "rgba(255, 255, 255, 0.18)";
            off.beginPath();
            off.arc(px + c * 0.5, py + c * 0.5, c * 0.05, 0, Math.PI * 2);
            off.fill();
          }
          break;
        }
        case "ocean": {
          if (hash === 10) {
            off.fillStyle = "rgba(204, 251, 241, 0.13)";
            off.beginPath();
            off.arc(px + c * 0.65, py + c * 0.35, c * 0.05, 0, Math.PI * 2);
            off.fill();
          }
          break;
        }
        case "space":
        case "lava":
          break;
        default: {
          if ((x * 7 + y * 13) % 7 === 0) {
            off.fillStyle = "rgba(255, 255, 255, 0.04)";
            off.fillRect(px + c * 0.35, py + c * 0.35, c * 0.08, c * 0.28);
          }
          break;
        }
      }
    }
  }

  // Bake radial vignette onto the cached board
  const vigGrad = off.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.42,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.72
  );
  vigGrad.addColorStop(0, "rgba(0,0,0,0)");
  vigGrad.addColorStop(1, theme.vignette);
  off.fillStyle = vigGrad;
  off.fillRect(0, 0, width, height);

  return cachedBoardCanvas;
}

/**
 * Draws cached theme-specific tile background + radial vignette, plus lightweight animated accents.
 */
export function drawBoardBackground(
  ctx: CanvasRenderingContext2D,
  cols: number,
  rows: number,
  c: number,
  theme: ThemeConfig,
  timeNow: number
) {
  const key = `${cols}x${rows}x${c}:${theme.id}:${theme.vignette}`;
  if (key !== cachedBoardKey || !cachedBoardCanvas) {
    buildStaticBoardCanvas(cols, rows, c, theme);
    cachedBoardKey = key;
  }

  if (cachedBoardCanvas) {
    ctx.drawImage(cachedBoardCanvas, 0, 0);
  }

  // Only iterate animated details for themes that actually have frame-by-frame effects
  if (theme.id !== "space" && theme.id !== "lava" && theme.id !== "ocean") {
    return;
  }

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const hash = (x * 31 + y * 17 + x * y * 7) % 29;
      const px = x * c;
      const py = y * c;

      if (theme.id === "space" && (hash === 1 || hash === 8 || hash === 19)) {
        const twinkle = 0.25 + 0.25 * Math.sin(timeNow * 0.003 + hash + x);
        ctx.fillStyle = `rgba(224, 231, 255, ${twinkle.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(
          px + c * (0.25 + (hash % 5) * 0.12),
          py + c * (0.3 + ((hash * 3) % 5) * 0.1),
          Math.max(1, c * 0.045),
          0,
          Math.PI * 2
        );
        ctx.fill();
      } else if (theme.id === "lava" && (hash === 3 || hash === 17)) {
        const glow = 0.14 + 0.08 * Math.sin(timeNow * 0.004 + y);
        ctx.strokeStyle = `rgba(249, 115, 22, ${glow.toFixed(2)})`;
        ctx.lineWidth = Math.max(1, c * 0.05);
        ctx.beginPath();
        ctx.moveTo(px + c * 0.2, py + c * 0.75);
        ctx.lineTo(px + c * 0.48, py + c * 0.45);
        ctx.lineTo(px + c * 0.75, py + c * 0.25);
        ctx.stroke();
      } else if (theme.id === "ocean" && (hash === 4 || hash === 15)) {
        const wave = Math.sin(timeNow * 0.003 + x * 0.6) * c * 0.04;
        ctx.strokeStyle = "rgba(153, 246, 228, 0.1)";
        ctx.lineWidth = Math.max(1, c * 0.04);
        ctx.beginPath();
        ctx.arc(px + c * 0.5, py + c * 0.5 + wave, c * 0.18, 0.2, Math.PI - 0.2);
        ctx.stroke();
      }
    }
  }
}

/**
 * Draws map-themed obstacles with distinct shapes, depth, and spawn pulse animation.
 */
export function drawObstacles(
  ctx: CanvasRenderingContext2D,
  obstacles: Obstacle[],
  c: number,
  theme: ThemeConfig,
  timeNow: number
) {
  if (!obstacles.length) return;

  const baseColor = theme.obstacleColor || "#475569";
  const hiColor = theme.obstacleHighlight || "#94a3b8";
  const accentColor = theme.obstacleAccent || theme.accent;
  const nowMs = Date.now();

  for (const obs of obstacles) {
    const cx = (obs.x + 0.5) * c;
    const cy = (obs.y + 0.5) * c;
    const pad = c * 0.1;
    const size = c - pad * 2;
    const x0 = obs.x * c + pad;
    const y0 = obs.y * c + pad;

    ctx.save();

    // Subtle spawn pulse for dynamically introduced obstacles
    if (obs.spawnedAt && nowMs - obs.spawnedAt < 1200) {
      const age = (nowMs - obs.spawnedAt) / 1200;
      const scale = 0.75 + 0.25 * Math.min(1, age * 1.6);
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.translate(-cx, -cy);
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 1 - age;
      ctx.beginPath();
      ctx.arc(cx, cy, c * (0.45 + age * 0.3), 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Ground drop shadow (strong contrast so every obstacle stands out)
    ctx.fillStyle = "rgba(0, 0, 0, 0.62)";
    ctx.beginPath();
    ctx.roundRect(x0 + c * 0.04, y0 + c * 0.09, size, size, c * 0.18);
    ctx.fill();

    if (theme.id === "ice") {
      // Dark deep-glacier crystal block with crisp rim
      const grad = ctx.createLinearGradient(x0, y0, x0 + size, y0 + size);
      grad.addColorStop(0, hiColor);
      grad.addColorStop(0.65, baseColor);
      grad.addColorStop(1, "#020617");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(cx, y0);
      ctx.lineTo(x0 + size, cy - c * 0.1);
      ctx.lineTo(x0 + size * 0.86, y0 + size);
      ctx.lineTo(x0 + size * 0.14, y0 + size);
      ctx.lineTo(x0, cy - c * 0.1);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "#020617";
      ctx.lineWidth = Math.max(2, c * 0.07);
      ctx.stroke();

      ctx.strokeStyle = accentColor;
      ctx.lineWidth = Math.max(1.2, c * 0.04);
      ctx.stroke();
    } else if (theme.id === "space") {
      // Dark metallic monolith / asteroid with crisp border & glowing core
      const grad = ctx.createRadialGradient(cx - c * 0.1, cy - c * 0.1, c * 0.05, cx, cy, c * 0.52);
      grad.addColorStop(0, hiColor);
      grad.addColorStop(1, baseColor);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x0, y0, size, size, c * 0.22);
      ctx.fill();

      ctx.strokeStyle = "#020617";
      ctx.lineWidth = Math.max(2, c * 0.07);
      ctx.stroke();

      // Glowing energy core dot
      const pulse = 0.65 + 0.35 * Math.sin(timeNow * 0.005 + obs.x + obs.y);
      ctx.fillStyle = accentColor;
      ctx.globalAlpha = pulse;
      ctx.beginPath();
      ctx.arc(cx, cy, c * 0.13, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "rgba(167, 139, 250, 0.7)";
      ctx.lineWidth = Math.max(1.2, c * 0.045);
      ctx.strokeRect(x0 + c * 0.06, y0 + c * 0.06, size - c * 0.12, size - c * 0.12);
    } else if (theme.id === "lava") {
      // Pitch-dark obsidian rock with glowing orange edge & magma cracks
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.roundRect(x0, y0, size, size, c * 0.18);
      ctx.fill();

      ctx.strokeStyle = "#000000";
      ctx.lineWidth = Math.max(2.2, c * 0.075);
      ctx.stroke();

      ctx.strokeStyle = "rgba(251, 146, 60, 0.55)";
      ctx.lineWidth = Math.max(1, c * 0.035);
      ctx.stroke();

      const glow = 0.75 + 0.25 * Math.sin(timeNow * 0.006 + obs.x * 2);
      ctx.strokeStyle = accentColor;
      ctx.globalAlpha = glow;
      ctx.lineWidth = Math.max(1.5, c * 0.06);
      ctx.beginPath();
      ctx.moveTo(x0 + size * 0.2, y0 + size * 0.25);
      ctx.lineTo(cx, cy);
      ctx.lineTo(x0 + size * 0.8, y0 + size * 0.75);
      ctx.moveTo(cx, cy);
      ctx.lineTo(x0 + size * 0.75, y0 + size * 0.25);
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else if (theme.id === "ocean") {
      // Dark sunken reef rock with bold border & coral accents
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.roundRect(x0, y0, size, size, c * 0.28);
      ctx.fill();

      ctx.strokeStyle = "#020617";
      ctx.lineWidth = Math.max(2, c * 0.07);
      ctx.stroke();

      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.arc(cx - c * 0.12, cy - c * 0.08, c * 0.12, 0, Math.PI * 2);
      ctx.arc(cx + c * 0.12, cy + c * 0.06, c * 0.1, 0, Math.PI * 2);
      ctx.arc(cx + c * 0.04, cy - c * 0.15, c * 0.09, 0, Math.PI * 2);
      ctx.fill();
    } else if (theme.id === "desert") {
      // Deep dark canyon rock / cactus block
      const grad = ctx.createLinearGradient(x0, y0, x0 + size, y0 + size);
      grad.addColorStop(0, hiColor);
      grad.addColorStop(1, baseColor);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x0, y0, size, size, c * 0.2);
      ctx.fill();

      ctx.strokeStyle = "#1c0d04";
      ctx.lineWidth = Math.max(2, c * 0.07);
      ctx.stroke();

      if ((obs.variant ?? 0) === 1) {
        // Small cactus crest
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.roundRect(cx - c * 0.1, y0 + c * 0.12, c * 0.2, size * 0.72, c * 0.08);
        ctx.fill();
      } else {
        ctx.strokeStyle = "rgba(254, 243, 199, 0.32)";
        ctx.lineWidth = Math.max(1, c * 0.04);
        ctx.beginPath();
        ctx.moveTo(x0 + size * 0.18, cy);
        ctx.lineTo(x0 + size * 0.82, cy);
        ctx.stroke();
      }
    } else {
      // Jungle dark stone block with mossy cap & crisp dark border
      const grad = ctx.createLinearGradient(x0, y0, x0 + size, y0 + size);
      grad.addColorStop(0, hiColor);
      grad.addColorStop(1, baseColor);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x0, y0, size, size, c * 0.16);
      ctx.fill();

      ctx.strokeStyle = "#090d0b";
      ctx.lineWidth = Math.max(2, c * 0.07);
      ctx.stroke();

      // Mossy vine cap
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.roundRect(x0 + c * 0.06, y0 + c * 0.03, size - c * 0.12, size * 0.24, c * 0.08);
      ctx.fill();
    }

    ctx.restore();
  }
}

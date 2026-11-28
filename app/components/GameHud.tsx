"use client";

import React from "react";
import { DifficultyConfig, Status, ThemeConfig } from "../utils/types";

interface GameHudProps {
  status: Status;
  sessionTheme?: ThemeConfig;
  sessionDifficulty?: DifficultyConfig;
  applesEaten: number;
  targetApples: number;
  score?: number;
  bestScore?: number;
  currentLevel: number;
  totalStars: number;
  timeLeft: number; // in seconds
  isMuted: boolean;
  isFullscreen: boolean;
  isHudVisible: boolean;
  isMobileDevice: boolean;
  controlMode: "dpad" | "swipe";
  onToggleSound: () => void;
  onToggleControlMode: () => void;
  onToggleFullscreen: () => void;
  onTogglePause: () => void;
  onRestart: () => void;
  onOpenLevelSelector: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export const GameHud: React.FC<GameHudProps> = ({
  status,
  sessionTheme,
  sessionDifficulty,
  applesEaten,
  targetApples,
  score = 0,
  bestScore = 0,
  currentLevel,
  totalStars,
  timeLeft,
  isMuted,
  isFullscreen,
  isHudVisible,
  isMobileDevice,
  controlMode,
  onToggleSound,
  onToggleControlMode,
  onToggleFullscreen,
  onTogglePause,
  onRestart,
  onOpenLevelSelector,
  onMouseEnter,
  onMouseLeave,
}) => {
  const formatTime = (seconds: number) => {
    const s = Math.max(0, Math.ceil(seconds));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem < 10 ? "0" : ""}${rem}`;
  };

  const isLowTime = timeLeft <= 15 && status === "playing";

  return (
    <header
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={
        isFullscreen
          ? `fixed top-2 left-1/2 -translate-x-1/2 w-[96%] max-w-4xl glass-panel rounded-xl sm:rounded-2xl p-1.5 px-2 sm:p-2 sm:px-4 flex items-center justify-between shadow-2xl border border-white/15 z-50 transition-all duration-300 ease-out ${
              isHudVisible
                ? "translate-y-0 opacity-100 pointer-events-auto"
                : "-translate-y-28 opacity-0 pointer-events-none"
            }`
          : "w-full max-w-4xl glass-panel rounded-xl sm:rounded-2xl p-1.5 px-2 sm:p-2 sm:px-4 flex items-center justify-between shadow-xl border border-white/10 shrink-0 z-20 transition-all duration-300"
      }
    >
      {/* LEFT: APPLES GOAL, LEVEL MAP TRIGGER & MAP/DIFFICULTY BADGE */}
      <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
        <div className="flex items-center gap-1">
          <span className="text-lg sm:text-2xl animate-bounce">🍎</span>
          <div>
            <div className="hidden sm:block text-[9px] uppercase tracking-wider text-emerald-400 font-extrabold leading-none">
              Goal
            </div>
            <div className="text-sm sm:text-xl font-black text-white tabular-nums tracking-tight">
              <span className="text-emerald-300">{applesEaten}</span>
              <span className="text-white/50 text-xs sm:text-sm">/{targetApples}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenLevelSelector();
          }}
          className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-[11px] sm:text-xs font-bold text-amber-300 cursor-pointer touch-btn active:scale-95"
          title="Open Levels Map"
        >
          <span>🗺️</span>
          <span>Lvl {currentLevel}</span>
          <span className="text-[10px] text-amber-400">⭐{totalStars}</span>
        </button>

        {sessionTheme && sessionDifficulty && (
          <>
            <span
              className={`hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-bold ${sessionDifficulty.badgeClass}`}
              title={`${sessionTheme.name} • ${sessionDifficulty.label} (${sessionDifficulty.dots || "●●○○"})`}
            >
              <span>{sessionTheme.icon}</span>
              <span>{sessionTheme.name.split(" ").pop()}</span>
              <span className="opacity-50">•</span>
              <span>{sessionDifficulty.label}</span>
              <span className="text-[10px] tracking-tighter opacity-90">
                ({sessionDifficulty.dots || "●●○○"})
              </span>
            </span>
            <span
              className={`flex sm:hidden items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-bold ${sessionDifficulty.badgeClass}`}
              title={`${sessionTheme.name} • ${sessionDifficulty.label} (${sessionDifficulty.dots || "●●○○"})`}
            >
              <span>{sessionTheme.icon}</span>
              <span className="tracking-tighter">{sessionDifficulty.dots || "●●○○"}</span>
            </span>
          </>
        )}

        <div
          className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-bold tabular-nums"
          title={`Score: ${score} • Best: ${bestScore}`}
        >
          <span className="text-amber-300">{score}</span>
          <span className="text-white/30">/</span>
          <span className="text-white/60 text-[10px]">Best {bestScore}</span>
        </div>
      </div>

      {/* CENTER: COUNTDOWN TIMER */}
      <div
        className={`flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg sm:rounded-xl border tabular-nums transition-all ${
          isLowTime
            ? "bg-red-500/25 border-red-500/60 text-red-300 animate-pulse scale-105"
            : "bg-white/5 border-white/10 text-white"
        }`}
      >
        <span className="text-xs">{isLowTime ? "🔥" : "⏱️"}</span>
        <span className="text-xs sm:text-base font-black tracking-wider">
          {formatTime(timeLeft)}
        </span>
      </div>

      {/* RIGHT: QUICK UTILITIES */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Audio Toggle */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSound();
          }}
          className="p-1 sm:p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 touch-btn text-xs sm:text-sm cursor-pointer"
          title={isMuted ? "Unmute Sound" : "Mute Sound"}
        >
          {isMuted ? "🔇" : "🔊"}
        </button>

        {/* Mobile Control Mode Toggle */}
        {isMobileDevice && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleControlMode();
            }}
            className={`p-1 sm:p-2 rounded-lg border touch-btn text-[11px] sm:text-xs font-bold flex items-center gap-0.5 cursor-pointer ${
              controlMode === "dpad"
                ? "bg-emerald-600/60 border-emerald-400/40 text-emerald-200"
                : "bg-white/5 border-white/10 text-white/70"
            }`}
            title="Toggle D-Pad / Swipe Mode"
          >
            <span>{controlMode === "dpad" ? "🎮" : "👆"}</span>
          </button>
        )}

        {/* Fullscreen Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFullscreen();
          }}
          className="p-1 sm:p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 touch-btn text-xs sm:text-sm font-bold text-white/80 cursor-pointer"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? "🗗" : "⛶"}
        </button>

        {/* Quick Restart */}
        {(status === "playing" || status === "paused") && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRestart();
            }}
            className="p-1 sm:p-2 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 touch-btn text-xs sm:text-sm text-white/85 cursor-pointer"
            title="Restart Current Level (R)"
          >
            🔄
          </button>
        )}

        {/* Pause / Play */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePause();
          }}
          className="p-1 sm:p-2 px-2 sm:px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm border border-emerald-400/30 touch-btn shadow-md cursor-pointer active:scale-95"
          title={status === "playing" ? "Pause Game (Space / Esc)" : "Resume / Play"}
        >
          {status === "playing" ? "⏸" : "▶"}
        </button>
      </div>
    </header>
  );
};

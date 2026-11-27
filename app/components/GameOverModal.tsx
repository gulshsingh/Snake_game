"use client";

import React from "react";
import { DifficultyConfig, GameSessionConfig, LevelConfig, ThemeConfig } from "../utils/types";

interface GameOverModalProps {
  session?: GameSessionConfig | null;
  sessionTheme?: ThemeConfig;
  sessionDifficulty?: DifficultyConfig;
  level: LevelConfig;
  isTimeUp: boolean;
  applesEaten: number;
  targetApples: number;
  snakeLength: number;
  onRetry: () => void;
  onOpenLevelSelector: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  session,
  sessionTheme,
  sessionDifficulty,
  level,
  isTimeUp,
  applesEaten,
  targetApples,
  snakeLength,
  onRetry,
  onOpenLevelSelector,
}) => {
  return (
    <div
      className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-4 text-center z-40 select-none cursor-pointer"
      style={{ touchAction: "manipulation" }}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onRetry();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onRetry();
      }}
    >
      <div className="w-full max-w-sm bg-[#140c0c] border-2 border-red-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col items-center relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Icon & Title */}
        <div className="text-4xl mb-1">{isTimeUp ? "⏰" : "💥"}</div>
        <h2 className="text-2xl sm:text-3xl font-black text-red-500 mb-1 tracking-tight pointer-events-none">
          {isTimeUp ? "TIME'S UP!" : "GAME OVER"}
        </h2>

        {/* Subtitle / Reason */}
        <p className="text-xs text-white/70 mb-4 max-w-xs pointer-events-none">
          {isTimeUp
            ? `You needed ${Math.max(0, targetApples - applesEaten)} more apples to complete Level ${level.level}.`
            : `Crashed in Level ${level.level}: ${level.title}!`}
          {session && sessionTheme && sessionDifficulty
            ? ` (${sessionTheme.icon} ${sessionTheme.name} • ${sessionDifficulty.label})`
            : ""}
        </p>

        {/* Stats Card */}
        <div className="w-full bg-white/5 rounded-2xl p-3 border border-white/10 mb-5 flex items-center justify-around text-xs pointer-events-none">
          <div>
            <div className="text-white/50 text-[10px] uppercase font-bold">Apples</div>
            <div className="text-lg font-black text-emerald-400 tabular-nums">
              {applesEaten} / {targetApples}
            </div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <div className="text-white/50 text-[10px] uppercase font-bold">Level</div>
            <div className="text-lg font-black text-amber-300 tabular-nums">
              {level.level}
            </div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <div className="text-white/50 text-[10px] uppercase font-bold">Length</div>
            <div className="text-lg font-black text-cyan-400 tabular-nums">
              {snakeLength}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2">
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              onRetry();
            }}
            onClick={(e) => {
              e.stopPropagation();
              onRetry();
            }}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-base tracking-wide shadow-xl shadow-emerald-500/40 touch-btn cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
          >
            <span>🔄</span>
            <span>{`TRY LEVEL ${level.level} AGAIN`}</span>
          </button>

          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              onOpenLevelSelector();
            }}
            onClick={(e) => {
              e.stopPropagation();
              onOpenLevelSelector();
            }}
            className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/90 text-xs font-bold border border-white/10 touch-btn cursor-pointer active:scale-95"
          >
            🗺️ Choose Different Level
          </button>
        </div>
      </div>
    </div>
  );
};

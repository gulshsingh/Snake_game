"use client";

import React from "react";
import { DifficultyConfig, GameSessionConfig, LevelConfig, ThemeConfig } from "../utils/types";

interface PauseOverlayProps {
  session?: GameSessionConfig | null;
  sessionTheme?: ThemeConfig;
  sessionDifficulty?: DifficultyConfig;
  level: LevelConfig;
  applesEaten: number;
  timeLeft: number;
  onResume: () => void;
  onRestart: () => void;
  onOpenLevelSelector: () => void;
}

export const PauseOverlay: React.FC<PauseOverlayProps> = ({
  session,
  sessionTheme,
  sessionDifficulty,
  level,
  applesEaten,
  timeLeft,
  onResume,
  onRestart,
  onOpenLevelSelector,
}) => {
  const formatTime = (seconds: number) => {
    const s = Math.max(0, Math.ceil(seconds));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem < 10 ? "0" : ""}${rem}`;
  };

  return (
    <div
      className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-40 select-none cursor-pointer"
      style={{ touchAction: "manipulation" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onResume();
      }}
    >
      <div
        className="w-full max-w-sm bg-[#0e1610]/95 border-2 border-emerald-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col items-center relative overflow-hidden cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-4xl mb-1.5 pointer-events-none">⏸</div>
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-1 tracking-tight pointer-events-none">
          GAME PAUSED
        </h2>

        <p className="text-xs text-white/75 mb-4 pointer-events-none">
          {`Level ${level.level}: ${level.title}`}
          {session && sessionTheme && sessionDifficulty
            ? ` • ${sessionTheme.icon} ${sessionTheme.name} (${sessionDifficulty.label} ${sessionDifficulty.dots || "●●○○"})`
            : ""}
        </p>

        {/* Live Progress Snapshot */}
        <div className="w-full bg-white/5 rounded-2xl p-2.5 border border-white/10 mb-4 flex items-center justify-around text-xs pointer-events-none">
          <div>
            <div className="text-white/50 text-[10px] uppercase font-bold">Apples</div>
            <div className="text-base font-black text-emerald-400 tabular-nums">
              {applesEaten} / {level.targetApples}
            </div>
          </div>
          <div className="w-px h-7 bg-white/10" />
          <div>
            <div className="text-white/50 text-[10px] uppercase font-bold">Time Left</div>
            <div className="text-base font-black text-amber-300 tabular-nums">
              {formatTime(timeLeft)}
            </div>
          </div>
          {session && (
            <>
              <div className="w-px h-7 bg-white/10" />
              <div>
                <div className="text-white/50 text-[10px] uppercase font-bold">Layout</div>
                <div className="text-xs font-extrabold text-cyan-300 capitalize mt-0.5">
                  {session.pattern}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="w-full flex flex-col gap-2">
          {/* Resume */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onResume();
            }}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-base touch-btn shadow-lg shadow-emerald-500/30 cursor-pointer active:scale-95 flex items-center justify-center gap-2"
          >
            <span>▶</span>
            <span>RESUME GAME</span>
          </button>

          {/* Restart */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRestart();
            }}
            className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/90 text-xs font-bold border border-white/10 touch-btn cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
          >
            <span>🔄</span>
            <span>Restart Level {level.level}</span>
          </button>

          {/* Change Level */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenLevelSelector();
            }}
            className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/90 text-xs font-bold border border-white/10 touch-btn cursor-pointer active:scale-95"
          >
            🗺️ Level Map
          </button>
        </div>

        <div className="text-[10px] text-white/45 mt-3 pointer-events-none">
          Space / Esc: Resume • R: Restart Level
        </div>
      </div>
    </div>
  );
};

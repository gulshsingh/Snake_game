"use client";

import React, { useRef, useCallback } from "react";
import { LevelConfig } from "../utils/types";

interface LevelClearModalProps {
  level: LevelConfig;
  starsEarned: number;
  timeTaken: number;
  score?: number;
  bestScore?: number;
  hasNextLevel: boolean;
  onNextLevel: () => void;
  onReplay: () => void;
  onOpenLevelSelector: () => void;
}

export const LevelClearModal: React.FC<LevelClearModalProps> = ({
  level,
  starsEarned,
  timeTaken,
  score = 0,
  bestScore = 0,
  hasNextLevel,
  onNextLevel,
  onReplay,
  onOpenLevelSelector,
}) => {
  const hasTriggeredRef = useRef(false);

  const handleNext = useCallback(() => {
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;
    onNextLevel();
  }, [onNextLevel]);

  const handleReplay = () => {
    hasTriggeredRef.current = true;
    onReplay();
  };

  const handleOpenMap = () => {
    hasTriggeredRef.current = true;
    onOpenLevelSelector();
  };

  return (
    <div
      className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-3 sm:p-4 text-center z-40 select-none animate-in fade-in duration-200"
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="w-full max-w-sm bg-[#0e1910] border-2 border-emerald-400/50 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col items-center relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Level Cleared Badge */}
        <div className="text-3xl sm:text-4xl mb-1 animate-bounce">🏆</div>
        <div className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-emerald-400 mb-0.5">
          Level {level.level} Completed!
        </div>
        <h2 className="text-xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-300 tracking-tight mb-2">
          {level.title}
        </h2>

        {/* STARS RATING DISPLAY */}
        <div className="flex items-center justify-center gap-2 my-2 sm:my-3">
          {[1, 2, 3].map((starIdx) => {
            const hasStar = starIdx <= starsEarned;
            return (
              <div
                key={starIdx}
                className={`text-2xl sm:text-4xl transition-all duration-300 transform ${
                  hasStar
                    ? "scale-110 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)] animate-pulse"
                    : "opacity-25 grayscale scale-95"
                }`}
              >
                ⭐
              </div>
            );
          })}
        </div>

        {/* Star Rating Comment */}
        <div className="text-xs font-bold text-amber-300 mb-3">
          {starsEarned === 3
            ? "⭐⭐⭐ PERFECT! Blazing Fast!"
            : starsEarned === 2
            ? "⭐⭐ GREAT SPEED! Just missed 3 stars!"
            : "⭐ LEVEL CLEARED! Good job!"}
        </div>

        {/* TIME & STATS CARD */}
        <div className="w-full bg-white/5 rounded-2xl p-2.5 sm:p-3 border border-white/10 mb-3 flex items-center justify-around text-xs">
          <div>
            <div className="text-white/50 text-[10px] uppercase font-bold">Time</div>
            <div className="text-sm sm:text-base font-black text-amber-300 tabular-nums">
              {timeTaken.toFixed(1)}s
            </div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <div className="text-white/50 text-[10px] uppercase font-bold">Score</div>
            <div
              className="text-sm sm:text-base font-black text-cyan-300 tabular-nums"
              title={`Best: ${bestScore}`}
            >
              {score}
            </div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <div className="text-white/50 text-[10px] uppercase font-bold">Apples</div>
            <div className="text-sm sm:text-base font-black text-emerald-400 tabular-nums">
              {level.targetApples} 🍏
            </div>
          </div>
        </div>

        {/* STAGE MILESTONE ALERT */}
        {level.level % 5 === 0 && (
          <div className="w-full bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-400/40 rounded-2xl p-2 sm:p-2.5 mb-3 text-center">
            <div className="text-[11px] font-black text-amber-300 uppercase tracking-wider flex items-center justify-center gap-1">
              <span>🏅</span>
              <span>{`STAGE ${level.level} MILESTONE CLEARED!`}</span>
            </div>
            <div className="text-[10px] text-white/90 mt-0.5 font-semibold">
              {`Next bracket unlocked: Level ${level.level + 1}+ brings fresh layouts & faster action!`}
            </div>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="w-full flex flex-col gap-2">
          {hasNextLevel ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="w-full py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-sm sm:text-base tracking-wide shadow-xl shadow-emerald-500/30 touch-btn cursor-pointer active:scale-95 flex items-center justify-center gap-2"
            >
              <span>▶ START LEVEL {level.level + 1}</span>
              <span>➔</span>
            </button>
          ) : (
            <div className="text-xs font-bold text-amber-300 py-2">
              🎉 Congratulations! You have conquered all levels!
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleReplay();
              }}
              className="flex-1 py-2 sm:py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/90 text-xs font-bold border border-white/10 touch-btn cursor-pointer active:scale-95"
            >
              🔄 Replay
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenMap();
              }}
              className="flex-1 py-2 sm:py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/90 text-xs font-bold border border-white/10 touch-btn cursor-pointer active:scale-95"
            >
              🗺️ Level Map
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

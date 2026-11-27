"use client";

import React, { useState } from "react";
import { LevelConfig, LevelProgress } from "../utils/types";
import { getLevelBatch, MAX_LEVELS, TIER_CONFIG } from "../utils/levels";

interface LevelSelectorModalProps {
  currentLevel: number;
  progress: LevelProgress;
  onSelectLevel: (lvl: LevelConfig) => void;
  onClose: () => void;
}

export const LevelSelectorModal: React.FC<LevelSelectorModalProps> = ({
  currentLevel,
  progress,
  onSelectLevel,
  onClose,
}) => {
  const [selectedTier, setSelectedTier] = useState<"all" | "normal" | "medium" | "hard" | "mythic">("all");

  const pageSize = 20;
  const initialPage = Math.floor((currentLevel - 1) / pageSize);
  const [page, setPage] = useState(initialPage);
  const maxPage = Math.floor((MAX_LEVELS - 1) / pageSize);

  const startLevel = page * pageSize + 1;
  const pageLevels = getLevelBatch(startLevel, pageSize);

  const totalStars = Object.values(progress.stars).reduce((sum, val) => sum + val, 0);

  const filteredLevels =
    selectedTier === "all" ? pageLevels : pageLevels.filter((l) => l.tier === selectedTier);

  return (
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 select-none overscroll-contain"
      onTouchStart={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-2xl h-[92dvh] sm:h-auto sm:max-h-[86vh] bg-[#0c140d] border border-emerald-500/30 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="p-2.5 sm:p-4 border-b border-white/10 flex items-center justify-between bg-black/30 shrink-0 gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-lg sm:text-2xl shrink-0">🗺️</span>
              <h2 className="text-sm sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 truncate">
                LEVEL CHALLENGES
              </h2>
            </div>
            <p className="text-[10px] sm:text-xs text-white/60 mt-0.5 truncate">
              Automatic Campaign with 10,000 Levels & dynamic board themes!
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Total Stars Pill */}
            <div className="flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-300 text-[11px] sm:text-xs font-black">
              <span>⭐</span>
              <span className="tabular-nums font-bold">
                {totalStars} Stars
              </span>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onPointerDown={(e) => {
                e.stopPropagation();
                onClose();
              }}
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center font-bold text-xs sm:text-sm cursor-pointer touch-btn"
              title="Close Map"
            >
              ✕
            </button>
          </div>
        </div>

        {/* TIER FILTER TABS */}
        <div
          className="flex gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 border-b border-white/10 overflow-x-auto shrink-0 bg-black/15 no-scrollbar"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {(["all", "normal", "medium", "hard", "mythic"] as const).map((tierKey) => (
            <button
              key={tierKey}
              type="button"
              onPointerDown={() => setSelectedTier(tierKey)}
              onClick={() => setSelectedTier(tierKey)}
              className={`px-2.5 sm:px-3 py-1 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider shrink-0 touch-btn cursor-pointer transition-all ${
                selectedTier === tierKey
                  ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/30 scale-105"
                  : "bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              {tierKey === "all" ? "All Page Levels" : TIER_CONFIG[tierKey].badge}
            </button>
          ))}
        </div>

        {/* PAGINATION / RANGE CONTROLS (For 10,000 Levels) */}
        <div className="flex items-center justify-between px-2.5 sm:px-4 py-1.5 border-b border-white/5 bg-black/25 text-xs shrink-0">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed text-white/80 font-bold touch-btn flex items-center gap-1 text-[11px] cursor-pointer"
          >
            <span>◀</span>
            <span>Prev 20</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="font-extrabold text-emerald-400 font-mono text-[11px] sm:text-xs">
              Lvl {startLevel} - {Math.min(MAX_LEVELS, startLevel + pageSize - 1)}
            </span>
            {page !== initialPage && (
              <button
                type="button"
                onClick={() => setPage(initialPage)}
                className="text-[10px] text-amber-300 underline font-bold cursor-pointer"
              >
                Jump to Lvl {currentLevel}
              </button>
            )}
          </div>

          <button
            type="button"
            disabled={page >= maxPage}
            onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed text-white/80 font-bold touch-btn flex items-center gap-1 text-[11px] cursor-pointer"
          >
            <span>Next 20</span>
            <span>▶</span>
          </button>
        </div>

        {/* LEVEL GRID SCROLL AREA */}
        <div
          className="flex-1 overflow-y-auto p-2 sm:p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-2.5 no-scrollbar"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {filteredLevels.map((lvl) => {
            const isUnlocked = lvl.level <= progress.unlockedLevel;
            const isCurrent = lvl.level === currentLevel;
            const starsEarned = progress.stars[lvl.level] || 0;
            const tierStyle = TIER_CONFIG[lvl.tier];

            return (
              <button
                key={lvl.level}
                type="button"
                disabled={!isUnlocked}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  if (isUnlocked) onSelectLevel(lvl);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isUnlocked) onSelectLevel(lvl);
                }}
                className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border text-left flex flex-col justify-between transition-all relative overflow-hidden group select-none min-h-[88px] sm:min-h-[100px] ${
                  !isUnlocked
                    ? "bg-black/40 border-white/5 opacity-40 cursor-not-allowed"
                    : isCurrent
                    ? "bg-emerald-950/70 border-emerald-400 shadow-lg shadow-emerald-500/30 scale-[1.02] cursor-pointer ring-1 ring-emerald-400/50"
                    : "bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 cursor-pointer touch-btn active:scale-95"
                }`}
              >
                {/* Top Badge: Level Number & Lock / Stars */}
                <div className="flex items-center justify-between w-full mb-1 gap-1">
                  <span
                    className={`text-[10px] sm:text-xs font-black px-1.5 sm:px-2 py-0.5 rounded ${
                      isCurrent
                        ? "bg-emerald-500 text-black font-extrabold"
                        : "bg-white/10 text-white/90"
                    }`}
                  >
                    Lvl {lvl.level}
                  </span>

                  {isUnlocked ? (
                    <div className="flex items-center gap-0.5 text-[10px] sm:text-xs text-amber-400 shrink-0">
                      {[1, 2, 3].map((starIdx) => (
                        <span
                          key={starIdx}
                          className={starIdx <= starsEarned ? "opacity-100" : "opacity-20"}
                        >
                          ⭐
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-500 shrink-0">🔒</span>
                  )}
                </div>

                {/* Title & Theme Skin Info */}
                <div className="my-0.5 flex-1 flex flex-col justify-center">
                  <div className="text-xs sm:text-sm font-extrabold text-white truncate leading-tight">
                    {lvl.title}
                  </div>
                  <div className={`text-[10px] font-semibold ${tierStyle.textColor} truncate mt-0.5`}>
                    {tierStyle.themeIcon} {tierStyle.themeName}
                  </div>
                </div>

                {/* Target & Time Meta */}
                <div className="mt-1 pt-1 border-t border-white/5 flex items-center justify-between text-[10px] sm:text-[11px] text-white/70">
                  <span className="flex items-center gap-0.5 font-bold text-white">
                    <span>🍏</span>
                    <span>{lvl.targetApples}</span>
                  </span>
                  <span className="flex items-center gap-0.5 font-bold text-amber-300">
                    <span>⏱️</span>
                    <span>{lvl.timeLimit}s</span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* FOOTER */}
        <div className="p-2 sm:p-2.5 px-3 sm:px-4 border-t border-white/10 bg-black/40 flex items-center justify-between text-[11px] sm:text-xs text-white/60 shrink-0">
          <div>
            Highest Unlocked: <span className="text-emerald-400 font-bold">Level {progress.unlockedLevel}</span>
          </div>
          <div className="text-white/50">Auto Engine: 10,000 Levels</div>
        </div>
      </div>
    </div>
  );
};

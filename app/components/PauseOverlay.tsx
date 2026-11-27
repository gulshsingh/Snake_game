"use client";

import React from "react";
import { LevelConfig } from "../utils/types";

interface PauseOverlayProps {
  level: LevelConfig;
  onResume: () => void;
  onRestart: () => void;
  onOpenLevelSelector: () => void;
}

export const PauseOverlay: React.FC<PauseOverlayProps> = ({
  level,
  onResume,
  onRestart,
  onOpenLevelSelector,
}) => {
  return (
    <div
      className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-4 text-center z-40 select-none cursor-pointer"
      style={{ touchAction: "manipulation" }}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onResume();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onResume();
      }}
    >
      <div className="w-full max-w-sm bg-[#0e1610] border-2 border-emerald-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col items-center">
        <div className="text-4xl mb-2 pointer-events-none">⏸</div>
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-1 pointer-events-none">
          GAME PAUSED
        </h2>

        <p className="text-xs text-white/70 mb-5 pointer-events-none">
          {`Level ${level.level}: ${level.title} (${level.targetApples} apples goal)`}
        </p>

        <div className="w-full flex flex-col gap-2">
          {/* Resume */}
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              onResume();
            }}
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
            onPointerDown={(e) => {
              e.stopPropagation();
              onRestart();
            }}
            onClick={(e) => {
              e.stopPropagation();
              onRestart();
            }}
            className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/90 text-xs font-bold border border-white/10 touch-btn cursor-pointer active:scale-95"
          >
            🔄 Restart Level
          </button>

          {/* Change Level */}
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
            🗺️ Level Map
          </button>
        </div>
      </div>
    </div>
  );
};

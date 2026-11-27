"use client";

import React from "react";
import { Direction } from "../utils/types";

interface DPadControlsProps {
  onTurn: (dir: Direction) => void;
  onStart: () => void;
}

export const DPadControls: React.FC<DPadControlsProps> = ({ onTurn, onStart }) => {
  return (
    <div className="w-full shrink-0 flex items-center justify-center py-1 sm:py-2 z-20 select-none">
      <div className="relative w-44 h-36 flex items-center justify-center">
        {/* UP */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onTurn({ x: 0, y: -1 });
          }}
          onClick={() => onTurn({ x: 0, y: -1 })}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-12 rounded-xl bg-white/10 border border-white/20 active:bg-emerald-500 active:border-emerald-400 active:scale-95 transition-transform flex items-center justify-center text-xl text-white shadow-lg touch-btn cursor-pointer"
          aria-label="Up"
        >
          ▲
        </button>

        {/* LEFT */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onTurn({ x: -1, y: 0 });
          }}
          onClick={() => onTurn({ x: -1, y: 0 })}
          className="absolute left-1 top-1/2 -translate-y-1/2 w-12 h-14 rounded-xl bg-white/10 border border-white/20 active:bg-emerald-500 active:border-emerald-400 active:scale-95 transition-transform flex items-center justify-center text-xl text-white shadow-lg touch-btn cursor-pointer"
          aria-label="Left"
        >
          ◀
        </button>

        {/* CENTER INDICATOR / START */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onStart();
          }}
          onClick={onStart}
          className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-sm text-emerald-300 cursor-pointer active:scale-90 shadow-md touch-btn"
          aria-label="Center Action"
        >
          🐍
        </button>

        {/* RIGHT */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onTurn({ x: 1, y: 0 });
          }}
          onClick={() => onTurn({ x: 1, y: 0 })}
          className="absolute right-1 top-1/2 -translate-y-1/2 w-12 h-14 rounded-xl bg-white/10 border border-white/20 active:bg-emerald-500 active:border-emerald-400 active:scale-95 transition-transform flex items-center justify-center text-xl text-white shadow-lg touch-btn cursor-pointer"
          aria-label="Right"
        >
          ▶
        </button>

        {/* DOWN */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onTurn({ x: 0, y: 1 });
          }}
          onClick={() => onTurn({ x: 0, y: 1 })}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-12 rounded-xl bg-white/10 border border-white/20 active:bg-emerald-500 active:border-emerald-400 active:scale-95 transition-transform flex items-center justify-center text-xl text-white shadow-lg touch-btn cursor-pointer"
          aria-label="Down"
        >
          ▼
        </button>
      </div>
    </div>
  );
};

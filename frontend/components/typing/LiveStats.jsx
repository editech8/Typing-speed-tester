// components/typing/LiveStats.jsx
"use client";

import { Clock, Zap, Target, Infinity as InfinityIcon } from "lucide-react";

export default function LiveStats({
  isInfinite,
  displayTime,
  wpm,
  accuracy,
  isActive,
}) {
  return (
    <div className="flex items-center justify-between w-full max-w-6xl px-5 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl select-none font-mono">
      {/* Timer / Stopwatch */}
      <div className="flex items-center gap-2.5">
        {isInfinite ? (
          <div className="flex items-center gap-2 text-cyan-400">
            <InfinityIcon size={18} className={isActive ? "animate-pulse" : ""} />
            <span className="text-xl font-bold tracking-wider text-white">
              {displayTime}s
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Clock
              size={16}
              className={
                displayTime <= 5 && isActive
                  ? "text-rose-400 animate-bounce"
                  : "text-cyan-400"
              }
            />
            <span
              className={`text-xl font-bold tracking-wider ${
                displayTime <= 5 && isActive ? "text-rose-400" : "text-white"
              }`}
            >
              {displayTime}s
            </span>
          </div>
        )}
      </div>

      {/* Real-time WPM & Accuracy */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-amber-400" />
          <div className="text-right">
            <span className="text-[10px] text-slate-500 block uppercase leading-none">
              WPM
            </span>
            <span className="text-lg font-bold text-slate-200">{wpm}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Target size={16} className="text-emerald-400" />
          <div className="text-right">
            <span className="text-[10px] text-slate-500 block uppercase leading-none">
              ACC
            </span>
            <span className="text-lg font-bold text-slate-200">{accuracy}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
// components/typing/TypingArena.jsx
"use client";

import { useEffect, useRef, useState } from "react";
import SmoothCaret from "./SmoothCaret";

export default function TypingArena({
  words,
  userInput,
  activeWordIndex,
  wordHistory,
  isFinished,
}) {
  const containerRef = useRef(null);
  const letterRefs = useRef({});
  const [caretRect, setCaretRect] = useState(null);

  useEffect(() => {
    if (!containerRef.current || isFinished) {
      setCaretRect(null);
      return;
    }

    const currentWord = words[activeWordIndex] || "";
    const activeCharIdx = userInput.length;

    // Target the current character element
    const key = `${activeWordIndex}-${Math.min(
      activeCharIdx,
      Math.max(0, currentWord.length - 1)
    )}`;
    const el = letterRefs.current[key];

    if (el) {
      const isPastLastChar = activeCharIdx >= currentWord.length;

      // Coordinate matching with sub-pixel preservation
      const nextLeft = el.offsetLeft + (isPastLastChar ? el.offsetWidth : 0);
      const nextTop = el.offsetTop;
      const nextHeight = el.offsetHeight || 32;

      // RAF ensures the update fires on screen refresh rate
      requestAnimationFrame(() => {
        setCaretRect({
          left: nextLeft,
          top: nextTop,
          height: nextHeight,
        });
      });

      // Smooth auto-scroll tracking for multi-line text
      if (el.offsetTop > 80) {
        containerRef.current.scrollTop = el.offsetTop - 40;
      } else {
        containerRef.current.scrollTop = 0;
      }
    }
  }, [activeWordIndex, userInput, words, isFinished]);

  return (
    <div className="w-full max-w-6xl p-6 sm:p-8 rounded-3xl bg-slate-900/50 backdrop-blur-2xl border border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
      <div
        ref={containerRef}
        className="relative w-full h-[140px] md:h-[160px] max-h-[160px] overflow-hidden font-mono text-2xl md:text-3xl leading-relaxed flex flex-wrap content-start gap-x-3 gap-y-2 select-none cursor-text scroll-smooth"
      >
        <SmoothCaret rect={caretRect} isTyping={userInput.length > 0} />

        {words.map((word, wIdx) => {
          const isCurrentWord = wIdx === activeWordIndex;
          const isPastWord = wIdx < activeWordIndex;
          const pastTyped = wordHistory[wIdx] || "";

          return (
            <span
              key={wIdx}
              className={`inline-flex font-mono tracking-normal transition-colors duration-150 ${
                isCurrentWord
                  ? "text-slate-100"
                  : isPastWord
                  ? "opacity-90"
                  : "text-slate-600/70"
              }`}
            >
              {word.split("").map((char, cIdx) => {
                let charColor = "text-slate-600/70";

                if (isCurrentWord) {
                  if (cIdx < userInput.length) {
                    charColor =
                      userInput[cIdx] === char
                        ? "text-cyan-400"
                        : "text-rose-500 bg-rose-500/15 rounded-xs font-semibold";
                  } else {
                    charColor = "text-slate-300";
                  }
                } else if (isPastWord) {
                  if (cIdx < pastTyped.length) {
                    charColor =
                      pastTyped[cIdx] === char
                        ? "text-slate-400"
                        : "text-rose-500 bg-rose-500/20 rounded-xs font-semibold";
                  } else {
                    charColor = "text-rose-400/60 underline decoration-rose-500";
                  }
                }

                return (
                  <span
                    key={cIdx}
                    ref={(node) => {
                      if (node) letterRefs.current[`${wIdx}-${cIdx}`] = node;
                    }}
                    className={`${charColor} inline-block transition-colors duration-75`}
                  >
                    {char}
                  </span>
                );
              })}

              {isCurrentWord && userInput.length > word.length && (
                <span className="text-rose-400 bg-rose-500/10 rounded-xs">
                  {userInput.slice(word.length)}
                </span>
              )}
              {isPastWord && pastTyped.length > word.length && (
                <span className="text-rose-500/70 line-through">
                  {pastTyped.slice(word.length)}
                </span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
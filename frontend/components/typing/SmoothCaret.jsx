// components/typing/SmoothCaret.jsx
"use client";

import { useEffect, useRef, useState } from "react";

export default function SmoothCaret({ rect, isTyping }) {
  const prevLeftRef = useRef(rect?.left ?? 0);
  const [isGliding, setIsGliding] = useState(false);

  useEffect(() => {
    if (!rect) return;

    // Detect horizontal stroke jump to trigger the micro-stretch
    const deltaX = Math.abs(rect.left - prevLeftRef.current);
    if (deltaX > 2) {
      setIsGliding(true);
      const timer = setTimeout(() => setIsGliding(false), 90);
      prevLeftRef.current = rect.left;
      return () => clearTimeout(timer);
    }
  }, [rect?.left]);

  if (!rect) return null;

  return (
    <div
      className={`pointer-events-none absolute z-30 rounded-full bg-cyan-400 will-change-transform ${
        !isTyping ? "animate-pulse" : ""
      }`}
      style={{
        height: `${rect.height}px`,
        // Stretch dynamically to 3.5px during rapid motion, settle back to 2.5px
        width: isGliding ? "3.8px" : "2.5px",
        transform: `translate3d(${rect.left}px, ${rect.top}px, 0)`,
        // Quintic-ease curve creates organic drag and settle motion
        transition:
          "transform 110ms cubic-bezier(0.19, 1, 0.22, 1), width 90ms ease-out, height 110ms ease",
        boxShadow:
          "0 0 10px rgba(6, 182, 212, 0.8), 0 0 20px rgba(6, 182, 212, 0.35)",
      }}
    />
  );
}
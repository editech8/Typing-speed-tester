// app/page.js
"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import confetti from "canvas-confetti";
import {
  RotateCcw,
  Flame,
  Trophy,
  Plus,
  Infinity as InfinityIcon,
  History,
  X,
  StopCircle,
} from "lucide-react";
import TypingArena from "@/components/typing/TypingArena";
import LiveStats from "@/components/typing/LiveStats";
import { mockDb } from "@/lib/mockDb";

const WORD_BANK = [
  "algorithm", "binary", "constant", "compiler", "container", "callback", "closure",
  "database", "element", "framework", "function", "generic", "handler", "interface",
  "iterator", "memory", "module", "network", "object", "package", "protocol", "queue",
  "react", "runtime", "server", "session", "syntax", "thread", "variable", "vector",
  "async", "await", "promise", "stream", "buffer", "socket", "client", "service"
];

export default function TypingSpeedPage() {
  // --- Profile & Custom Timers State ---
  const [profile, setProfile] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [customInputOpen, setCustomInputOpen] = useState(false);
  const [customDurationInput, setCustomDurationInput] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [sessions, setSessions] = useState([]);

  // --- Session Typing State ---
  const [words, setWords] = useState([]);
  const [activeWordIdx, setActiveWordIdx] = useState(0);
  const [currentInput, setCurrentInput] = useState("");
  const [wordHistory, setWordHistory] = useState({});
  const [correctChars, setCorrectChars] = useState(0);
  const [totalStrokes, setTotalStrokes] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  // --- Timer State ---
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [elapsedInfinite, setElapsedInfinite] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const isInfiniteMode = selectedDuration === 0;

  const inputRef = useRef(null);
  const timerRef = useRef(null);

  // Load Profile and Past Sessions on mount
  useEffect(() => {
    const loadedProfile = mockDb.getProfile();
    setProfile(loadedProfile);
    setSessions(mockDb.getSessions());
  }, []);

  // Generate word stream
  const generateWords = useCallback(() => {
    return [...WORD_BANK, ...WORD_BANK, ...WORD_BANK, ...WORD_BANK]
      .sort(() => Math.random() - 0.5)
      .slice(0, 100);
  }, []);

  // Complete and save test session
  const finishTest = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsActive(false);
    setIsFinished(true);

    confetti({
      particleCount: 85,
      spread: 70,
      origin: { y: 0.6 },
    });
  }, []);

  // Reset or initialize session
  const resetTest = useCallback(
    (duration = selectedDuration) => {
      if (timerRef.current) clearInterval(timerRef.current);

      setWords(generateWords());
      setActiveWordIdx(0);
      setCurrentInput("");
      setWordHistory({});
      setCorrectChars(0);
      setTotalStrokes(0);
      setMistakes(0);
      setSelectedDuration(duration);
      setTimerSeconds(duration);
      setElapsedInfinite(0);
      setIsActive(false);
      setIsFinished(false);

      setTimeout(() => inputRef.current?.focus(), 25);
    },
    [selectedDuration, generateWords]
  );

  useEffect(() => {
    resetTest(30);
  }, [resetTest]);

  // Unified Countdown & Infinite Stopwatch
  useEffect(() => {
    if (!isActive) return;

    timerRef.current = setInterval(() => {
      if (isInfiniteMode) {
        // Infinity Mode: Increment elapsed time count-up
        setElapsedInfinite((prev) => prev + 1);
      } else {
        // Finite Countdown Mode
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            finishTest();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isActive, isInfiniteMode, finishTest]);

  // Persist session to mockDb when test finishes
  useEffect(() => {
    if (isFinished) {
      const activeSeconds = isInfiniteMode ? Math.max(1, elapsedInfinite) : selectedDuration;
      const currentWord = words[activeWordIdx] || "";
      const currentActiveCorrect = currentInput
        .split("")
        .filter((c, i) => c === currentWord[i]).length;
      const finalWpm = Math.round(((correctChars + currentActiveCorrect) / 5) / (activeSeconds / 60)) || 0;
      const finalAccuracy =
        totalStrokes > 0 ? Math.max(0, Math.round(((totalStrokes - mistakes) / totalStrokes) * 100)) : 100;

      const saved = mockDb.recordSession({
        wpm: finalWpm,
        rawWpm: Math.round((totalStrokes / 5) / (activeSeconds / 60)) || 0,
        accuracy: finalAccuracy,
        durationSeconds: activeSeconds,
        mode: isInfiniteMode ? "infinite" : `time_${selectedDuration}`,
        mistakes,
        totalStrokes,
      });

      if (saved.success) {
        setSessions(mockDb.getSessions());
      }
    }
  }, [isFinished]); // Run only on state change to finished

  // Global Keyboard Listeners: Quick restarts & hands-free navigation
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Exit infinite loop or restart test
      if (e.key === "Escape" || e.key === "Tab") {
        e.preventDefault();
        resetTest();
        return;
      }

      // Exit infinite loop with Shift + Enter / Shift + Backspace
      if (isInfiniteMode && isActive && e.shiftKey && e.key === "Enter") {
        e.preventDefault();
        finishTest();
        return;
      }

      // Automatically focus on printable keys
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (document.activeElement !== inputRef.current) {
          inputRef.current?.focus();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [resetTest, isInfiniteMode, isActive, finishTest]);

  // Keystroke input logic
  const handleInputChange = (e) => {
    if (isFinished) return;
    if (!isActive) setIsActive(true);

    const val = e.target.value;
    const currentWord = words[activeWordIdx] || "";

    // Word submission via space
    if (val.endsWith(" ")) {
      if (currentInput.trim().length === 0) return;

      const trimmed = currentInput.trim();
      setTotalStrokes((prev) => prev + 1);

      setWordHistory((prev) => ({
        ...prev,
        [activeWordIdx]: trimmed,
      }));

      if (trimmed === currentWord) {
        setCorrectChars((prev) => prev + currentWord.length + 1);
      } else {
        setMistakes((prev) => prev + 1);
      }

      setActiveWordIdx((prev) => prev + 1);
      setCurrentInput("");
      return;
    }

    // Single character tracking
    if (val.length > currentInput.length) {
      const charTyped = val[val.length - 1];
      const targetChar = currentWord[val.length - 1];

      setTotalStrokes((prev) => prev + 1);
      if (charTyped !== targetChar) {
        setMistakes((prev) => prev + 1);
      }
    }

    setCurrentInput(val);
  };

  // Add custom timer handler
  const handleAddCustomTimer = (e) => {
    e.preventDefault();
    const duration = parseInt(customDurationInput, 10);
    if (!isNaN(duration) && duration >= 0) {
      mockDb.addCustomTimer(duration);
      setProfile(mockDb.getProfile());
      setCustomInputOpen(false);
      setCustomDurationInput("");
      resetTest(duration);
    }
  };

  // Real-time metric computations
  const currentDurationActive = isInfiniteMode
    ? Math.max(1, elapsedInfinite)
    : Math.max(1, selectedDuration - timerSeconds);

  const currentWord = words[activeWordIdx] || "";
  const currentActiveCorrect = currentInput
    .split("")
    .filter((c, i) => c === currentWord[i]).length;

  const liveWpm = Math.round(((correctChars + currentActiveCorrect) / 5) / (currentDurationActive / 60)) || 0;

  const liveAccuracy =
    totalStrokes > 0 ? Math.max(0, Math.round(((totalStrokes - mistakes) / totalStrokes) * 100)) : 100;

  const statsSummary = useMemo(() => mockDb.getStatsSummary(), [sessions]);

  return (
    <main
      onClick={() => inputRef.current?.focus()}
      className="relative min-h-screen bg-[#080c14] text-slate-100 flex flex-col items-center justify-between p-6 sm:p-10 cursor-text select-none overflow-hidden"
    >
      {/* Invisible Native Input */}
      <input
        ref={inputRef}
        type="text"
        value={currentInput}
        onChange={handleInputChange}
        className="absolute opacity-0 pointer-events-none"
        autoFocus
      />

      {/* Ambient Lighting */}
      <div className="pointer-events-none absolute -top-24 left-1/3 w-[550px] h-[550px] bg-cyan-500/10 rounded-full blur-3xl will-change-transform" />
      <div className="pointer-events-none absolute -bottom-24 right-1/4 w-[550px] h-[550px] bg-blue-600/10 rounded-full blur-3xl will-change-transform" />

      {/* Top Navigation & Mode Selector */}
      <header className="relative z-10 w-full max-w-6xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Flame size={20} />
          </div>
          <div>
            <h1 className="font-bold tracking-tight text-base">type.flow</h1>
            <span className="text-[10px] font-mono text-slate-500 block leading-none">
              v1.0 • {profile?.displayName || "Guest"}
            </span>
          </div>
        </div>

        {/* Timer Presets & Custom Configuration */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
            {profile?.customTimers?.map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  resetTest(sec);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1 cursor-pointer ${
                  selectedDuration === sec
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {sec === 0 ? <InfinityIcon size={13} /> : `${sec}s`}
              </button>
            ))}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCustomInputOpen(true);
              }}
              className="px-2 py-1 rounded-lg text-xs font-mono text-slate-400 hover:text-cyan-400 hover:bg-white/[0.04] transition cursor-pointer"
              title="Add Custom Duration"
            >
              <Plus size={13} />
            </button>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setHistoryOpen(true);
            }}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-400 hover:text-white transition cursor-pointer"
            title="View History & Database Stats"
          >
            <History size={16} />
          </button>
        </div>
      </header>

      {/* Central Arena */}
      <section className="relative z-10 flex flex-col items-center gap-6 w-full max-w-6xl my-auto">
        <LiveStats
          isInfinite={isInfiniteMode}
          displayTime={isInfiniteMode ? elapsedInfinite : timerSeconds}
          wpm={liveWpm}
          accuracy={liveAccuracy}
          isActive={isActive}
        />

        <TypingArena
          words={words}
          userInput={currentInput}
          activeWordIndex={activeWordIdx}
          wordHistory={wordHistory}
          isFinished={isFinished}
        />

        {/* Action Controls */}
        <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              resetTest();
            }}
            className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-400 hover:text-white transition cursor-pointer flex items-center gap-2"
          >
            <RotateCcw size={14} />
            <span>Restart</span>
          </button>

          {isInfiniteMode && isActive && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                finishTest();
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:bg-rose-500/30 transition cursor-pointer flex items-center gap-1.5"
            >
              <StopCircle size={14} />
              <span>Finish Run (Shift+Enter)</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-2">
            <span>Press</span>
            <kbd className="px-2 py-0.5 rounded bg-white/[0.06] border border-white/[0.1] text-slate-300">
              Tab
            </kbd>
            <span>or</span>
            <kbd className="px-2 py-0.5 rounded bg-white/[0.06] border border-white/[0.1] text-slate-300">
              Esc
            </kbd>
            <span>to restart anytime</span>
          </div>
        </div>
      </section>

      {/* Test Completion Modal */}
      {isFinished && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900/95 border border-white/[0.1] p-8 rounded-3xl max-w-md w-full shadow-2xl flex flex-col items-center text-center gap-6 animate-in zoom-in-95 duration-150">
            <div className="p-4 bg-cyan-500/10 text-cyan-400 rounded-2xl border border-cyan-500/20">
              <Trophy size={36} />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white">Test Complete!</h2>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                {isInfiniteMode ? `${elapsedInfinite}s Infinite Run` : `${selectedDuration}s Timed Test`} • Saved to Local Database
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="p-4 rounded-2xl bg-[#0b1220] border border-white/[0.06]">
                <span className="text-xs text-slate-400 block font-mono">Net WPM</span>
                <span className="text-3xl font-extrabold text-cyan-400">{liveWpm}</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#0b1220] border border-white/[0.06]">
                <span className="text-xs text-slate-400 block font-mono">Accuracy</span>
                <span className="text-3xl font-extrabold text-emerald-400">{liveAccuracy}%</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => resetTest()}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-xl text-sm transition-all shadow-[0_0_25px_rgba(6,182,212,0.3)] cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Take Another Test</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/20 text-[11px] font-mono">Tab</kbd>
            </button>
          </div>
        </div>
      )}

      {/* Custom Timer Input Dialog */}
      {customInputOpen && (
        <div
          onClick={() => setCustomInputOpen(false)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-white/[0.1] p-6 rounded-3xl max-w-sm w-full shadow-2xl flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base">Custom Duration</h3>
              <button
                type="button"
                onClick={() => setCustomInputOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Enter test duration in seconds. Enter <strong className="text-cyan-400 font-mono">0</strong> for Infinite Mode.
            </p>

            <form onSubmit={handleAddCustomTimer} className="flex flex-col gap-4">
              <input
                type="number"
                min="0"
                max="3600"
                value={customDurationInput}
                onChange={(e) => setCustomDurationInput(e.target.value)}
                placeholder="e.g. 45 or 0"
                className="w-full p-3 rounded-xl bg-[#080c14] border border-white/[0.1] text-white font-mono text-sm focus:outline-none focus:border-cyan-500 transition"
                autoFocus
              />

              <button
                type="submit"
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-xs transition cursor-pointer shadow-md shadow-cyan-600/30"
              >
                Save & Start Test
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Mock Database Sessions Drawer */}
      {historyOpen && (
        <div
          onClick={() => setHistoryOpen(false)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-950 border-l border-white/[0.08] w-full max-w-md h-full p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200"
          >
            <div className="flex flex-col gap-5 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                <div>
                  <h3 className="font-bold text-lg text-white">Typing History</h3>
                  <span className="text-xs font-mono text-slate-500">mockDb.typing_sessions</span>
                </div>
                <button
                  type="button"
                  onClick={() => setHistoryOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Aggregated Analytics */}
              <div className="grid grid-cols-2 gap-3 font-mono">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <span className="text-[10px] uppercase text-slate-500 block">Best Speed</span>
                  <span className="text-xl font-bold text-cyan-400">{statsSummary.bestWpm} WPM</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <span className="text-[10px] uppercase text-slate-500 block">Avg Accuracy</span>
                  <span className="text-xl font-bold text-emerald-400">{statsSummary.avgAccuracy}%</span>
                </div>
              </div>

              {/* Sessions List */}
              <div className="flex flex-col gap-2.5">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  Recent Runs ({sessions.length})
                </span>

                {sessions.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center font-mono">
                    No runs recorded yet. Finish a test to persist metrics!
                  </p>
                ) : (
                  sessions.slice(0, 10).map((s) => (
                    <div
                      key={s.id}
                      className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs font-mono"
                    >
                      <div>
                        <span className="text-cyan-300 font-bold block">{s.wpm} WPM</span>
                        <span className="text-[10px] text-slate-500">
                          {s.mode} • {s.accuracy}% acc
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {new Date(s.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Clear Database Button */}
            <div className="pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => {
                  if (confirm("Clear all recorded typing session history?")) {
                    mockDb.clearHistory();
                    setSessions([]);
                  }
                }}
                className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-mono transition cursor-pointer"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 text-center text-xs font-mono text-slate-600">
        Open Source Full-Stack Typing Engine • Next.js & Spring Boot
      </footer>
    </main>
  );
}
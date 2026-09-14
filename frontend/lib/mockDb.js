// src/lib/mockDb.js

// ==========================================
// 1. DEFAULT DATA SCHEMAS
// ==========================================

const DEFAULT_PROFILE = {
  id: "usr_guest_01",
  username: "guest_typist",
  displayName: "Guest Typist",
  avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=flow",
  joinedDate: "2026-01-01",
  customTimers: [15, 30, 60, 120], // in seconds (0 denotes infinite)
  preferences: {
    theme: "cyber-dark",
    smoothCaret: true,
    soundFx: false,
  },
};

const DEFAULT_SESSIONS = [
  {
    id: "sess_demo_1",
    timestamp: Date.now() - 86400000,
    wpm: 84,
    rawWpm: 88,
    accuracy: 96,
    durationSeconds: 30,
    mode: "time_30",
    mistakes: 3,
    totalStrokes: 420,
  },
  {
    id: "sess_demo_2",
    timestamp: Date.now() - 43200000,
    wpm: 92,
    rawWpm: 94,
    accuracy: 98,
    durationSeconds: 15,
    mode: "time_15",
    mistakes: 1,
    totalStrokes: 230,
  },
];

// ==========================================
// 2. SAFE STORAGE ENGINE
// ==========================================

const readStorage = (key, fallback) => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeStorage = (key, data) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(data));
  }
};

// ==========================================
// 3. UNIFIED MOCK API
// ==========================================

export const mockDb = {
  // --- Profile Management ---
  getProfile: () => readStorage("typing_profile", DEFAULT_PROFILE),

  saveProfile: (profileData) => {
    writeStorage("typing_profile", profileData);
    return { success: true, profile: profileData };
  },

  addCustomTimer: (seconds) => {
    const profile = mockDb.getProfile();
    const duration = parseInt(seconds, 10);
    if (isNaN(duration) || duration < 0) return { success: false, error: "Invalid duration" };

    if (!profile.customTimers.includes(duration)) {
      profile.customTimers.push(duration);
      profile.customTimers.sort((a, b) => a - b);
      mockDb.saveProfile(profile);
    }
    return { success: true, timers: profile.customTimers };
  },

  deleteCustomTimer: (seconds) => {
    const profile = mockDb.getProfile();
    profile.customTimers = profile.customTimers.filter((t) => t !== seconds);
    mockDb.saveProfile(profile);
    return { success: true, timers: profile.customTimers };
  },

  // --- Session History & Analytics ---
  getSessions: () => readStorage("typing_sessions", DEFAULT_SESSIONS),

  recordSession: (sessionData) => {
    const sessions = mockDb.getSessions();
    const newSession = {
      id: `sess_${Date.now()}`,
      timestamp: Date.now(),
      ...sessionData,
    };
    sessions.unshift(newSession);
    writeStorage("typing_sessions", sessions);
    return { success: true, session: newSession };
  },

  getStatsSummary: () => {
    const sessions = mockDb.getSessions();
    if (!sessions.length) {
      return { totalTests: 0, bestWpm: 0, avgWpm: 0, avgAccuracy: 0 };
    }

    const totalTests = sessions.length;
    const bestWpm = Math.max(...sessions.map((s) => s.wpm || 0));
    const avgWpm = Math.round(
      sessions.reduce((acc, s) => acc + (s.wpm || 0), 0) / totalTests
    );
    const avgAccuracy = Math.round(
      sessions.reduce((acc, s) => acc + (s.accuracy || 0), 0) / totalTests
    );

    return { totalTests, bestWpm, avgWpm, avgAccuracy };
  },

  clearHistory: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("typing_sessions");
    }
    return { success: true };
  },
};
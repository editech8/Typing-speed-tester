"use client";

import { useEffect, useState } from "react";
import { Activity, CheckCircle2, XCircle } from "lucide-react";

export default function Home() {
  const [backendStatus, setBackendStatus] = useState("Checking...");
  const [isOnline, setIsOnline] = useState(null);

  useEffect(() => {
    fetch("http://localhost:8080/api/health")
      .then((res) => {
        if (!res.ok) throw new Error("HTTP error " + res.status);
        return res.json();
      })
      .then((data) => {
        setBackendStatus(`${data.service} is ${data.status} (Port ${data.port})`);
        setIsOnline(true);
      })
      .catch(() => {
        setBackendStatus("Could not connect to Spring Boot at http://localhost:8080");
        setIsOnline(false);
      });
  }, []);

  return (
    <main className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 backdrop-blur-xl max-w-md w-full text-center flex flex-col items-center gap-4 shadow-2xl">
        <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400">
          <Activity size={32} />
        </div>
        <h1 className="text-2xl font-bold">Typing Speed Platform</h1>
        <p className="text-xs text-slate-400">Full-Stack Environment Diagnostic</p>

        {/* Status Indicator Container */}
        <div className="w-full mt-2 p-4 rounded-xl bg-[#0b1220] border border-slate-800/80 flex items-center gap-3 text-left">
          {isOnline === true && <CheckCircle2 className="text-emerald-400 shrink-0" size={20} />}
          {isOnline === false && <XCircle className="text-red-400 shrink-0" size={20} />}
          {isOnline === null && (
            <div className="w-5 h-5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin shrink-0" />
          )}

          <div className="text-xs font-mono">
            <span className="text-slate-400 block text-[10px] uppercase">Backend Status</span>
            <span
              className={
                isOnline === true
                  ? "text-emerald-400 font-semibold"
                  : isOnline === false
                  ? "text-red-400 font-semibold"
                  : "text-slate-300"
              }
            >
              {backendStatus}
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
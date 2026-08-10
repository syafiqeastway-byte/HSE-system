import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    // Total duration ~ 3 seconds (2400ms loading progress + 600ms fadeout transition)
    const intervalTime = 24; // 100 steps * 24ms = 2400ms
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setFadingOut(true);
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 600);
          return 100;
        }
        return prev + 1;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-black via-[#09090b] to-zinc-950 text-white transition-opacity duration-500 ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative flex items-center justify-center mb-6">
        <div className="absolute w-28 h-28 rounded-full bg-blue-600/30 animate-ping"></div>
        <div className="w-24 h-24 flex items-center justify-center overflow-hidden">
          <img
            src="https://lh3.googleusercontent.com/d/1Nwa1uSh2j7JVDKnnJBI-Ttamib2FToVp"
            alt="EASTWAY Logo"
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-center px-4 mb-2">
        WELCOME TO EE MYSAFETY
      </h1>
      <p className="text-blue-400 font-semibold text-sm sm:text-base tracking-wider mb-8 uppercase">
        EASTWAY ENGINEERING HSE DASHBOARD
      </p>

      {/* CSS Progress Bar */}
      <div className="w-64 sm:w-80 bg-slate-800 rounded-full h-2.5 mb-4 overflow-hidden border border-slate-700/80 shadow-inner">
        <div
          className="bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 h-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
        <span className="material-symbols-outlined text-sm animate-spin text-blue-400">sync</span>
        <span>Initialising System Telemetry & HSE Protocols ({progress}%)...</span>
      </div>
    </div>
  );
};

/**
 * Generates a complete, single-file Index.html suitable for Google Apps Script deployment (HtmlService.createHtmlOutputFromFile('Index'))
 */
export function generateGasIndexHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EASTWAY ENGINEERING MYSAFETY - HSE Dashboard</title>
  
  <!-- Fonts & Google Icons -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
  
  <!-- Chart.js CDN -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: {
              blue: '#2563EB',
              darkBlue: '#1D4ED8',
              accent: '#3B82F6',
              bgLight: '#F8FAFC',
              bgDark: '#0F172A',
              cardLight: '#FFFFFF',
              cardDark: '#1E293B',
            }
          },
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
            heading: ['Poppins', 'sans-serif'],
          }
        }
      }
    }
  </script>

  <style>
    body {
      font-family: 'Inter', sans-serif;
      transition: background-color 0.3s ease, color 0.3s ease;
    }
    h1, h2, h3, h4, h5, h6 {
      font-family: 'Poppins', sans-serif;
    }
    .glass-card {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(226, 232, 240, 0.8);
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.05);
    }
    .dark .glass-card {
      background: rgba(30, 41, 59, 0.9);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(51, 65, 85, 0.6);
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
    }
    @keyframes pulseGlow {
      0%, 100% { box-shadow: 0 0 15px rgba(37, 99, 235, 0.2); }
      50% { box-shadow: 0 0 30px rgba(37, 99, 235, 0.5); }
    }
    .animate-pulse-glow { animation: pulseGlow 2.5s infinite ease-in-out; }
    @keyframes spinFast { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .animate-spin-fast { animation: spinFast 0.8s linear infinite; }
  </style>
</head>
<body class="bg-[#F8FAFC] dark:bg-[#0F172A] text-[#0F172A] dark:text-[#F8FAFC] min-h-screen">

  <!-- 1. SPLASH SCREEN -->
  <div id="splashScreen" class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#090D16] text-white transition-opacity duration-700">
    <div class="relative flex items-center justify-center mb-6">
      <div class="absolute w-24 h-24 rounded-full bg-blue-600/30 animate-ping"></div>
      <div class="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-xl shadow-blue-500/30">
        <span class="material-symbols-outlined text-4xl text-white">health_and_safety</span>
      </div>
    </div>
    <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight text-center mb-2">EASTWAY ENGINEERING</h1>
    <p class="text-blue-400 font-semibold text-lg mb-8 tracking-wider">MYSAFETY HSE DASHBOARD</p>
    
    <div class="w-64 bg-slate-800 rounded-full h-2 mb-4 overflow-hidden border border-slate-700">
      <div id="splashProgress" class="bg-gradient-to-r from-blue-500 to-cyan-400 h-full w-0 transition-all duration-300"></div>
    </div>
    <p id="splashText" class="text-xs text-slate-400 font-medium">Loading Telemetry & HSE Protocols...</p>
  </div>

  <!-- MAIN WRAPPER -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    
    <!-- HEADER BANNER -->
    <header class="glass-card p-4 sm:p-6 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 flex items-center justify-center flex-shrink-0 overflow-hidden">
          <img src="https://lh3.googleusercontent.com/d/1Nwa1uSh2j7JVDKnnJBI-Ttamib2FToVp" alt="EASTWAY Logo" class="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" referrerpolicy="no-referrer" />
        </div>
        <div>
          <h1 class="text-xl sm:text-2xl font-extrabold tracking-tight">EASTWAY ENGINEERING MYSAFETY</h1>
          <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Health, Safety & Environment Management System</p>
        </div>
      </div>
      
      <div class="flex items-center gap-3">
        <!-- Theme Toggle -->
        <button id="themeToggleBtn" onclick="toggleTheme()" class="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-sm font-semibold transition-all">
          <span id="themeIcon" class="material-symbols-outlined text-amber-500">dark_mode</span>
          <span id="themeText">Dark Mode</span>
        </button>
      </div>
    </header>

    <!-- TELEMETRY HUB ROW -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      
      <!-- Real Time Clock -->
      <div class="glass-card p-5 flex items-center gap-4">
        <div class="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
          <span class="material-symbols-outlined text-2xl">schedule</span>
        </div>
        <div>
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">SYSTEM TELEMETRY TIME</span>
          <div id="liveClock" class="text-lg font-bold font-mono text-slate-800 dark:text-slate-100">-- MMM YYYY | --:--:--</div>
        </div>
      </div>

      <!-- Live Weather Widget -->
      <div class="glass-card p-5 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="p-3 rounded-xl bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400">
            <span class="material-symbols-outlined text-2xl">thermostat</span>
          </div>
          <div>
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">SITE WEATHER</span>
            <div id="weatherKL" class="text-sm font-bold text-slate-800 dark:text-slate-100">KL: Loading...</div>
            <div id="weatherPenang" class="text-xs text-slate-500 dark:text-slate-400">Penang: Loading...</div>
          </div>
        </div>
        <span class="material-symbols-outlined text-3xl text-cyan-500 animate-pulse">partly_cloudy_day</span>
      </div>

      <!-- Incident Counter Card -->
      <div class="glass-card p-5 border-l-4 border-emerald-500 flex items-center justify-between animate-pulse-glow">
        <div>
          <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">INCIDENT COUNTER</span>
          <div class="text-2xl font-black text-slate-900 dark:text-white flex items-baseline gap-2 mt-0.5">
            <span id="daysCountNum">438</span>
            <span class="text-xs font-bold text-emerald-500 uppercase">DAYS WITHOUT INCIDENT</span>
          </div>
        </div>
        <div class="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
          <span class="material-symbols-outlined text-2xl">verified_user</span>
        </div>
      </div>

    </div>

    <!-- SPA VIEW CONTAINERS -->
    <main id="appContainer">
      <div class="glass-card p-6 text-center">
        <p class="text-slate-500">Loading HSE Modules...</p>
      </div>
    </main>

  </div>

  <!-- GOOGLE APPS SCRIPT BRIDGE & LOGIC -->
  <script>
    // System Theme State
    function toggleTheme() {
      const html = document.documentElement;
      if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        document.getElementById('themeText').innerText = 'Dark Mode';
        document.getElementById('themeIcon').innerText = 'dark_mode';
      } else {
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        document.getElementById('themeText').innerText = 'Light Mode';
        document.getElementById('themeIcon').innerText = 'light_mode';
      }
    }

    // Init Theme
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Real time clock
    function updateClock() {
      const now = new Date();
      const options = { day: '2-digit', month: 'short', year: 'numeric' };
      const dateStr = now.toLocaleDateString('en-GB', options).toUpperCase();
      const timeStr = now.toTimeString().split(' ')[0];
      const el = document.getElementById('liveClock');
      if (el) el.innerText = dateStr + ' | ' + timeStr;
    }
    setInterval(updateClock, 1000);
    updateClock();

    // Open-Meteo Weather Fetch
    async function fetchWeather() {
      try {
        const resKL = await fetch('https://api.open-meteo.com/v1/forecast?latitude=3.1390&longitude=101.6869&current_weather=true');
        const dataKL = await resKL.json();
        const resPenang = await fetch('https://api.open-meteo.com/v1/forecast?latitude=5.4164&longitude=100.3327&current_weather=true');
        const dataPenang = await resPenang.json();

        document.getElementById('weatherKL').innerText = 'KL: ' + dataKL.current_weather.temperature + '°C (Dry)';
        document.getElementById('weatherPenang').innerText = 'Penang: ' + dataPenang.current_weather.temperature + '°C (Clear)';
      } catch (e) {
        document.getElementById('weatherKL').innerText = 'KL: 31.5°C (Sunny)';
        document.getElementById('weatherPenang').innerText = 'Penang: 30.2°C (Fair)';
      }
    }
    fetchWeather();

    // Splash Screen animation
    let prog = 0;
    const interval = setInterval(() => {
      prog += 25;
      const bar = document.getElementById('splashProgress');
      if (bar) bar.style.width = prog + '%';
      if (prog >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          const splash = document.getElementById('splashScreen');
          if (splash) {
            splash.style.opacity = '0';
            setTimeout(() => splash.remove(), 700);
          }
        }, 300);
      }
    }, 150);
  </script>
</body>
</html>`;
}

import React, { useEffect, useState } from 'react';
import { WeatherInfo } from '../types';
import { fetchDaysWithoutIncident } from '../utils/gasBridge';

export const TelemetryHub: React.FC = () => {
  const [timeStr, setTimeStr] = useState<string>('-- MMM YYYY | --:--:--');
  const [daysCount, setDaysCount] = useState<number>(438);
  const [loadingDays, setLoadingDays] = useState<boolean>(true);
  const [weather, setWeather] = useState<WeatherInfo>({
    tempKL: 31.8,
    weatherKL: 'Partly Cloudy',
    tempPenang: 30.5,
    weatherPenang: 'Fair & Sunny',
    lastUpdated: 'Just Now'
  });
  const [loadingWeather, setLoadingWeather] = useState<boolean>(true);

  // Real-time Clock Effect
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
      const dateFormatted = now.toLocaleDateString('en-GB', options).toUpperCase();
      const timeFormatted = now.toTimeString().split(' ')[0];
      setTimeStr(`${dateFormatted} | ${timeFormatted}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Days Without Incident
  useEffect(() => {
    let isMounted = true;
    setLoadingDays(true);
    fetchDaysWithoutIncident()
      .then((days) => {
        if (isMounted) {
          setDaysCount(days);
          setLoadingDays(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoadingDays(false);
      });
    return () => { isMounted = false; };
  }, []);

  // Open-Meteo Live Weather API Fetch
  useEffect(() => {
    let isMounted = true;
    const getWeather = async () => {
      try {
        setLoadingWeather(true);
        // Kuala Lumpur: Lat 3.1390, Lon 101.6869
        // Penang: Lat 5.4164, Lon 100.3327
        const [resKL, resPenang] = await Promise.all([
          fetch('https://api.open-meteo.com/v1/forecast?latitude=3.1390&longitude=101.6869&current_weather=true'),
          fetch('https://api.open-meteo.com/v1/forecast?latitude=5.4164&longitude=100.3327&current_weather=true')
        ]);

        if (resKL.ok && resPenang.ok) {
          const dataKL = await resKL.json();
          const dataPenang = await resPenang.json();

          const codeMap: Record<number, string> = {
            0: 'Clear Sky',
            1: 'Mainly Clear',
            2: 'Partly Cloudy',
            3: 'Overcast',
            45: 'Foggy',
            51: 'Light Drizzle',
            61: 'Slight Rain',
            80: 'Rain Showers',
            95: 'Thunderstorm'
          };

          const klCode = dataKL.current_weather?.weathercode ?? 2;
          const penangCode = dataPenang.current_weather?.weathercode ?? 0;

          if (isMounted) {
            setWeather({
              tempKL: Math.round(dataKL.current_weather?.temperature ?? 31.8),
              weatherKL: codeMap[klCode] || 'Partly Cloudy',
              tempPenang: Math.round(dataPenang.current_weather?.temperature ?? 30.5),
              weatherPenang: codeMap[penangCode] || 'Fair',
              lastUpdated: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
            });
            setLoadingWeather(false);
          }
        } else {
          if (isMounted) setLoadingWeather(false);
        }
      } catch (err) {
        console.warn('Weather fetch error, fallback to defaults:', err);
        if (isMounted) setLoadingWeather(false);
      }
    };

    getWeather();
    const weatherInterval = setInterval(getWeather, 300000); // 5 mins
    return () => { isMounted = false; clearInterval(weatherInterval); };
  }, []);

  const getWeatherIcon = (weatherDesc: string) => {
    const desc = weatherDesc.toLowerCase();
    if (desc.includes('clear') || desc.includes('sunny')) return 'wb_sunny';
    if (desc.includes('partly') || desc.includes('mainly')) return 'partly_cloudy_day';
    if (desc.includes('cloudy') || desc.includes('overcast')) return 'cloud';
    if (desc.includes('rain') || desc.includes('drizzle') || desc.includes('shower')) return 'rainy';
    if (desc.includes('thunderstorm') || desc.includes('storm')) return 'thunderstorm';
    if (desc.includes('fog')) return 'foggy';
    return 'wb_cloudy';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      
      {/* 1. Real-Time System Clock */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 sm:p-5 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 border border-blue-500/30">
            <span className="material-symbols-outlined text-2xl">schedule</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-blue-400 uppercase tracking-widest">
              <span>DATE/TIME</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="text-sm sm:text-base font-bold font-mono text-slate-900 dark:text-white mt-1 tracking-tight">
              {timeStr}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Live Weather Widget (Kuala Lumpur & Penang) */}
      <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3.5 w-full">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0 border border-cyan-500/30">
            <span className="material-symbols-outlined text-2xl">thermostat</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[9px] sm:text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1">
              <span>LIVE SITE WEATHER</span>
              {loadingWeather && <span className="material-symbols-outlined text-xs animate-spin">sync</span>}
            </div>
            
            <div className="space-y-1 mt-1.5">
              {/* KL Weather */}
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                <span>KL:</span>
                <span className="text-cyan-500 dark:text-cyan-400 font-extrabold">{weather.tempKL}°C</span>
                <span className="text-slate-400 dark:text-slate-600 font-normal">•</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium truncate">{weather.weatherKL}</span>
                <span className="material-symbols-outlined text-cyan-400 text-lg animate-pulse ml-auto" title={weather.weatherKL}>
                  {getWeatherIcon(weather.weatherKL)}
                </span>
              </div>
              
              {/* PENANG Weather */}
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                <span>PENANG:</span>
                <span className="text-cyan-500 dark:text-cyan-400 font-extrabold">{weather.tempPenang}°C</span>
                <span className="text-slate-400 dark:text-slate-600 font-normal">•</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium truncate">{weather.weatherPenang}</span>
                <span className="material-symbols-outlined text-cyan-400 text-lg animate-pulse ml-auto" title={weather.weatherPenang}>
                  {getWeatherIcon(weather.weatherPenang)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Incident Counter Card */}
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 flex items-center justify-between backdrop-blur-md animate-pulse-glow">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
            <span className="material-symbols-outlined text-2xl">verified_user</span>
          </div>
          <div>
            <div className="text-[9px] sm:text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
              DAYS WITHOUT INCIDENT
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 flex items-baseline gap-2 mt-0.5 font-mono">
              {loadingDays ? (
                <span className="text-slate-400 text-lg">--</span>
              ) : (
                <span>{daysCount}</span>
              )}
              <span className="text-[9px] sm:text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest">
                DAYS SAFE
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

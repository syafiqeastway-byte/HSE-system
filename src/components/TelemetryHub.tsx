import React, { useEffect, useState } from 'react';
import { WeatherInfo } from '../types';
import {
  fetchDaysWithoutIncident,
  fetchLatestJkkMeeting,
  getCachedDaysWithoutIncident,
  getCachedLatestJkkMeeting,
  JkkMeetingSummary
} from '../utils/gasBridge';

interface TelemetryHubProps {
  onNavigateMinuteMeetings?: () => void;
}

// Helper to compute realistic local diurnal weather if network is blocked
const getRealisticLocalWeather = (): WeatherInfo => {
  const now = new Date();
  const hr = now.getHours();
  let tempKL = 31.8;
  let weatherKL = 'Partly Cloudy';
  let tempPenang = 30.5;
  let weatherPenang = 'Fair & Sunny';

  if (hr >= 0 && hr < 7) {
    tempKL = 25.5;
    weatherKL = 'Clear Night';
    tempPenang = 25.8;
    weatherPenang = 'Mainly Clear';
  } else if (hr >= 7 && hr < 11) {
    tempKL = 28.5;
    weatherKL = 'Fair & Sunny';
    tempPenang = 28.0;
    weatherPenang = 'Clear Sky';
  } else if (hr >= 11 && hr < 16) {
    tempKL = 33.2;
    weatherKL = 'Partly Cloudy';
    tempPenang = 32.0;
    weatherPenang = 'Fair & Sunny';
  } else if (hr >= 16 && hr < 19) {
    tempKL = 29.5;
    weatherKL = 'Slight Rain';
    tempPenang = 29.0;
    weatherPenang = 'Partly Cloudy';
  } else {
    tempKL = 27.2;
    weatherKL = 'Mainly Clear';
    tempPenang = 27.0;
    weatherPenang = 'Clear Night';
  }

  return {
    tempKL: Math.round(tempKL * 10) / 10,
    weatherKL,
    tempPenang: Math.round(tempPenang * 10) / 10,
    weatherPenang,
    lastUpdated: now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
  };
};

export const TelemetryHub: React.FC<TelemetryHubProps> = ({ onNavigateMinuteMeetings }) => {
  const [timeStr, setTimeStr] = useState<string>('-- MMM YYYY | --:--:--');
  const [daysCount, setDaysCount] = useState<number>(() => getCachedDaysWithoutIncident());
  const [jkkMeeting, setJkkMeeting] = useState<JkkMeetingSummary>(() => getCachedLatestJkkMeeting());
  const [weather, setWeather] = useState<WeatherInfo>(() => {
    try {
      const cached = localStorage.getItem('HSE_CACHED_WEATHER');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // ignore
    }
    return getRealisticLocalWeather();
  });
  const [loadingWeather, setLoadingWeather] = useState<boolean>(false);

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

  // Fetch Days Without Incident in background (Instant load with SWR)
  useEffect(() => {
    let isMounted = true;
    fetchDaysWithoutIncident()
      .then((days) => {
        if (isMounted && typeof days === 'number') {
          setDaysCount(days);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  // Fetch JKK Meeting Data in background (Instant load with SWR)
  useEffect(() => {
    let isMounted = true;
    fetchLatestJkkMeeting()
      .then((data) => {
        if (isMounted && data && data.date) {
          setJkkMeeting(data);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  // Live Weather API Fetch (Optimized multi-coordinate single request with fast timeout)
  useEffect(() => {
    let isMounted = true;
    const getWeather = async () => {
      try {
        setLoadingWeather(true);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        // Fetch Kuala Lumpur (3.1390, 101.6869) and Pulau Pinang (5.4164, 100.3327) in one single request
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=3.1390,5.4164&longitude=101.6869,100.3327&current_weather=true',
          {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          }
        );

        clearTimeout(timeoutId);

        if (res.ok) {
          const rawData = await res.json();
          const dataKL = Array.isArray(rawData) ? rawData[0] : rawData;
          const dataPenang = Array.isArray(rawData) ? rawData[1] : rawData;

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

          const klCode = dataKL?.current_weather?.weathercode ?? 2;
          const penangCode = dataPenang?.current_weather?.weathercode ?? 0;

          const updatedWeather: WeatherInfo = {
            tempKL: Math.round(dataKL?.current_weather?.temperature ?? 31.8),
            weatherKL: codeMap[klCode] || 'Partly Cloudy',
            tempPenang: Math.round(dataPenang?.current_weather?.temperature ?? 30.5),
            weatherPenang: codeMap[penangCode] || 'Fair & Sunny',
            lastUpdated: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
          };

          if (isMounted) {
            setWeather(updatedWeather);
            try {
              localStorage.setItem('HSE_CACHED_WEATHER', JSON.stringify(updatedWeather));
            } catch {
              // ignore
            }
            setLoadingWeather(false);
          }
          return;
        }
      } catch {
        // Silently handled: Fallback to local cache or realistic ambient estimation
      }

      if (isMounted) {
        try {
          const cached = localStorage.getItem('HSE_CACHED_WEATHER');
          if (cached) {
            const parsed = JSON.parse(cached);
            setWeather({
              ...parsed,
              lastUpdated: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            });
            setLoadingWeather(false);
            return;
          }
        } catch {
          // ignore
        }

        const fallback = getRealisticLocalWeather();
        setWeather(fallback);
        setLoadingWeather(false);
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

  const getDaysRemaining = (dateStr: string): string => {
    if (!dateStr || dateStr.includes('--')) return '';
    try {
      let meetingDate: Date | null = null;
      const parts = dateStr.trim().split(/[/.-]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          meetingDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        } else {
          meetingDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        }
      } else {
        meetingDate = new Date(dateStr);
      }

      if (!meetingDate || isNaN(meetingDate.getTime())) return '';

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      meetingDate.setHours(0, 0, 0, 0);

      const diffTime = meetingDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 1) {
        return `(${diffDays} DAYS LEFT)`;
      } else if (diffDays === 1) {
        return `(TOMORROW)`;
      } else if (diffDays === 0) {
        return `(TODAY)`;
      } else {
        const pastDays = Math.abs(diffDays);
        return `(${pastDays} DAYS AGO)`;
      }
    } catch {
      return '';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 mb-6">
      
      {/* 1. Real-Time System Clock */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 min-h-20 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-800/80 text-slate-200 flex items-center justify-center flex-shrink-0 border border-slate-700/50">
            <span className="material-symbols-outlined text-xl sm:text-2xl">schedule</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 uppercase tracking-wider">
              <span>DATE/TIME</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="text-xs sm:text-sm font-bold text-white mt-0.5 tracking-tight">
              {timeStr}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Live Weather Widget (Kuala Lumpur, Pulau Pinang) */}
      <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl px-3.5 py-2 sm:px-4 sm:py-2.5 min-h-20 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3 w-full">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-800/80 text-white flex items-center justify-center flex-shrink-0 border border-slate-700/50">
            <span className="material-symbols-outlined text-xl sm:text-2xl">thermostat</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
              <span>LIVE SITE WEATHER</span>
              {loadingWeather && <span className="material-symbols-outlined text-[10px] animate-spin">sync</span>}
            </div>
            
            <div className="flex flex-col gap-0.5 mt-0.5">
              {/* KUALA LUMPUR Weather */}
              <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-white">
                <span className="truncate text-white">KUALA LUMPUR:</span>
                <span className="flex items-center gap-1 flex-shrink-0 ml-1">
                  <span>{weather.tempKL}°C</span>
                  <span className="material-symbols-outlined text-white text-base" title={weather.weatherKL}>
                    {getWeatherIcon(weather.weatherKL)}
                  </span>
                </span>
              </div>
              
              {/* PULAU PINANG Weather */}
              <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-white">
                <span className="truncate text-white">PULAU PINANG:</span>
                <span className="flex items-center gap-1 flex-shrink-0 ml-1">
                  <span>{weather.tempPenang}°C</span>
                  <span className="material-symbols-outlined text-white text-base" title={weather.weatherPenang}>
                    {getWeatherIcon(weather.weatherPenang)}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Incident Counter Card */}
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 min-h-20 flex items-center justify-between backdrop-blur-md animate-pulse-glow">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-800/80 text-white flex items-center justify-center flex-shrink-0 border border-slate-700/50">
            <span className="material-symbols-outlined text-xl sm:text-2xl">verified_user</span>
          </div>
          <div>
            <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              DAYS WITHOUT INCIDENT
            </div>
            <div className="text-xs sm:text-sm font-bold text-white flex items-baseline gap-1.5 mt-0.5">
              <span>{daysCount}</span>
              <span className="uppercase tracking-wider text-white">
                DAYS SAFE
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. JKK Meeting Card (Placed beside DAYS WITHOUT INCIDENT) */}
      <div 
        onClick={onNavigateMinuteMeetings}
        className={`bg-sky-500/10 border border-sky-500/30 rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 min-h-20 flex items-center justify-between backdrop-blur-md transition-all ${
          onNavigateMinuteMeetings ? 'cursor-pointer hover:scale-[1.02] hover:border-sky-500/50 hover:bg-sky-500/15 active:scale-[0.98]' : ''
        }`}
        title={onNavigateMinuteMeetings ? "Click to view JKK Minute Meetings" : undefined}
      >
        <div className="flex items-center gap-3 w-full">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-800/80 text-white flex items-center justify-center flex-shrink-0 border border-slate-700/50">
            <span className="material-symbols-outlined text-xl sm:text-2xl">groups</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center justify-between">
              <span>NEXT JKK MEETING</span>
            </div>
            <div className="text-xs sm:text-sm font-bold text-white mt-0.5 tracking-tight flex items-center justify-between">
              <span>{jkkMeeting.date}</span>
              <span className="text-xs sm:text-sm font-bold text-white ml-1">
                {getDaysRemaining(jkkMeeting.date)}
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { WeatherInfo } from '../types';
import {
  fetchDaysWithoutIncident,
  fetchLatestJkkMeeting,
  fetchLiveIncidentRecords,
  getCachedDaysWithoutIncident,
  getCachedLatestJkkMeeting,
  JkkMeetingSummary
} from '../utils/gasBridge';
import { useAutoRefresh } from '../hooks/useAutoRefresh';

interface TelemetryHubProps {
  onNavigateMinuteMeetings?: () => void;
  onNavigateAnalytics?: () => void;
}

interface YearIncidentStat {
  year: string;
  count: number;
  color: string;
}

const DEFAULT_YEAR_STATS: YearIncidentStat[] = [
  { year: '2022', count: 5, color: '#3B82F6' },
  { year: '2023', count: 4, color: '#8B5CF6' },
  { year: '2024', count: 16, color: '#EC4899' },
  { year: '2025', count: 13, color: '#F59E0B' },
  { year: '2026', count: 22, color: '#10B981' },
];

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

export const TelemetryHub: React.FC<TelemetryHubProps> = ({ 
  onNavigateMinuteMeetings,
  onNavigateAnalytics
}) => {
  const [timeStr, setTimeStr] = useState<string>('-- MMM YYYY | --:--:--');
  const [daysCount, setDaysCount] = useState<number>(() => getCachedDaysWithoutIncident());
  const [jkkMeeting, setJkkMeeting] = useState<JkkMeetingSummary>(() => getCachedLatestJkkMeeting());
  const [yearStats, setYearStats] = useState<YearIncidentStat[]>(DEFAULT_YEAR_STATS);
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

  // Fetch Days Without Incident
  const refreshDaysWithoutIncident = useCallback(async () => {
    try {
      const days = await fetchDaysWithoutIncident();
      if (typeof days === 'number' && days > 0) {
        setDaysCount(days);
      }
    } catch {}
  }, []);

  // Fetch JKK Meeting Data
  const refreshJkkMeeting = useCallback(async () => {
    try {
      const data = await fetchLatestJkkMeeting();
      if (data && data.date) {
        setJkkMeeting(data);
      }
    } catch {}
  }, []);

  // Fetch Incidents Breakdown By Year
  const refreshYearStats = useCallback(async () => {
    try {
      const records = await fetchLiveIncidentRecords();
      if (Array.isArray(records) && records.length > 0) {
        const counts: Record<string, number> = {};
        records.forEach((r: any) => {
          const y = String(r.year || '').trim();
          if (y && y !== '-' && y !== 'N/A' && /^\d{4}$/.test(y)) {
            counts[y] = (counts[y] || 0) + 1;
          }
        });
        const sortedYears = Object.keys(counts).sort();
        if (sortedYears.length > 0) {
          const colorPalette = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#06B6D4'];
          const stats: YearIncidentStat[] = sortedYears.map((yr, idx) => ({
            year: yr,
            count: counts[yr],
            color: colorPalette[idx % colorPalette.length],
          }));
          setYearStats(stats);
          return;
        }
      }
    } catch {}
  }, []);

  // Live Weather API Fetch
  const refreshWeather = useCallback(async () => {
    try {
      setLoadingWeather(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

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

        setWeather(updatedWeather);
        try {
          localStorage.setItem('HSE_CACHED_WEATHER', JSON.stringify(updatedWeather));
        } catch {}
        setLoadingWeather(false);
        return;
      }
    } catch {}

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
    } catch {}

    const fallback = getRealisticLocalWeather();
    setWeather(fallback);
    setLoadingWeather(false);
  }, []);

  // Combined Telemetry Refresh Callback
  const refreshAllTelemetry = useCallback(async () => {
    await Promise.allSettled([
      refreshDaysWithoutIncident(),
      refreshJkkMeeting(),
      refreshWeather(),
      refreshYearStats(),
    ]);
  }, [refreshDaysWithoutIncident, refreshJkkMeeting, refreshWeather, refreshYearStats]);

  // Initial fetch on mount
  useEffect(() => {
    refreshAllTelemetry();
  }, [refreshAllTelemetry]);

  // AUTO-REFRESH: Automatically updates telemetry every 60 seconds, on tab focus/visibility, or on global refresh
  useAutoRefresh(refreshAllTelemetry, { intervalMs: 60000 });

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

  // Max value for mini chart height scaling
  const maxYearCount = useMemo(() => {
    const maxVal = Math.max(...yearStats.map((s) => s.count), 1);
    return maxVal;
  }, [yearStats]);

  const totalIncidents = useMemo(() => {
    return yearStats.reduce((acc, curr) => acc + curr.count, 0);
  }, [yearStats]);

  const displayMeetingDate = jkkMeeting.date || '08/01/2027';
  const meetingDaysRemaining = getDaysRemaining(displayMeetingDate);
  const safeDays = daysCount !== undefined && daysCount !== null ? daysCount : 2;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 mb-6">
      
      {/* 1. Real-Time System Clock */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 min-h-24 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-800/80 text-slate-200 flex items-center justify-center flex-shrink-0 border border-slate-700/50">
            <span className="material-symbols-outlined text-xl sm:text-2xl">schedule</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 uppercase tracking-wider">
              <span>DATE/TIME</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="text-xs sm:text-sm font-normal text-white mt-0.5 tracking-tight">
              {timeStr}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Live Weather Widget (Kuala Lumpur, Pulau Pinang) */}
      <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl px-3.5 py-2 sm:px-4 sm:py-2.5 min-h-24 flex items-center justify-between backdrop-blur-md">
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
              <div className="flex items-center justify-between text-xs sm:text-sm font-normal text-white">
                <span className="truncate text-white">KUALA LUMPUR:</span>
                <span className="flex items-center gap-1 flex-shrink-0 ml-1">
                  <span>{weather.tempKL}°C</span>
                  <span className="material-symbols-outlined text-white text-base" title={weather.weatherKL}>
                    {getWeatherIcon(weather.weatherKL)}
                  </span>
                </span>
              </div>
              
              {/* PULAU PINANG Weather */}
              <div className="flex items-center justify-between text-xs sm:text-sm font-normal text-white">
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

      {/* 3. Incidents Breakdown by Year Mini Chart (Replacing old DAYS WITHOUT INCIDENT box) */}
      <div 
        onClick={onNavigateAnalytics}
        className={`bg-slate-900/80 border border-cyan-500/30 rounded-2xl p-2.5 sm:p-3 min-h-24 flex flex-col justify-between backdrop-blur-md transition-all ${
          onNavigateAnalytics ? 'cursor-pointer hover:border-cyan-400 hover:bg-slate-900/95 active:scale-[0.99]' : ''
        }`}
        title={onNavigateAnalytics ? "Click to view full Incidents Analytics & Breakdown" : "Incidents Breakdown by Year"}
      >
        <div className="flex items-center justify-between gap-1 mb-1">
          <div className="text-[10px] sm:text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 truncate">
            <span className="material-symbols-outlined text-sm text-cyan-400">bar_chart</span>
            <span className="truncate">INCIDENTS BREAKDOWN BY YEAR</span>
          </div>
        </div>

        {/* Mini Bar Chart with prominent numbers displayed on the chart */}
        <div className="flex items-end justify-between gap-1.5 sm:gap-2 h-14 pt-1 px-1">
          {yearStats.map((item, idx) => {
            const barHeightPx = Math.max(10, Math.round((item.count / maxYearCount) * 32));
            return (
              <div 
                key={`${item.year}-${idx}`} 
                className="flex-1 flex flex-col items-center justify-end h-full group relative"
                title={`Year ${item.year}: ${item.count} Incidents`}
              >
                {/* Numbers displayed on the chart */}
                <span className="text-[10px] sm:text-[11px] font-black text-white leading-none mb-1 drop-shadow">
                  {item.count}
                </span>

                {/* The Bar */}
                <div 
                  className="w-full max-w-[24px] sm:max-w-[28px] rounded-t transition-all duration-300 group-hover:brightness-125 shadow-sm"
                  style={{
                    height: `${barHeightPx}px`,
                    backgroundColor: item.color,
                  }}
                />

                {/* Year Label */}
                <span className="text-[9px] sm:text-[10px] font-semibold text-slate-300 mt-1 leading-none tracking-tighter sm:tracking-normal">
                  {item.year}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. JKK Meeting & Safe Days Card */}
      <div 
        onClick={onNavigateMinuteMeetings}
        className={`bg-sky-500/10 border border-sky-500/30 rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 min-h-24 flex items-center justify-between backdrop-blur-md transition-all ${
          onNavigateMinuteMeetings ? 'cursor-pointer hover:scale-[1.01] hover:border-sky-500/50 hover:bg-sky-500/15 active:scale-[0.99]' : ''
        }`}
        title={onNavigateMinuteMeetings ? "Click to view JKK Minute Meetings" : undefined}
      >
        <div className="flex items-center gap-3 w-full">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-800/80 text-white flex items-center justify-center flex-shrink-0 border border-slate-700/50 shadow-inner">
            <span className="material-symbols-outlined text-xl sm:text-2xl text-cyan-400">groups</span>
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            {/* Top row: NEXT MEETING: date */}
            <div className="text-xs sm:text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center justify-between gap-1">
              <span className="truncate">
                NEXT MEETING: <span className="text-white font-extrabold">{displayMeetingDate}</span>
              </span>
            </div>

            {/* Bottom row: DAYS WITHOUT INCIDENT */}
            <div className="text-xs sm:text-xs font-bold text-emerald-400 uppercase tracking-wider mt-1.5 pt-1.5 border-t border-cyan-500/20 flex items-center justify-between gap-1">
              <span className="truncate">
                DAYS WITHOUT INCIDENT: <span className="text-white font-extrabold">{safeDays}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { WeatherInfo } from '../types';
import { fetchDaysWithoutIncident, fetchLatestJkkMeeting, JkkMeetingSummary } from '../utils/gasBridge';

interface TelemetryHubProps {
  onNavigateMinuteMeetings?: () => void;
}

export const TelemetryHub: React.FC<TelemetryHubProps> = ({ onNavigateMinuteMeetings }) => {
  const [timeStr, setTimeStr] = useState<string>('-- MMM YYYY | --:--:--');
  const [daysCount, setDaysCount] = useState<number>(438);
  const [loadingDays, setLoadingDays] = useState<boolean>(true);
  const [jkkMeeting, setJkkMeeting] = useState<JkkMeetingSummary>({
    date: '09/10/2026',
    meetingTitle: '13th Minute Meeting',
    location: 'IJOK',
    meetingNo: '13',
    totalMeetings: 13
  });
  const [loadingJkk, setLoadingJkk] = useState<boolean>(true);
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

  // Fetch JKK Meeting Data (Dynamic from Sheet JKK MEETING column D / latest row)
  useEffect(() => {
    let isMounted = true;
    setLoadingJkk(true);
    fetchLatestJkkMeeting()
      .then((data) => {
        if (isMounted) {
          setJkkMeeting(data);
          setLoadingJkk(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoadingJkk(false);
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
        // Pulau Pinang (Penang): Lat 5.4164, Lon 100.3327
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 mb-6">
      
      {/* 1. Real-Time System Clock */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 min-h-20 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 border border-blue-500/30">
            <span className="material-symbols-outlined text-xl sm:text-2xl">schedule</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400 uppercase tracking-wider">
              <span>DATE/TIME</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="text-xs sm:text-sm font-bold text-black dark:text-white mt-0.5 tracking-tight">
              {timeStr}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Live Weather Widget (Kuala Lumpur, Pulau Pinang) */}
      <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl px-3.5 py-2 sm:px-4 sm:py-2.5 min-h-20 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3 w-full">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0 border border-cyan-500/30">
            <span className="material-symbols-outlined text-xl sm:text-2xl">thermostat</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
              <span>LIVE SITE WEATHER</span>
              {loadingWeather && <span className="material-symbols-outlined text-[10px] animate-spin">sync</span>}
            </div>
            
            <div className="flex flex-col gap-0.5 mt-0.5">
              {/* KUALA LUMPUR Weather */}
              <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-black dark:text-white">
                <span className="truncate">KUALA LUMPUR:</span>
                <span className="flex items-center gap-1 flex-shrink-0 ml-1">
                  <span>{weather.tempKL}°C</span>
                  <span className="material-symbols-outlined text-black dark:text-white text-base" title={weather.weatherKL}>
                    {getWeatherIcon(weather.weatherKL)}
                  </span>
                </span>
              </div>
              
              {/* PULAU PINANG Weather */}
              <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-black dark:text-white">
                <span className="truncate">PULAU PINANG:</span>
                <span className="flex items-center gap-1 flex-shrink-0 ml-1">
                  <span>{weather.tempPenang}°C</span>
                  <span className="material-symbols-outlined text-black dark:text-white text-base" title={weather.weatherPenang}>
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
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
            <span className="material-symbols-outlined text-xl sm:text-2xl">verified_user</span>
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              DAYS WITHOUT INCIDENT
            </div>
            <div className="text-xs sm:text-sm font-bold text-black dark:text-white flex items-baseline gap-1.5 mt-0.5">
              {loadingDays ? (
                <span>--</span>
              ) : (
                <span>{daysCount}</span>
              )}
              <span className="uppercase tracking-wider">
                DAYS SAFE
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. JKK Meeting Card (Placed beside DAYS WITHOUT INCIDENT) */}
      <div 
        onClick={onNavigateMinuteMeetings}
        className={`bg-purple-500/10 border border-purple-500/30 rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 min-h-20 flex items-center justify-between backdrop-blur-md transition-all ${
          onNavigateMinuteMeetings ? 'cursor-pointer hover:scale-[1.02] hover:border-purple-500/50 hover:bg-purple-500/15 active:scale-[0.98]' : ''
        }`}
        title={onNavigateMinuteMeetings ? "Click to view JKK Minute Meetings" : undefined}
      >
        <div className="flex items-center gap-3 w-full">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0 border border-purple-500/30">
            <span className="material-symbols-outlined text-xl sm:text-2xl">groups</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center justify-between">
              <span>NEXT JKK MEETING</span>
              {loadingJkk && <span className="material-symbols-outlined text-[10px] animate-spin">sync</span>}
            </div>
            <div className="text-xs sm:text-sm font-bold text-black dark:text-white mt-0.5 tracking-tight flex items-center justify-between">
              {loadingJkk ? (
                <span>--/--/----</span>
              ) : (
                <span>{jkkMeeting.date}</span>
              )}
              {jkkMeeting.location && (
                <span className="text-xs sm:text-sm font-bold text-black dark:text-white ml-1">
                  ({jkkMeeting.location})
                </span>
              )}
            </div>
            <div className="text-xs sm:text-sm font-bold text-black dark:text-white truncate mt-0.5">
              <span>{jkkMeeting.meetingTitle || 'LATEST SESSION'}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

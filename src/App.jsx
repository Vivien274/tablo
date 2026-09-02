import React, { useState, useEffect, useCallback, useRef } from 'react';
import HeaderBar from './components/HeaderBar';
import ClockWidget from './components/ClockWidget';
import WeatherHub from './components/WeatherHub';
import TodoWidget from './components/TodoWidget';
import PhotoFrameWidget from './components/PhotoFrameWidget';
import CityModal from './components/CityModal';
import ScreenSaverOverlay from './components/ScreenSaverOverlay';
import NightScheduleOverlay from './components/NightScheduleOverlay';
import { fetchWeather } from './services/weatherService';
import { fetchSharedGooglePhotosAlbum } from './services/googlePhotosService';
import { fetchCalendarFromUrl, DEFAULT_CALENDAR_EVENTS } from './services/calendarService';
import { storage } from './services/storageService';

const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes d'inactivité

function isWithinNightHours(startTime = '23:00', endTime = '07:00') {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = (startTime || '23:00').split(':').map(Number);
  const startMinutes = startH * 60 + startM;

  const [endH, endM] = (endTime || '07:00').split(':').map(Number);
  const endMinutes = endH * 60 + endM;

  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

export default function App() {
  // State
  const [city, setCity] = useState(() => storage.getCity());
  const [weatherData, setWeatherData] = useState(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);

  const [todos, setTodos] = useState(() => storage.getTodos());
  const [members] = useState(() => storage.getMembers());
  const [photos, setPhotos] = useState(() => storage.getPhotos());

  const [calendarUrl, setCalendarUrl] = useState(() => storage.getCalendarUrl());
  const [calendarEvents, setCalendarEvents] = useState(DEFAULT_CALENDAR_EVENTS);

  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [isScreenSaverActive, setIsScreenSaverActive] = useState(false);
  const [isNightModeActive, setIsNightModeActive] = useState(() => isWithinNightHours());

  const idleTimerRef = useRef(null);

  // Load weather
  const loadWeather = useCallback(async (targetCity) => {
    setIsWeatherLoading(true);
    const data = await fetchWeather(targetCity.lat, targetCity.lon);
    setWeatherData(data);
    setIsWeatherLoading(false);
  }, []);

  useEffect(() => {
    loadWeather(city);
    const interval = setInterval(() => {
      loadWeather(city);
    }, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [city, loadWeather]);

  // Sync Calendar
  const loadCalendar = useCallback(async (url) => {
    const events = await fetchCalendarFromUrl(url);
    setCalendarEvents(events);
  }, []);

  useEffect(() => {
    loadCalendar(calendarUrl);
    const interval = setInterval(() => {
      loadCalendar(calendarUrl);
    }, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [calendarUrl, loadCalendar]);

  // Initial sync for Google Photos
  useEffect(() => {
    const albumUrl = storage.getGoogleAlbumUrl();
    if (albumUrl) {
      fetchSharedGooglePhotosAlbum(albumUrl)
        .then((res) => {
          if (res.photos && res.photos.length > 0) {
            setPhotos(res.photos);
            storage.setPhotos(res.photos);
          }
        })
        .catch((err) => {
          console.warn('Initial Google Photos fetch error:', err);
        });
    }
  }, []);

  // Night Mode schedule check every minute
  useEffect(() => {
    const checkSchedule = () => {
      if (isWithinNightHours('23:00', '07:00')) {
        setIsNightModeActive(true);
      }
    };
    const timer = setInterval(checkSchedule, 60000);
    return () => clearInterval(timer);
  }, []);

  // 5-minute Inactivity Detection for Screen Saver (during daytime)
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(() => {
      if (isWithinNightHours('23:00', '07:00')) {
        setIsNightModeActive(true);
      } else {
        setIsScreenSaverActive(true);
      }
    }, IDLE_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'touchstart', 'touchmove', 'keydown', 'wheel'];

    const handleUserActivity = () => {
      resetIdleTimer();
    };

    events.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    // Start initial timer
    resetIdleTimer();

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      events.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
    };
  }, [resetIdleTimer]);

  // Handlers for manual triggers
  const handleTriggerScreenSaver = () => {
    setIsNightModeActive(false);
    setIsScreenSaverActive(true);
  };

  const handleToggleNightMode = () => {
    setIsScreenSaverActive(false);
    setIsNightModeActive(true);
  };

  // Exit Screen Saver handler
  const handleExitScreenSaver = () => {
    setIsScreenSaverActive(false);
    resetIdleTimer();
  };

  // Exit Night Mode handler
  const handleExitNightMode = () => {
    setIsNightModeActive(false);
    resetIdleTimer();
  };

  // Handlers with LocalStorage persistence
  const handleSelectCity = (newCity) => {
    setCity(newCity);
    storage.setCity(newCity);
    loadWeather(newCity);
  };

  const handleUpdateTodos = (newTodos) => {
    setTodos(newTodos);
    storage.setTodos(newTodos);
  };

  const handleUpdatePhotos = (newPhotos) => {
    setPhotos(newPhotos);
    storage.setPhotos(newPhotos);
  };

  const handleUpdateCalendarUrl = (newUrl) => {
    setCalendarUrl(newUrl);
    storage.setCalendarUrl(newUrl);
    loadCalendar(newUrl);
  };

  return (
    <div className="h-screen max-h-screen bg-[#07080c] text-zinc-100 p-3 sm:p-4 md:p-5 flex flex-col justify-between max-w-[1720px] mx-auto w-full overflow-hidden">
      {/* En-tête épuré */}
      <HeaderBar
        currentCity={city}
        onOpenCityModal={() => setIsCityModalOpen(true)}
        onTriggerScreenSaver={handleTriggerScreenSaver}
        onToggleNightMode={handleToggleNightMode}
      />

      {/* 
        Grille Bento 2 Colonnes & 2 Lignes (Split 35% / 65%) :
        Ligne 1 (35% hauteur) : 1. Heure | 2. Météo (Gradient Weather)
        Ligne 2 (65% hauteur) : 3. Tâches & Agenda | 4. Photos
      */}
      <main className="grid grid-cols-1 lg:grid-cols-2 grid-rows-[auto_auto] lg:grid-rows-[35fr_65fr] gap-3 sm:gap-4 md:gap-5 my-2 flex-1 items-stretch w-full overflow-hidden">
        {/* LIGNE 1 (35% HAUTEUR) */}
        {/* 1. HEURE */}
        <div className="w-full h-full flex overflow-hidden">
          <ClockWidget weatherData={weatherData} />
        </div>

        {/* 2. MÉTÉO */}
        <div className="w-full h-full flex overflow-hidden">
          <WeatherHub
            weatherData={weatherData}
            currentCity={city}
            onOpenCityModal={() => setIsCityModalOpen(true)}
            isLoading={isWeatherLoading}
          />
        </div>

        {/* LIGNE 2 (65% HAUTEUR) */}
        {/* 3. TÂCHES & AGENDA FAMILIAL */}
        <div className="w-full h-full flex overflow-hidden">
          <TodoWidget
            todos={todos}
            onUpdateTodos={handleUpdateTodos}
            members={members}
            calendarEvents={calendarEvents}
            calendarUrl={calendarUrl}
            onUpdateCalendarUrl={handleUpdateCalendarUrl}
          />
        </div>

        {/* 4. PHOTOS */}
        <div className="w-full h-full flex overflow-hidden">
          <PhotoFrameWidget
            photos={photos}
            onUpdatePhotos={handleUpdatePhotos}
          />
        </div>
      </main>

      {/* Footer discret */}
      <footer className="w-full text-center py-1 text-[11px] text-zinc-500 font-mono-numbers flex items-center justify-between px-2 shrink-0">
        <span className="hidden sm:inline">Tablo • Protection iPad Pro active (Pixel-Shift + Veille 23h-7h)</span>
        <span className="mx-auto sm:mx-0">Économiseur auto (5 min) • Toucher pour réveiller</span>
        <span className="hidden sm:inline">v1.6.0</span>
      </footer>

      {/* City Switcher Modal */}
      <CityModal
        isOpen={isCityModalOpen}
        onClose={() => setIsCityModalOpen(false)}
        onSelectCity={handleSelectCity}
        currentCity={city}
      />

      {/* 1. Économiseur d'écran Diaporama (Photo en fond + 2 colonnes en haut + Tâches en bas à gauche + Pixel-shift) */}
      <ScreenSaverOverlay
        isActive={isScreenSaverActive && !isNightModeActive}
        onExit={handleExitScreenSaver}
        photos={photos}
        weatherData={weatherData}
        todos={todos}
        members={members}
      />

      {/* 2. Mode Nuit OLED Profond (Programmable 23h00 - 07h00) */}
      <NightScheduleOverlay
        isActive={isNightModeActive}
        onExit={handleExitNightMode}
        weatherData={weatherData}
      />
    </div>
  );
}

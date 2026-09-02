// Service Météo pour Tablo utilisant l'API Open-Meteo (Gratuite & sans clé API)

export const DEFAULT_CITIES = [
  { name: 'Paris', label: 'Paris (Île-de-France)', lat: 48.8566, lon: 2.3522 },
  { name: 'Lyon', label: 'Lyon (Rhône)', lat: 45.764, lon: 4.8357 },
  { name: 'Marseille', label: 'Marseille (PACA)', lat: 43.2965, lon: 5.3698 },
  { name: 'Bordeaux', label: 'Bordeaux (Nouvelle-Aquitaine)', lat: 44.8378, lon: -0.5792 },
  { name: 'Toulouse', label: 'Toulouse (Occitanie)', lat: 43.6047, lon: 1.4442 },
  { name: 'Nantes', label: 'Nantes (Pays de la Loire)', lat: 47.2184, lon: -1.5536 },
  { name: 'Strasbourg', label: 'Strasbourg (Grand Est)', lat: 48.5734, lon: 7.7521 },
  { name: 'Lille', label: 'Lille (Hauts-de-France)', lat: 50.6292, lon: 3.0573 },
  { name: 'Nice', label: 'Nice (Côte d\'Azur)', lat: 43.7102, lon: 7.2620 },
  { name: 'Rennes', label: 'Rennes (Bretagne)', lat: 48.1173, lon: -1.6778 },
  { name: 'Montpellier', label: 'Montpellier (Hérault)', lat: 43.6108, lon: 3.8767 },
  { name: 'Annecy', label: 'Annecy (Haute-Savoie)', lat: 45.8992, lon: 6.1294 },
];

export const WMO_CODES = {
  0: { label: 'Ciel dégagé', icon: 'Sun', dayColor: 'text-amber-400', bgGlow: 'rgba(251, 191, 36, 0.12)' },
  1: { label: 'Principalement dégagé', icon: 'SunMedium', dayColor: 'text-amber-300', bgGlow: 'rgba(251, 191, 36, 0.08)' },
  2: { label: 'Partiellement nuageux', icon: 'CloudSun', dayColor: 'text-sky-300', bgGlow: 'rgba(56, 189, 248, 0.08)' },
  3: { label: 'Couvert', icon: 'Cloud', dayColor: 'text-zinc-300', bgGlow: 'rgba(148, 163, 184, 0.08)' },
  45: { label: 'Brouillard', icon: 'CloudFog', dayColor: 'text-slate-300', bgGlow: 'rgba(148, 163, 184, 0.08)' },
  48: { label: 'Brouillard givrant', icon: 'CloudFog', dayColor: 'text-teal-200', bgGlow: 'rgba(45, 212, 191, 0.08)' },
  51: { label: 'Bruine légère', icon: 'CloudDrizzle', dayColor: 'text-cyan-300', bgGlow: 'rgba(6, 182, 212, 0.08)' },
  53: { label: 'Bruine modérée', icon: 'CloudDrizzle', dayColor: 'text-cyan-400', bgGlow: 'rgba(6, 182, 212, 0.1)' },
  55: { label: 'Bruine dense', icon: 'CloudDrizzle', dayColor: 'text-blue-400', bgGlow: 'rgba(59, 130, 246, 0.1)' },
  61: { label: 'Pluie faible', icon: 'CloudRain', dayColor: 'text-blue-400', bgGlow: 'rgba(59, 130, 246, 0.1)' },
  63: { label: 'Pluie modérée', icon: 'CloudRain', dayColor: 'text-blue-400', bgGlow: 'rgba(59, 130, 246, 0.12)' },
  65: { label: 'Forte pluie', icon: 'CloudRainWind', dayColor: 'text-indigo-400', bgGlow: 'rgba(99, 102, 241, 0.15)' },
  71: { label: 'Neige légère', icon: 'CloudSnow', dayColor: 'text-blue-200', bgGlow: 'rgba(191, 219, 254, 0.12)' },
  73: { label: 'Neige modérée', icon: 'CloudSnow', dayColor: 'text-blue-200', bgGlow: 'rgba(191, 219, 254, 0.15)' },
  75: { label: 'Forte neige', icon: 'Snowflake', dayColor: 'text-cyan-100', bgGlow: 'rgba(207, 250, 254, 0.2)' },
  80: { label: 'Averses faibles', icon: 'CloudRain', dayColor: 'text-sky-400', bgGlow: 'rgba(56, 189, 248, 0.1)' },
  81: { label: 'Averses modérées', icon: 'CloudRain', dayColor: 'text-blue-400', bgGlow: 'rgba(59, 130, 246, 0.12)' },
  82: { label: 'Violentes averses', icon: 'CloudLightning', dayColor: 'text-purple-400', bgGlow: 'rgba(168, 85, 247, 0.15)' },
  95: { label: 'Orage', icon: 'CloudLightning', dayColor: 'text-amber-400', bgGlow: 'rgba(245, 158, 11, 0.15)' },
  96: { label: 'Orage avec grêle', icon: 'CloudLightning', dayColor: 'text-rose-400', bgGlow: 'rgba(244, 63, 94, 0.15)' },
};

export function getWeatherMeta(code, isDay = 1) {
  const info = WMO_CODES[code] || { label: 'Nuageux', icon: 'Cloud', dayColor: 'text-zinc-300', bgGlow: 'rgba(255,255,255,0.05)' };
  
  // Night overrides for clear / partly cloudy
  if (!isDay && (code === 0 || code === 1)) {
    return {
      ...info,
      label: code === 0 ? 'Nuit claire' : 'Nuit dégagée',
      icon: 'Moon',
      dayColor: 'text-indigo-300',
      bgGlow: 'rgba(99, 102, 241, 0.1)',
    };
  }
  if (!isDay && code === 2) {
    return {
      ...info,
      label: 'Nuit nuageuse',
      icon: 'CloudMoon',
      dayColor: 'text-slate-300',
      bgGlow: 'rgba(148, 163, 184, 0.08)',
    };
  }
  return info;
}

export async function fetchWeather(lat, lon) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,uv_index&hourly=temperature_2m,precipitation_probability,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max&timezone=auto&forecast_days=7`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather API returned ${response.status}`);
    }
    
    const data = await response.json();
    return processWeatherData(data);
  } catch (error) {
    console.warn('Weather fetch failed, using fallback data:', error);
    return getFallbackWeatherData();
  }
}

function processWeatherData(data) {
  const current = data.current;
  const daily = data.daily;
  const hourly = data.hourly;

  // Next 12 hours
  const now = new Date();
  const currentHour = now.getHours();
  const nextHours = [];
  
  if (hourly && hourly.time) {
    for (let i = 0; i < hourly.time.length; i++) {
      const timeDate = new Date(hourly.time[i]);
      if (timeDate >= now && nextHours.length < 8) {
        nextHours.push({
          time: timeDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          temp: Math.round(hourly.temperature_2m[i]),
          rainProb: hourly.precipitation_probability ? hourly.precipitation_probability[i] : 0,
          code: hourly.weather_code[i],
          isDay: hourly.is_day ? hourly.is_day[i] : 1,
        });
      }
    }
  }

  // 6 Days Daily Forecast
  const dailyForecast = [];
  if (daily && daily.time) {
    for (let i = 0; i < Math.min(daily.time.length, 6); i++) {
      const date = new Date(daily.time[i]);
      const isToday = i === 0;
      const dayName = isToday 
        ? "Aujourd'hui" 
        : date.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '');
      
      dailyForecast.push({
        date: daily.time[i],
        dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
        maxTemp: Math.round(daily.temperature_2m_max[i]),
        minTemp: Math.round(daily.temperature_2m_min[i]),
        code: daily.weather_code[i],
        rainProb: daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : 0,
        sunrise: daily.sunrise ? daily.sunrise[i].split('T')[1].slice(0, 5) : '07:00',
        sunset: daily.sunset ? daily.sunset[i].split('T')[1].slice(0, 5) : '20:30',
      });
    }
  }

  return {
    current: {
      temp: Math.round(current.temperature_2m),
      apparentTemp: Math.round(current.apparent_temperature),
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m),
      uvIndex: current.uv_index ? Math.round(current.uv_index) : 0,
      precipitation: current.precipitation,
      code: current.weather_code,
      isDay: current.is_day,
      meta: getWeatherMeta(current.weather_code, current.is_day),
    },
    todayMax: dailyForecast[0]?.maxTemp ?? Math.round(current.temperature_2m + 3),
    todayMin: dailyForecast[0]?.minTemp ?? Math.round(current.temperature_2m - 4),
    sunrise: dailyForecast[0]?.sunrise ?? '07:15',
    sunset: dailyForecast[0]?.sunset ?? '20:30',
    hourly: nextHours,
    daily: dailyForecast,
    lastUpdated: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  };
}

export function getFallbackWeatherData() {
  return {
    current: {
      temp: 21,
      apparentTemp: 22,
      humidity: 55,
      windSpeed: 14,
      uvIndex: 4,
      precipitation: 0,
      code: 1,
      isDay: 1,
      meta: getWeatherMeta(1, 1),
    },
    todayMax: 24,
    todayMin: 16,
    sunrise: '07:12',
    sunset: '20:45',
    hourly: [
      { time: '17:00', temp: 22, rainProb: 5, code: 1, isDay: 1 },
      { time: '18:00', temp: 22, rainProb: 10, code: 2, isDay: 1 },
      { time: '19:00', temp: 21, rainProb: 15, code: 2, isDay: 1 },
      { time: '20:00', temp: 19, rainProb: 10, code: 1, isDay: 1 },
      { time: '21:00', temp: 18, rainProb: 5, code: 0, isDay: 0 },
      { time: '22:00', temp: 17, rainProb: 0, code: 0, isDay: 0 },
    ],
    daily: [
      { dayName: "Aujourd'hui", maxTemp: 24, minTemp: 16, code: 1, rainProb: 10, sunrise: '07:12', sunset: '20:45' },
      { dayName: 'Mer.', maxTemp: 25, minTemp: 15, code: 0, rainProb: 0, sunrise: '07:13', sunset: '20:43' },
      { dayName: 'Jeu.', maxTemp: 23, minTemp: 17, code: 2, rainProb: 20, sunrise: '07:15', sunset: '20:41' },
      { dayName: 'Ven.', maxTemp: 21, minTemp: 14, code: 61, rainProb: 70, sunrise: '07:16', sunset: '20:39' },
      { dayName: 'Sam.', maxTemp: 22, minTemp: 13, code: 2, rainProb: 15, sunrise: '07:18', sunset: '20:37' },
      { dayName: 'Dim.', maxTemp: 24, minTemp: 15, code: 0, rainProb: 5, sunrise: '07:19', sunset: '20:35' },
    ],
    lastUpdated: 'À l\'instant (mode hors-ligne)',
  };
}

export async function searchCities(query) {
  if (!query || query.trim().length < 2) return [];
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=fr&format=json`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.results) return [];
    return data.results.map(item => ({
      name: item.name,
      label: `${item.name} (${item.admin1 || item.country || ''})`,
      lat: item.latitude,
      lon: item.longitude,
      country: item.country,
    }));
  } catch (err) {
    console.error('Error searching cities:', err);
    return [];
  }
}

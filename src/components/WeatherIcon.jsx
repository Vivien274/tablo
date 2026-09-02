import React from 'react';
import {
  Sun,
  SunMedium,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudRainWind,
  CloudSnow,
  Snowflake,
  CloudLightning,
  Moon,
  CloudMoon,
} from 'lucide-react';

const ICON_MAP = {
  Sun,
  SunMedium,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudRainWind,
  CloudSnow,
  Snowflake,
  CloudLightning,
  Moon,
  CloudMoon,
};

export default function WeatherIcon({ name, className = 'w-6 h-6' }) {
  const IconComponent = ICON_MAP[name] || Cloud;
  return <IconComponent className={className} />;
}

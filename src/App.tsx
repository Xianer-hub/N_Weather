import { useState, useEffect, useCallback, useRef } from 'react';
import { Settings, Search, Loader2, WifiOff, Droplets, Wind, Thermometer, MapPin, X } from 'lucide-react';
import { weatherApi, processForecast, STORAGE_KEYS } from './api/weather';
import { WeatherData, TemperatureUnit, CitySuggestion, ForecastItem } from './types/weather';

const DEFAULT_CITY = 'Taipei';

function getContainerSize() {
  const width = typeof window !== 'undefined' ? window.innerWidth : 400;
  if (width < 320) return 'sm';
  if (width < 480) return 'md';
  return 'lg';
}

export default function App() {
  console.log('App version: 1.0.2 - Auto-fetch and Layout Fixes');
  const [location, setLocation] = useState('');
  const [showInput, setShowInput] = useState(true);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unit, setUnit] = useState<TemperatureUnit>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(STORAGE_KEYS.TEMP_UNIT) as TemperatureUnit) || 'celsius';
    }
    return 'celsius';
  });
  const [isOffline, setIsOffline] = useState(false);
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [containerSize, setContainerSize] = useState(() => getContainerSize());
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleResize = () => setContainerSize(getContainerSize());
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TEMP_UNIT, unit);
  }, [unit]);

  const handleSearch = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }
    setSearchLoading(true);
    try {
      const results = await weatherApi.searchCities(query);
      setSuggestions(results);
    } catch {
      setSuggestions([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const onLocationChange = (value: string) => {
    setLocation(value);
    setShowSuggestions(true);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => handleSearch(value), 200);
  };

  const selectSuggestion = (city: CitySuggestion) => {
    const value = city.country ? `${city.name}, ${city.country}` : city.name;
    setLocation(value);
    setShowSuggestions(false);
    setSuggestions([]);
    fetchWeather(value); // Fix: Auto-fetch weather when selecting from suggestions
  };

  const fetchWeather = useCallback(async (city?: string, preserveUnit = false) => {
    const cityToFetch = city || location;
    if (!cityToFetch) {
      setError('請輸入地點');
      return;
    }

    // Reset to Celsius when searching for a new city, unless preserveUnit is true
    if (!preserveUnit) {
      setUnit('celsius');
    }

    setLoading(true);
    setError(null);
    // Clear data to prevent useEffect from refetching with old city and new unit
    setWeatherData(null);

    try {
      const [currentData, forecastData] = await Promise.all([
        weatherApi.getCurrentWeather(cityToFetch, 'celsius'),
        weatherApi.getForecast(cityToFetch, 'celsius'),
      ]);
      setWeatherData({ current: currentData, forecast: processForecast(forecastData) });
      localStorage.setItem(STORAGE_KEYS.LAST_CITY, cityToFetch);
      setShowInput(false);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || '查詢天氣時發生錯誤');
    } finally {
      setLoading(false);
    }
  }, [location]);

  // Initial load effect
  const initialLoadDone = useRef(false);
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    const savedCity = localStorage.getItem(STORAGE_KEYS.LAST_CITY);
    if (savedCity) {
      setLocation(savedCity);
      fetchWeather(savedCity, true);
    }
  }, [fetchWeather]);

  useEffect(() => {
    // Only refetch when unit changes if we already have a loaded city
    if (!weatherData) return;

    const fetchWithNewUnit = async () => {
      const city = weatherData.current.name;
      setLoading(true);
      try {
        const [currentData, forecastData] = await Promise.all([
          weatherApi.getCurrentWeather(city, unit),
          weatherApi.getForecast(city, unit),
        ]);
        setWeatherData({ current: currentData, forecast: processForecast(forecastData) });
      } catch (err) {
        // Fix: Log/display error if unit change refetch fails instead of silent catch
        console.error('Failed to refetch with new unit', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWithNewUnit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit]); // Intentionally omitting weatherData to avoid infinity loops when weatherData is updated here

  const toggleUnit = () => setUnit(prev => prev === 'celsius' ? 'fahrenheit' : 'celsius');
  const formatTemp = (temp: number) => `${Math.round(temp)}°${unit === 'celsius' ? 'C' : 'F'}`;
  const getDayName = (dateStr: string) => new Date(dateStr).toLocaleDateString('zh-TW', { weekday: 'short' });

  const sizes = {
    sm: { icon: 40, iconSm: 24, text: 'text-xl', textSm: 'text-3xl', gap: 2 },
    md: { icon: 64, iconSm: 32, text: 'text-2xl', textSm: 'text-4xl', gap: 3 },
    lg: { icon: 80, iconSm: 40, text: 'text-2xl', textSm: 'text-5xl', gap: 4 },
  }[containerSize];

  // Fix: Click outside to close suggestions
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex flex-col w-full max-w-md mx-auto p-2"
      style={{ fontSize: containerSize === 'sm' ? '12px' : '14px' }}
    >
      {isOffline && (
        <div className="flex items-center gap-1 p-1.5 bg-amber-100 text-amber-800 text-xs rounded mb-2">
          <WifiOff size={12} />
          <span>離線</span>
        </div>
      )}

      {showInput && (
        <div className="relative flex-shrink-0 mb-2">
          <div className="relative">
            <input
              type="text"
              className="w-full p-2 pl-8 text-sm border-b border-gray-200 focus:border-blue-500 focus:outline-none bg-transparent transition-colors"
              placeholder="輸入城市..."
              value={location}
              onChange={(e) => onLocationChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (setShowSuggestions(false), fetchWeather())}
              onFocus={() => setShowSuggestions(true)}
            />
            <Search className="absolute left-2 top-2.5 text-gray-400" size={14} />
            {loading && <Loader2 className="absolute right-2 top-2.5 animate-spin text-blue-500" size={14} />}
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5 ml-1">輸入城市英文名稱並按 Enter 搜尋</p>
          {showSuggestions && Array.isArray(suggestions) && suggestions.length > 0 && (
            <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-32 overflow-y-auto text-sm">
              {suggestions.map((city, index) => (
                <li
                  key={`${city.id || 'unknown'}-${index}`}
                  className="px-2 py-1.5 hover:bg-gray-50 cursor-pointer flex items-center gap-2 text-gray-700 transition-colors"
                  onClick={() => selectSuggestion(city)}
                >
                  <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                  <span className="truncate font-medium">{city.name}</span>
                  <span className="text-gray-400 text-xs truncate">{city.country}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!showInput && weatherData && weatherData.current && (
        <div className="flex flex-col animate-in fade-in duration-500 relative gap-4">
          <div className="absolute left-0 top-0 flex gap-1 z-10">
            <button onClick={toggleUnit} className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100" title="切換單位">
              <Thermometer size={14} />
            </button>
            <button onClick={() => setShowInput(true)} className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100" title="搜尋">
              <Search size={14} />
            </button>
          </div>

          <div className="text-center pt-6">
            <h2 className={`font-bold text-gray-800 ${sizes.text}`}>{weatherData.current.name}</h2>
            <div className="flex items-center justify-center gap-1 my-1">
              {Array.isArray(weatherData.current.weather) && weatherData.current.weather.length > 0 && (
                <img
                  src={`https://openweathermap.org/img/wn/${weatherData.current.weather[0].icon}@2x.png`}
                  alt=""
                  className="w-12 h-12 drop-shadow-sm"
                  loading="lazy"
                />
              )}
              <span className={`font-bold text-gray-900 ${sizes.textSm}`}>
                {formatTemp(weatherData.current.main.temp)}
              </span>
            </div>
            <p className="text-gray-500 text-xs capitalize">
              {Array.isArray(weatherData.current.weather) && weatherData.current.weather.length > 0
                ? weatherData.current.weather[0].description
                : ''}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50/80 rounded-lg text-xs backdrop-blur-sm">
            <div className="flex flex-col items-center gap-1">
              <Droplets size={14} className="text-blue-400" />
              <span className="text-gray-500">濕度</span>
              <span className="font-semibold text-gray-700">{weatherData.current.main.humidity}%</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Wind size={14} className="text-teal-400" />
              <span className="text-gray-500">風速</span>
              <span className="font-semibold text-gray-700">{weatherData.current.wind.speed} {unit === 'celsius' ? 'm/s' : 'mph'}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Thermometer size={14} className="text-orange-400" />
              <span className="text-gray-500">體感</span>
              <span className="font-semibold text-gray-700">{formatTemp(weatherData.current.main.feels_like)}</span>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-1 text-center pt-3 border-t border-gray-100">
            {Array.isArray(weatherData.forecast) && weatherData.forecast.map((day) => (
              <div key={day.dt} className="flex flex-col items-center gap-1">
                <span className="text-gray-400 text-[10px] uppercase tracking-wider">{getDayName(day.dt_txt)}</span>
                {Array.isArray(day.weather) && day.weather.length > 0 && (
                  <img src={`https://openweathermap.org/img/wn/${day.weather[0].icon}.png`} alt="" className="w-6 h-6 opacity-80" loading="lazy" />
                )}
                <span className="font-medium text-xs text-gray-700">{formatTemp(day.main.temp)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-red-500 text-xs mt-1">錯誤: {error}</p>}

      {loading && !weatherData && (
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="animate-spin text-blue-500" size={24} />
        </div>
      )}
    </div>
  );
}

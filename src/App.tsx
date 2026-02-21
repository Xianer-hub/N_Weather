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
    const savedCity = localStorage.getItem(STORAGE_KEYS.LAST_CITY);
    if (savedCity) setLocation(savedCity);

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

  const fetchWeather = async (city?: string) => {
    const cityToFetch = city || location;
    if (!cityToFetch) {
      setError('請輸入地點');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [currentData, forecastData] = await Promise.all([
        weatherApi.getCurrentWeather(cityToFetch, unit),
        weatherApi.getForecast(cityToFetch, unit),
      ]);
      setWeatherData({ current: currentData, forecast: processForecast(forecastData) });
      localStorage.setItem(STORAGE_KEYS.LAST_CITY, cityToFetch);
      setShowInput(false);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || '查詢天氣時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

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
      className="h-full min-h-[300px] flex flex-col"
      style={{ fontSize: containerSize === 'sm' ? '12px' : '14px' }}
    >
      {isOffline && (
        <div className="flex items-center gap-1 p-1.5 bg-amber-100 text-amber-800 text-xs rounded">
          <WifiOff size={12} />
          <span>離線</span>
        </div>
      )}

      {showInput && (
        <div className="relative flex-shrink-0">
          <div className="flex gap-1.5">
            <div className="relative flex-grow">
              <input
                type="text"
                className="w-full p-1.5 pl-7 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="輸入城市"
                value={location}
                onChange={(e) => onLocationChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (setShowSuggestions(false), fetchWeather())}
                onFocus={() => setShowSuggestions(true)}
              />
              <Search className="absolute left-2 top-1.5 text-gray-400" size={14} />
            </div>
            <button
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
              onClick={() => fetchWeather()}
              disabled={loading || isOffline}
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : '查詢'}
            </button>
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-32 overflow-y-auto text-sm">
              {suggestions.map((city) => (
                <li
                  key={`${city.name}-${city.country || ''}`}
                  className="px-2 py-1 hover:bg-gray-100 cursor-pointer flex items-center gap-1 text-gray-800"
                  onClick={() => selectSuggestion(city)}
                >
                  <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                  <span className="truncate">{city.name}</span>
                  <span className="text-gray-400 text-xs truncate">{city.country}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!showInput && weatherData && (
        <div className="flex-grow flex flex-col">
          <div className="flex justify-between items-start">
            <div className="text-center flex-grow">
              <h2 className={`font-bold text-gray-800 ${sizes.text}`}>{weatherData.current.name}</h2>
              <div className="flex items-center justify-center gap-1">
                <img
                  src={`https://openweathermap.org/img/wn/${weatherData.current.weather[0].icon}@2x.png`}
                  alt=""
                  className="w-12 h-12"
                  loading="lazy"
                />
                <span className={`font-bold text-gray-900 ${sizes.textSm}`}>
                  {formatTemp(weatherData.current.main.temp)}
                </span>
              </div>
              <p className="text-gray-500 text-xs capitalize">{weatherData.current.weather[0].description}</p>
            </div>
            <div className="flex gap-1">
              <button onClick={toggleUnit} className="p-1 text-gray-400 hover:text-gray-600" title="切換單位">
                <Thermometer size={14} />
              </button>
              <button onClick={() => setShowInput(true)} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1 p-2 bg-gray-50 rounded text-xs mt-2">
            <div className="flex flex-col items-center">
              <Droplets size={12} className="text-blue-400" />
              <span className="text-gray-400">濕度</span>
              <span className="font-medium">{weatherData.current.main.humidity}%</span>
            </div>
            <div className="flex flex-col items-center">
              <Wind size={12} className="text-gray-400" />
              <span className="text-gray-400">風速</span>
              <span className="font-medium">{weatherData.current.wind.speed} {unit === 'celsius' ? 'm/s' : 'mph'}</span>
            </div>
            <div className="flex flex-col items-center">
              <Thermometer size={12} className="text-orange-400" />
              <span className="text-gray-400">體感</span>
              <span className="font-medium">{formatTemp(weatherData.current.main.feels_like)}</span>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-1 text-center pt-2 mt-auto">
            {weatherData.forecast.map((day) => (
              <div key={day.dt} className="flex flex-col items-center">
                <span className="text-gray-400 text-xs">{getDayName(day.dt_txt)}</span>
                <img src={`https://openweathermap.org/img/wn/${day.weather[0].icon}.png`} alt="" className="w-8 h-8" loading="lazy" />
                <span className="font-medium text-xs text-gray-800">{formatTemp(day.main.temp)}</span>
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

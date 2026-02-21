/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Settings } from 'lucide-react';

interface WeatherData {
  current: any;
  forecast: any[];
}

export default function App() {
  const [location, setLocation] = useState('');
  const [showInput, setShowInput] = useState(true);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY?.trim();

  const fetchWeather = async () => {
    if (!location) {
      setError('請輸入地點');
      setWeatherData(null);
      return;
    }
    if (!OPENWEATHER_API_KEY) {
      setError('OpenWeatherMap API Key 未設定。請檢查您的環境變數。');
      setWeatherData(null);
      return;
    }

    setLoading(true);
    setError(null);
    setWeatherData(null);

    try {
      const [currentRes, forecastRes] = await Promise.all([
        fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=zh_tw`
        ),
        fetch(
          `https://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=zh_tw`
        ),
      ]);

      if (!currentRes.ok) {
        const errorData = await currentRes.json();
        if (currentRes.status === 401) {
          throw new Error('API Key 無效或尚未啟用。新申請的 Key 可能需要 10-60 分鐘才能生效，請稍後再試。');
        }
        throw new Error(errorData.message || '無法取得當前天氣資料');
      }

      if (!forecastRes.ok) {
        const errorData = await forecastRes.json();
        throw new Error(errorData.message || '無法取得預報資料');
      }

      const currentData = await currentRes.json();
      const forecastData = await forecastRes.json();

      // Process forecast data to get one entry per day (e.g., around noon)
      // The API returns data every 3 hours. We want to skip today if possible or just show next 5 days.
      // Let's pick data points that are roughly 24 hours apart, or just pick the one closest to 12:00 PM for each distinct day.
      
      const dailyForecast: any[] = [];
      const seenDates = new Set();

      for (const item of forecastData.list) {
        const date = item.dt_txt.split(' ')[0];
        if (!seenDates.has(date)) {
          // Check if the time is close to noon (e.g., 12:00:00) or just take the first available slot for the next days
          // To be simple and robust, let's take the entry closest to 12:00:00
          if (item.dt_txt.includes('12:00:00')) {
             seenDates.add(date);
             dailyForecast.push(item);
          }
        }
      }
      
      // If we didn't get 5 days (maybe because it's already past noon), fill in with whatever we have for new days
      if (dailyForecast.length < 5) {
         // Reset and try a simpler strategy: just take the first entry of each new day
         seenDates.clear();
         dailyForecast.length = 0;
         for (const item of forecastData.list) {
            const date = item.dt_txt.split(' ')[0];
            if (!seenDates.has(date)) {
               seenDates.add(date);
               dailyForecast.push(item);
            }
         }
      }

      // Limit to 5 days
      const finalForecast = dailyForecast.slice(0, 5);

      setWeatherData({
        current: currentData,
        forecast: finalForecast,
      });
      setShowInput(false);
    } catch (err: any) {
      setError(err.message || '查詢天氣時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      fetchWeather();
    }
  };

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-TW', { weekday: 'short' });
  };

  return (
    <div className="p-4 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-4 font-sans">
      {showInput && (
        <div className="flex space-x-2">
          <input
            type="text"
            className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="輸入城市名稱 (例如: Taipei)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            onClick={fetchWeather}
            disabled={loading}
          >
            {loading ? '查詢中...' : '查詢天氣'}
          </button>
        </div>
      )}

      {!showInput && weatherData && (
        <div className="relative">
          <div className="absolute top-0 right-0">
            <button
              className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
              onClick={() => setShowInput(true)}
            >
              <Settings size={16} />
            </button>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">{weatherData.current.name}</h2>
            <div className="flex justify-center items-center">
              <img 
                src={`https://openweathermap.org/img/wn/${weatherData.current.weather[0].icon}@2x.png`} 
                alt={weatherData.current.weather[0].description}
                className="w-20 h-20"
              />
              <span className="text-4xl font-bold text-gray-900">{Math.round(weatherData.current.main.temp)}°C</span>
            </div>
            <p className="text-gray-600 capitalize">{weatherData.current.weather[0].description}</p>
          </div>

          <div className="grid grid-cols-5 gap-2 text-center border-t border-gray-100 pt-4">
            {weatherData.forecast.map((day: any, index: number) => (
              <div key={index} className="flex flex-col items-center">
                <span className="text-xs text-gray-500 mb-1">{getDayName(day.dt_txt)}</span>
                <img 
                  src={`https://openweathermap.org/img/wn/${day.weather[0].icon}.png`} 
                  alt={day.weather[0].description}
                  className="w-10 h-10"
                />
                <span className="text-sm font-semibold text-gray-800">{Math.round(day.main.temp)}°</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-red-500 text-sm mt-2">錯誤: {error}</p>}
    </div>
  );
}

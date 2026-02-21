/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Settings } from 'lucide-react';

export default function App() {
  const [location, setLocation] = useState('');
  const [showInput, setShowInput] = useState(true);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
  console.log('OpenWeatherMap API Key:', OPENWEATHER_API_KEY);

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
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=zh_tw`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '無法取得天氣資料');
      }
      const data = await response.json();
      setWeatherData(data);
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

  return (
    <div className="p-4 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-4">
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
        <div className="flex justify-end">
          <button
            className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-md"
            onClick={() => setShowInput(true)}
          >
            <Settings size={20} />
          </button>
        </div>
      )}

      {error && <p className="text-red-500 text-sm">錯誤: {error}</p>}

      {weatherData && (
        <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
          <h2 className="text-xl font-semibold text-gray-800">地點: {weatherData.name}</h2>
          <p className="text-gray-700">溫度: {weatherData.main.temp}°C</p>
          <p className="text-gray-700">體感溫度: {weatherData.main.feels_like}°C</p>
          <p className="text-gray-700">天氣: {weatherData.weather[0].description}</p>
          <p className="text-gray-700">濕度: {weatherData.main.humidity}%</p>
          <p className="text-gray-700">風速: {weatherData.wind.speed} m/s</p>
        </div>
      )}
    </div>
  );
}

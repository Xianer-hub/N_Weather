import axios from 'axios';
import { CurrentWeather, ForecastResponse, CitySuggestion, TemperatureUnit, ForecastItem } from '../types/weather';

const API_BASE = '/api/weather';

const getUnits = (unit: TemperatureUnit) => unit === 'celsius' ? 'metric' : 'imperial';

export const weatherApi = {
  getCurrentWeather: async (city: string, unit: TemperatureUnit): Promise<CurrentWeather> => {
    const response = await axios.get(`${API_BASE}/current`, {
      params: { q: city, units: getUnits(unit) },
    });
    return response.data;
  },

  getForecast: async (city: string, unit: TemperatureUnit): Promise<ForecastResponse> => {
    const response = await axios.get(`${API_BASE}/forecast`, {
      params: { q: city, units: getUnits(unit) },
    });
    return response.data;
  },

  searchCities: async (query: string): Promise<CitySuggestion[]> => {
    const response = await axios.get(`${API_BASE}/search`, {
      params: { q: query },
    });
    return response.data;
  },
};

export const processForecast = (forecastData: ForecastResponse): ForecastItem[] => {
  const dailyForecast: ForecastItem[] = [];
  const seenDates = new Set<string>();

  if (!forecastData || !Array.isArray(forecastData.list)) {
    return [];
  }

  // 第一次嘗試：優先收集每天中午 12:00 的預報
  for (const item of forecastData.list) {
    const date = item.dt_txt.split(' ')[0];
    if (!seenDates.has(date)) {
      if (item.dt_txt.includes('12:00:00')) {
        seenDates.add(date);
        dailyForecast.push(item);
      }
    }
  }

  // 如果不足五天，且原本的 list 中還有其他時間點的資料可以利用
  if (dailyForecast.length < 5) {
    for (const item of forecastData.list) {
      if (dailyForecast.length >= 5) break; // 若已補滿 5 天則結束
      const date = item.dt_txt.split(' ')[0];
      if (!seenDates.has(date)) {
        seenDates.add(date);
        dailyForecast.push(item); // 直接補足未收集的日期，通常是每天的第一筆
      }
    }
  }

  // 加上排序確保依序（因為有可能後補的日期比已加入的日期早）
  dailyForecast.sort((a, b) => a.dt - b.dt);

  return dailyForecast.slice(0, 5);
};

export const STORAGE_KEYS = {
  LAST_CITY: 'weather_last_city',
  TEMP_UNIT: 'weather_temp_unit',
} as const;

import { useState, useCallback } from 'react';
import { WeatherData } from '../types'; // Import the WeatherData type

const useWeatherData = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);

  const fetchWeatherData = useCallback(async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${import.meta.env.VITE_OPENWEATHER_API_KEY}&units=metric`
      );
      if (!response.ok) throw new Error('Failed to fetch weather data');
      const data = await response.json();
      setWeatherData(data);
    } catch (error) {
      console.error('Error fetching weather data:', error);
    }
  }, []);

  return { weatherData, fetchWeatherData };
};

export default useWeatherData;

import React from 'react';
import { WeatherData } from '../types';

interface WeatherWidgetProps {
  weatherData: WeatherData | null;
  closeWeatherWidget: () => void;
}

const WeatherWidget = ({ weatherData, closeWeatherWidget }: WeatherWidgetProps) => (
  <div className="weather-widget">
    <button onClick={closeWeatherWidget}>×</button>
    <h3>Weather Info</h3>
    <p><strong>Location:</strong> {weatherData?.name}</p>
    <p><strong>Temperature:</strong> {weatherData?.main?.temp}°C</p>
    <p><strong>Feels Like:</strong> {weatherData?.main?.feels_like}°C</p>
    <p><strong>Humidity:</strong> {weatherData?.main?.humidity}%</p>
    <p><strong>Wind Speed:</strong> {weatherData?.wind?.speed} m/s</p>
    <p><strong>Condition:</strong> {weatherData?.weather?.[0]?.description}</p>
    <img
      src={`http://openweathermap.org/img/wn/${weatherData?.weather?.[0]?.icon}@2x.png`}
      alt="Weather Icon"
    />
  </div>
);

export default WeatherWidget;

"use client";
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

const WeatherDisplay = ({
  weatherApiKey,
  city,
  latitude,
  longitude,
}: {
  weatherApiKey: string;
  city: string;
  latitude: number;
  longitude: number;
}) => {
  const [temperature, setTemperature] = useState<string | null>(null);
  const [condition, setCondition] = useState<string | null>(null);
  const [humidity, setHumidity] = useState<string | null>(null);
  const [windSpeed, setWindSpeed] = useState<string | null>(null);
  const [chanceOfRain, setChanceOfRain] = useState<string | null>(null);
  const [icon, setIcon] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchWeather = async () => {
      if (!weatherApiKey) {
        setError("Weather API key is missing. Please check your environment variables.");
        setIsLoading(false);
        return;
      }

      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTime;
      
      // Rate limiting: don't fetch more than once every 10 minutes
      if (timeSinceLastFetch < 600000) { // 10 minutes in milliseconds
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${weatherApiKey}&units=metric`
        );
        
        if (!response.ok) {
          if (response.status === 429) {
            setError("API call limit reached. Please try again in 10 minutes.");
            return;
          }
          throw new Error(`Weather API error: ${response.statusText}`);
        }

        const data = await response.json();
        setTemperature(data.main.temp);
        setCondition(data.weather[0].main);
        setHumidity(data.main.humidity);
        setWindSpeed(data.wind.speed);
        setChanceOfRain(data.rain ? data.rain["1h"] : 0);
        setIcon(`https://openweathermap.org/img/w/${data.weather[0].icon}.png`);
        setLastFetchTime(now);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch weather data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeather();
  }, [weatherApiKey, latitude, longitude]); // Removed city and lastFetchTime from dependencies

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-3 w-[500px] mx-auto flex flex-col items-center">
        <div className="animate-pulse w-full">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2 mx-auto"></div>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-200 rounded-lg p-2 h-12"></div>
            ))}
            <div className="bg-gray-200 rounded-lg p-2 h-12 col-span-4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-2 w-[500px] mx-auto flex flex-col items-center hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between mb-1 w-full">
        <h2 className="text-base font-semibold text-gray-800">Weather in {city}</h2>
        <img 
          src={icon || "default_image.png"} 
          alt="Weather icon" 
          className="w-6 h-6"
        />
      </div>
      
      <div className="grid grid-cols-4 gap-1 w-full">
        <div className="bg-gray-50 rounded-lg p-1.5 hover:bg-blue-50 hover:shadow-md transition-all duration-200 cursor-pointer group">
          <p className="text-[10px] text-gray-600 group-hover:text-blue-600 group-hover:text-xs transition-all duration-200">Temperature</p>
          <p className="text-xs font-bold text-gray-800 group-hover:text-blue-700 group-hover:text-sm transition-all duration-200">{temperature}°C</p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-1.5 hover:bg-blue-50 hover:shadow-md transition-all duration-200 cursor-pointer group">
          <p className="text-[10px] text-gray-600 group-hover:text-blue-600 group-hover:text-xs transition-all duration-200">Condition</p>
          <p className="text-xs font-bold text-gray-800 group-hover:text-blue-700 group-hover:text-sm transition-all duration-200">{condition}</p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-1.5 hover:bg-blue-50 hover:shadow-md transition-all duration-200 cursor-pointer group">
          <p className="text-[10px] text-gray-600 group-hover:text-blue-600 group-hover:text-xs transition-all duration-200">Humidity</p>
          <p className="text-xs font-bold text-gray-800 group-hover:text-blue-700 group-hover:text-sm transition-all duration-200">{humidity}%</p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-1.5 hover:bg-blue-50 hover:shadow-md transition-all duration-200 cursor-pointer group">
          <p className="text-[10px] text-gray-600 group-hover:text-blue-600 group-hover:text-xs transition-all duration-200">Wind Speed</p>
          <p className="text-xs font-bold text-gray-800 group-hover:text-blue-700 group-hover:text-sm transition-all duration-200">{windSpeed} m/s</p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-1.5 col-span-4 hover:bg-blue-50 hover:shadow-md transition-all duration-200 cursor-pointer group">
          <p className="text-[10px] text-gray-600 group-hover:text-blue-600 group-hover:text-xs transition-all duration-200">Chance of Rain</p>
          <p className="text-xs font-bold text-gray-800 group-hover:text-blue-700 group-hover:text-sm transition-all duration-200">{chanceOfRain}%</p>
        </div>
      </div>
    </div>
  );
};

WeatherDisplay.propTypes = {
  weatherApiKey: PropTypes.string.isRequired,
  city: PropTypes.string.isRequired,
  latitude: PropTypes.number.isRequired,
  longitude: PropTypes.number.isRequired,
};

export default WeatherDisplay;

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

  useEffect(() => {
    const fetchWeather = async () => {
      if (!weatherApiKey) {
        setError("Weather API key is missing. Please check your environment variables.");
        return;
      }

      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTime;
      
      // Rate limiting: don't fetch more than once every 10 minutes
      if (timeSinceLastFetch < 600000) { // 10 minutes in milliseconds
        return;
      }

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
      }
    };

    fetchWeather();
  }, [city, weatherApiKey, lastFetchTime, latitude, longitude]);

  if (error) {
    return (
      <div className="text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="">
      <div className="flex ">
        <h2>Weather in {city} </h2>
        <img src={icon || "default_image.png"} alt="Weather icon" />
      </div>
      <p>Temperature: {temperature}°C</p>
      <p>Condition: {condition}</p>
      <p>Humidity: {humidity}%</p>
      <p>Wind Speed: {windSpeed} m/s</p>
      <p>Chance of Rain: {chanceOfRain}%</p>
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

"use client";
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

const WeatherDisplay = ({
  weatherApiKey,
  city,
}: {
  weatherApiKey: string;
  city: string;
}) => {
  const [temperature, setTemperature] = useState<string | null>(null);
  const [condition, setCondition] = useState<string | null>(null);
  const [humidity, setHumidity] = useState<string | null>(null);
  const [windSpeed, setWindSpeed] = useState<string | null>(null);
  const [chanceOfRain, setChanceOfRain] = useState<string | null>(null);
  const [icon, setIcon] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      const response = await fetch(
        `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${weatherApiKey}`
      );
      const data = await response.json();
      setTemperature(data.main.temp);
      setCondition(data.weather[0].main);
      setHumidity(data.main.humidity);
      setWindSpeed(data.wind.speed);
      setChanceOfRain(data.rain ? data.rain["1h"] : 0);
      setIcon(`http://openweathermap.org/img/w/${data.weather[0].icon}.png`);
    };
    fetchWeather();
  }, [city]);

  return (
    <div className="">
      <div className="flex ">
        <h2>Weather in {city} </h2>
        <img src={icon || "default_image.png"} alt="Weather icon" />
      </div>
      <p>Temperature: {temperature}</p>
      <p>Condition: {condition}</p>
      <p>Humidity: {humidity}%</p>
      <p>Wind Speed: {windSpeed} m/s</p>
      <p>Chance of Rain: {chanceOfRain}%</p>
    </div>
  );
};

WeatherDisplay.propTypes = {
  city: PropTypes.string.isRequired,
  weatherApiKey: PropTypes.string.isRequired,
};

export default WeatherDisplay;

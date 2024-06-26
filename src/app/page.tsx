"use client";
import React, { useState, useEffect } from "react";
import MapDisplay from "@/components/mapDisplayComponent";
import axios from "axios";

function useDebounce<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function App() {
  const weatherApiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
  const geocodingApiKey = process.env.NEXT_PUBLIC_GEOCODING_API_KEY;
  const [city, setCity] = useState<string>("London");
  const [latitude, setLatitude] = useState<number>(51.505);
  const [longitude, setLongitude] = useState<number>(-0.09);
  const debouncedCity = useDebounce(city, 700);

  useEffect(() => {
    const fetchCity = async () => {
      try {
        const response = await axios.get(
          `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${geocodingApiKey}`
        );
        const city = response.data.results[0].components.city;
        setCity(city);
      } catch (error) {
        console.error("Failed to fetch city:", error);
      }
    };

    fetchCity();
  }, [latitude, longitude]);

  useEffect(() => {
    const fetchCoordinates = async () => {
      try {
        const response = await axios.get(
          `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
            debouncedCity
          )}&key=${geocodingApiKey}`
        );
        const { lat, lng } = response.data.results[0].geometry;
        setLatitude(lat);
        setLongitude(lng);
      } catch (error) {
        console.error("Failed to fetch coordinates:", error);
      }
    };

    if (debouncedCity) {
      fetchCoordinates();
    }
  }, [debouncedCity]);

  return (
    <div className="App">
      <form>
        <label>
          Latitude:
          <input
            className="text-black"
            type="number"
            max={90}
            min={-90}
            step={0.001}
            value={latitude}
            onChange={(e) => setLatitude(Number(e.target.value))}
            required
          />
        </label>
        <label>
          Longitude:
          <input
            className="text-black"
            type="number"
            max={180}
            min={-180}
            step={0.001}
            value={longitude}
            onChange={(e) => setLongitude(Number(e.target.value))}
            required
          />
        </label>
        {/* Add your interactive search bar here */}
        <label>
          City:
          <input
            className="text-black"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
          />
        </label>
      </form>
      <MapDisplay
        weatherApiKey={weatherApiKey || ""}
        initialLatitude={latitude}
        setLatitude={setLatitude}
        initialLongitude={longitude}
        setLongitude={setLongitude}
        zoomLevel={7}
        city={city}
      />
    </div>
  );
}

export default App;

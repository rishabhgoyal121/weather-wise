"use client";
import React, { useState, useEffect } from "react";
import MapDisplay from "@/app/components/mapDisplayComponent";
import axios from "axios";

function App() {
  const weatherApiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
  const geocodingApiKey = process.env.NEXT_PUBLIC_GEOCODING_API_KEY;
  const [city, setCity] = useState<string>("London");
  const [latitude, setLatitude] = useState<number>(51.505);
  const [longitude, setLongitude] = useState<number>(-0.09);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Pass the latitude and longitude to the MapDisplay component
  };

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

  return (
    <div className="App">
      <form onSubmit={handleSubmit}>
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
        <input type="submit" value="Submit" />
      </form>
      <MapDisplay
        apiKey={weatherApiKey || ""}
        initialLatitude={latitude}
        setLatitude={setLatitude}
        initialLongitude={longitude}
        setLongitude={setLongitude}
        zoomLevel={13}
        city={city}
      />
    </div>
  );
}

export default App;

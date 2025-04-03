"use client";
import dynamic from "next/dynamic";
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false } // This will load the component only on client side
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});

import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useMapEvents, useMap } from "react-leaflet";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import WeatherDisplay from "@/components/weatherComponent";
import { DivIcon, Icon, IconOptions } from "leaflet";

const MapDisplay = ({
  weatherApiKey,
  geocodingApiKey,
  initialLatitude = 51.505, // default latitude
  setLatitude,
  initialLongitude = -0.09, // default longitude
  setLongitude,
  zoomLevel = 13,
  city = "London",
  setCity,
}: {
  weatherApiKey: string;
  geocodingApiKey: string;
  initialLatitude?: number;
  setLatitude: (latitude: number) => void;
  initialLongitude?: number;
  setLongitude: (longitude: number) => void;
  zoomLevel?: number;
  city?: string;
  setCity?: (city: string) => void;
}) => {
  const [error, setError] = useState<null | unknown>(null);
  const [customIcon, setCustomIcon] = useState<Icon<IconOptions> | DivIcon | undefined>(undefined);
  const [currentLat, setCurrentLat] = useState(initialLatitude);
  const [currentLng, setCurrentLng] = useState(initialLongitude);
  const [currentCity, setCurrentCity] = useState(city);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const L = require("leaflet");
      setCustomIcon(
        new L.Icon({
          iconUrl: "/marker-icon.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        })
      );
    }
  }, []);

  const fetchWeather = async (lat: number, lon: number) => {
    try {
      if (!weatherApiKey) {
        setError(new Error("Weather API key is missing. Please check your environment variables."));
        return;
      }

      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=metric`
      );
      
      if (response.status === 429) {
        setError(new Error("API call limit reached. Please try again in 10 minutes."));
        return;
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 429) {
        setError(new Error("API call limit reached. Please try again in 10 minutes."));
      } else {
        setError(err instanceof Error ? err : new Error("Failed to fetch weather data"));
      }
    }
  };

  const fetchCityName = async (lat: number, lng: number) => {
    try {
      if (!geocodingApiKey) {
        setCurrentCity("Unknown Location");
        if (setCity) {
          setCity("Unknown Location");
        }
        return;
      }

      const response = await axios.get(
        `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${geocodingApiKey}`
      );
      const cityName = response.data.results[0].components.city || 
                      response.data.results[0].components.town ||
                      response.data.results[0].components.village ||
                      "Unknown Location";
      setCurrentCity(cityName);
      if (setCity) {
        setCity(cityName);
      }
    } catch (err) {
      console.error("Failed to fetch city name:", err);
      setCurrentCity("Unknown Location");
      if (setCity) {
        setCity("Unknown Location");
      }
    }
  };

  useEffect(() => {
    fetchWeather(currentLat, currentLng);
    fetchCityName(currentLat, currentLng);
  }, [currentLat, currentLng]);

  const LocationMarker = () => {
    const map = useMap();
    
    useEffect(() => {
      map.flyTo([currentLat, currentLng], map.getZoom());
    }, [currentLat, currentLng, map]);

    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setCurrentLat(lat);
        setCurrentLng(lng);
        setLatitude(lat);
        setLongitude(lng);
        map.flyTo(e.latlng, map.getZoom());
      },
    });

    return (
      <Marker
        position={[currentLat, currentLng]}
        icon={customIcon}
        eventHandlers={{ add: (e) => e.target.openPopup() }}
      >
        <Popup>
          <WeatherDisplay 
            weatherApiKey={weatherApiKey} 
            city={currentCity} 
            latitude={currentLat}
            longitude={currentLng}
          />
        </Popup>
      </Marker>
    );
  };

  if (error) return <div>Error: {(error as Error).message}</div>;

  return (
    <MapContainer
      center={[currentLat, currentLng]}
      zoom={zoomLevel}
      className="h-[100vh] w-full"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <LocationMarker />
    </MapContainer>
  );
};

MapDisplay.propTypes = {
  weatherApiKey: PropTypes.string.isRequired,
  geocodingApiKey: PropTypes.string.isRequired,
  initialLatitude: PropTypes.number,
  setLatitude: PropTypes.func.isRequired,
  initialLongitude: PropTypes.number,
  setLongitude: PropTypes.func.isRequired,
  zoomLevel: PropTypes.number,
  city: PropTypes.string,
  setCity: PropTypes.func,
};

export default MapDisplay;

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
import L from "leaflet";

interface MapDisplayProps {
  weatherApiKey: string;
  geocodingApiKey: string;
  initialLatitude?: number;
  setLatitude: (latitude: number) => void;
  initialLongitude?: number;
  setLongitude: (longitude: number) => void;
  zoomLevel?: number;
  city?: string;
  setCity?: (city: string) => void;
  onMapClick?: (latitude: number, longitude: number) => void;
}

const MapDisplay: React.FC<MapDisplayProps> = ({
  weatherApiKey,
  geocodingApiKey,
  initialLatitude = 51.505, // default latitude
  setLatitude,
  initialLongitude = -0.09, // default longitude
  setLongitude,
  zoomLevel = 13,
  city = "London",
  setCity,
  onMapClick
}) => {
  const [error, setError] = useState<null | unknown>(null);
  const [customIcon, setCustomIcon] = useState<Icon<IconOptions> | DivIcon | undefined>(undefined);
  const [currentLat, setCurrentLat] = useState(initialLatitude);
  const [currentLng, setCurrentLng] = useState(initialLongitude);
  const [currentCity, setCurrentCity] = useState(city);
  const [isUpdating, setIsUpdating] = useState(false);

  // Add effect to update current coordinates when initial coordinates change
  useEffect(() => {
    if (!isUpdating) {
      setCurrentLat(initialLatitude);
      setCurrentLng(initialLongitude);
    }
  }, [initialLatitude, initialLongitude, isUpdating]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const L = require("leaflet");
      setCustomIcon(
        new L.Icon({
          iconUrl: "/marker-icon.png",
          iconSize: [32, 52],
          iconAnchor: [16, 52],
          popupAnchor: [1, -34],
          shadowSize: [52, 52],
          className: "animate-bounce"
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

  const LocationMarker = () => {
    const map = useMap();
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    
    useMapEvents({
      click(e) {
        handleMapClick(e);
      },
    });

    return (
      <Marker
        position={[currentLat, currentLng]}
        icon={customIcon}
        eventHandlers={{ 
          add: (e) => {
            if (!isPopupOpen) {
              e.target.openPopup();
              setIsPopupOpen(true);
              e.target.getElement().classList.add('animate-bounce');
            }
          },
          remove: (e) => {
            e.target.getElement().classList.remove('animate-bounce');
          },
          popupopen: () => setIsPopupOpen(true),
          popupclose: () => setIsPopupOpen(false)
        }}
      >
        <Popup className="custom-popup">
          <div className="p-2">
            <WeatherDisplay 
              weatherApiKey={weatherApiKey} 
              city={currentCity} 
              latitude={currentLat}
              longitude={currentLng}
            />
          </div>
        </Popup>
      </Marker>
    );
  };

  // Update currentCity when city prop changes
  useEffect(() => {
    if (!isUpdating) {
      setCurrentCity(city);
    }
  }, [city, isUpdating]);

  // Move the useEffect outside of LocationMarker to prevent unnecessary re-renders
  useEffect(() => {
    const updateLocation = async () => {
      await Promise.all([
        fetchWeather(currentLat, currentLng),
        fetchCityName(currentLat, currentLng)
      ]);
    };
    
    updateLocation();
  }, [currentLat, currentLng]);

  // Handle map click
  const handleMapClick = (e: L.LeafletMouseEvent) => {
    const { lat, lng } = e.latlng;
    const roundedLat = Math.round(lat * 10000) / 10000;
    const roundedLng = Math.round(lng * 10000) / 10000;
    
    setIsUpdating(true);
    setCurrentLat(roundedLat);
    setCurrentLng(roundedLng);
    setLatitude(roundedLat);
    setLongitude(roundedLng);
    if (onMapClick) {
      onMapClick(roundedLat, roundedLng);
    }
    setIsUpdating(false);
  };

  if (error) return (
    <div className="flex items-center justify-center h-[100vh] w-full bg-gray-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="text-red-500 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2 text-center">Error</h2>
        <p className="text-gray-600 text-center">{(error as Error).message}</p>
      </div>
    </div>
  );

  return (
    <div className="relative h-[100vh] w-full">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-white opacity-50 z-0"></div>
      <MapContainer
        center={[currentLat, currentLng]}
        zoom={zoomLevel}
        className="h-full w-full z-10"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <LocationMarker />
      </MapContainer>
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 z-20">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Current Location</h2>
        <p className="text-gray-600">{currentCity}</p>
      </div>
    </div>
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
  onMapClick: PropTypes.func,
};

export default MapDisplay;

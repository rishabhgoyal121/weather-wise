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
import { useMapEvents } from "react-leaflet";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import WeatherDisplay from "@/components/weatherComponent";
import { DivIcon, Icon, IconOptions } from "leaflet";

const MapDisplay = ({
  weatherApiKey,
  initialLatitude = 51.505, // default latitude
  setLatitude,
  initialLongitude = -0.09, // default longitude
  setLongitude,
  zoomLevel = 13,
  city = "London",
}: {
  weatherApiKey: string;
  initialLatitude?: number;
  setLatitude: (latitude: number) => void;
  initialLongitude?: number;
  setLongitude: (longitude: number) => void;
  zoomLevel?: number;
  city?: string;
}) => {
  const [error, setError] = useState<null | unknown>(null);
  const [customIcon, setCustomIcon] = useState<Icon<IconOptions> | DivIcon | undefined>(undefined);

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
      await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=metric`
      );
    } catch (err) {
      setError(err);
    }
  };

  useEffect(() => {
    fetchWeather(initialLatitude, initialLongitude);
  }, [initialLatitude, initialLongitude]);

  const LocationMarker = () => {
    const map = useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        fetchWeather(lat, lng);
        setLatitude(lat);
        setLongitude(lng);
        map.flyTo(e.latlng, map.getZoom());
      },
    });

    return initialLatitude !== undefined && initialLongitude !== undefined ? (
      <Marker
        position={[initialLatitude, initialLongitude]}
        icon={customIcon}
        eventHandlers={{ add: (e) => e.target.openPopup() }}
      >
        <Popup>
          <WeatherDisplay weatherApiKey={weatherApiKey} city={city} />
        </Popup>
      </Marker>
    ) : null;
  };

  if (error) return <div>Error: {(error as Error).message}</div>;

  return initialLatitude !== undefined && initialLongitude !== undefined ? (
    <MapContainer
      center={[initialLatitude, initialLongitude]}
      zoom={zoomLevel}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <LocationMarker />
    </MapContainer>
  ) : null;
};

MapDisplay.propTypes = {
  weatherApiKey: PropTypes.string.isRequired,
  initialLatitude: PropTypes.number,
  setLatitude: PropTypes.func.isRequired,
  initialLongitude: PropTypes.number,
  setLongitude: PropTypes.func.isRequired,
  zoomLevel: PropTypes.number,
  city: PropTypes.string,
};

export default MapDisplay;

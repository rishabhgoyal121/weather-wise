import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import WeatherDisplay from "@/components/weatherComponent";

// Custom icon for the marker
const customIcon = new L.Icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  shadowSize: [41, 41],
});

const MapDisplay = ({
  weatherApiKey,
  geocodingApiKey,
  initialLatitude = 51.505, // default latitude
  setLatitude,
  initialLongitude = -0.09, // default longitude
  setLongitude,
  zoomLevel = 13,
  city = "London",
}: {
  weatherApiKey: string;
  geocodingApiKey: string;
  initialLatitude?: number;
  setLatitude: (latitude: number) => void;
  initialLongitude?: number;
  setLongitude: (longitude: number) => void;
  zoomLevel?: number;
  city?: string;
}) => {
  const [error, setError] = useState<null | unknown>(null);

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
  geocodingApiKey: PropTypes.string.isRequired,
  initialLatitude: PropTypes.number,
  setLatitude: PropTypes.func.isRequired,
  initialLongitude: PropTypes.number,
  setLongitude: PropTypes.func.isRequired,
  zoomLevel: PropTypes.number,
  city: PropTypes.string,
};

export default MapDisplay;
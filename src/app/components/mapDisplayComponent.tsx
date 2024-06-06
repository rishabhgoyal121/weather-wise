"use client";
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import WeatherDisplay from "@/app/components/weatherComponent";

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
  apiKey,
  initialLatitude = 51.505, // default latitude
  setLatitude,
  initialLongitude = -0.09, // default longitude
  setLongitude,
  zoomLevel = 13,
  city = "London",
}: {
  apiKey: string;
  initialLatitude?: number;
  setLatitude: (latitude: number) => void;
  initialLongitude?: number;
  setLongitude: (longitude: number) => void;
  zoomLevel?: number;
  city?: string;
}) => {
  const isValidCoordinates =
    typeof initialLatitude === "number" && typeof initialLongitude === "number";

  const [position, setPosition] = useState(
    isValidCoordinates ? [initialLatitude, initialLongitude] : [51.505, -0.09] // default position
  );

  useEffect(() => {
    if (isValidCoordinates) {
      setPosition([initialLatitude, initialLongitude]);
    }
  }, [initialLatitude, initialLongitude, isValidCoordinates]);
  const [error, setError] = useState(null);

  const fetchWeather = async (lat: number, lon: number) => {
    try {
      await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      );
    } catch (err) {
      setError(null); // Update the setError function to accept null as a parameter
    }
  };

  useEffect(() => {
    fetchWeather(initialLatitude, initialLongitude);
  }, [initialLatitude, initialLongitude]);

  const LocationMarker = () => {const LocationMarker = () => {
  const map = useMap();

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      fetchWeather(lat, lng);
      setLatitude(lat);
      setLongitude(lng);
      map.flyTo(e.latlng, map.getZoom()); // Center the map on the clicked location
    },
  });

  // Assuming position is an array of numbers
  const [lat, lng] = position;

  // Check if lat and lng are not undefined
  if (lat !== undefined && lng !== undefined) {
    return (
      <Marker 
        position={[lat, lng]} 
        icon={customIcon}
        eventHandlers={{ add: (e) => e.target.openPopup() }}
      >
        <Popup>
          <WeatherDisplay city={city} />
        </Popup>
      </Marker>
    );
  } else {
    // Handle the case where lat or lng is undefined
    // You could return null, or a default Marker, or handle this case differently depending on your needs
    return null;
  }
};
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);
        fetchWeather(lat, lng);
        setLatitude(lat);
        setLongitude(lng);
      },
    });
    // Assuming position is an array of numbers
    const [lat, lng] = position;

    // Check if lat and lng are not undefined
    if (lat !== undefined && lng !== undefined) {
      return (
        <Marker 
  position={[lat, lng]} 
  icon={customIcon}
  eventHandlers={{ add: (e) => e.target.openPopup() }}
>
  <Popup>
    <WeatherDisplay city={city} />
  </Popup>
</Marker>
      );
    } else {
      // Handle the case where lat or lng is undefined
      // You could return null, or a default Marker, or handle this case differently depending on your needs
      return null;
    }
  };

  if (error) return <div>Error: {(error as Error).message}</div>;

  // Assuming position is an array of numbers
  const [lat, lng] = position;

  // Check if lat and lng are not undefined
  if (lat !== undefined && lng !== undefined) {
    return (
      <MapContainer
        center={[lat, lng]}
        zoom={zoomLevel}
        style={{ height: "100vh", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <LocationMarker />
      </MapContainer>
    );
  } else {
    // Handle the case where lat or lng is undefined
    // You could return null, or a default Map, or handle this case differently depending on your needs
    return null;
  }
};

MapDisplay.propTypes = {
  apiKey: PropTypes.string.isRequired,
  initialLatitude: PropTypes.number.isRequired,
  initialLongitude: PropTypes.number.isRequired,
  zoomLevel: PropTypes.number.isRequired,
};

export default MapDisplay;

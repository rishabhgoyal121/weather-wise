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

  // Add logging to verify API keys
  useEffect(() => {
    console.log("Weather API Key:", weatherApiKey ? "Present" : "Missing");
    console.log("Geocoding API Key:", geocodingApiKey ? "Present" : "Missing");
  }, [weatherApiKey, geocodingApiKey]);

  const [city, setCity] = useState<string>("London");
  const [latitude, setLatitude] = useState<number>(51.505);
  const [longitude, setLongitude] = useState<number>(-0.09);
  const [searchInput, setSearchInput] = useState<string>("London");
  const [isSearching, setIsSearching] = useState(false);
  const [lastSearchedCity, setLastSearchedCity] = useState<string>("London");
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{name: string, lat: number, lng: number}>>([]);
  const [showResults, setShowResults] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const debouncedSearchInput = useDebounce(searchInput, 1000);

  // Set initial location on component mount
  useEffect(() => {
    const setInitialLocation = async () => {
      try {
        const response = await axios.get(
          `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${geocodingApiKey}`
        );
        if (response.data.results && response.data.results.length > 0) {
          const cityName = response.data.results[0].components.city || 
                          response.data.results[0].components.town ||
                          response.data.results[0].components.village ||
                          "Unknown Location";
          setCity(cityName);
          setSearchInput(cityName);
          setLastSearchedCity(cityName);
        }
      } catch (error) {
        console.error("Failed to fetch initial city:", error);
      }
    };

    setInitialLocation();
  }, []); // Empty dependency array means this runs once on mount

  // Only fetch city when coordinates change from map clicks
  useEffect(() => {
    const fetchCity = async () => {
      if (isUpdating) return;
      
      try {
        const response = await axios.get(
          `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${geocodingApiKey}`
        );
        if (response.data.results && response.data.results.length > 0) {
          const cityName = response.data.results[0].components.city || 
                          response.data.results[0].components.town ||
                          response.data.results[0].components.village ||
                          "Unknown Location";
          setIsUpdating(true);
          setCity(cityName);
          setSearchInput(cityName);
          setLastSearchedCity(cityName);
          setIsUpdating(false);
        }
      } catch (error) {
        console.error("Failed to fetch city:", error);
      }
    };

    fetchCity();
  }, [latitude, longitude, geocodingApiKey, isUpdating]);

  // Only fetch coordinates when city is manually changed
  useEffect(() => {
    const fetchCoordinates = async () => {
      if (isSearching || !debouncedSearchInput || debouncedSearchInput.trim() === "" || isUpdating) return;
      
      // Prevent duplicate searches for the same city
      if (debouncedSearchInput === lastSearchedCity) return;
      
      try {
        setIsSearching(true);
        setIsUpdating(true);
        const response = await axios.get(
          `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
            debouncedSearchInput
          )}&key=${geocodingApiKey}`
        );
        
        // Check if we have any results
        if (response.data.results && response.data.results.length > 0) {
          // Process all results
          const results = response.data.results.map((result: any) => ({
            name: result.formatted,
            lat: result.geometry.lat,
            lng: result.geometry.lng
          }));
          
          setSearchResults(results);
          setShowResults(true);
          
          // If we only have one result, use it immediately
          if (results.length === 1) {
            const { lat, lng } = results[0];
            const roundedLat = Math.round(lat * 10000) / 10000;
            const roundedLng = Math.round(lng * 10000) / 10000;
            
            setLatitude(roundedLat);
            setLongitude(roundedLng);
            setLastSearchedCity(debouncedSearchInput);
            setCity(debouncedSearchInput);
            setShowResults(false);
          }
        } else {
          setSearchResults([]);
          setShowResults(false);
        }
      } catch (error) {
        console.error("Failed to fetch coordinates:", error);
        setSearchResults([]);
        setShowResults(false);
      } finally {
        setIsSearching(false);
        setIsUpdating(false);
      }
    };

    fetchCoordinates();
  }, [debouncedSearchInput, geocodingApiKey, isSearching, lastSearchedCity, isUpdating]);

  // Handle search result selection
  const handleResultSelect = (result: {name: string, lat: number, lng: number}) => {
    setIsUpdating(true);
    const roundedLat = Math.round(result.lat * 10000) / 10000;
    const roundedLng = Math.round(result.lng * 10000) / 10000;
    
    // Update all states at once to prevent intermediate updates
    setLatitude(roundedLat);
    setLongitude(roundedLng);
    setSearchInput(result.name);
    setLastSearchedCity(result.name);
    setCity(result.name);
    setShowResults(false);
    setSearchResults([]);
    setIsUpdating(false);
  };

  // Handle manual coordinate input changes
  const handleLatitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLat = Number(e.target.value);
    if (newLat >= -90 && newLat <= 90) {
      setIsUpdating(true);
      setLatitude(newLat);
      setShowResults(false);
      setSearchResults([]);
      setIsUpdating(false);
    }
  };

  const handleLongitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLng = Number(e.target.value);
    if (newLng >= -180 && newLng <= 180) {
      setIsUpdating(true);
      setLongitude(newLng);
      setShowResults(false);
      setSearchResults([]);
      setIsUpdating(false);
    }
  };

  // Handle search input changes
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    if (!e.target.value.trim()) {
      setShowResults(false);
      setSearchResults([]);
    }
  };

  // Handle map click updates
  const handleMapClick = (newLat: number, newLng: number) => {
    setIsUpdating(true);
    setLatitude(newLat);
    setLongitude(newLng);
    setIsUpdating(false);
  };

  return (
    <div className="App">
      <form className="relative">
        <label>
          Latitude:
          <input
            className="text-black"
            type="number"
            max={90}
            min={-90}
            step={0.0001}
            value={latitude}
            onChange={handleLatitudeChange}
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
            step={0.0001}
            value={longitude}
            onChange={handleLongitudeChange}
            required
          />
        </label>
        <label className="relative">
          City:
          <input
            className="text-black"
            type="text"
            value={searchInput}
            onChange={handleSearchInputChange}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => {
              setIsInputFocused(false);
              // Hide dropdown when input loses focus
              setTimeout(() => setShowResults(false), 200);
            }}
            required
          />
          {showResults && searchResults.length > 0 && isInputFocused && (
            <div 
              className="absolute z-50 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
              onMouseDown={(e) => e.preventDefault()} // Prevent input blur when clicking dropdown
            >
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onMouseDown={() => handleResultSelect(result)}
                >
                  {result.name}
                </div>
              ))}
            </div>
          )}
        </label>
      </form>
      <MapDisplay
        weatherApiKey={weatherApiKey || ""}
        geocodingApiKey={geocodingApiKey || ""}
        initialLatitude={latitude}
        setLatitude={setLatitude}
        initialLongitude={longitude}
        setLongitude={setLongitude}
        zoomLevel={7}
        city={city}
        setCity={setCity}
        onMapClick={handleMapClick}
      />
    </div>
  );
}

export default App;

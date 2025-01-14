/**
 * Represents an earthquake event.
 */
export interface Earthquake {
  id: string; // Unique identifier for the earthquake
  geometry: {
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: {
    title: string; // Title of the earthquake event
    mag: number; // Magnitude of the earthquake
    place: string; // Location description
  };
}

/**
 * Represents a user-generated marker on the map.
 */
export interface UserMarker {
  id: string; // Unique identifier for the marker
  lng: number; // Longitude of the marker
  lat: number; // Latitude of the marker
  label: string; // Custom label for the marker
}

/**
 * Represents weather data for a specific location.
 */
export interface WeatherData {
  name: string; // Location name
  main: {
    temp: number; // Temperature in Celsius
    feels_like: number; // "Feels like" temperature in Celsius
    humidity: number; // Humidity percentage
  };
  weather: {
    description: string; // Weather condition description (e.g., "clear sky")
    icon: string; // Weather icon code (e.g., "01d" for clear sky day)
  }[];
  wind: {
    speed: number; // Wind speed in meters per second
  };
}

/**
 * Props for the Earth component.
 */
export interface EarthProps {
  onCaptureView: () => void; // Callback for capturing the map view
  showWeatherWidget: boolean; // Whether the weather widget is visible
  setShowWeatherWidget: (show: boolean) => void; // Function to toggle weather widget visibility
}

/**
 * Ref for the Earth component.
 */
export interface EarthRef {
  handleSearch: (lng: number, lat: number) => void; // Function to handle location search
}

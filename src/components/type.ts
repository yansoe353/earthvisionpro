export interface Earthquake {
  id: string;
  geometry: {
    coordinates: [number, number];
  };
  properties: {
    title: string;
    mag: number;
    place: string;
  };
}

export interface UserMarker {
  lng: number;
  lat: number;
  label: string;
  id: string;
}

export interface WeatherData {
  name: string;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  weather: {
    description: string;
    icon: string;
  }[];
  wind: {
    speed: number;
  };
}

export interface EarthProps {
  onCaptureView: () => void;
  showWeatherWidget: boolean;
  setShowWeatherWidget: (value: boolean) => void;
}

export interface EarthRef {
  handleSearch: (lng: number, lat: number) => void;
}

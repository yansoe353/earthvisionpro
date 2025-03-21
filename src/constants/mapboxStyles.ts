// src/constants/mapboxStyles.ts
export interface MapboxStyle {
  label: string;
  value: string;
}

export const MAPBOX_STYLES: MapboxStyle[] = [
  {
    label: "Default",
    value: "mapbox://styles/htetnay/cm52c39vv00bz01sa0qzx4ro7",
  },
  {
    label: "Street",
    value: "mapbox://styles/mapbox/streets-v12",
  },
  {
    label: "Earth Vision Pro",
    value: "mapbox://styles/htetnay/cm52c39vv00bz01sa0qzx4ro7",
  },
  {
    label: "Dark",
    value: "mapbox://styles/mapbox/dark-v11",
  },
  {
    label: "Light",
    value: "mapbox://styles/mapbox/light-v11",
  },
  {
    label: "Outdoors",
    value: "mapbox://styles/mapbox/outdoors-v12",
  },
];

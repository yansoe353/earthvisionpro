import React, { useState, useRef, useCallback } from 'react';
import { Marker, Popup, MapLayerMouseEvent } from 'react-map-gl';
import axios from 'axios';

interface AIImageGeneratorProps {
  mapRef: React.RefObject<any>;
}

interface Location {
  lng: number;
  lat: number;
}

const AIImageGenerator: React.FC<AIImageGeneratorProps> = ({ mapRef }) => {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [style, setStyle] = useState<'realistic' | 'impressionist' | 'futuristic'>('realistic');
  const [loading, setLoading] = useState(false);

  const handleMapClick = (event: MapLayerMouseEvent) => {
    const { lngLat } = event;
    setSelectedLocation({ lng: lngLat.lng, lat: lngLat.lat });
  };

  const generateImage = async () => {
    if (selectedLocation) {
      setLoading(true);
      try {
        const res

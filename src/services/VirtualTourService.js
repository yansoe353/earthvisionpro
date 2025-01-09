const MAPILLARY_API_KEY = import.meta.env.VITE_MAPILLARY_API_KEY;

// Fetch Mapillary 360 image near a location
export const fetchMapillaryImage = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://graph.mapillary.com/images?access_token=${MAPILLARY_API_KEY}&fields=thumb_1024_url&closeto=${lng},${lat}&limit=1`
    );
    const data = await response.json();
    if (data.data && data.data.length > 0) {
      return data.data[0].thumb_1024_url; // Return the 360 image URL
    }
    return null;
  } catch (error) {
    console.error('Error fetching Mapillary image:', error);
    return null;
  }
};

const MAPILLARY_API_KEY = import.meta.env.VITE_MAPILLARY_API_KEY;

export const fetchMapillaryImage = async (
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://graph.mapillary.com/images?access_token=${MAPILLARY_API_KEY}&fields=thumb_1024_url&closeto=${lng},${lat}&limit=1`,
      { signal }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Mapillary API Response:', data);

    if (data.data && data.data.length > 0) {
      return data.data[0].thumb_1024_url; // Return the standard image URL
    } else {
      console.warn('No images found for the given location.');
      return null;
    }
  } catch (error) {
    console.error('Error fetching Mapillary image:', error);
    return null;
  }
};

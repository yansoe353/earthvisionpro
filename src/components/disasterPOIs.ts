// disasterPOIs.ts

export type DisasterPOI = {
  id: string;
  title: string;
  image: string;
  link: string;
  coordinates: [number, number];
};

const disasterPOIs: DisasterPOI[] = [
  {
    id: 'disaster-1',
    title: 'Flood in City A',
    image: 'https://example.com/flood-image.jpg',
    link: 'https://example.com/flood-details',
    coordinates: [10.0, 20.0],
  },
  {
    id: 'disaster-2',
    title: 'Earthquake in City B',
    image: 'https://example.com/earthquake-image.jpg',
    link: 'https://example.com/earthquake-details',
    coordinates: [30.0, 40.0],
  },
  // Add more disaster POIs as needed
];

export default disasterPOIs;

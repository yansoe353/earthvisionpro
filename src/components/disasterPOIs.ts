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
    title: 'Devastating 7.7-Magnitude Earthquake Strikes Myanmar',
    image: 'https://earthvision.world/wp-content/uploads/2025/03/487205691_1161177069136995_3227935157759261818_n.jpg',
    link: 'https://earthvision.world/events/devastating-7-7-magnitude-earthquake-strikes-myanmar-over-1700-dead-as-rescue-efforts-continue/',
    coordinates: [10.0, 20.0],
  },
 
  // Add more disaster POIs as needed
];

export default disasterPOIs;

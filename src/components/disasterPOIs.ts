// disasterPOIs.ts

export type DisasterPOI = {
  id: string;
  title: string;
  image: string;
  link: string;
  helpLink: string;
  supportLink: string;
  coordinates: [number, number];
  effectZones: {
    epicenter: [number, number];
    zones: {
      radius: number;
      color: string;
    }[];
  };
};

const disasterPOIs: DisasterPOI[] = [
  {
    id: 'disaster-1',
    title: 'Devastating 7.7-Magnitude Earthquake Strikes Myanmar',
    image: 'https://earthvision.world/wp-content/uploads/2025/03/487205691_1161177069136995_3227935157759261818_n.jpg',
    link: 'https://earthvision.world/events/devastating-7-7-magnitude-earthquake-strikes-myanmar-over-1700-dead-as-rescue-efforts-continue/',
    helpLink: 'https://earthvision.world/mmearthquakhelp',
    supportLink: 'https://earthvision.world/mmearthquakesupport',
    coordinates: [95.923703, 21.995095],
    effectZones: {
      epicenter: [95.923703, 21.995095],
      zones: [
        { radius: 50, color: 'red' },
        { radius: 100, color: 'orange' },
        { radius: 150, color: 'yellow' },
      ],
    },
  },
  // Add more disaster POIs as needed
];

export default disasterPOIs;

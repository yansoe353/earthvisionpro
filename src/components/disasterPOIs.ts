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
    helpLink: 'https://web.facebook.com/info.mrcs?_rdc=1&_rdr#',
    supportLink: 'https://www.google.com/search?q=%E1%80%99%E1%80%BC%E1%80%94%E1%80%BA%E1%80%99%E1%80%AC%E1%80%94%E1%80%AD%E1%80%AF%E1%80%84%E1%80%BA%E1%80%84%E1%80%B6%E1%80%84%E1%80%9C%E1%80%BB%E1%80%84%E1%80%BA&hl=my&stick=H4sIAAAAAAAAAONQUeLVT9c3NKywMEsuzKswfsRoxS3w8sc9YSnDXWcbq3W4NLhQFSiJc4nqJ-fn5KQml2Tm5-mnZBYnFpekFhULMPIsYjV72DDzYcOehw1THjbsArPXgNlrHzasf9jQAhYEktvA5JyHDbshggBjVGODhwAAAA',
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

// businessData.ts
export type Business = {
  id: string;
  name: string;
  description: string;
  previewImage: string;
  contactPhone: string;
  webLink: string;
  coordinates: [number, number];
};

export const businessDirectory: Business[] = [
  {
    id: 'business-1',
    name: 'Central Cafe',
    description: 'A cozy cafe in the heart of the city.',
    previewImage: 'https://example.com/central-cafe.jpg',
    contactPhone: '+1234567890',
    webLink: 'https://central-cafe.com',
    coordinates: [-73.9654, 40.7829],
  },
  {
    id: 'business-2',
    name: 'Paris Bistro',
    description: 'A famous bistro in Paris, France.',
    previewImage: 'https://example.com/paris-bistro.jpg',
    contactPhone: '+0987654321',
    webLink: 'https://paris-bistro.com',
    coordinates: [2.2945, 48.8584],
  },
  {
    id: 'business-3',
    name: 'Swiss Chalet',
    description: 'A cozy chalet in the Swiss Alps.',
    previewImage: 'https://example.com/swiss-chalet.jpg',
    contactPhone: '+1234509876',
    webLink: 'https://swiss-chalet.com',
    coordinates: [9.714189134324783, 46.52136798216034],
  },
];

declare module './components/VirtualTour' {
  import { FC } from 'react';

  interface VirtualTourProps {
    location: { lat: number; lng: number; name: string };
  }

  const VirtualTour: FC<VirtualTourProps>;
  export default VirtualTour;
}

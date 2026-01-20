import { createContext, useContext } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';

const GoogleMapsContext = createContext();

export const useGoogleMaps = () => useContext(GoogleMapsContext);

const libraries = ['places'];

export const GoogleMapsProvider = ({ children }) => {
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: "YOUR_GOOGLE_MAPS_API_KEY", // Replace with valid key
        libraries,
    });

    if (loadError) {
        return <div>Error loading Google Maps</div>;
    }

    return (
        <GoogleMapsContext.Provider value={{ isLoaded }}>
            {children}
        </GoogleMapsContext.Provider>
    );
};

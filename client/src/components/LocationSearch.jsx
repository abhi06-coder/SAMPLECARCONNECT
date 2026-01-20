import { useState, useEffect, useRef } from 'react';

const LocationSearch = ({ placeholder, onSelect, initialValue }) => {
    const [inputValue, setInputValue] = useState(initialValue || '');
    const [predictions, setPredictions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const autocompleteService = useRef(null);
    const geocoder = useRef(null);
    const wrapperRef = useRef(null);

    useEffect(() => {
        if (!window.google) return;
        try {
            autocompleteService.current = new window.google.maps.places.AutocompleteService();
            geocoder.current = new window.google.maps.Geocoder();
        } catch (error) {
            console.error("Error initializing Google Maps Services:", error);
        }
    }, []);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
        const value = e.target.value;
        setInputValue(value);
        setShowSuggestions(true);

        if (!value) {
            setPredictions([]);
            return;
        }

        if (autocompleteService.current) {
            autocompleteService.current.getPlacePredictions(
                { input: value },
                (results, status) => {
                    if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                        setPredictions(results);
                    } else {
                        setPredictions([]);
                    }
                }
            );
        }
    };

    const handleSelect = (prediction) => {
        setInputValue(prediction.description);
        setShowSuggestions(false);

        if (geocoder.current) {
            geocoder.current.geocode({ placeId: prediction.place_id }, (results, status) => {
                if (status === window.google.maps.GeocoderStatus.OK && results[0]) {
                    const location = results[0].geometry.location;
                    onSelect({
                        name: prediction.description,
                        lat: location.lat(),
                        lng: location.lng(),
                        address: results[0].formatted_address
                    });
                } else {
                    alert("Failed to get location details. Please try again.");
                }
            });
        }
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onFocus={() => inputValue && setShowSuggestions(true)}
                placeholder={placeholder}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {showSuggestions && predictions.length > 0 && (
                <ul className="absolute z-50 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                    {predictions.map((prediction) => (
                        <li
                            key={prediction.place_id}
                            onClick={() => handleSelect(prediction)}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b last:border-b-0 text-gray-700"
                        >
                            {prediction.description}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default LocationSearch;

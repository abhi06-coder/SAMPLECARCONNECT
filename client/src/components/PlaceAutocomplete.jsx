import { useEffect, useRef, useState } from 'react';

export const PlaceAutocomplete = ({ onPlaceSelect, placeholder = "Search for a place" }) => {
    const inputContainerRef = useRef(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        let autocompleteElement = null;

        const init = async () => {
            try {
                if (!window.google) {
                    console.error("Google Maps JavaScript API not loaded");
                    return;
                }

                // Import the new Places library
                const { PlaceAutocompleteElement } = await window.google.maps.importLibrary("places");

                // Create the element
                autocompleteElement = new PlaceAutocompleteElement();
                autocompleteElement.placeholder = placeholder;
                autocompleteElement.classList.add('w-full', 'px-3', 'py-2', 'border', 'rounded-lg');

                // Append to DOM FIRST
                if (inputContainerRef.current) {
                    inputContainerRef.current.innerHTML = ''; // Clear container
                    inputContainerRef.current.appendChild(autocompleteElement);
                }

                // Attach event listener
                // Helper to handle place selection
                const handlePlaceSelect = async (event) => {
                    console.log("Place selection event fired:", event.type, event);

                    let place = event.place;

                    // Handle new API structure where placePrediction is returned
                    if (!place && event.placePrediction) {
                        place = event.placePrediction.toPlace();
                    }

                    if (!place) {
                        console.log("No place or placePrediction in event");
                        return;
                    }

                    try {
                        // Fetch required fields - ensure we ask for location
                        await place.fetchFields({ fields: ['displayName', 'formattedAddress', 'location'] });

                        console.log("Place fetched:", place);

                        // Robust data extraction
                        const name = place.displayName || "";
                        const address = place.formattedAddress || "";
                        let lat = null;
                        let lng = null;

                        if (place.location) {
                            if (typeof place.location.lat === 'function') {
                                lat = place.location.lat();
                                lng = place.location.lng();
                            } else {
                                // Fallback if location is not a LatLng object (unlikely in new API but possible in transition)
                                console.error("Location object missing lat/lng methods", place.location);
                            }
                        }

                        if (lat !== null && lng !== null) {
                            onPlaceSelect({
                                name: name,
                                address: address,
                                lat: lat,
                                lng: lng
                            });
                            setError(null); // Clear previous errors
                        } else {
                            setError("Selected place does not have a valid location.");
                        }

                    } catch (err) {
                        console.error("Error fetching place details:", err);
                        setError("Failed to fetch location details. Please try again.");
                    }
                };

                // Attach event listeners for both standard and potential alternative event names
                autocompleteElement.addEventListener('gmp-places-select', handlePlaceSelect);
                autocompleteElement.addEventListener('gmp-select', handlePlaceSelect);

            } catch (err) {
                console.error("Error initializing PlaceAutocomplete:", err);
                setError(err.message);
            }
        };

        init();

        // Cleanup
        return () => {
            if (inputContainerRef.current) {
                inputContainerRef.current.innerHTML = '';
            }
        };
    }, [onPlaceSelect, placeholder]);

    return (
        <div className="w-full">
            <div ref={inputContainerRef} className="place-autocomplete-container"></div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
};

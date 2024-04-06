import React, { useState } from 'react';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';

const libraries: ("places")[] = ['places'];

function Homepage() {

    const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
    const [inputValue, setInputValue] = useState<string>("");
    const [place, setPlace] = useState<google.maps.places.PlaceResult | null>(null);

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "",
        libraries,
    });

    const onLoad = (autoC: google.maps.places.Autocomplete) => {
        setAutocomplete(autoC);
        setInputValue("");
    };

    const onPlaceChanged = () => {
        if (autocomplete) {
            const placeData = autocomplete.getPlace();
            setInputValue(placeData.name || "");
            setPlace(placeData);
            console.log(placeData);
        }
    };

    const cleanText = () => {
        setInputValue("");
    }

    const run = () => {
        // do something
    }

    if (!isLoaded) {
        return (
            <div>
                Loading...
            </div>
        )
    };

    return (

        <div className="container">

            <div className="row">

                <div className="col-5">

                    <h2 className='mt-5'>
                        ENTER A PLACE
                    </h2>

                    <div className='input-group mt-3'>

                        <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>

                            <input
                                type="text" 
                                className='form-control'
                                placeholder="Type location"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                            />

                        </Autocomplete>

                        <div className="input-group-append">

                            <button className="btn btn-secondary" onClick={cleanText}>
                                Clean Text
                            </button>

                        </div>

                    </div>
                
                    <div className="mt-4">
                        <button className="btn btn-primary" onClick={run}>
                            RUN
                        </button>
                    </div>

                </div>

                <div className="col-7">

                    <h3 className='mt-5'>
                        ANALYSIS
                    </h3>

                    {place && (
                        <div>
                            <h5>Place Details</h5>
                            <p>Name: {place.name}</p>
                            <p>Address: {place.formatted_address}</p>
                            <p>Latitude: {place.geometry?.location?.lat()}</p>
                            <p>Longitude: {place.geometry?.location?.lng()}</p>
                        </div>
                    )}

                </div>

            </div>

        </div>

    );
}

export default Homepage;
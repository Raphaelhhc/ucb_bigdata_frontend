import React, { useState } from 'react';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';
import axios from 'axios';

const libraries: ("places")[] = ['places'];

function Homepage() {

    const this_year: number = new Date().getFullYear();
    const past_span: number = 5;
    const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
    const [inputValue, setInputValue] = useState<string>("");
    const [place, setPlace] = useState<google.maps.places.PlaceResult | null>(null);
    const [day_span, setDaySpan] = useState<number>(1);
    const [resultData, setResultData] = useState(null);
    const [resultloading, setResultLoading] = useState(false);

    const [testData, setTestData] = useState(null);
    const [testloading, setTestLoading] = useState(false);
    
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
        }
    };

    const cleanText = () => {
        setInputValue("");
        setPlace(null);
        setTestData(null);
    }

    const run = async () => {
        if (!place) {
            alert('Please select a place using the autocomplete input.');
            return;
        }
        if (day_span < 1 || day_span > 60) {
            alert('TRAVEL DAY SPAN must be between 1 and 60.');
            return;
        }
        await getResultData();
    }

    const getResultData = async () => {
        try {
            setResultLoading(true);
            const rain_volume_lists: number[][] = await getRainVolumeLists();
            const temperature_lists: number[][] = await getTemperatureLists();
            const [rain_volume_probabilities, rain_volume_scores] = await getRainVolumeProbabilityScore(rain_volume_lists);
            const [temperature_probabilities, temperature_scores] = await getTemperatureProbabilityScore(temperature_lists);
            console.log('data collect & analysis done!')
            const response = await axios.post('http://127.0.0.1:5000/recommend', {
                place: place?.name,
                this_year: this_year,
                past_span: past_span,
                day_span: day_span,
                rain_volume_probabilities: rain_volume_probabilities,
                temperature_probabilities: temperature_probabilities,
                rain_volume_scores: rain_volume_scores,
                temperature_scores: temperature_scores
            });
            setResultData(response.data);
            setResultLoading(false);
        } catch (error) {
            console.error('Error fetching data: ', error);
            setResultLoading(false);
        }
    }

    const getRainVolumeLists = async () => {
        try {
            const response = await axios.post('http://127.0.0.1:5000/rainvolumecollector', {
                place: place?.name,
                lat: place?.geometry?.location?.lat(),
                lon: place?.geometry?.location?.lng(),
                this_year: this_year,
                past_span: past_span,
            });
            if (response.data.rain_volume_lists) {
                const rain_volume_lists = response.data.rain_volume_lists;
                console.log('Get rain volume lists!');
                return rain_volume_lists;
            } else {
                console.error('No rain volume lists in response');
            }
        } catch (error) {
            console.error('Error fetching rain volume lists: ', error);
        }
    }

    const getTemperatureLists = async () => {
        try {
            const response = await axios.post('http://127.0.0.1:5000/temperaturecollector', {
                place: place?.name,
                lat: place?.geometry?.location?.lat(),
                lon: place?.geometry?.location?.lng(),
                this_year: this_year,
                past_span: past_span,
            });
            if (response.data.temperature_lists) {
                const temperature_lists = response.data.temperature_lists;
                console.log('Get temperature lists!');
                return temperature_lists;
            } else {
                console.error('No temperature lists in response');
            }
        } catch (error) {
            console.error('Error fetching temperature lists: ', error);
        }
    }

    const getRainVolumeProbabilityScore = async (rain_volume_lists: number[][]) => {
        try {
            const response = await axios.post('http://127.0.0.1:5000/rainvolumeanalyzer', {
                place: place?.name,
                this_year: this_year,
                past_span: past_span,
                day_span: day_span,
                rain_volume_lists: rain_volume_lists
            });
            if (response.data.rain_volume_probabilities && response.data.rain_volume_scores) {
                const rain_volume_probabilities = response.data.rain_volume_probabilities;
                const rain_volume_scores = response.data.rain_volume_scores;
                console.log('Get rain volume probabilities and scores!');
                return [rain_volume_probabilities, rain_volume_scores];
            } else {
                console.error('No rain volume probabilities and scores in response');
            }
        } catch (error) {
            console.error('Error fetching rain volume probabilities and scores: ', error);
        }
        return [null, null]
    }

    const getTemperatureProbabilityScore = async (temperature_lists: number[][]) => {
        try {
            const response = await axios.post('http://127.0.0.1:5000/temperatureanalyzer', {
                place: place?.name,
                this_year: this_year,
                past_span: past_span,
                day_span: day_span,
                temperature_lists: temperature_lists
            });
            if (response.data.temperature_probabilities && response.data.temperature_scores) {
                const temperature_probabilities = response.data.temperature_probabilities;
                const temperature_scores = response.data.temperature_scores;
                console.log('Get temperature probabilities and scores!');
                return [temperature_probabilities, temperature_scores];
            } else {
                console.error('No temperature probabilities and scores in response');
            }
        } catch (error) {
            console.error('Error fetching temperature probabilities and scores: ', error);
        }
        return [null, null]
    }

    // TEST
    const runtest = async () => {
        if (!place) {
            alert('Please select a place using the autocomplete input.');
            return;
        }
        if (day_span < 1 || day_span > 60) {
            alert('TRAVEL DAY SPAN must be between 1 and 60.');
            return;
        }
        await getTestData();
    }

    const getTestData = async () => {
        try {
            setTestLoading(true);
            const response = await axios.post('http://127.0.0.1:5000/test', {
                place: place?.name,
                lat: place?.geometry?.location?.lat(),
                lon: place?.geometry?.location?.lng(),
                this_year: this_year,
                past_span: past_span,
                day_span: day_span
            });
            setTestData(response.data);
            setTestLoading(false);
        } catch (error) {
            console.error('Error fetching data: ', error);
            setTestLoading(false);
        }
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
            <div className="row mt-4">

                <h1>Travel Date Recommend</h1>

                <div className="col-5">
                    <div className='card text-bg-light mt-3'>
                        <div className='card-body m-3'>

                            <h3 className='card-title'>
                                ENTER A PLACE
                            </h3>

                            <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>

                                <input
                                    type="text" 
                                    className='form-control'
                                    placeholder="Type location"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                />

                            </Autocomplete>

                            <div className="mt-3">
                                <label>TRAVEL DAY SPAN (min: 1, max: 60)</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={day_span}
                                    onChange={(e) => setDaySpan(Number(e.target.value))}
                                    min="1"
                                    max="60"
                                />
                            </div>

                            <div className='d-flex justify-content-between'>
                                <div className="mt-4">
                                    <button className="btn btn-primary" onClick={run}>
                                        RUN
                                    </button>
                                </div>
                                <div className="mt-4">
                                    <button className="btn btn-secondary" onClick={cleanText}>
                                        Clean Text
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4">
                                <button className="btn btn-primary" onClick={runtest}>
                                    RUN TEST
                                </button>
                            </div>

                        </div>
                    </div>

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

                <div className="col-7">
                    <div className='card text-bg-light mt-3' style={{ minHeight: '500px' }}>
                        <div className='card-body m-3'>

                            <h3 className='card-title'>
                                ANALYSIS RESULT
                            </h3>

                            {resultloading && (
                                <div className="d-flex justify-content-center">
                                    <div className="spinner-border" role="status">
                                        <span className="sr-only">Loading...</span>
                                    </div>
                                </div>
                            )}
                            {resultData && (
                                <div>
                                    <h5>Data Output</h5>
                                    <p>Input Details:</p>
                                    <ul>
                                        <li>Place: {(resultData as any).input.place}</li>
                                        <li>This Year: {(resultData as any).input.this_year}</li>
                                        <li>Past Span: {(resultData as any).input.past_span}</li>
                                        <li>Day Span: {(resultData as any).input.day_span}</li>
                                    </ul>
                                    <p>Output:</p>
                                    <div>
                                        {(resultData as any).recommend_date.map((period: string[], index: number) => (
                                            <div key={index}>
                                                <p style={{ fontSize: '20px' }}>
                                                    Recommend period {index + 1}: {period[0]} ~ {period[1]}
                                                </p>
                                                <div style={{ marginLeft: '20px' }}>
                                                    {(resultData as any).recommend_date_probability[index].map((dailyProb: any, idx: number) => (
                                                        <div key={idx}>
                                                            <p>Probability of {idx % 2 === 0 ? 'rain' : 'temperature'} on {idx % 2 === 0 ? period[0] : period[1]}</p>
                                                            <ul>
                                                                {Object.entries(dailyProb).map(([condition, value], conditionIdx) => (
                                                                    <li key={conditionIdx}>
                                                                        {condition}: {Math.round(value as number * 100)}%
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                    {/* TEST */}
                    {testloading && (
                        <div className="d-flex justify-content-center">
                            <div className="spinner-border" role="status">
                                <span className="sr-only">Loading...</span>
                            </div>
                        </div>
                    )}
                    {testData && (
                        <div>
                            <h5>Test Output</h5>
                            <p>Input Details:</p>
                            <ul>
                                <li>Place: {(testData as any).input.place}</li>
                                <li>This Year: {(testData as any).input.this_year}</li>
                                <li>Past Span: {(testData as any).input.past_span}</li>
                                <li>Day Span: {(testData as any).input.day_span}</li>
                            </ul>
                            <p>Output:</p>
                            <div>
                                {(testData as any).recommend_date.map((period: string[], index: number) => (
                                    <div key={index}>
                                        <p style={{ fontSize: '20px' }}>
                                            Recommend period {index + 1}: {period[0]} ~ {period[1]}
                                        </p>
                                        <div style={{ marginLeft: '20px' }}>
                                            {(testData as any).recommend_date_probability[index].map((dailyProb: any, idx: number) => (
                                                <div key={idx}>
                                                    <p>Probability of {idx % 2 === 0 ? 'rain' : 'temperature'} on {idx % 2 === 0 ? period[0] : period[1]}</p>
                                                    <ul>
                                                        {Object.entries(dailyProb).map(([condition, value], conditionIdx) => (
                                                            <li key={conditionIdx}>
                                                                {condition}: {Math.round(value as number * 100)}%
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                </div>

            </div>

        </div>

    );
}

export default Homepage;
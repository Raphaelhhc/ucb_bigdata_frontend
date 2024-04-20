import React, { useState } from 'react';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';
import axios from 'axios';

const libraries: ("places")[] = ['places'];

function Homepage() {

    const this_year: number = new Date().getFullYear();
    const past_span: number = 3;
    const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
    const [inputValue, setInputValue] = useState<string>("");
    const [place, setPlace] = useState<google.maps.places.PlaceResult | null>(null);
    const [day_span, setDaySpan] = useState<number>(1);
    const [resultData, setResultData] = useState(null);
    const [resultloading, setResultLoading] = useState(false);
    const [showStatus, setShowStatus] = useState<string>("Enter Place and Travel Day Span and click RUN button");
    
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "",
        libraries,
        language: 'en'
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
    }

    const run = async () => {
        if (!place) {
            alert('Please select a place using the autocomplete input.');
            return;
        }
        if (!day_span || day_span < 1) {
            alert('Please enter a valid TRAVEL DAY SPAN number.');
            return;
        }
        if (day_span > 60) {
            alert('TRAVEL DAY SPAN must be between 1 and 60.');
            return;
        }
        setResultData(null);
        await getResultData();
    }

    const getResultData = async () => {
        try {
            setResultLoading(true);
            setShowStatus('Start analysis!');
            const checkresult = await axios.post(`${process.env.REACT_APP_RESTAPI_URL || 'http://127.0.0.1:5000'}/recommend/cache`, {
                place: place?.name,
                this_year: this_year,
                past_span: past_span,
                day_span: day_span
            });
            if (checkresult.data) {
                setShowStatus('Analysis done!');
                setResultData(checkresult.data);
            } else {
                setShowStatus('Data collect start!');
                console.log('data collect start!');

                const rain_volume_lists = await getRainVolumeLists();
                const temperature_lists = await getTemperatureLists();

                setShowStatus('Data collect done!');
                console.log('data collect done!');

                if (!rain_volume_lists || !temperature_lists) {
                    setShowStatus('Unable to collect data, please try again!');
                    setResultLoading(false);
                    return;
                }

                if (rain_volume_lists && temperature_lists) {
                    const [rain_volume_probabilities, rain_volume_scores] = await getRainVolumeProbabilityScore(rain_volume_lists);
                    const [temperature_probabilities, temperature_scores] = await getTemperatureProbabilityScore(temperature_lists);
                    setShowStatus('Data analysis done!');
                    console.log('data analysis done!');

                    const response = await axios.post(`${process.env.REACT_APP_RESTAPI_URL || 'http://127.0.0.1:5000'}/recommend`, {
                        place: place?.name,
                        this_year: this_year,
                        past_span: past_span,
                        day_span: day_span,
                        rain_volume_probabilities: rain_volume_probabilities,
                        temperature_probabilities: temperature_probabilities,
                        rain_volume_scores: rain_volume_scores,
                        temperature_scores: temperature_scores
                    });
                    setShowStatus('Analysis done!');
                    setResultData(response.data);
                }
            }
            setResultLoading(false);
        } catch (error) {
            console.error('Error fetching data: ', error);
            setShowStatus('Error happened, please try again!');
            setResultLoading(false);
        }
    }

    const getRainVolumeLists = async () => {
        try {
            const response = await axios.post(`${process.env.REACT_APP_RESTAPI_URL || 'http://127.0.0.1:5000'}/rainvolumecollector`, {
                place: place?.name,
                lat: place?.geometry?.location?.lat(),
                lon: place?.geometry?.location?.lng(),
                this_year: this_year,
                past_span: past_span,
            });
            if (response.data.rain_volume_lists) {
                const rain_volume_lists = response.data.rain_volume_lists;
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
            const response = await axios.post(`${process.env.REACT_APP_RESTAPI_URL || 'http://127.0.0.1:5000'}/temperaturecollector`, {
                place: place?.name,
                lat: place?.geometry?.location?.lat(),
                lon: place?.geometry?.location?.lng(),
                this_year: this_year,
                past_span: past_span,
            });
            if (response.data.temperature_lists) {
                const temperature_lists = response.data.temperature_lists;
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
            const response = await axios.post(`${process.env.REACT_APP_RESTAPI_URL || 'http://127.0.0.1:5000'}/rainvolumeanalyzer`, {
                place: place?.name,
                this_year: this_year,
                past_span: past_span,
                day_span: day_span,
                rain_volume_lists: rain_volume_lists
            });
            if (response.data.rain_volume_probabilities && response.data.rain_volume_scores) {
                const rain_volume_probabilities = response.data.rain_volume_probabilities;
                const rain_volume_scores = response.data.rain_volume_scores;
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
            const response = await axios.post(`${process.env.REACT_APP_RESTAPI_URL || 'http://127.0.0.1:5000'}/temperatureanalyzer`, {
                place: place?.name,
                this_year: this_year,
                past_span: past_span,
                day_span: day_span,
                temperature_lists: temperature_lists
            });
            if (response.data.temperature_probabilities && response.data.temperature_scores) {
                const temperature_probabilities = response.data.temperature_probabilities;
                const temperature_scores = response.data.temperature_scores;
                return [temperature_probabilities, temperature_scores];
            } else {
                console.error('No temperature probabilities and scores in response');
            }
        } catch (error) {
            console.error('Error fetching temperature probabilities and scores: ', error);
        }
        return [null, null]
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
                                    onChange={(e) => {
                                        setDaySpan(parseInt(e.target.value, 10))
                                    }}
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

                        </div>
                    </div>

                </div>

                <div className="col-7">
                    <div className='card text-bg-light mt-3' style={{ minHeight: '500px' }}>
                        <div className='card-body m-3'>

                            <h3 className='card-title'>
                                ANALYSIS RESULT
                            </h3>
                            <p>Current Status: {showStatus}</p>

                            {resultloading && (
                                <div className="d-flex justify-content-center">
                                    <div className="spinner-border" role="status">
                                        <span className="sr-only"></span>
                                    </div>
                                </div>
                            )}
                            {resultData && (
                                <div>
                                    <h5>Destination:</h5>
                                    <ul>
                                        <li>Place: {(resultData as any).input.place}</li>
                                        <li>Year: {(resultData as any).input.this_year}</li>
                                        <li>Travel Day Span: {(resultData as any).input.day_span}</li>
                                    </ul>
                                    <div>
                                        {(resultData as any).recommend_date.map((period: string[], index: number) => (
                                            <div key={index}>
                                                <h5 className='mb-4' style={{ fontSize: '20px' }}>
                                                    Recommend period {index + 1}: {period[0]} ~ {period[1]}
                                                </h5>
                                                <div style={{ marginLeft: '20px' }}>
                                                    {(resultData as any).recommend_date_probability[index].map((dailyProb: any, idx: number) => (
                                                        <div key={idx}>
                                                            <p>Probability of {idx % 2 === 0 ? 'rain' : 'temperature'} on {idx < 2 ? period[0] : period[1]}</p>
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

            </div>

        </div>

    );
}

export default Homepage;
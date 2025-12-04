import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { SEOUL_CENTER } from '../../constants/runnerGrades';
import MapController from './MapController';
import RunnerMarkers from './RunnerMarkers';
import LegendPanel from './LegendPanel';
import ControlPanel from './ControlPanel';
import StartButton from '../common/StartButton';

const containerStyle = {
    width: '100%',
    height: '100%'
};

const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
};

function MapView({
    runners,
    stats,
    selectedRunner,
    isRunning,
    onRunnerClick,
    onRefresh,
    onStartToggle
}) {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        language: 'ko'
    });

    const [map, setMap] = useState(null);

    const onLoad = useCallback(function callback(map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback(map) {
        setMap(null);
    }, []);

    if (!isLoaded) return <div>Loading Map...</div>;

    return (
        <div className={`map-container ${selectedRunner ? 'with-panel' : ''}`}>
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={SEOUL_CENTER}
                zoom={13}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={mapOptions}
            >
                <MapController map={map} selectedRunner={selectedRunner} />

                <RunnerMarkers
                    runners={runners}
                    selectedRunner={selectedRunner}
                    onRunnerClick={onRunnerClick}
                />
            </GoogleMap>

            {/* Legend */}
            <LegendPanel stats={stats} show={!selectedRunner} />

            {/* Control Panel */}
            <ControlPanel onRefresh={onRefresh} />

            {/* Start Button */}
            <StartButton isRunning={isRunning} onClick={onStartToggle} />
        </div>
    );
}

export default MapView;

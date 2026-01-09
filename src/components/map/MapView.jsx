import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { SEOUL_CENTER } from '../../constants/runnerGrades';
import MapController from './MapController';
import RunnerMarkers from './RunnerMarkers';
import ControlPanel from './ControlPanel';
import { interactiveMapOptions, LIBRARIES, MAP_ID } from '../../utils/mapConfig';

const containerStyle = {
    width: '100%',
    height: '100%'
};



function MapView({
    runners,
    stats,
    selectedRunner,
    isRunning,
    onRunnerClick,
    onRefresh,
    onStartToggle,
    showLabels
}) {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        language: 'ko',
        libraries: LIBRARIES
    });

    const [map, setMap] = useState(null);

    const mapOptions = {
        ...interactiveMapOptions,
        mapId: MAP_ID
    };

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
                    map={map}
                    runners={runners}
                    selectedRunner={selectedRunner}
                    onRunnerClick={onRunnerClick}
                />
            </GoogleMap>

            {/* Control Panel */}
            <ControlPanel onRefresh={onRefresh} />
        </div>
    );
}

export default MapView;

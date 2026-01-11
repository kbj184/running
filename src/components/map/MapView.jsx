import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { SEOUL_CENTER } from '../../constants/runnerGrades';
import MapController from './MapController';
import RunnerMarkers from './RunnerMarkers';
import ControlPanel from './ControlPanel';
import { getInteractiveMapOptions, LIBRARIES, getMapId } from '../../utils/mapConfig';

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
    showLabels,
    onBoundsChange
}) {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        language: 'ko',
        libraries: LIBRARIES
    });

    const [map, setMap] = useState(null);

    const onLoad = useCallback(function callback(map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback(map) {
        setMap(null);
    }, []);

    const onIdle = useCallback(() => {
        if (map && onBoundsChange) {
            const bounds = map.getBounds();
            if (bounds) {
                const sw = bounds.getSouthWest();
                const ne = bounds.getNorthEast();
                onBoundsChange({
                    sw: { lat: sw.lat(), lng: sw.lng() },
                    ne: { lat: ne.lat(), lng: ne.lng() }
                });
            }
        }
    }, [map, onBoundsChange]);

    // Define mapCenter, assuming it should be SEOUL_CENTER based on original code
    // If mapCenter is meant to be dynamic, it would need to be passed as a prop or derived.
    // For now, keeping it consistent with the original center value.
    const mapCenter = SEOUL_CENTER;

    if (!isLoaded) return <div>Loading Map...</div>;

    return (
        <div className={`map-container ${selectedRunner ? 'with-panel' : ''}`}>
            <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={mapCenter}
                zoom={14}
                onLoad={onLoad}
                onUnmount={onUnmount}
                onIdle={onIdle}
                options={{
                    ...(getInteractiveMapOptions() || {}),
                    mapId: getMapId()
                }}
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

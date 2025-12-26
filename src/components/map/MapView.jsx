import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { SEOUL_CENTER } from '../../constants/runnerGrades';
import MapController from './MapController';
import RunnerMarkers from './RunnerMarkers';
import ControlPanel from './ControlPanel';

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
        language: 'ko'
    });

    const [map, setMap] = useState(null);

    // showLabels에 따라 동적으로 mapOptions 생성
    const mapOptions = {
        disableDefaultUI: true, // 기본 UI 제거 (브라우저 기본 위치 팝업 방지용)
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
        gestureHandling: 'greedy', // 모바일에서 한 손가락으로 확대/축소 가능
        styles: showLabels ? [] : [
            {
                featureType: "poi",
                stylers: [{ visibility: "off" }],
            },
            {
                featureType: "transit",
                elementType: "labels.icon",
                stylers: [{ visibility: "off" }],
            },
            {
                featureType: "all",
                elementType: "labels.text",
                stylers: [{ visibility: "off" }],
            },
        ],
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

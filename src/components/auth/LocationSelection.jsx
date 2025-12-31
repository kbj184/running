import React, { useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const SEOUL_CENTER = { lat: 37.5665, lng: 126.9780 };

function LocationSelection({ onSelect, onBack, isLoading }) {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        language: 'ko'
    });

    const [markerPos, setMarkerPos] = useState(null);
    const [isGeocoding, setIsGeocoding] = useState(false);

    const handleMapClick = (e) => {
        setMarkerPos({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    };

    const handleConfirm = async () => {
        if (!markerPos) {
            alert('주 활동 지역을 지도에서 클릭하여 마킹해주세요.');
            return;
        }

        setIsGeocoding(true);
        try {
            const geocoder = new window.google.maps.Geocoder();
            const response = await geocoder.geocode({ location: markerPos });

            if (response.results && response.results.length > 0) {
                // Find the best match (usually the first one)
                // We want to find a result that has administrative levels if possible
                const result = response.results[0];
                const addressComponents = result.address_components;

                let locationData = {
                    mainCountryCode: '',
                    mainCountryName: '',
                    adminLevel1: '',
                    adminLevel2: '',
                    adminLevel3: '',
                    latitude: markerPos.lat,
                    longitude: markerPos.lng
                };

                addressComponents.forEach(component => {
                    const types = component.types;
                    if (types.includes('country')) {
                        locationData.mainCountryCode = component.short_name;
                        locationData.mainCountryName = component.long_name;
                    } else if (types.includes('administrative_area_level_1')) {
                        locationData.adminLevel1 = component.long_name;
                    } else if (types.includes('administrative_area_level_2')) {
                        locationData.adminLevel2 = component.long_name;
                    } else if (types.includes('sublocality_level_1') || types.includes('administrative_area_level_3') || types.includes('locality')) {
                        // For Korea, localities or sublocalities are often level 3 equivalents
                        if (!locationData.adminLevel3) {
                            locationData.adminLevel3 = component.long_name;
                        }
                    }
                });

                onSelect(locationData);
            } else {
                alert('해당 위치의 주소 정보를 가져올 수 없습니다.');
            }
        } catch (error) {
            console.error('Geocoding error:', error);
            alert('위치 정보를 처리하는 중 오류가 발생했습니다.');
        } finally {
            setIsGeocoding(false);
        }
    };

    if (!isLoaded) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.loadingSpinner}></div>
                <p>지도를 불러오는 중...</p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>📍 활동 지역 설정</h2>
            <p style={styles.subtitle}>주로 활동하시는 러닝 지역을 지도에서 클릭하여 마킹해주세요.</p>

            <div style={styles.mapWrapper}>
                <GoogleMap
                    mapContainerStyle={styles.mapContainer}
                    center={SEOUL_CENTER}
                    zoom={12}
                    onClick={handleMapClick}
                    options={{
                        disableDefaultUI: false,
                        mapTypeControl: false,
                        streetViewControl: false,
                        fullscreenControl: false,
                        styles: [
                            {
                                featureType: "poi",
                                stylers: [{ visibility: "off" }],
                            }
                        ]
                    }}
                >
                    {markerPos && <Marker position={markerPos} />}
                </GoogleMap>
            </div>

            <div style={styles.buttonGroup}>
                <button onClick={onBack} style={styles.backButton}>이전</button>
                <button
                    onClick={handleConfirm}
                    disabled={isGeocoding || isLoading}
                    style={styles.confirmButton}
                >
                    {isGeocoding || isLoading ? '저장 중...' : '완료 및 가입'}
                </button>
            </div>
        </div>
    );
}

const styles = {
    container: {
        width: '100%',
        textAlign: 'center',
    },
    title: {
        fontSize: '1.8rem',
        color: '#fff',
        marginBottom: '10px',
        fontWeight: '800',
        background: 'linear-gradient(to right, #00f2fe, #4facfe)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    },
    subtitle: {
        color: 'rgba(255, 255, 255, 0.6)',
        marginBottom: '20px',
        fontSize: '0.9rem',
        lineHeight: '1.5',
    },
    mapWrapper: {
        borderRadius: '20px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        marginBottom: '25px',
    },
    mapContainer: {
        width: '100%',
        height: '350px',
    },
    buttonGroup: {
        display: 'flex',
        gap: '15px',
        marginTop: '10px',
    },
    backButton: {
        flex: 1,
        padding: '16px',
        borderRadius: '15px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(255, 255, 255, 0.05)',
        color: '#fff',
        fontSize: '1.1rem',
        fontWeight: '700',
        cursor: 'pointer',
    },
    confirmButton: {
        flex: 2,
        padding: '16px',
        borderRadius: '15px',
        border: 'none',
        background: 'linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)',
        color: '#000',
        fontSize: '1.1rem',
        fontWeight: '700',
        cursor: 'pointer',
        boxShadow: '0 10px 20px -5px rgba(0, 242, 254, 0.4)',
    },
    loadingContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '50px',
        color: '#fff',
    },
    loadingSpinner: {
        width: '40px',
        height: '40px',
        border: '4px solid rgba(255, 255, 255, 0.1)',
        borderTop: '4px solid #00f2fe',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '15px',
    }
};

export default LocationSelection;

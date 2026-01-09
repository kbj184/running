import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, Autocomplete } from '@react-google-maps/api';
import AdvancedMarker from '../../common/AdvancedMarker';

const SEOUL_CENTER = { lat: 37.5665, lng: 126.9780 };
const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;

function CrewActivityAreaSelection({ onSelect, onBack, isLoading }) {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (window.google && window.google.maps) {
            setIsLoaded(true);
        }
    }, []);

    const [map, setMap] = useState(null);
    const [markerPos, setMarkerPos] = useState(null);
    const [selectedAddress, setSelectedAddress] = useState('');
    const [extractedGu, setExtractedGu] = useState('');
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const autocompleteRef = useRef(null);

    const onLoad = useCallback(function callback(mapInstance) {
        setMap(mapInstance);
    }, []);

    const onUnmount = useCallback(function callback() {
        setMap(null);
    }, []);

    const getLocationData = (result, providedPos = null) => {
        const addressComponents = result.address_components;
        const lat = providedPos ? (typeof providedPos.lat === 'function' ? providedPos.lat() : providedPos.lat) : result.geometry.location.lat();
        const lng = providedPos ? (typeof providedPos.lng === 'function' ? providedPos.lng() : providedPos.lng) : result.geometry.location.lng();

        let locationData = {
            countryCode: '',
            countryName: '',
            adminLevel1: '',
            adminLevel2: '',
            adminLevel3: '',
            adminLevelFull: result.formatted_address,
            latitude: lat,
            longitude: lng,
            formattedAddress: result.formatted_address
        };

        addressComponents.forEach(component => {
            const types = component.types;
            const name = component.long_name;

            if (types.includes('country')) {
                locationData.countryCode = component.short_name;
                locationData.countryName = name;
            } else if (types.includes('administrative_area_level_1')) {
                locationData.adminLevel1 = name;
            } else if (types.includes('locality') || types.includes('administrative_area_level_2')) {
                if (!locationData.adminLevel2 || name.endsWith('구') || name.endsWith('시')) {
                    locationData.adminLevel2 = name;
                }
            } else if (types.includes('sublocality_level_1')) {
                if (name.endsWith('구')) {
                    locationData.adminLevel2 = name;
                }
            }
        });

        if (!locationData.adminLevel2) {
            const guComp = addressComponents.find(c => c.long_name.endsWith('구'));
            if (guComp) locationData.adminLevel2 = guComp.long_name;
        }

        return locationData;
    };

    const findBestLocationData = (results, pos) => {
        if (!results || results.length === 0) return null;

        for (const res of results) {
            const data = getLocationData(res, pos);
            if (data.adminLevel2) return data;
        }

        return getLocationData(results[0], pos);
    };

    const handleMapClick = async (e) => {
        const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };

        try {
            const geocoder = new window.google.maps.Geocoder();
            const response = await geocoder.geocode({ location: newPos });

            if (response.results && response.results.length > 0) {
                const locationData = findBestLocationData(response.results, newPos);

                if (!locationData || !locationData.adminLevel2) {
                    alert('유효한 구/지역 정보가 없는 위치입니다. 다른 곳을 선택해주세요.');
                    return;
                }

                setMarkerPos({ lat: locationData.latitude, lng: locationData.longitude });
                setSelectedAddress(locationData.formattedAddress);
                setExtractedGu(locationData.adminLevel2);
            }
        } catch (error) {
            console.error('Map click geocoding error:', error);
        }
    };

    const onPlaceChanged = () => {
        if (autocompleteRef.current !== null) {
            const place = autocompleteRef.current.getPlace();
            if (place.geometry && place.geometry.location) {
                const locationData = getLocationData(place);

                if (!locationData.adminLevel2) {
                    alert('검색된 지역에 유효한 구 정보가 없습니다.');
                    return;
                }

                const newPos = {
                    lat: locationData.latitude,
                    lng: locationData.longitude
                };

                setMarkerPos(newPos);
                setSelectedAddress(locationData.formattedAddress);
                setExtractedGu(locationData.adminLevel2);

                if (map) {
                    map.panTo(newPos);
                    map.setZoom(15);
                }
            }
        }
    };

    const moveToCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('브라우저가 위치 정보를 지원하지 않습니다.');
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const newPos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                if (map) {
                    map.panTo(newPos);
                    map.setZoom(15);
                }

                try {
                    const geocoder = new window.google.maps.Geocoder();
                    const response = await geocoder.geocode({ location: newPos });

                    if (response.results && response.results.length > 0) {
                        const locationData = findBestLocationData(response.results, newPos);

                        if (locationData && locationData.adminLevel2) {
                            setMarkerPos({ lat: locationData.latitude, lng: locationData.longitude });
                            setSelectedAddress(locationData.formattedAddress);
                            setExtractedGu(locationData.adminLevel2);
                        } else {
                            alert('현재 위치에서 구 단위 정보를 찾을 수 없습니다. 지도를 드래그하여 정확한 위치를 클릭해주세요.');
                            setMarkerPos(newPos);
                            setSelectedAddress(response.results[0].formatted_address);
                            setExtractedGu('');
                        }
                    }
                } catch (error) {
                    console.error('Current location geocoding error:', error);
                } finally {
                    setIsLocating(false);
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                alert('위치 정보를 가져올 수 없습니다. 권한 설정을 확인해주세요.');
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };

    const handleConfirm = async () => {
        if (!markerPos) {
            alert('크루 활동 지역을 검색하거나 지도에서 클릭하여 지정해주세요.');
            return;
        }

        setIsGeocoding(true);
        try {
            const geocoder = new window.google.maps.Geocoder();
            const response = await geocoder.geocode({ location: markerPos });

            if (response.results && response.results.length > 0) {
                const locationData = getLocationData(response.results[0], markerPos);
                console.log('📍 Final Extracted Location (Crew Activity Area):', locationData);
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
            <div style={styles.header}>
                <h3 style={styles.title}>지도를 클릭하여 새로운 활동 지역을 선택하세요</h3>
            </div>

            <div style={styles.searchWrapper}>
                <Autocomplete
                    onLoad={(autocomplete) => { autocompleteRef.current = autocomplete; }}
                    onPlaceChanged={onPlaceChanged}
                >
                    <div style={styles.searchContainer}>
                        <span style={styles.searchIcon}>🔍</span>
                        <input
                            type="text"
                            placeholder="지역명 또는 건물명 검색"
                            style={styles.searchInput}
                        />
                    </div>
                </Autocomplete>
            </div>

            <div style={styles.mapWrapper}>
                <GoogleMap
                    mapContainerStyle={styles.mapContainer}
                    center={markerPos || SEOUL_CENTER}
                    zoom={15}
                    onClick={handleMapClick}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                    options={{
                        mapId: MAP_ID,
                        disableDefaultUI: false,
                        mapTypeControl: false,
                        streetViewControl: false,
                        fullscreenControl: false,
                    }}
                >
                    {markerPos && (
                        <AdvancedMarker
                            map={map}
                            position={markerPos}
                        >
                            <div style={{
                                width: '30px',
                                height: '30px',
                                backgroundColor: '#00f2fe',
                                borderRadius: '50%',
                                border: '3px solid white',
                                boxShadow: '0 0 15px rgba(0,242,254,0.6)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '16px'
                            }}>📍</div>
                        </AdvancedMarker>
                    )}

                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            moveToCurrentLocation();
                        }}
                        style={styles.myLocationBtn}
                        disabled={isLocating}
                        title="내 위치로 이동"
                    >
                        {isLocating ? '...' : '🎯'}
                    </button>
                </GoogleMap>
            </div>

            <div style={styles.resultCard}>
                <span style={{ fontWeight: '700', color: '#333' }}>선택된 지역: </span>
                <span style={{ color: '#666' }}>{selectedAddress || '지도를 클릭하여 선택해주세요'}</span>
            </div>

            <div style={styles.buttonGroup}>
                <button onClick={onBack} style={styles.backButton}>이전</button>
                <button
                    onClick={handleConfirm}
                    disabled={isGeocoding || isLoading || !markerPos}
                    style={{
                        ...styles.confirmButton,
                        opacity: (isGeocoding || isLoading || !markerPos) ? 0.6 : 1
                    }}
                >
                    {isGeocoding || isLoading ? '처리 중...' : '활동 지역 확정'}
                </button>
            </div>
        </div>
    );
}

const styles = {
    container: {
        width: '100%',
        maxWidth: '500px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        padding: '24px 20px',
        backgroundColor: '#fff',
        minHeight: '100vh',
    },
    header: {
        marginBottom: '4px',
    },
    title: {
        fontSize: '15px',
        fontWeight: '600',
        color: '#666',
        margin: 0,
    },
    searchWrapper: {
        width: '100%',
        zIndex: 10,
    },
    searchContainer: {
        display: 'flex',
        alignItems: 'center',
        background: '#f3f4f6',
        borderRadius: '12px',
        padding: '12px 16px',
        border: '1px solid #e5e7eb',
    },
    searchIcon: {
        marginRight: '12px',
        fontSize: '14px',
        color: '#9ca3af',
    },
    searchInput: {
        flex: 1,
        background: 'none',
        border: 'none',
        color: '#111827',
        fontSize: '15px',
        outline: 'none',
        width: '100%',
    },
    mapWrapper: {
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
        position: 'relative',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    mapContainer: {
        width: '100%',
        height: '350px',
    },
    resultCard: {
        background: '#f9fafb',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid #e5e7eb',
        fontSize: '14px',
        lineHeight: '1.5',
    },
    buttonGroup: {
        display: 'flex',
        gap: '12px',
        marginTop: 'auto',
        paddingTop: '20px',
    },
    backButton: {
        flex: 1,
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        background: '#fff',
        color: '#6b7280',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
    },
    confirmButton: {
        flex: 2,
        padding: '16px',
        borderRadius: '12px',
        border: 'none',
        background: '#10b981',
        color: '#fff',
        fontSize: '16px',
        fontWeight: '700',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
    },
    loadingContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px',
    },
    loadingSpinner: {
        width: '40px',
        height: '40px',
        border: '3px solid #f3f4f6',
        borderTop: '3px solid #10b981',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '16px',
    },
    myLocationBtn: {
        position: 'absolute',
        right: '12px',
        bottom: '12px',
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        backgroundColor: '#fff',
        border: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        cursor: 'pointer',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: 10,
    }
};

export default CrewActivityAreaSelection;

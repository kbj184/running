import React, { useState, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';

const SEOUL_CENTER = { lat: 37.5665, lng: 126.9780 };
const LIBRARIES = ['places'];

function LocationSelection({ onSelect, onBack, isLoading }) {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        language: 'ko',
        libraries: LIBRARIES
    });

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
            mainCountryCode: '',
            mainCountryName: '',
            adminLevel1: '',
            adminLevel2: '',
            adminLevel3: '',
            latitude: lat,
            longitude: lng,
            formattedAddress: result.formatted_address
        };

        addressComponents.forEach(component => {
            const types = component.types;
            const name = component.long_name;

            if (types.includes('country')) {
                locationData.mainCountryCode = component.short_name;
                locationData.mainCountryName = name;
            } else if (types.includes('administrative_area_level_1')) {
                locationData.adminLevel1 = name;
            } else if (types.includes('locality') || types.includes('administrative_area_level_2')) {
                if (!locationData.adminLevel2 || name.endsWith('구') || name.endsWith('시')) {
                    locationData.adminLevel2 = name;
                }
            } else if (types.includes('sublocality_level_1')) {
                if (name.endsWith('구') || (name.endsWith('시') && !locationData.adminLevel2)) {
                    locationData.adminLevel2 = name;
                }
            }
        });

        if (!locationData.adminLevel2) {
            const guComp = addressComponents.find(c => c.long_name.endsWith('구') || (c.long_name.endsWith('시') && !c.types.includes('administrative_area_level_1')));
            if (guComp) locationData.adminLevel2 = guComp.long_name;
        }

        return locationData;
    };

    const handleMapClick = async (e) => {
        const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };

        try {
            const geocoder = new window.google.maps.Geocoder();
            const response = await geocoder.geocode({ location: newPos });

            if (response.results && response.results[0]) {
                const locationData = getLocationData(response.results[0], newPos);

                // '구' 정보가 없는 지역은 무시
                if (!locationData.adminLevel2) {
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

                // 현재 위치로 마커 설정 및 자치구 추출 시도
                try {
                    const geocoder = new window.google.maps.Geocoder();
                    const response = await geocoder.geocode({ location: newPos });
                    if (response.results && response.results[0]) {
                        const locationData = getLocationData(response.results[0], newPos);

                        // 구 정보가 있는 경우에만 상태 업데이트
                        if (locationData.adminLevel2) {
                            setMarkerPos({ lat: locationData.latitude, lng: locationData.longitude });
                            setSelectedAddress(locationData.formattedAddress);
                            setExtractedGu(locationData.adminLevel2);
                        } else {
                            // 구 정보가 없더라도 일단 마커는 찍어줌
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
            alert('주 활동 지역을 검색하거나 지도에서 클릭하여 지정해주세요.');
            return;
        }

        setIsGeocoding(true);
        try {
            const geocoder = new window.google.maps.Geocoder();
            const response = await geocoder.geocode({ location: markerPos });

            if (response.results && response.results.length > 0) {
                const locationData = getLocationData(response.results[0], markerPos);
                console.log('📍 Final Extracted Location (Gu):', locationData);
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
            <header style={styles.header}>
                <h2 style={styles.title}>📍 활동 범위 설정</h2>
                <p style={styles.subtitle}>거주하시는 '구'(예: 강남구)를 검색하거나 지도를 클릭하세요.</p>
            </header>

            <div style={styles.searchWrapper}>
                <Autocomplete
                    onLoad={(autocomplete) => { autocompleteRef.current = autocomplete; }}
                    onPlaceChanged={onPlaceChanged}
                >
                    <div style={styles.searchContainer}>
                        <span style={styles.searchIcon}>🔍</span>
                        <input
                            type="text"
                            placeholder="구 또는 지역명 검색 (예: 강남구, 분당구)"
                            style={styles.searchInput}
                        />
                    </div>
                </Autocomplete>
            </div>

            <div style={styles.mapWrapper}>
                <GoogleMap
                    mapContainerStyle={styles.mapContainer}
                    center={SEOUL_CENTER}
                    zoom={12}
                    onClick={handleMapClick}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
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

                    {/* Floating My Location Button */}
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
                {selectedAddress ? (
                    <>
                        <div style={styles.dongBadge}>
                            <span style={styles.dongIcon}>�️</span>
                            <span style={styles.dongName}>{extractedGu || '지역 미지정'}</span>
                        </div>
                        <div style={styles.addressDisplay}>
                            <span style={styles.addressText}>{selectedAddress}</span>
                        </div>
                    </>
                ) : (
                    <div style={styles.placeholderCard}>
                        지도에서 활동 범위를 선택해주세요.
                    </div>
                )}
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
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
    },
    header: {
        textAlign: 'center',
        marginBottom: '5px',
    },
    title: {
        fontSize: '1.6rem',
        color: '#fff',
        margin: '0 0 8px 0',
        fontWeight: '800',
        background: 'linear-gradient(to right, #00f2fe, #4facfe)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    },
    subtitle: {
        color: 'rgba(255, 255, 255, 0.6)',
        margin: 0,
        fontSize: '0.85rem',
        lineHeight: '1.4',
    },
    searchWrapper: {
        width: '100%',
        zIndex: 10,
    },
    searchContainer: {
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '12px 16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
    },
    searchIcon: {
        marginRight: '12px',
        fontSize: '1rem',
    },
    searchInput: {
        flex: 1,
        background: 'none',
        border: 'none',
        color: '#fff',
        fontSize: '0.95rem',
        outline: 'none',
        width: '100%',
    },
    mapWrapper: {
        borderRadius: '24px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
        position: 'relative',
    },
    mapContainer: {
        width: '100%',
        height: '300px',
    },
    resultCard: {
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '20px',
        padding: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'left',
    },
    dongBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        background: 'rgba(0, 242, 254, 0.15)',
        padding: '6px 12px',
        borderRadius: '10px',
        marginBottom: '10px',
        border: '1px solid rgba(0, 242, 254, 0.3)',
    },
    dongIcon: {
        fontSize: '1rem',
    },
    dongName: {
        color: '#00f2fe',
        fontWeight: '700',
        fontSize: '0.9rem',
    },
    addressDisplay: {
        padding: '0 4px',
    },
    addressText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '0.85rem',
        lineHeight: '1.4',
    },
    placeholderCard: {
        color: 'rgba(255, 255, 255, 0.3)',
        fontSize: '0.9rem',
        textAlign: 'center',
        padding: '10px 0',
    },
    buttonGroup: {
        display: 'flex',
        gap: '12px',
        marginTop: '5px',
    },
    backButton: {
        flex: 1,
        padding: '16px',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(255, 255, 255, 0.05)',
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: '1rem',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    confirmButton: {
        flex: 2,
        padding: '16px',
        borderRadius: '16px',
        border: 'none',
        background: 'linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)',
        color: '#000',
        fontSize: '1rem',
        fontWeight: '800',
        cursor: 'pointer',
        boxShadow: '0 10px 20px -5px rgba(0, 242, 254, 0.4)',
        transition: 'all 0.2s',
    },
    loadingContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px',
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
    },
    myLocationBtn: {
        position: 'absolute',
        right: '16px',
        bottom: '16px',
        width: '44px',
        height: '44px',
        borderRadius: '12px',
        backgroundColor: '#fff',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.2rem',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        zIndex: 10,
        transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        '&:active': {
            transform: 'scale(0.95)',
        }
    }
};

export default LocationSelection;

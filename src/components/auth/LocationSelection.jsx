import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, Autocomplete } from '@react-google-maps/api';
import AdvancedMarker from '../common/AdvancedMarker';
import { getDefaultMapOptions, getMapId } from '../../utils/mapConfig';

const SEOUL_CENTER = { lat: 37.5665, lng: 126.9780 };

function LocationSelection({ onSelect, onBack, isLoading }) {
    // App.jsx의 LoadScript에서 이미 로드되었으므로 useJsApiLoader 제거
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Google Maps API가 로드되었는지 확인
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
            mainCountryCode: '',
            mainCountryName: '',
            adminLevel1: '',
            adminLevel2: '',
            adminLevel3: '',
            adminLevelFull: result.formatted_address,  // 전체 주소
            latitude: lat,
            longitude: lng,
            formattedAddress: result.formatted_address
        };

        // 행정 구역 정보를 담고 있는 모든 컴포넌트 순회
        addressComponents.forEach(component => {
            const types = component.types;
            const name = component.long_name;

            if (types.includes('country')) {
                locationData.mainCountryCode = component.short_name;
                locationData.mainCountryName = name;
            } else if (types.includes('administrative_area_level_1')) {
                locationData.adminLevel1 = name;
            } else if (types.includes('locality') || types.includes('administrative_area_level_2')) {
                // 시/군/구 단위 (예: 성남시, 수원시)
                if (!locationData.adminLevel2 || name.endsWith('구') || name.endsWith('시')) {
                    locationData.adminLevel2 = name;
                }
            } else if (types.includes('sublocality_level_1')) {
                // 구 단위 (예: 강남구)
                if (name.endsWith('구')) {
                    locationData.adminLevel2 = name;
                }
            }
        });

        // 후속 보정: 타입 기반으로 못 잡은 경우 접미사 '구'로 재검색
        if (!locationData.adminLevel2) {
            const guComp = addressComponents.find(c => c.long_name.endsWith('구'));
            if (guComp) locationData.adminLevel2 = guComp.long_name;
        }

        return locationData;
    };

    // 여러 검색 결과 중 '구' 정보가 포함된 최적의 결과를 찾는 헬퍼
    const findBestLocationData = (results, pos) => {
        if (!results || results.length === 0) return null;

        // 1. 우선적으로 '구' 정보가 포함된 결과 찾기
        for (const res of results) {
            const data = getLocationData(res, pos);
            if (data.adminLevel2) return data;
        }

        // 2. 만약 하나도 없다면 첫 번째 결과 데이터 반환 (실패용)
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
                            // 현위치 정보가 행정구역상 구 정보를 포함하지 않는 경우
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
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={markerPos || SEOUL_CENTER}
                    zoom={15}
                    onClick={handleMapClick}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                    options={{
                        ...(getDefaultMapOptions() || {}),
                        mapId: getMapId(),
                        gestureHandling: 'greedy'
                    }}
                >
                    {markerPos && (
                        <AdvancedMarker
                            map={map}
                            position={markerPos}
                        >
                            <div style={{
                                width: '24px',
                                height: '24px',
                                backgroundColor: '#00f2fe',
                                borderRadius: '50%',
                                border: '3px solid white',
                                boxShadow: '0 0 10px rgba(0,242,254,0.5)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px'
                            }}>📍</div>
                        </AdvancedMarker>
                    )}

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
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" fill="currentColor" />
                        </svg>
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
        right: '10px',
        bottom: '120px',
        width: '40px',
        height: '40px',
        borderRadius: '2px',
        backgroundColor: '#fff',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: 'rgba(0, 0, 0, 0.3) 0px 1px 4px -1px',
        zIndex: 10,
        color: '#666',
        transition: 'background-color 0.2s',
    }
};

export default LocationSelection;

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, Autocomplete } from '@react-google-maps/api';
import AdvancedMarker from '../../common/AdvancedMarker';
import { defaultMapOptions } from '../../../utils/mapConfig';

const SEOUL_CENTER = { lat: 37.5665, lng: 126.9780 };
const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;

function CrewActivityAreaSelection({ onSelect, onBack, isLoading, embedded = false }) {
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

                // 임베디드 모드일 경우 즉시 상위 컴포넌트에 알림
                if (embedded) {
                    onSelect(locationData);
                }
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

                // 임베디드 모드일 경우 즉시 상위 컴포넌트에 알림
                if (embedded) {
                    onSelect(locationData);
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

                            // 임베디드 모드일 경우 즉시 상위 컴포넌트에 알림
                            if (embedded) {
                                onSelect(locationData);
                            }
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

        try {
            const geocoder = new window.google.maps.Geocoder();
            const response = await geocoder.geocode({ location: markerPos });

            if (response.results && response.results.length > 0) {
                const locationData = getLocationData(response.results[0], markerPos);
                onSelect(locationData);
            } else {
                alert('해당 위치의 주소 정보를 가져올 수 없습니다.');
            }
        } catch (error) {
            console.error('Geocoding error:', error);
            alert('위치 정보를 처리하는 중 오류가 발생했습니다.');
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

    const containerStyle = embedded ?
        { ...styles.container, maxWidth: '100%', padding: '0', minHeight: 'auto', backgroundColor: 'transparent' } :
        styles.container;

    return (
        <div style={containerStyle}>
            {/* 구글 로고 및 하단 텍스트 제거를 위한 스타일 스타일 */}
            <style>
                {`
                    .gm-style-cc, .gmnoprint, .gm-style-cc + div {
                        display: none !important;
                    }
                    a[href^="https://maps.google.com/maps"] {
                        display: none !important;
                    }
                    .gm-control-active {
                        display: none !important;
                    }
                `}
            </style>

            {!embedded && (
                <div style={styles.header}>
                    <h3 style={styles.title}>지도를 클릭하여 새로운 활동 지역을 선택하세요</h3>
                </div>
            )}

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
                        ...defaultMapOptions,
                        mapId: MAP_ID,
                        gestureHandling: 'greedy'
                    }}
                >
                    {markerPos && (
                        <AdvancedMarker
                            map={map}
                            position={markerPos}
                        >
                            <div style={{
                                fontSize: '32px',
                                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                                transform: 'translateY(-16px)'
                            }}>🚩</div>
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
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" fill="currentColor" />
                        </svg>
                    </button>
                </GoogleMap>
            </div>

            <div style={styles.resultCard}>
                <span style={{ fontWeight: '700', color: '#f8fafc' }}>선택된 지역: </span>
                <span style={{ color: '#94a3b8' }}>{selectedAddress || '지도를 클릭하여 선택해주세요'}</span>
            </div>

            {!embedded && (
                <div style={styles.buttonGroup}>
                    <button onClick={onBack} style={styles.backButton}>이전</button>
                    <button
                        onClick={handleConfirm}
                        disabled={isLoading || !markerPos}
                        style={{
                            ...styles.confirmButton,
                            opacity: (isLoading || !markerPos) ? 0.6 : 1
                        }}
                    >
                        {isLoading ? '처리 중...' : '활동 지역 확정'}
                    </button>
                </div>
            )}
        </div>
    );
}

const styles = {
    container: {
        width: '100%',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '24px 20px',
        backgroundColor: '#0f172a',
        minHeight: '100vh',
    },
    header: {
        marginBottom: '4px',
    },
    title: {
        fontSize: '15px',
        fontWeight: '600',
        color: '#94a3b8',
        margin: 0,
    },
    searchWrapper: {
        width: '100%',
        zIndex: 10,
    },
    searchContainer: {
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '14px',
        padding: '12px 16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        transition: 'all 0.2s',
    },
    searchIcon: {
        marginRight: '12px',
        fontSize: '14px',
        color: '#64748b',
    },
    searchInput: {
        flex: 1,
        background: 'none',
        border: 'none',
        color: '#f8fafc',
        fontSize: '15px',
        outline: 'none',
        width: '100%',
    },
    mapWrapper: {
        borderRadius: '20px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'relative',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    },
    mapContainer: {
        width: '100%',
        height: '300px',
    },
    resultCard: {
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '14px',
        padding: '16px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
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
        borderRadius: '14px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(255, 255, 255, 0.05)',
        color: '#94a3b8',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
    },
    confirmButton: {
        flex: 2,
        padding: '16px',
        borderRadius: '14px',
        border: 'none',
        background: '#38bdf8',
        color: '#0f172a',
        fontSize: '16px',
        fontWeight: '800',
        cursor: 'pointer',
        boxShadow: '0 10px 15px -3px rgba(56, 189, 248, 0.3)',
    },
    loadingContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px',
        color: '#94a3b8'
    },
    loadingSpinner: {
        width: '40px',
        height: '40px',
        border: '3px solid rgba(255, 255, 255, 0.1)',
        borderTop: '3px solid #38bdf8',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '16px',
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

export default CrewActivityAreaSelection;

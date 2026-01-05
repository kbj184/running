import React, { useState, useMemo } from 'react';
import { api } from '../../../utils/api';
import { generateRouteMapImage } from '../../../utils/mapThumbnail';
import { GoogleMap, useJsApiLoader, Polyline } from '@react-google-maps/api';
import AdvancedMarker from '../../common/AdvancedMarker';

const LIBRARIES = ['places', 'marker'];
const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;

// 속도에 따른 색상 반환
const getSpeedColor = (speedKmh) => {
    if (speedKmh <= 0) return "#667eea";
    if (speedKmh < 6) return "#10b981";
    if (speedKmh < 9) return "#f59e0b";
    if (speedKmh < 12) return "#ef4444";
    return "#7c3aed";
};

function CourseDetailPage({ user, crewId, selectedRecord, onClose, onSuccess }) {
    const [description, setDescription] = useState('');
    const [registering, setRegistering] = useState(false);
    const [showInteractiveMap, setShowInteractiveMap] = useState(false);
    const [map, setMap] = useState(null);

    // Google Maps API 로드
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        language: 'ko',
        libraries: LIBRARIES
    });

    const getAuthHeaders = () => {
        if (!user || !user.accessToken) return {};
        return {
            'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
        };
    };

    // route 데이터 파싱
    const parsedRoute = useMemo(() => {
        if (selectedRecord.route) {
            try {
                let route = selectedRecord.route;
                if (typeof route === 'string') {
                    route = JSON.parse(route);
                }
                if (Array.isArray(route) && route.length > 0) {
                    return route;
                }
            } catch (e) {
                console.error('Failed to parse route:', e);
            }
        }
        return null;
    }, [selectedRecord.route]);

    // 정적 지도 이미지 생성
    const mapImageUrl = useMemo(() => {
        if (parsedRoute && parsedRoute.length > 0) {
            const wateringSegments = selectedRecord.wateringSegments || [];
            return generateRouteMapImage(parsedRoute, wateringSegments);
        }
        return selectedRecord.thumbnail;
    }, [parsedRoute, selectedRecord.wateringSegments, selectedRecord.thumbnail]);

    // 지도 중심점 계산
    const mapCenter = useMemo(() => {
        if (!parsedRoute || parsedRoute.length === 0) return { lat: 37.5665, lng: 126.9780 };

        const lats = parsedRoute.map(p => p.lat);
        const lngs = parsedRoute.map(p => p.lng);

        return {
            lat: (Math.min(...lats) + Math.max(...lats)) / 2,
            lng: (Math.min(...lngs) + Math.max(...lngs)) / 2
        };
    }, [parsedRoute]);

    // 경로를 속도별 세그먼트로 변환
    const routeSegments = useMemo(() => {
        if (!parsedRoute || parsedRoute.length < 2) return [];

        const segments = [];
        let currentPath = [];
        let currentColor = getSpeedColor(parsedRoute[0]?.speed || 0);

        for (let i = 0; i < parsedRoute.length - 1; i++) {
            const p1 = parsedRoute[i];
            const p2 = parsedRoute[i + 1];
            let color = getSpeedColor(p1.speed || 0);

            if (currentPath.length === 0) {
                currentPath.push({ lat: p1.lat, lng: p1.lng });
                currentColor = color;
            }

            if (color !== currentColor) {
                currentPath.push({ lat: p1.lat, lng: p1.lng });
                segments.push({ path: [...currentPath], color: currentColor });
                currentPath = [{ lat: p1.lat, lng: p1.lng }];
                currentColor = color;
            }

            currentPath.push({ lat: p2.lat, lng: p2.lng });
        }

        if (currentPath.length > 0) {
            segments.push({ path: currentPath, color: currentColor });
        }

        return segments;
    }, [parsedRoute]);

    // 마커 위치
    const markers = useMemo(() => {
        if (!parsedRoute || parsedRoute.length === 0) return { start: null, goal: null };
        return {
            start: parsedRoute[0],
            goal: parsedRoute[parsedRoute.length - 1]
        };
    }, [parsedRoute]);

    // 지도 로드 콜백
    const onLoad = (mapInstance) => {
        setMap(mapInstance);
        if (parsedRoute && parsedRoute.length > 0) {
            const bounds = new window.google.maps.LatLngBounds();
            parsedRoute.forEach(point => {
                bounds.extend({ lat: point.lat, lng: point.lng });
            });
            mapInstance.fitBounds(bounds);
        }
    };

    const handleRegister = async () => {
        try {
            setRegistering(true);

            const courseData = {
                name: `러닝 코스 - ${new Date(selectedRecord.timestamp || Date.now()).toLocaleDateString()}`,
                description: description.trim() || `거리: ${selectedRecord.distance?.toFixed(2)}km, 시간: ${Math.floor(selectedRecord.duration / 60)}분`,
                distance: selectedRecord.distance,
                routeData: selectedRecord.route,
                mapThumbnailUrl: selectedRecord.thumbnail
            };

            const response = await api.request(`${import.meta.env.VITE_API_URL}/crew/${crewId}/courses`, {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(courseData)
            });

            if (response.ok) {
                onSuccess();
            } else {
                const errorText = await response.text();
                console.error('Failed to register course:', response.status, errorText);
                alert('코스 등록에 실패했습니다.');
            }
        } catch (error) {
            console.error('Failed to register course:', error);
            alert('코스 등록 중 오류가 발생했습니다.');
        } finally {
            setRegistering(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: '#fff',
                borderRadius: '16px',
                padding: '24px',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                overflowY: 'auto'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h3 style={{
                        margin: 0,
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#333'
                    }}>
                        코스 등록
                    </h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '24px',
                            cursor: 'pointer',
                            color: '#999',
                            padding: 0,
                            lineHeight: 1
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* Map - Static or Interactive */}
                <div style={{ position: 'relative' }}>
                    {!showInteractiveMap ? (
                        // Static Map
                        <div
                            style={{
                                width: '100%',
                                height: '400px',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                backgroundColor: '#f0f0f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                position: 'relative'
                            }}
                            onClick={() => setShowInteractiveMap(true)}
                        >
                            {mapImageUrl ? (
                                <img
                                    src={mapImageUrl}
                                    alt="러닝 경로"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        const errorDiv = document.createElement('div');
                                        errorDiv.style.cssText = 'display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-size:16px;';
                                        errorDiv.textContent = '지도 로딩 실패';
                                        e.target.parentElement.appendChild(errorDiv);
                                    }}
                                />
                            ) : (
                                <div style={{ fontSize: '40px', color: '#ccc' }}>🗺️</div>
                            )}
                        </div>
                    ) : (
                        // Interactive Map
                        <div style={{
                            width: '100%',
                            height: '400px',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            position: 'relative'
                        }}>
                            {isLoaded && parsedRoute && parsedRoute.length > 0 ? (
                                <GoogleMap
                                    mapContainerStyle={{
                                        width: '100%',
                                        height: '100%',
                                        borderRadius: '12px'
                                    }}
                                    center={mapCenter}
                                    zoom={14}
                                    onLoad={onLoad}
                                    onUnmount={() => setMap(null)}
                                    options={{
                                        mapId: MAP_ID,
                                        disableDefaultUI: false,
                                        zoomControl: true,
                                        mapTypeControl: false,
                                        streetViewControl: false,
                                        fullscreenControl: true,
                                    }}
                                >
                                    {/* 속도별 경로 세그먼트 */}
                                    {routeSegments.map((segment, idx) => (
                                        <Polyline
                                            key={`segment-${idx}`}
                                            path={segment.path}
                                            options={{
                                                strokeColor: segment.color,
                                                strokeOpacity: 0.9,
                                                strokeWeight: 6,
                                            }}
                                        />
                                    ))}

                                    {/* S (Start) 마커 */}
                                    {markers.start && (
                                        <AdvancedMarker
                                            map={map}
                                            position={markers.start}
                                            zIndex={100}
                                        >
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                backgroundColor: '#22c55e',
                                                borderRadius: '50%',
                                                border: '3px solid white',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '14px',
                                                fontWeight: '800',
                                                color: 'white'
                                            }}>
                                                S
                                            </div>
                                        </AdvancedMarker>
                                    )}

                                    {/* G (Goal) 마커 */}
                                    {markers.goal && (
                                        <AdvancedMarker
                                            map={map}
                                            position={markers.goal}
                                            zIndex={100}
                                        >
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                backgroundColor: '#ef4444',
                                                borderRadius: '50%',
                                                border: '3px solid white',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '14px',
                                                fontWeight: '800',
                                                color: 'white'
                                            }}>
                                                G
                                            </div>
                                        </AdvancedMarker>
                                    )}
                                </GoogleMap>
                            ) : (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '100%',
                                    color: '#999',
                                    backgroundColor: '#f5f5f5'
                                }}>
                                    지도 로딩 중...
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Course Info */}
                <div style={{
                    padding: '16px',
                    backgroundColor: '#f8f8f8',
                    borderRadius: '12px'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px'
                    }}>
                        <div style={{ fontSize: '14px', color: '#666' }}>거리</div>
                        <div style={{ fontSize: '18px', fontWeight: '700', color: '#FF9A56' }}>
                            {selectedRecord.distance?.toFixed(2)} km
                        </div>
                    </div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{ fontSize: '14px', color: '#666' }}>시간</div>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
                            {Math.floor(selectedRecord.duration / 60)}분
                        </div>
                    </div>
                </div>

                {/* Description Input */}
                <div>
                    <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#333',
                        marginBottom: '8px'
                    }}>
                        코스 설명
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="코스에 대한 설명을 입력하세요 (선택사항)"
                        maxLength={500}
                        style={{
                            width: '100%',
                            minHeight: '120px',
                            padding: '12px',
                            fontSize: '14px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px',
                            resize: 'vertical',
                            fontFamily: 'inherit',
                            boxSizing: 'border-box'
                        }}
                    />
                    <div style={{
                        fontSize: '12px',
                        color: '#999',
                        marginTop: '4px',
                        textAlign: 'right'
                    }}>
                        {description.length} / 500
                    </div>
                </div>

                {/* Action Buttons */}
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    marginTop: '8px'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1,
                            padding: '14px',
                            backgroundColor: '#f0f0f0',
                            color: '#666',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '15px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        취소
                    </button>
                    <button
                        onClick={handleRegister}
                        disabled={registering}
                        style={{
                            flex: 1,
                            padding: '14px',
                            backgroundColor: registering ? '#ccc' : '#FF9A56',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '15px',
                            fontWeight: '600',
                            cursor: registering ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {registering ? '등록 중...' : '등록'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CourseDetailPage;

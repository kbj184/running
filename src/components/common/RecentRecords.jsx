import { useState, useEffect } from 'react';
import { GoogleMap, PolylineF, useJsApiLoader } from '@react-google-maps/api';
import { getRecentSessions } from '../../utils/db';
import { formatDistance, formatTime } from '../../utils/gps';

const thumbnailMapStyle = {
    width: '100px',
    height: '80px',
    borderRadius: '8px'
};

const mapOptions = {
    disableDefaultUI: true,
    zoomControl: false,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
    clickableIcons: false,
    gestureHandling: 'none',
    styles: [
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

function RouteThumbnail({ route }) {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        language: 'ko'
    });

    const [map, setMap] = useState(null);

    useEffect(() => {
        if (map && route && route.length > 0 && window.google) {
            const bounds = new window.google.maps.LatLngBounds();
            route.forEach(point => {
                bounds.extend({ lat: point.lat, lng: point.lng });
            });
            map.fitBounds(bounds);
        }
    }, [map, route]);

    if (!isLoaded || !route || route.length === 0) {
        return (
            <div style={{
                ...thumbnailMapStyle,
                background: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
                fontSize: '12px'
            }}>
                🗺️
            </div>
        );
    }

    const center = route[Math.floor(route.length / 2)];

    return (
        <div style={{ ...thumbnailMapStyle, overflow: 'hidden' }}>
            <GoogleMap
                mapContainerStyle={thumbnailMapStyle}
                center={center}
                zoom={14}
                options={mapOptions}
                onLoad={setMap}
                onUnmount={() => setMap(null)}
            >
                <PolylineF
                    path={route}
                    options={{
                        strokeColor: '#4318FF',
                        strokeOpacity: 0.9,
                        strokeWeight: 3,
                    }}
                />
            </GoogleMap>
        </div>
    );
}

function RecentRecords({ onRefresh, onRecordClick }) {
    const [records, setRecords] = useState([]);
    const [stats, setStats] = useState({
        totalDistance: 0,
        totalDuration: 0,
        avgSpeed: 0
    });

    useEffect(() => {
        loadRecords();
    }, [onRefresh]);

    const loadRecords = async () => {
        console.log('📋 최근 기록 로딩 시작...');
        try {
            // 모든 기록 가져오기
            const recent = await getRecentSessions(100);
            console.log('📋 가져온 기록 수:', recent.length);

            // 통계 계산
            if (recent.length > 0) {
                const totalDistance = recent.reduce((sum, r) => sum + r.distance, 0);
                const totalDuration = recent.reduce((sum, r) => sum + r.duration, 0);
                const avgSpeed = totalDuration > 0 ? (totalDistance / (totalDuration / 3600)) : 0;

                setStats({
                    totalDistance,
                    totalDuration,
                    avgSpeed
                });
            }

            setRecords(recent);
        } catch (err) {
            console.error('❌ 기록 로딩 실패:', err);
        }
    };

    if (records.length === 0) {
        return (
            <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#999'
            }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏃</div>
                <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>아직 기록이 없습니다</div>
                <div style={{ fontSize: '14px' }}>첫 러닝을 시작해보세요!</div>
            </div>
        );
    }

    return (
        <div style={{ width: '100%' }}>
            {/* 통계 섹션 */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                padding: '20px',
                backgroundColor: '#f9f9f9',
                borderBottom: '1px solid #e0e0e0'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>총 거리</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a1a' }}>
                        {formatDistance(stats.totalDistance)}
                    </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>총 시간</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a1a' }}>
                        {formatTime(stats.totalDuration)}
                    </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>평균 속도</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a1a' }}>
                        {stats.avgSpeed.toFixed(1)} <span style={{ fontSize: '12px', fontWeight: '500' }}>km/h</span>
                    </div>
                </div>
            </div>

            {/* 최근 활동 섹션 */}
            <div style={{ padding: '20px 0' }}>
                <h3 style={{
                    margin: '0 0 16px 20px',
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#1a1a1a'
                }}>
                    📅 최근 활동
                </h3>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {records.map(record => (
                        <div
                            key={record.sessionId}
                            onClick={() => onRecordClick(record)}
                            style={{
                                display: 'flex',
                                gap: '12px',
                                padding: '16px 20px',
                                borderBottom: '1px solid #f0f0f0',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s',
                                backgroundColor: '#fff'
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}
                        >
                            {/* 썸네일 지도 */}
                            <RouteThumbnail route={record.route} />

                            {/* 기록 정보 */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a' }}>
                                        {formatDistance(record.distance)}
                                    </span>
                                    <span style={{ fontSize: '12px', color: '#999' }}>
                                        {new Date(record.timestamp).toLocaleDateString()}
                                    </span>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    gap: '12px',
                                    fontSize: '13px',
                                    color: '#666'
                                }}>
                                    <span>⏱️ {formatTime(record.duration)}</span>
                                    <span>⚡ {record.pace.toFixed(1)} min/km</span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#999' }}>
                                    🔥 {Math.floor(record.distance * 60)} kcal
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default RecentRecords;

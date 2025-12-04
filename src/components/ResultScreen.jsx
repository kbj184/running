import { GoogleMap, Marker, Polyline, useJsApiLoader } from '@react-google-maps/api';
import { formatTime, formatDistance } from '../utils/gps';

const containerStyle = {
    width: '100%',
    height: '100%'
};

const mapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
    clickableIcons: false,
};

function ResultScreen({ result, onSave, onDelete, mode = 'finish' }) {
    const { distance, duration, speed, pace, route } = result;

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        language: 'ko'
    });

    // 평균 속도 계산
    const avgSpeed = speed || 0;
    const avgPace = pace || 0;

    // 칼로리 계산 (대략적인 추정: 1km당 60kcal)
    const calories = Math.floor(distance * 60);

    // 지도 중심 계산 (경로의 중간 지점)
    const center = route && route.length > 0
        ? route[Math.floor(route.length / 2)]
        : { lat: 37.5665, lng: 126.9780 };

    return (
        <div className="result-screen">
            {/* 헤더 */}
            <div className="result-header">
                <div className="result-title">
                    <span className="result-icon">🎉</span>
                    <h1>{mode === 'view' ? '기록 상세' : '러닝 완료!'}</h1>
                </div>
                <button className="result-close-button" onClick={onSave}>
                    ✕
                </button>
            </div>

            {/* 주요 통계 */}
            <div className="result-main-stats">
                <div className="result-main-card">
                    <div className="result-main-label">총 거리</div>
                    <div className="result-main-value">{formatDistance(distance)}</div>
                </div>

                <div className="result-main-card">
                    <div className="result-main-label">총 시간</div>
                    <div className="result-main-value">{formatTime(duration)}</div>
                </div>
            </div>

            {/* 상세 통계 */}
            <div className="result-stats-grid">
                <div className="result-stat-card">
                    <div className="result-stat-icon">🏃‍♂️</div>
                    <div className="result-stat-info">
                        <div className="result-stat-label">평균 속도</div>
                        <div className="result-stat-value">{avgSpeed.toFixed(1)} km/h</div>
                    </div>
                </div>

                <div className="result-stat-card">
                    <div className="result-stat-icon">⚡</div>
                    <div className="result-stat-info">
                        <div className="result-stat-label">평균 페이스</div>
                        <div className="result-stat-value">
                            {avgPace > 0 && avgPace < 100 ? avgPace.toFixed(1) : '0.0'} min/km
                        </div>
                    </div>
                </div>

                <div className="result-stat-card">
                    <div className="result-stat-icon">🔥</div>
                    <div className="result-stat-info">
                        <div className="result-stat-label">소모 칼로리</div>
                        <div className="result-stat-value">{calories} kcal</div>
                    </div>
                </div>

                <div className="result-stat-card">
                    <div className="result-stat-icon">📍</div>
                    <div className="result-stat-info">
                        <div className="result-stat-label">경로 포인트</div>
                        <div className="result-stat-value">{route ? route.length : 0}개</div>
                    </div>
                </div>
            </div>

            {/* 경로 지도 */}
            <div className="result-map-section">
                <h2 className="result-section-title">
                    <span>🗺️</span>
                    <span>이동 경로</span>
                </h2>

                <div className="result-map">
                    {isLoaded && route && route.length > 0 ? (
                        <GoogleMap
                            mapContainerStyle={containerStyle}
                            center={center}
                            zoom={14}
                            options={mapOptions}
                        >
                            {/* 경로 라인 */}
                            <Polyline
                                path={route}
                                options={{
                                    strokeColor: "#667eea",
                                    strokeOpacity: 0.8,
                                    strokeWeight: 5,
                                }}
                            />

                            {/* 시작점 */}
                            <Marker
                                position={route[0]}
                                icon={{
                                    path: google.maps.SymbolPath.CIRCLE,
                                    scale: 6,
                                    fillColor: "#22c55e",
                                    fillOpacity: 1,
                                    strokeColor: "#ffffff",
                                    strokeWeight: 3,
                                }}
                            />

                            {/* 종료점 */}
                            <Marker
                                position={route[route.length - 1]}
                                icon={{
                                    path: google.maps.SymbolPath.CIRCLE,
                                    scale: 6,
                                    fillColor: "#ef4444",
                                    fillOpacity: 1,
                                    strokeColor: "#ffffff",
                                    strokeWeight: 3,
                                }}
                            />
                        </GoogleMap>
                    ) : (
                        <div className="no-route-message">
                            {isLoaded ? '경로 데이터가 없습니다.' : '지도 로딩 중...'}
                        </div>
                    )}
                </div>
            </div>

            {/* 하단 버튼 */}
            <div className="result-actions" style={{ display: 'flex', gap: '12px' }}>
                <button
                    className="result-action-button delete"
                    onClick={onDelete}
                    style={{
                        backgroundColor: '#ef4444',
                        flex: '0 0 auto',
                        width: 'auto',
                        padding: '0 24px'
                    }}
                >
                    <span>🗑️</span>
                    <span>삭제하기</span>
                </button>
                <button
                    className="result-action-button primary"
                    onClick={onSave}
                    style={{ flex: 1 }}
                >
                    {mode === 'view' ? (
                        <>
                            <span>🏠</span>
                            <span>홈으로</span>
                        </>
                    ) : (
                        <>
                            <span>💾</span>
                            <span>저장하기</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

export default ResultScreen;

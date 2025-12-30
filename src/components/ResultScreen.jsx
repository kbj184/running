import { GoogleMap, MarkerF, PolylineF, useJsApiLoader } from '@react-google-maps/api';
import { formatTime, formatDistance } from '../utils/gps';
import { useState, useEffect, useCallback } from 'react';
import './result-screen.css';

const containerStyle = {
    width: '100%',
    height: '100%'
};

const mapOptions = {
    disableDefaultUI: true,
    zoomControl: false,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
    clickableIcons: false,
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
    ],
};

const getSpeedColor = (speedKmh) => {
    if (speedKmh === undefined || speedKmh === null) return "#4318FF";
    if (speedKmh <= 0) return "#4318FF";
    if (speedKmh < 6) return "#10b981";
    if (speedKmh < 9) return "#f59e0b";
    if (speedKmh < 12) return "#ef4444";
    return "#7c3aed";
};

function ResultScreen({ result, onSave, onDelete, mode = 'finish' }) {
    const {
        distance,
        duration,
        speed,
        pace,
        route,
        wateringSegments = [],
        splits = [],
        currentElevation = 0,
        totalAscent = 0,
        totalDescent = 0
    } = result;

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        language: 'ko'
    });

    // 지도 인스턴스 저장
    const [map, setMap] = useState(null);

    // 승급 메시지 표시 여부 상태
    const [showGradeUpgrade, setShowGradeUpgrade] = useState(false);

    // 지도 로드 콜백
    const onLoad = useCallback((map) => {
        setMap(map);
    }, []);

    // 지도 언마운트 콜백
    const onUnmount = useCallback(() => {
        setMap(null);
    }, []);

    // 경로에 맞게 지도 확대/축소 자동 조정
    useEffect(() => {
        if (map && route && route.length > 0 && window.google) {
            const bounds = new window.google.maps.LatLngBounds();
            route.forEach(point => {
                bounds.extend({ lat: point.lat, lng: point.lng });
            });
            map.fitBounds(bounds, {
                top: 50,
                right: 50,
                bottom: 50,
                left: 50
            });
        }
    }, [map, route]);

    // 승급 메시지 최초 1회만 표시 체크
    useEffect(() => {
        if (result.gradeUpgraded && result.newGrade) {
            const gradeHistoryKey = 'grade_upgrade_history';
            const gradeHistory = JSON.parse(localStorage.getItem(gradeHistoryKey) || '[]');

            // 이미 이 등급에 도달한 적이 있는지 확인
            const alreadyAchieved = gradeHistory.includes(result.newGrade);

            if (!alreadyAchieved) {
                // 최초 달성이면 표시하고 기록에 추가
                setShowGradeUpgrade(true);
                gradeHistory.push(result.newGrade);
                localStorage.setItem(gradeHistoryKey, JSON.stringify(gradeHistory));
                console.log(`🎉 New Grade Achievement: ${result.newGrade}`);
            } else {
                console.log(`✓ Grade ${result.newGrade} already achieved before`);
            }
        }
    }, [result.gradeUpgraded, result.newGrade]);

    const avgSpeed = speed || 0;
    const avgPace = pace || 0;
    const calories = Math.floor(distance * 60);

    const center = route && route.length > 0
        ? route[Math.floor(route.length / 2)]
        : { lat: 37.5665, lng: 126.9780 };

    const mapSegments = (() => {
        if (!route || route.length < 2) return [];
        const segments = [];
        let currentPath = [];
        const isIndexInWatering = (idx) => {
            for (const seg of wateringSegments) {
                if (idx >= seg.start && idx < seg.end) return true;
            }
            return false;
        };

        let currentColor = isIndexInWatering(0) ? "#06b6d4" : getSpeedColor(route[0]?.speed);

        for (let i = 0; i < route.length - 1; i++) {
            const p1 = route[i];
            const p2 = route[i + 1];
            const watering = isIndexInWatering(i);
            let color = watering ? "#06b6d4" : getSpeedColor(p1.speed);

            if (currentPath.length === 0) {
                currentPath.push(p1);
                currentColor = color;
            }

            if (color !== currentColor) {
                currentPath.push(p1);
                segments.push({ path: [...currentPath], color: currentColor });
                currentPath = [p1];
                currentColor = color;
            }
            currentPath.push(p2);
        }

        if (currentPath.length > 0) {
            segments.push({ path: currentPath, color: currentColor });
        }
        return segments;
    })();

    return (
        <div className="result-screen-container">
            <header className="result-header">
                <h1 className="result-title">러닝 완료!</h1>
                <button className="result-close-x" onClick={onSave}>✕</button>
            </header>

            {/* 승급 축하 배너 - 최초 1회만 표시 */}
            {showGradeUpgrade && (
                <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '20px',
                    margin: '0 20px 20px 20px',
                    borderRadius: '16px',
                    textAlign: 'center',
                    color: '#fff',
                    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
                    animation: 'slideDown 0.5s ease-out'
                }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎉</div>
                    <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>
                        등급 승급!
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>
                        {result.newGrade}
                    </div>
                    <div style={{ fontSize: '13px', opacity: 0.9 }}>
                        {result.gradeDescription}
                    </div>
                </div>
            )}

            <section className="result-summary-section">
                <div className="result-main-stats-row">
                    <div className="result-main-stat-item">
                        <div className="result-stat-label">시간</div>
                        <div className="result-stat-value-huge">{formatTime(duration)}</div>
                    </div>
                    <div className="result-main-stat-item center">
                        <div className="result-stat-label">거리</div>
                        <div className="result-stat-value-huge">{formatDistance(distance)}</div>
                    </div>
                </div>

                <div className="result-secondary-stats-grid">
                    <div className="result-secondary-item">
                        <div className="result-secondary-label">평균 속도</div>
                        <div className="result-secondary-value">{avgSpeed.toFixed(1)} <small>km/h</small></div>
                    </div>
                    <div className="result-secondary-item">
                        <div className="result-secondary-label">칼로리</div>
                        <div className="result-secondary-value">{calories} <small>kcal</small></div>
                    </div>
                    <div className="result-secondary-item">
                        <div className="result-secondary-label">평균 페이스</div>
                        <div className="result-secondary-value">{avgPace > 0 && avgPace < 100 ? avgPace.toFixed(1) : '0.0'} <small>분/km</small></div>
                    </div>
                </div>

                {/* 고도 정보 */}
                {(totalAscent > 0 || totalDescent > 0) && (
                    <div className="result-secondary-stats-grid" style={{ marginTop: '12px' }}>
                        <div className="result-secondary-item">
                            <div className="result-secondary-label">현재 고도</div>
                            <div className="result-secondary-value" style={{ color: '#667eea' }}>{currentElevation.toFixed(0)} <small>m</small></div>
                        </div>
                        <div className="result-secondary-item">
                            <div className="result-secondary-label">↗ 상승</div>
                            <div className="result-secondary-value" style={{ color: '#22c55e' }}>{totalAscent.toFixed(0)} <small>m</small></div>
                        </div>
                        <div className="result-secondary-item">
                            <div className="result-secondary-label">↘ 하강</div>
                            <div className="result-secondary-value" style={{ color: '#ef4444' }}>{totalDescent.toFixed(0)} <small>m</small></div>
                        </div>
                    </div>
                )}
            </section>

            <section className="result-card-section">
                <div className="result-section-title-simple">
                    <span>🗺️</span> 러닝 경로
                </div>
                <div className="result-map-card">
                    {loadError ? <div>지도 오류</div> :
                        !isLoaded ? <div>로딩 중...</div> :
                            !route || route.length === 0 ? <div>경로 없음</div> : (
                                <GoogleMap
                                    mapContainerStyle={containerStyle}
                                    center={center}
                                    zoom={15}
                                    options={mapOptions}
                                    onLoad={onLoad}
                                    onUnmount={onUnmount}
                                >
                                    {mapSegments.map((segment, idx) => (
                                        <PolylineF
                                            key={idx}
                                            path={segment.path}
                                            options={{
                                                strokeColor: segment.color,
                                                strokeOpacity: 0.9,
                                                strokeWeight: 6,
                                            }}
                                        />
                                    ))}
                                    {window.google && (
                                        <>
                                            <MarkerF
                                                position={route[0]}
                                                icon={{
                                                    path: window.google.maps.SymbolPath.CIRCLE,
                                                    scale: 6, fillColor: "#22c55e", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 3
                                                }}
                                            />
                                            <MarkerF
                                                position={route[route.length - 1]}
                                                icon={{
                                                    path: window.google.maps.SymbolPath.CIRCLE,
                                                    scale: 6, fillColor: "#4318FF", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 3
                                                }}
                                            />
                                        </>
                                    )}
                                </GoogleMap>
                            )}
                </div>
            </section>

            {splits && splits.length > 0 && (
                <section className="result-card-section">
                    <div className="result-section-title-simple">
                        <span>🚩</span> 구간 기록 (1km)
                    </div>
                    <div className="splits-list">
                        {splits.map((split, idx) => (
                            <div className="split-row-item" key={idx}>
                                <div className="split-km-badge">{split.km} km</div>
                                <div className="split-time-value">{formatTime(split.duration)}</div>
                                <div className="split-pace-value">{split.pace.toFixed(2)} 분/km</div>
                                {split.elevation !== undefined && (
                                    <div className="split-elevation-value" style={{ color: '#667eea', fontSize: '12px' }}>
                                        🗻 {split.elevation.toFixed(0)}m
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <div className="result-footer-actions">
                <button className="result-btn result-btn-delete" onClick={onDelete}>
                    <span>🗑️</span> 삭제
                </button>
                <button className="result-btn result-btn-save" onClick={onSave}>
                    {mode === 'view' ? '홈으로' : '기록 저장'}
                </button>
            </div>
        </div>
    );
}

export default ResultScreen;

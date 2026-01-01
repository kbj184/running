import { formatTime, formatDistance } from '../utils/gps';
import { useState, useEffect, useMemo } from 'react';
import { generateRouteMapImage } from '../utils/mapThumbnail';
import { GoogleMap, useJsApiLoader, Polyline } from '@react-google-maps/api';
import AdvancedMarker from './common/AdvancedMarker';
import './result-screen.css';

const LIBRARIES = ['places', 'marker'];
const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;

function ResultScreen({ result, onSave, onDelete, mode = 'finish' }) {
    const {
        distance,
        duration,
        speed,
        pace,
        route,
        thumbnail, // 썸네일 URL 추가
        wateringSegments = [],
        splits = [],
        currentElevation = 0,
        totalAscent = 0,
        totalDescent = 0,
        timestamp // 타임스탬프 추가
    } = result;

    // 승급 메시지 표시 여부 상태
    const [showGradeUpgrade, setShowGradeUpgrade] = useState(false);

    // 지도 모드 상태 (true: 실제 지도, false: 이미지)
    const [showInteractiveMap, setShowInteractiveMap] = useState(false);
    const [map, setMap] = useState(null);

    // Google Maps API 로드
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        language: 'ko',
        libraries: LIBRARIES
    });

    // 승급 메시지 최초 1회만 표시 체크
    useEffect(() => {
        if (result.gradeUpgraded && result.newGrade) {
            // 세션 ID를 키로 사용하여 이미 표시했는지 확인
            const sessionKey = `grade_shown_${result.sessionId || Date.now()}`;
            const alreadyShown = sessionStorage.getItem(sessionKey);

            if (!alreadyShown) {
                // 이번 세션에서 처음 보는 것이면 표시
                setShowGradeUpgrade(true);
                sessionStorage.setItem(sessionKey, 'true');
                console.log(`🎉 New Grade Achievement: ${result.newGrade}`);
            } else {
                console.log(`✓ Grade upgrade message already shown for this session`);
            }
        }
    }, []); // 빈 배열로 마운트 시 한 번만 실행

    const avgSpeed = speed || 0;
    const avgPace = pace || 0;
    const calories = Math.floor(distance * 60);

    // 지도 이미지 URL 생성 (데이터가 바뀔 때만 재계산)
    const mapImageUrl = useMemo(() => {
        if (thumbnail) return thumbnail;
        if (route && route.length > 0) {
            console.log("🗺️ Generating new map image URL...");
            return generateRouteMapImage(route, wateringSegments);
        }
        return null;
    }, [thumbnail, route, wateringSegments]);

    // 지도 중심점 계산
    const mapCenter = useMemo(() => {
        if (!route || route.length === 0) return { lat: 37.5665, lng: 126.9780 };

        const lats = route.map(p => p.lat);
        const lngs = route.map(p => p.lng);

        return {
            lat: (Math.min(...lats) + Math.max(...lats)) / 2,
            lng: (Math.min(...lngs) + Math.max(...lngs)) / 2
        };
    }, [route]);

    // 경로를 Google Maps Polyline 형식으로 변환
    const routePath = useMemo(() => {
        if (!route || route.length === 0) return [];
        return route.map(point => ({ lat: point.lat, lng: point.lng }));
    }, [route]);

    // wateringSegments를 인덱스에서 실제 좌표 배열로 변환
    const wateringPaths = useMemo(() => {
        if (!route || route.length === 0 || !wateringSegments || wateringSegments.length === 0) {
            return [];
        }

        console.log('💧 Converting wateringSegments to paths...');
        console.log('💧 Original wateringSegments:', wateringSegments);

        const paths = wateringSegments.map((segment, idx) => {
            // segment가 {start, end} 형식인 경우
            if (segment && typeof segment === 'object' && 'start' in segment && 'end' in segment) {
                const { start, end } = segment;
                console.log(`💧 Segment ${idx}: start=${start}, end=${end}`);

                // route에서 start부터 end까지의 좌표 추출
                if (start >= 0 && end < route.length && start <= end) {
                    const path = route.slice(start, end + 1).map(p => ({ lat: p.lat, lng: p.lng }));
                    console.log(`✅ Converted segment ${idx} to path with ${path.length} points`);
                    return path;
                }
            }
            // segment가 이미 좌표 배열인 경우
            else if (Array.isArray(segment) && segment.length > 0) {
                console.log(`✅ Segment ${idx} is already a path with ${segment.length} points`);
                return segment;
            }

            console.warn(`⚠️ Invalid segment ${idx}:`, segment);
            return null;
        }).filter(path => path && path.length > 0);

        console.log(`💧 Converted ${paths.length} watering paths`);
        return paths;
    }, [route, wateringSegments]);

    // 마커 위치 계산
    const markers = useMemo(() => {
        if (!route || route.length === 0) return { start: null, goal: null, water: [] };

        const start = route[0];
        const goal = route[route.length - 1];

        console.log('🗺️ Markers - Route length:', route.length);
        console.log('🗺️ Markers - WateringPaths count:', wateringPaths.length);

        // 수분 보충 구간의 중간 지점들
        const waterMarkers = [];

        if (wateringPaths && wateringPaths.length > 0) {
            wateringPaths.forEach((path, idx) => {
                console.log(`💧 Water path ${idx}:`, path.length, 'points');

                if (path && Array.isArray(path) && path.length > 0) {
                    const midIndex = Math.floor(path.length / 2);
                    const waterPos = path[midIndex];

                    if (waterPos && waterPos.lat && waterPos.lng) {
                        waterMarkers.push(waterPos);
                        console.log(`✅ Water marker ${idx} added:`, waterPos);
                    }
                }
            });
        }

        console.log('🗺️ Final markers:', {
            start,
            goal,
            waterCount: waterMarkers.length,
            water: waterMarkers
        });

        return { start, goal, water: waterMarkers };
    }, [route, wateringPaths]);

    // 지도 로드 콜백
    const onLoad = (mapInstance) => {
        setMap(mapInstance);

        // 경로에 맞게 지도 범위 조정
        if (route && route.length > 0) {
            const bounds = new window.google.maps.LatLngBounds();
            route.forEach(point => {
                bounds.extend({ lat: point.lat, lng: point.lng });
            });
            mapInstance.fitBounds(bounds);
        }
    };

    const onUnmount = () => {
        setMap(null);
    };

    // 날짜/시간 포맷팅 - 2025년12월30일 10:36~10:36 형식
    const runDate = timestamp ? new Date(timestamp) : new Date();
    const year = runDate.getFullYear();
    const month = runDate.getMonth() + 1;
    const day = runDate.getDate();

    // 시작 시간과 종료 시간 계산
    const endTime = runDate;
    const startTime = new Date(endTime.getTime() - duration * 1000);
    const startTimeStr = `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}`;
    const endTimeStr = `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`;
    const dateTimeStr = `${year}년${month}월${day}일 ${startTimeStr}~${endTimeStr}`;

    return (
        <div className="result-screen-container">
            {/* 고정 헤더 - X 버튼과 날짜/시간 */}
            <header className="result-header-fixed">
                <button className="result-close-x" onClick={onSave}>✕</button>
                <div className="result-datetime">
                    {dateTimeStr}
                </div>
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

            {/* 거리 표시 - 라벨 없이 숫자만 */}
            <section className="result-distance-section">
                <div className="result-distance-value">{formatDistance(distance)}</div>
            </section>

            {/* 지도 표기 - 이미지 또는 실제 지도 */}
            <section className="result-card-section">
                <div className="result-map-card" style={{ position: 'relative' }}>
                    {!showInteractiveMap ? (
                        // 이미지 모드
                        <>
                            {!mapImageUrl ? (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '400px',
                                    color: '#999',
                                    fontSize: '16px',
                                    backgroundColor: '#f5f5f5',
                                    borderRadius: '12px'
                                }}>
                                    경로 없음
                                </div>
                            ) : (
                                <div
                                    style={{
                                        position: 'relative',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => setShowInteractiveMap(true)}
                                >
                                    <img
                                        src={mapImageUrl}
                                        alt="러닝 경로"
                                        style={{
                                            width: '100%',
                                            height: '400px',
                                            objectFit: 'cover',
                                            borderRadius: '12px',
                                            display: 'block'
                                        }}
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            const errorDiv = document.createElement('div');
                                            errorDiv.style.cssText = 'display:flex;align-items:center;justify-content:center;height:400px;color:#999;background:#f5f5f5;border-radius:12px;';
                                            errorDiv.textContent = '지도 로딩 실패';
                                            e.target.parentElement.appendChild(errorDiv);
                                        }}
                                    />
                                    {/* 클릭 힌트 오버레이 */}
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '16px',
                                        right: '16px',
                                        background: 'rgba(0, 0, 0, 0.7)',
                                        color: '#fff',
                                        padding: '8px 16px',
                                        borderRadius: '20px',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        backdropFilter: 'blur(4px)'
                                    }}>
                                        🗺️ 지도 보기
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        // 실제 지도 모드
                        <div style={{ position: 'relative' }}>
                            {isLoaded && route && route.length > 0 ? (
                                <GoogleMap
                                    mapContainerStyle={{
                                        width: '100%',
                                        height: '400px',
                                        borderRadius: '12px'
                                    }}
                                    center={mapCenter}
                                    zoom={14}
                                    onLoad={onLoad}
                                    onUnmount={onUnmount}
                                    options={{
                                        mapId: MAP_ID,
                                        disableDefaultUI: false,
                                        zoomControl: true,
                                        mapTypeControl: false,
                                        streetViewControl: false,
                                        fullscreenControl: true,
                                    }}
                                >
                                    {/* 러닝 경로 */}
                                    <Polyline
                                        path={routePath}
                                        options={{
                                            strokeColor: '#00f2fe',
                                            strokeOpacity: 0.8,
                                            strokeWeight: 4,
                                        }}
                                    />

                                    {/* 수분 보충 구간 */}
                                    {wateringPaths && wateringPaths.length > 0 && wateringPaths.map((path, idx) => (
                                        <Polyline
                                            key={`water-${idx}`}
                                            path={path}
                                            options={{
                                                strokeColor: '#4facfe',
                                                strokeOpacity: 0.6,
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

                                    {/* W (Water) 마커들 */}
                                    {markers.water.map((waterPos, idx) => (
                                        <AdvancedMarker
                                            key={`water-marker-${idx}`}
                                            map={map}
                                            position={waterPos}
                                            zIndex={99}
                                        >
                                            <div style={{
                                                width: '28px',
                                                height: '28px',
                                                backgroundColor: '#3b82f6',
                                                borderRadius: '50%',
                                                border: '3px solid white',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '13px',
                                                fontWeight: '800',
                                                color: 'white'
                                            }}>
                                                W
                                            </div>
                                        </AdvancedMarker>
                                    ))}

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
                                    height: '400px',
                                    color: '#999',
                                    backgroundColor: '#f5f5f5',
                                    borderRadius: '12px'
                                }}>
                                    지도 로딩 중...
                                </div>
                            )}

                            {/* 이미지로 돌아가기 버튼 */}
                            <button
                                onClick={() => setShowInteractiveMap(false)}
                                style={{
                                    position: 'absolute',
                                    bottom: '16px',
                                    right: '16px',
                                    background: 'rgba(0, 0, 0, 0.7)',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    backdropFilter: 'blur(4px)',
                                    zIndex: 10
                                }}
                            >
                                🖼️ 이미지로
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* 런닝 데이터 표기 */}
            <section className="result-summary-section">
                <div className="result-section-title-simple" style={{ marginBottom: '16px', paddingLeft: '20px' }}>
                    <span>📊</span> 런닝 데이터
                </div>

                <div className="result-secondary-stats-grid">
                    <div className="result-secondary-item">
                        <div className="result-secondary-label">시간</div>
                        <div className="result-secondary-value">{formatTime(duration)}</div>
                    </div>
                    <div className="result-secondary-item">
                        <div className="result-secondary-label">평균 속도</div>
                        <div className="result-secondary-value">{avgSpeed.toFixed(1)} <small>km/h</small></div>
                    </div>
                    <div className="result-secondary-item">
                        <div className="result-secondary-label">평균 페이스</div>
                        <div className="result-secondary-value">{avgPace > 0 && avgPace < 100 ? avgPace.toFixed(1) : '0.0'} <small>분/km</small></div>
                    </div>
                </div>

                <div className="result-secondary-stats-grid" style={{ marginTop: '12px' }}>
                    <div className="result-secondary-item">
                        <div className="result-secondary-label">칼로리</div>
                        <div className="result-secondary-value">{calories} <small>kcal</small></div>
                    </div>
                    {(totalAscent > 0 || totalDescent > 0) && (
                        <>
                            <div className="result-secondary-item">
                                <div className="result-secondary-label">↗ 상승</div>
                                <div className="result-secondary-value" style={{ color: '#22c55e' }}>{totalAscent.toFixed(0)} <small>m</small></div>
                            </div>
                            <div className="result-secondary-item">
                                <div className="result-secondary-label">↘ 하강</div>
                                <div className="result-secondary-value" style={{ color: '#ef4444' }}>{totalDescent.toFixed(0)} <small>m</small></div>
                            </div>
                        </>
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
                {mode === 'finish' && (
                    <button className="result-btn result-btn-save" onClick={onSave}>
                        기록 저장
                    </button>
                )}
            </div>
        </div>
    );
}

export default ResultScreen;


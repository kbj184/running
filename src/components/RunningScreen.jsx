import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleMap, MarkerF, PolylineF, useJsApiLoader } from '@react-google-maps/api';
import {
    calculateDistance,
    calculateSpeed,
    calculatePace,
    formatTime,
    formatDistance,
    watchPosition,
    clearWatch
} from '../utils/gps';
import { saveRunningData } from '../utils/db';

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

// 속도에 따른 색상 반환 (히트맵 스타일: Low-Green -> High-Red)
const getSpeedColor = (speedKmh) => {
    if (speedKmh <= 0) return "#667eea"; // 멈춤
    if (speedKmh < 6) return "#10b981"; // 걷기/느린 조깅 (초록)
    if (speedKmh < 9) return "#f59e0b"; // 중강도 (주황)
    if (speedKmh < 12) return "#ef4444"; // 고강도 (빨강)
    return "#7c3aed"; // 초고속 (보라)
};

function RunningScreen({ onStop, sessionId }) {
    // 서울 중심 좌표
    const SEOUL_CENTER = { lat: 37.5665, lng: 126.9780 };

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        language: 'ko'
    });

    const [map, setMap] = useState(null);
    const [currentPosition, setCurrentPosition] = useState(null);

    // Route 데이터 구조: { lat, lng, speed, timestamp }
    const [route, setRoute] = useState([]);

    // 1km 구간 기록 (Splits)
    const [splits, setSplits] = useState([]);
    const lastSplitDistanceRef = useRef(0); // 마지막으로 기록된 1km 지점 (km 단위 정수)

    const [distance, setDistance] = useState(0); // km
    const [speed, setSpeed] = useState(0); // km/h
    const [pace, setPace] = useState(0); // min/km
    const [duration, setDuration] = useState(0); // seconds
    const [isTracking, setIsTracking] = useState(true);
    const [error, setError] = useState(null);
    const [testMode, setTestMode] = useState(true);

    // 급수 관련 상태
    const [isWatering, setIsWatering] = useState(false);
    const [wateringSegments, setWateringSegments] = useState([]);
    const [wateringStartIndex, setWateringStartIndex] = useState(null);

    const watchIdRef = useRef(null);
    const startTimeRef = useRef(Date.now());
    const lastPositionRef = useRef(null);
    const saveIntervalRef = useRef(null);

    // 최신 상태 ref
    const currentStateRef = useRef({
        currentPosition: null,
        distance: 0,
        speed: 0,
        pace: 0,
        duration: 0,
        route: []
    });

    const onLoad = useCallback(function callback(map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback(map) {
        setMap(null);
    }, []);

    useEffect(() => {
        currentStateRef.current = {
            currentPosition,
            distance,
            speed,
            pace,
            duration,
            route
        };
    }, [currentPosition, distance, speed, pace, duration, route]);

    useEffect(() => {
        if (map && currentPosition) {
            map.panTo(currentPosition);
        }
    }, [map, currentPosition]);

    useEffect(() => {
        if (testMode && !currentPosition) {
            setCurrentPosition(SEOUL_CENTER);
        }
    }, [testMode]);

    // 위치 업데이트 및 Split 체크 공통 로직
    const handleLocationUpdate = (newPos, currentDuration) => {
        setCurrentPosition(newPos);
        setError(null);

        let newDistance = distance;
        let newSpeed = speed;
        let newPace = pace;

        if (lastPositionRef.current) {
            const dist = calculateDistance(
                lastPositionRef.current.lat,
                lastPositionRef.current.lng,
                newPos.lat,
                newPos.lng
            );

            // 거리가 너무 작으면 튀는 값일 수 있으므로 무시 (선택 사항)
            if (dist > 0.0005) { // 0.5m 이상 움직였을 때만
                newDistance = distance + dist;
                newSpeed = calculateSpeed(newDistance, currentDuration);
                newPace = calculatePace(newDistance, currentDuration);

                setDistance(newDistance);
                setSpeed(newSpeed);
                setPace(newPace);

                // 1km Split 체크
                const currentKm = Math.floor(newDistance);
                if (currentKm > lastSplitDistanceRef.current) {
                    // 새로운 1km 달성!
                    const splitDuration = duration; // 현재까지 총 시간 (정확한 구간 시간은 별도 계산 필요하지만 편의상 누적 기록 사용하거나 이전 split 차감)

                    // 이전 Split들의 총 시간 합산
                    const prevDuration = splits.reduce((acc, curr) => acc + curr.duration, 0);
                    const currentSplitDuration = duration - prevDuration; // 이번 1km 걸린 시간 (초)
                    const currentSplitPace = currentSplitDuration / 60; // min/km (1km니까 시간이 곧 페이스)

                    const newSplit = {
                        km: currentKm,
                        duration: currentSplitDuration,
                        pace: currentSplitPace,
                        totalDistance: newDistance,
                        totalTime: duration
                    };

                    setSplits(prev => [...prev, newSplit]);
                    lastSplitDistanceRef.current = currentKm;

                    console.log(`🎉 ${currentKm}km 돌파! 기록:`, newSplit);
                }
            }
        } else {
            // 첫 시작점
            console.log('🟢 시작점 설정');
        }

        // 경로에 추가 (속도 정보 포함)
        setRoute(prev => [...prev, {
            lat: newPos.lat,
            lng: newPos.lng,
            speed: newSpeed, // 현재 구간 속도
            timestamp: Date.now()
        }]);

        lastPositionRef.current = newPos;
    };

    // 테스트 클릭 핸들러
    const onMapClick = (e) => {
        if (!testMode) return;
        const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        const currentDuration = (Date.now() - startTimeRef.current) / 1000;
        handleLocationUpdate(newPos, currentDuration);
    };

    useEffect(() => {
        // ... (로그 생략)

        if (!testMode) {
            watchIdRef.current = watchPosition(
                (position) => {
                    const newPos = { lat: position.latitude, lng: position.longitude };
                    const currentDuration = (Date.now() - startTimeRef.current) / 1000;
                    handleLocationUpdate(newPos, currentDuration);
                },
                (err) => {
                    console.error('GPS Error:', err);
                    setError('GPS 위치 실패');
                }
            );
        }

        const durationInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
            setDuration(elapsed);
        }, 1000);

        saveIntervalRef.current = setInterval(async () => {
            const state = currentStateRef.current;
            if (state.currentPosition && state.distance > 0) {
                try {
                    await saveRunningData({
                        sessionId,
                        timestamp: Date.now(),
                        position: state.currentPosition,
                        distance: state.distance,
                        speed: state.speed,
                        pace: state.pace,
                        duration: state.duration,
                        route: state.route,
                        wateringSegments,
                        isWatering,
                        splits: splits // Split 정보 저장
                    });
                } catch (err) { }
            }
        }, 2000);

        return () => {
            if (watchIdRef.current) clearWatch(watchIdRef.current);
            clearInterval(durationInterval);
            if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
        };
    }, [sessionId, testMode, wateringSegments, isWatering, splits]); // splits 의존성 추가

    const handleWateringStart = () => {
        setIsWatering(true);
        setWateringStartIndex(route.length);
    };

    const handleWateringEnd = () => {
        setIsWatering(false);
        if (wateringStartIndex !== null) {
            setWateringSegments(prev => [...prev, {
                start: wateringStartIndex,
                end: route.length
            }]);
            setWateringStartIndex(null);
        }
    };

    const handleStop = async () => {
        setIsTracking(false);
        const state = currentStateRef.current;
        if (state.currentPosition && state.distance > 0) {
            await saveRunningData({
                sessionId,
                timestamp: Date.now(),
                position: state.currentPosition,
                distance: state.distance,
                speed: state.speed,
                pace: state.pace,
                duration: state.duration,
                route: state.route,
                wateringSegments,
                isComplete: true,
                splits // 최종 저장 시 포함
            });
        }
        if (watchIdRef.current) clearWatch(watchIdRef.current);
        if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);

        onStop({
            distance: state.distance,
            duration: state.duration,
            speed: state.speed,
            pace: state.pace,
            route: state.route,
            wateringSegments,
            splits,
            sessionId
        });
    };

    // 경로 세그먼트 계산 (useMemo로 최적화)
    const mapSegments = useMemo(() => {
        if (route.length < 2) return [];

        const segments = [];
        let currentPath = [];
        let currentColor = getSpeedColor(route[0]?.speed || 0);
        let isInWatering = false;

        // 급수 구간 판별 헬퍼
        const isIndexInWatering = (idx) => {
            // 완료된 급수 구간
            for (const seg of wateringSegments) {
                if (idx >= seg.start && idx < seg.end) return true;
            }
            // 현재 진행중인 급수 구간
            if (isWatering && wateringStartIndex !== null) {
                if (idx >= wateringStartIndex) return true;
            }
            return false;
        };

        // 1km 단위로 색상을 쪼개려면 route 데이터에 km 정보가 있거나, distance누적이 있어야 하는데
        // 현재는 '속도' 기반으로 색을 칠한다고 했으므로, 점마다 속도를 체크해서 색이 바뀌면 Polyline을 분리합니다.
        // 너무 잘게 쪼개지면 성능이 저하되므로, 일정 구간(예: 10개 점)마다 대표 속도로 퉁치거나,
        // 급수 구간 우선으로 처리합니다.

        // 여기서는 "1km별 평균속도별 색상"을 구현하기 위해
        // 1km 단위로 세그먼트를 크게 나눕니다.

        let splitIndices = []; // 1km, 2km... 되는 route 인덱스 찾기 (정확하진 않지만 근사치)
        // distance 계산이 handleLocationUpdate에서 state로 관리되어 여기서 route만으로는 정확한 누적 거리 알기 어려움.
        // 하지만 편의상 route의 길이를 등분하거나, route 객체에 distance 필드를 추가하는 게 좋았을 것.
        // 현재 route에 distance가 없으므로, 그냥 "속도 기반"으로 구간을 나누겠습니다. (요청사항 뒷부분 "평균속도별 색상을 가속력 있게 표현")

        for (let i = 0; i < route.length - 1; i++) {
            const p1 = route[i];
            const p2 = route[i + 1];

            const watering = isIndexInWatering(i);

            // 색상 결정: 급수중이면 하늘색, 아니면 속도기반 색상
            let color = watering ? "#06b6d4" : getSpeedColor(p1.speed);

            // 현재 세그먼트가 비어있으면 시작
            if (currentPath.length === 0) {
                currentPath.push(p1);
                currentColor = color;
                isInWatering = watering;
            }

            // 상태(급수여부, 색상)가 바뀌면 이전 세그먼트 끝내고 새로 시작
            // 단, 같은 급수 구간 내에서는 색상 변경 없음
            // 급수 구간이 아닐 때는 속도에 따라 색이 변함
            // 너무 빈번한 변경 방지를 위해 약간의 스무딩이 필요할 수 있지만 일단 리얼타임 반영.

            if (color !== currentColor) {
                currentPath.push(p1); // 연결점 추가
                segments.push({ path: [...currentPath], color: currentColor, isWatering: isInWatering });
                currentPath = [p1]; // 새로운 시작점은 연결점부터
                currentColor = color;
                isInWatering = watering;
            }

            currentPath.push(p2);
        }

        // 마지막 세그먼트 추가
        if (currentPath.length > 0) {
            segments.push({ path: currentPath, color: currentColor, isWatering: isInWatering });
        }

        return segments;
    }, [route, wateringSegments, isWatering, wateringStartIndex]);

    if (!isLoaded) return <div className="loading-container"><div className="loading-spinner"></div></div>;

    return (
        <div className="running-screen">
            {/* 1km 알림 (Splits 토스트) - 가장 최근 Split 3초간 표시 */}
            {splits.length > 0 && (Date.now() - (route[route.length - 1]?.timestamp || 0) < 5000) && (
                <div style={{
                    position: 'fixed', top: '100px', left: '50%', transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(0,0,0,0.8)', color: '#fff', padding: '10px 20px',
                    borderRadius: '20px', zIndex: 2000, display: 'flex', gap: '10px', alignItems: 'center'
                }}>
                    <span>🚩 {splits[splits.length - 1].km}km 달성!</span>
                    <span style={{ color: '#fbbf24' }}>{formatTime(splits[splits.length - 1].duration)}</span>
                </div>
            )}

            <div className="running-stats-panel">
                <div className="running-stat-card primary">
                    <div className="stat-label">거리</div>
                    <div className="stat-value-xl">{formatDistance(distance)}</div>
                </div>
                <div className="running-stats-grid">
                    <div className="running-stat-card">
                        <div className="stat-label">시간</div>
                        <div className="stat-value-lg">{formatTime(duration)}</div>
                    </div>
                    <div className="running-stat-card">
                        <div className="stat-label">속도</div>
                        <div className="stat-value-lg" style={{ color: getSpeedColor(speed) }}>{speed.toFixed(1)} km/h</div>
                    </div>
                    <div className="running-stat-card">
                        <div className="stat-label">페이스</div>
                        <div className="stat-value-lg">
                            {pace > 0 && pace < 100 ? pace.toFixed(1) : '0.0'}
                        </div>
                    </div>
                </div>
            </div>

            <div className="running-map">
                {currentPosition ? (
                    <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={currentPosition}
                        zoom={16}
                        onLoad={onLoad}
                        onUnmount={onUnmount}
                        options={mapOptions}
                        onClick={onMapClick}
                    >
                        {/* 계산된 세그먼트 렌더링 */}
                        {mapSegments.map((segment, idx) => {
                            // 급수 구간이면 하늘색으로 렌더링 (이전 요청사항 복구)
                            // if (segment.isWatering) return null; -> 제거됨

                            return (
                                <PolylineF
                                    key={idx}
                                    path={segment.path}
                                    options={{
                                        strokeColor: segment.color, // 급수 구간이면 이미 하늘색(#06b6d4)으로 설정됨
                                        strokeOpacity: 0.9,
                                        strokeWeight: 6,
                                    }}
                                />
                            );
                        })}

                        {/* 급수 아이콘 마커 */}
                        {window.google && wateringSegments.map((segment, idx) => (
                            segment.start < route.length && (
                                <MarkerF
                                    key={`water-start-${idx}`}
                                    position={route[segment.start]}
                                    icon={{
                                        path: window.google.maps.SymbolPath.CIRCLE,
                                        scale: 0, fillOpacity: 0, strokeWeight: 0
                                    }}
                                    label={{ text: "💧", fontSize: "24px" }}
                                />
                            )
                        ))}

                        {window.google && isWatering && wateringStartIndex !== null && wateringStartIndex < route.length && (
                            <MarkerF
                                position={route[wateringStartIndex]}
                                icon={{
                                    path: window.google.maps.SymbolPath.CIRCLE,
                                    scale: 0, fillOpacity: 0, strokeWeight: 0
                                }}
                                label={{
                                    text: "💧",
                                    fontSize: "28px",
                                    className: "pulsing-water-drop"
                                }}
                            />
                        )}

                        {route.length > 0 && window.google && (
                            <MarkerF
                                position={route[0]}
                                icon={{
                                    path: window.google.maps.SymbolPath.CIRCLE,
                                    scale: 5, fillColor: "#22c55e", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 3
                                }}
                            />
                        )}

                        {window.google && (
                            <MarkerF
                                position={currentPosition}
                                icon={{
                                    path: window.google.maps.SymbolPath.CIRCLE,
                                    scale: 8, fillColor: "#667eea", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 3
                                }}
                            />
                        )}
                    </GoogleMap>
                ) : (
                    <div className="loading-container"><div className="loading-spinner"></div></div>
                )}
            </div>

            {testMode && (
                <div style={{
                    position: 'fixed', bottom: '100px', left: '50%', transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(102, 126, 234, 0.95)', color: 'white', padding: '16px 24px',
                    borderRadius: '12px', fontSize: '14px', zIndex: 999
                }}>
                    🖱️ 맵을 클릭하여 위치 이동 (빠르게 클릭하면 가속!)
                </div>
            )}

            <button
                className="mode-toggle-button"
                onClick={() => setTestMode(!testMode)}
                style={{
                    position: 'fixed', top: '20px', right: '20px', padding: '12px 20px',
                    backgroundColor: testMode ? '#667eea' : '#22c55e', color: 'white', border: 'none',
                    borderRadius: '12px', zIndex: 1000
                }}
            >
                {testMode ? '🖱️ 테스트 모드' : '📍 GPS 모드'}
            </button>

            {!isWatering && (
                <button className="stop-button" onClick={handleStop}>
                    <div className="stop-button-inner"><span className="stop-icon">⏹️</span><span className="stop-text">종료</span></div>
                </button>
            )}

            {!isWatering && (
                <button
                    className="water-button"
                    onClick={handleWateringStart}
                    style={{
                        position: 'fixed', bottom: '30px', right: '140px', width: '80px', height: '80px',
                        borderRadius: '50%', backgroundColor: '#3b82f6', color: 'white', border: 'none',
                        fontSize: '32px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                >
                    💧
                </button>
            )}

            {isWatering && (
                <button
                    className="water-end-button"
                    onClick={handleWateringEnd}
                    style={{
                        position: 'fixed', bottom: '30px', right: '30px', width: '120px', height: '120px',
                        borderRadius: '50%', backgroundColor: '#3b82f6', color: 'white', border: '4px solid white',
                        fontSize: '16px', fontWeight: '700', cursor: 'pointer', zIndex: 1000,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        animation: 'pulse 2s infinite'
                    }}
                >
                    <span style={{ fontSize: '32px' }}>💧</span>
                    <span>급수 종료</span>
                </button>
            )}

            <style>{`
                @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
            `}</style>
        </div>
    );
}

export default RunningScreen;

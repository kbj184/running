import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, Marker, Polyline, useJsApiLoader } from '@react-google-maps/api';
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
};

function RunningScreen({ onStop, sessionId }) {
    // 서울 중심 좌표 (테스트용)
    const SEOUL_CENTER = { lat: 37.5665, lng: 126.9780 };

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        language: 'ko'
    });

    const [map, setMap] = useState(null);
    const [currentPosition, setCurrentPosition] = useState(null);
    const [route, setRoute] = useState([]);
    const [distance, setDistance] = useState(0); // km
    const [speed, setSpeed] = useState(0); // km/h
    const [pace, setPace] = useState(0); // min/km
    const [duration, setDuration] = useState(0); // seconds
    const [isTracking, setIsTracking] = useState(true);
    const [error, setError] = useState(null);
    const [testMode, setTestMode] = useState(true); // 테스트 모드 (기본값: true)

    const watchIdRef = useRef(null);
    const startTimeRef = useRef(Date.now());
    const lastPositionRef = useRef(null);
    const saveIntervalRef = useRef(null);

    // 최신 상태를 추적하기 위한 ref
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

    // 상태가 변경될 때마다 ref 업데이트
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

    // 지도 중심 업데이트
    useEffect(() => {
        if (map && currentPosition) {
            map.panTo(currentPosition);
        }
    }, [map, currentPosition]);

    // 테스트 모드일 때 초기 위치 설정
    useEffect(() => {
        if (testMode && !currentPosition) {
            setCurrentPosition(SEOUL_CENTER);
            console.log('🗺️ 초기 위치 설정:', SEOUL_CENTER);
        }
    }, [testMode]);

    // 마우스 클릭으로 위치 업데이트 (테스트용)
    const handleMapClick = (newPos) => {
        console.log('🖱️ 맵 클릭! 새 위치:', newPos);
        setCurrentPosition(newPos);

        // 경로에 추가
        setRoute(prev => [...prev, newPos]);

        // 거리 계산
        if (lastPositionRef.current) {
            const dist = calculateDistance(
                lastPositionRef.current.lat,
                lastPositionRef.current.lng,
                newPos.lat,
                newPos.lng
            );

            setDistance(prev => {
                const newDistance = prev + dist;

                // 속도 계산
                const currentDuration = (Date.now() - startTimeRef.current) / 1000;
                const newSpeed = calculateSpeed(newDistance, currentDuration);
                const newPace = calculatePace(newDistance, currentDuration);

                setSpeed(newSpeed);
                setPace(newPace);

                console.log('📊 업데이트된 통계:');
                console.log('   거리:', newDistance.toFixed(3), 'km');
                console.log('   속도:', newSpeed.toFixed(2), 'km/h');
                console.log('   페이스:', newPace.toFixed(2), 'min/km');

                return newDistance;
            });
        } else {
            // 첫 번째 클릭 (시작점)
            console.log('🟢 시작점 설정!');
        }

        lastPositionRef.current = newPos;
        setError(null);
    };

    const onMapClick = (e) => {
        if (!testMode) return;
        const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        handleMapClick(newPos);
    };

    useEffect(() => {
        // 러닝 시작 로그
        console.log('\n');
        console.log('🏃‍♂️ ═══════════════════════════════════════════════════════');
        console.log('🏃‍♂️ 러닝 시작!');
        console.log('🏃‍♂️ ═══════════════════════════════════════════════════════');
        console.log('🆔 세션 ID:', sessionId);
        console.log('🕐 시작 시간:', new Date(startTimeRef.current).toLocaleString('ko-KR'));
        console.log('🧪 모드:', testMode ? '테스트 모드 (맵 클릭으로 이동)' : 'GPS 모드');
        console.log('💾 저장 주기: 2초마다 자동 저장');
        console.log('🏃‍♂️ ═══════════════════════════════════════════════════════');

        if (testMode) {
            console.log('🖱️ 맵을 클릭하여 위치를 이동하세요!');
            console.log('🔄 GPS 모드로 전환하려면 "GPS 모드" 버튼을 클릭하세요.');
        }
        console.log('\n');

        // GPS 추적 시작 (테스트 모드가 아닐 때만)
        if (!testMode) {
            watchIdRef.current = watchPosition(
                (position) => {
                    const newPos = { lat: position.latitude, lng: position.longitude };
                    setCurrentPosition(newPos);

                    // 경로에 추가
                    setRoute(prev => [...prev, newPos]);

                    // 거리 계산
                    if (lastPositionRef.current) {
                        const dist = calculateDistance(
                            lastPositionRef.current.lat,
                            lastPositionRef.current.lng,
                            position.latitude,
                            position.longitude
                        );

                        setDistance(prev => {
                            const newDistance = prev + dist;

                            // 속도 계산
                            const currentDuration = (Date.now() - startTimeRef.current) / 1000;
                            const newSpeed = calculateSpeed(newDistance, currentDuration);
                            const newPace = calculatePace(newDistance, currentDuration);

                            setSpeed(newSpeed);
                            setPace(newPace);

                            return newDistance;
                        });
                    }

                    lastPositionRef.current = newPos;
                    setError(null);
                },
                (err) => {
                    console.error('❌ GPS Error:', err);
                    setError('GPS 위치를 가져올 수 없습니다. 위치 권한을 확인해주세요.');
                }
            );
        }

        // 시간 업데이트 타이머
        const durationInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
            setDuration(elapsed);
        }, 1000);

        // 2초마다 IndexedDB에 저장
        let saveCount = 0;
        saveIntervalRef.current = setInterval(async () => {
            const state = currentStateRef.current;
            if (state.currentPosition && state.distance > 0) {
                saveCount++;
                console.log(`\n💾 [저장 #${saveCount}] 2초 주기 자동 저장 시작...`);
                try {
                    const dataToSave = {
                        sessionId: sessionId,
                        timestamp: Date.now(),
                        position: state.currentPosition,
                        distance: state.distance,
                        speed: state.speed,
                        pace: state.pace,
                        duration: state.duration,
                        route: state.route
                    };

                    await saveRunningData(dataToSave);
                } catch (err) {
                    console.error('❌ 데이터 저장 실패:', err);
                }
            } else {
                console.log('⏳ GPS 위치 대기 중... (저장 건너뜀)');
            }
        }, 2000);

        // 클린업
        return () => {
            console.log('\n🛑 러닝 화면 종료 - GPS 추적 및 저장 중지\n');
            if (watchIdRef.current !== null) {
                clearWatch(watchIdRef.current);
            }
            clearInterval(durationInterval);
            if (saveIntervalRef.current) {
                clearInterval(saveIntervalRef.current);
            }
        };
    }, [sessionId, testMode]); // 의존성 배열 수정 - 무한 루프 방지

    const handleStop = async () => {
        console.log('\n');
        console.log('🛑 ═══════════════════════════════════════════════════════');
        console.log('🛑 러닝 종료 버튼 클릭!');
        console.log('🛑 ═══════════════════════════════════════════════════════');

        setIsTracking(false);

        // 마지막 데이터 저장
        const state = currentStateRef.current;
        if (state.currentPosition && state.distance > 0) {
            console.log('💾 최종 데이터 저장 중...\n');
            try {
                const finalData = {
                    sessionId: sessionId,
                    timestamp: Date.now(),
                    position: state.currentPosition,
                    distance: state.distance,
                    speed: state.speed,
                    pace: state.pace,
                    duration: state.duration,
                    route: state.route,
                    isComplete: true
                };

                await saveRunningData(finalData);

                console.log('\n✅ 최종 데이터 저장 완료!');
                console.log('📊 러닝 요약:');
                console.log('   📏 총 거리:', state.distance.toFixed(3), 'km');
                console.log('   ⏱️ 총 시간:', Math.floor(state.duration / 60), '분', state.duration % 60, '초');
                console.log('   🏃 평균 속도:', state.speed.toFixed(2), 'km/h');
                console.log('   ⚡ 평균 페이스:', state.pace.toFixed(2), 'min/km');
                console.log('   🗺️ 경로 포인트:', state.route.length, '개');
                console.log('🛑 ═══════════════════════════════════════════════════════\n');
            } catch (err) {
                console.error('❌ 최종 데이터 저장 실패:', err);
            }
        }

        // GPS 추적 중지
        if (watchIdRef.current !== null) {
            clearWatch(watchIdRef.current);
        }
        if (saveIntervalRef.current) {
            clearInterval(saveIntervalRef.current);
        }

        // 결과 화면으로 전환
        onStop({
            distance: state.distance,
            duration: state.duration,
            speed: state.speed,
            pace: state.pace,
            route: state.route,
            sessionId
        });
    };

    if (!isLoaded) return <div className="loading-container"><div className="loading-spinner"></div><div className="loading-text">Loading Map...</div></div>;

    return (
        <div className="running-screen">
            {/* 상단 통계 패널 */}
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
                        <div className="stat-value-lg">{speed.toFixed(1)} km/h</div>
                    </div>

                    <div className="running-stat-card">
                        <div className="stat-label">페이스</div>
                        <div className="stat-value-lg">
                            {pace > 0 && pace < 100 ? pace.toFixed(1) : '0.0'} min/km
                        </div>
                    </div>
                </div>
            </div>

            {/* 지도 */}
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
                        {/* 경로 표시 */}
                        {route.length > 1 && (
                            <Polyline
                                path={route}
                                options={{
                                    strokeColor: "#667eea",
                                    strokeOpacity: 0.8,
                                    strokeWeight: 5,
                                }}
                            />
                        )}

                        {/* 시작점 */}
                        {route.length > 0 && (
                            <Marker
                                position={route[0]}
                                icon={{
                                    path: google.maps.SymbolPath.CIRCLE,
                                    scale: 5,
                                    fillColor: "#22c55e",
                                    fillOpacity: 1,
                                    strokeColor: "#ffffff",
                                    strokeWeight: 3,
                                }}
                            />
                        )}

                        {/* 현재 위치 */}
                        <Marker
                            position={currentPosition}
                            icon={{
                                path: google.maps.SymbolPath.CIRCLE,
                                scale: 8,
                                fillColor: "#667eea",
                                fillOpacity: 1,
                                strokeColor: "#ffffff",
                                strokeWeight: 3,
                            }}
                        />
                    </GoogleMap>
                ) : (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <div className="loading-text">GPS 위치를 찾는 중...</div>
                    </div>
                )}
            </div>

            {/* 테스트 모드 안내 */}
            {testMode && (
                <div style={{
                    position: 'fixed',
                    bottom: '100px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(102, 126, 234, 0.95)',
                    color: 'white',
                    padding: '16px 24px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    zIndex: 999,
                    textAlign: 'center',
                    maxWidth: '90%'
                }}>
                    🖱️ 맵을 클릭하여 위치를 이동하세요!
                </div>
            )}

            {/* 에러 메시지 */}
            {error && (
                <div className="error-banner">
                    <span>⚠️</span>
                    <span>{error}</span>
                </div>
            )}

            {/* 모드 전환 버튼 */}
            <button
                className="mode-toggle-button"
                onClick={() => setTestMode(!testMode)}
                style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    padding: '12px 20px',
                    backgroundColor: testMode ? '#667eea' : '#22c55e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 1000,
                    transition: 'all 0.3s ease'
                }}
            >
                {testMode ? '🖱️ 테스트 모드' : '📍 GPS 모드'}
            </button>

            {/* 종료 버튼 */}
            <button className="stop-button" onClick={handleStop}>
                <div className="stop-button-inner">
                    <span className="stop-icon">⏹️</span>
                    <span className="stop-text">종료</span>
                </div>
            </button>
        </div>
    );
}

export default RunningScreen;

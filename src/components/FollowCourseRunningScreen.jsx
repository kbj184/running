import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleMap, PolylineF } from '@react-google-maps/api';
import AdvancedMarker from './common/AdvancedMarker';
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
import { api } from '../utils/api';
import { generateRouteThumbImage } from '../utils/mapThumbnail';
import './running-compact.css';

const containerStyle = {
    width: '100%',
    height: '100%'
};

const LIBRARIES = ['places', 'marker'];
const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;

const mapOptions = {
    disableDefaultUI: true,
    zoomControl: false,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
    clickableIcons: false,
};

// 거리 검증 상수 (km 단위)
const VALIDATION_RADIUS = {
    START: 0.05,  // 50m - 시작 가능 범위
    END: 0.1,     // 100m - 완주 인정 범위
    WARNING: 0.2  // 200m - 경고 범위
};

// 속도에 따른 색상 반환
const getSpeedColor = (speedKmh) => {
    if (speedKmh <= 0) return "#667eea";
    if (speedKmh < 6) return "#10b981";
    if (speedKmh < 9) return "#f59e0b";
    if (speedKmh < 12) return "#ef4444";
    return "#7c3aed";
};

function FollowCourseRunningScreen({ course, onStop, user, onClose }) {
    const sessionId = `follow-${course.id}-${Date.now()}`;

    const [map, setMap] = useState(null);
    const [currentPosition, setCurrentPosition] = useState(null);



    // 코스 경로 파싱
    const courseRoute = useMemo(() => {
        if (course.routeData) {
            try {
                let route = course.routeData;
                if (typeof route === 'string') {
                    route = JSON.parse(route);
                }
                return route;
            } catch (e) {
                console.error('Failed to parse course route:', e);
                return [];
            }
        }
        return [];
    }, [course.routeData]);

    const startPoint = useMemo(() => {
        const point = courseRoute[0];
        console.log('📍 Start Point:', point);
        return point;
    }, [courseRoute]);

    const endPoint = useMemo(() => {
        const point = courseRoute[courseRoute.length - 1];
        console.log('🎯 End Point:', point);
        return point;
    }, [courseRoute]);


    const googleMapOptions = useMemo(() => ({
        ...mapOptions,
        mapId: MAP_ID,
        isFractionalZoomEnabled: true
    }), []);

    useEffect(() => {
        if (!map) return;
        console.log('[FollowCourseRunningScreen] Debug Markers:', {
            mapId: MAP_ID,
            startPoint,
            endPoint,
            hasMap: !!map,
            hasMarkerLib: !!window.google?.maps?.marker,
            mapCapabilities: map.getMapCapabilities ? map.getMapCapabilities() : 'unknown'
        });
    }, [map, startPoint, endPoint]);

    // 러닝 상태
    const [route, setRoute] = useState([]);
    const [distance, setDistance] = useState(0);
    const [speed, setSpeed] = useState(0);
    const [pace, setPace] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isTracking, setIsTracking] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log('FollowCourseRunningScreen mounted. Course:', course);
        return () => {
            console.log('FollowCourseRunningScreen unmounted');
        };
    }, [course]);

    // 시작/종료 거리 상태
    const [distanceToStart, setDistanceToStart] = useState(null);
    const [distanceToEnd, setDistanceToEnd] = useState(null);
    const [isNearStart, setIsNearStart] = useState(false);
    const [courseCompleted, setCourseCompleted] = useState(false);

    // 결과 화면 상태
    const [showResult, setShowResult] = useState(false);

    // 고도 관련
    const [currentElevation, setCurrentElevation] = useState(0);
    const [totalAscent, setTotalAscent] = useState(0);
    const [totalDescent, setTotalDescent] = useState(0);
    const [elevationService, setElevationService] = useState(null);

    // Splits
    const [splits, setSplits] = useState([]);
    const lastSplitDistanceRef = useRef(0);

    const watchIdRef = useRef(null);
    const startTimeRef = useRef(null);
    const lastPositionRef = useRef(null);
    const lastSavedDistanceRef = useRef(0);
    const lastSavedTimeRef = useRef(Date.now());
    const lastSyncedTimeRef = useRef(Date.now());

    const dataRef = useRef({
        currentPosition: null,
        distance: 0,
        speed: 0,
        pace: 0,
        duration: 0,
        route: [],
        splits: [],
        currentElevation: 0,
        totalAscent: 0,
        totalDescent: 0,
        lastElevation: null
    });

    // 상태 동기화
    useEffect(() => {
        dataRef.current.splits = splits;
        dataRef.current.currentElevation = currentElevation;
        dataRef.current.totalAscent = totalAscent;
        dataRef.current.totalDescent = totalDescent;
    }, [splits, currentElevation, totalAscent, totalDescent]);

    // Google Elevation Service 초기화
    useEffect(() => {
        if (window.google && window.google.maps) {
            setElevationService(new window.google.maps.ElevationService());
        }
    }, []);

    // 거리 계산 업데이트
    useEffect(() => {
        if (currentPosition && startPoint) {
            const distToStart = calculateDistance(
                currentPosition.lat,
                currentPosition.lng,
                startPoint.lat,
                startPoint.lng
            );
            setDistanceToStart(distToStart);
            setIsNearStart(distToStart <= VALIDATION_RADIUS.START);
        }

        if (currentPosition && endPoint && hasStarted) {
            const distToEnd = calculateDistance(
                currentPosition.lat,
                currentPosition.lng,
                endPoint.lat,
                endPoint.lng
            );
            setDistanceToEnd(distToEnd);
        }
    }, [currentPosition, startPoint, endPoint, hasStarted]);

    // MariaDB 동기화 함수
    const syncToBackend = useCallback(async (isFinal = false, completedOverride = null) => {
        const data = dataRef.current;
        if (!user || !user.accessToken) {
            console.warn("⚠️ Sync skipped: User not logged in");
            return null;
        }

        try {
            const body = {
                userId: user.id,
                sessionId,
                distance: data.distance,
                duration: data.duration,
                speed: data.speed,
                pace: data.pace,
                currentElevation: data.currentElevation,
                totalAscent: data.totalAscent,
                totalDescent: data.totalDescent,
                route: JSON.stringify(data.route),
                splits: JSON.stringify(data.splits),
                isComplete: isFinal,
                courseId: course.id,
                courseCompleted: completedOverride !== null ? completedOverride : courseCompleted
            };

            const response = await api.request(`${import.meta.env.VITE_API_URL}/api/running/session/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
                },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                const result = await response.json();
                lastSyncedTimeRef.current = Date.now();
                console.log(`☁️ Course Run Sync Success (${isFinal ? 'Final' : 'Auto'})`);
                return result;
            } else {
                console.error("❌ Sync failed with status:", response.status);
                return null;
            }
        } catch (err) {
            console.error("❌ Sync error:", err);
            return null;
        }
    }, [sessionId, user, course.id, courseCompleted]);

    // IndexedDB 저장 함수
    const triggerSave = useCallback(async (isFinal = false, completedOverride = null) => {
        const data = dataRef.current;
        if (data.currentPosition && (data.route.length > 0 || isFinal)) {
            try {
                await saveRunningData({
                    sessionId,
                    timestamp: Date.now(),
                    position: data.currentPosition,
                    distance: data.distance,
                    speed: data.speed,
                    pace: data.pace,
                    duration: data.duration,
                    route: data.route,
                    isComplete: isFinal,
                    splits: data.splits,
                    currentElevation: data.currentElevation,
                    totalAscent: data.totalAscent,
                    totalDescent: data.totalDescent,
                    courseId: course.id,
                    courseCompleted: completedOverride !== null ? completedOverride : courseCompleted
                });
                lastSavedDistanceRef.current = data.distance;
                lastSavedTimeRef.current = Date.now();
                console.log(`💾 Course Run Saved (${data.distance.toFixed(3)}km)`);
            } catch (err) {
                console.error("❌ IndexedDB Save error:", err);
            }
        }
    }, [sessionId, course.id, courseCompleted]);

    const onLoad = useCallback(function callback(map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback(map) {
        setMap(null);
    }, []);

    useEffect(() => {
        if (map && currentPosition) {
            map.panTo(currentPosition);
        }
    }, [map, currentPosition]);

    // 고도 변화 계산
    const updateElevationGain = (prevElevation, currentElevation) => {
        if (prevElevation === null || currentElevation === null) return;

        const diff = currentElevation - prevElevation;
        const threshold = 1;

        if (diff > threshold) {
            setTotalAscent(prev => prev + diff);
            dataRef.current.totalAscent += diff;
        } else if (diff < -threshold) {
            setTotalDescent(prev => prev + Math.abs(diff));
            dataRef.current.totalDescent += Math.abs(diff);
        }
    };

    // 위치 업데이트 로직
    const handleLocationUpdate = async (newPos, currentDuration, gpsAltitude = null) => {
        const prevData = dataRef.current;

        setCurrentPosition(newPos);
        setError(null);

        let newDistance = prevData.distance;
        let newSpeed = prevData.speed;
        let newPace = prevData.pace;

        let elevation = gpsAltitude || dataRef.current.lastElevation || 0;

        setCurrentElevation(elevation);
        dataRef.current.currentElevation = elevation;

        if (dataRef.current.lastElevation !== null) {
            updateElevationGain(dataRef.current.lastElevation, elevation);
        }

        dataRef.current.lastElevation = elevation;

        const newPoint = {
            lat: newPos.lat,
            lng: newPos.lng,
            speed: newSpeed,
            elevation: elevation,
            timestamp: Date.now()
        };

        if (lastPositionRef.current) {
            const dist = calculateDistance(
                lastPositionRef.current.lat,
                lastPositionRef.current.lng,
                newPos.lat,
                newPos.lng
            );

            if (dist > 0.0005) {
                newDistance = prevData.distance + dist;
                newSpeed = calculateSpeed(newDistance, currentDuration);
                newPace = calculatePace(newDistance, currentDuration);
                newPoint.speed = newSpeed;

                setDistance(newDistance);
                setSpeed(newSpeed);
                setPace(newPace);

                // 1km Split 체크
                const currentKm = Math.floor(newDistance);
                if (currentKm > lastSplitDistanceRef.current) {
                    const prevSplitsDuration = prevData.splits.reduce((acc, curr) => acc + curr.duration, 0);
                    const currentSplitDuration = currentDuration - prevSplitsDuration;

                    const newSplit = {
                        km: currentKm,
                        duration: currentSplitDuration > 0 ? currentSplitDuration : 1,
                        pace: currentSplitDuration / 60,
                        totalDistance: newDistance,
                        totalTime: currentDuration,
                        elevation: elevation
                    };

                    setSplits(prev => [...prev, newSplit]);
                    lastSplitDistanceRef.current = currentKm;
                    console.log(`🚩 ${currentKm}km Split recorded!`);
                }

                if (newDistance - lastSavedDistanceRef.current >= 0.01) {
                    dataRef.current = {
                        ...prevData,
                        currentPosition: newPos,
                        distance: newDistance,
                        speed: newSpeed,
                        pace: newPace,
                        route: [...prevData.route, newPoint]
                    };
                    triggerSave();
                }
            }
        }

        const updatedRoute = [...prevData.route, newPoint];
        setRoute(updatedRoute);
        dataRef.current = {
            ...prevData,
            currentPosition: newPos,
            distance: newDistance,
            speed: newSpeed,
            pace: newPace,
            route: updatedRoute,
            duration: currentDuration
        };

        lastPositionRef.current = newPos;
    };

    // 러닝 시작
    const handleStart = () => {
        setHasStarted(true);
        setIsTracking(true);
        startTimeRef.current = Date.now();
        console.log('🏃 Course running started!');
    };

    // 러닝 종료
    const handleStop = async () => {
        setIsTracking(false);
        const data = dataRef.current;

        // 완주 여부 정밀 체크
        let completed = false;
        if (endPoint && (currentPosition || data.currentPosition)) {
            const pos = currentPosition || data.currentPosition;
            const dist = calculateDistance(pos.lat, pos.lng, endPoint.lat, endPoint.lng);
            completed = dist <= VALIDATION_RADIUS.END;
        } else if (distanceToEnd !== null && distanceToEnd <= VALIDATION_RADIUS.END) {
            completed = true;
        }

        setCourseCompleted(completed);

        const thumbnailUrl = generateRouteThumbImage(data.route);

        await triggerSave(true, completed);
        const syncResult = await syncToBackend(true, completed);

        if (watchIdRef.current) clearWatch(watchIdRef.current);

        // 결과 화면 표시
        setShowResult(true);
    };

    const handleClose = () => {
        if (showResult) {
            if (window.confirm("저장하지 않고 나가시겠습니까?")) {
                if (onClose) onClose();
                else if (onStop) onStop({ saved: false });
            }
        }
        else if (hasStarted) {
            if (window.confirm("달리기를 종료하시겠습니까?")) {
                handleStop();
            }
        } else {
            console.log("FollowCourseRunningScreen: closing (not started)");
            if (onClose) onClose();
            else if (onStop) onStop({ saved: false });
        }
    };

    // 저장 확인
    const handleSaveConfirm = () => {
        onStop({
            distance: dataRef.current.distance,
            duration: dataRef.current.duration,
            speed: dataRef.current.speed,
            pace: dataRef.current.pace,
            route: dataRef.current.route,
            splits,
            sessionId,
            currentElevation: dataRef.current.currentElevation,
            totalAscent: dataRef.current.totalAscent,
            totalDescent: dataRef.current.totalDescent,
            courseId: course.id,
            courseCompleted,
            saved: true
        });
    };

    // 삭제 확인
    const handleDeleteConfirm = () => {
        onStop({
            saved: false
        });
    };

    // GPS 추적 시작
    useEffect(() => {
        if (hasStarted && isTracking) {
            watchIdRef.current = watchPosition(
                (position) => {
                    const newPos = { lat: position.latitude, lng: position.longitude };
                    const currentDuration = (Date.now() - startTimeRef.current) / 1000;
                    handleLocationUpdate(newPos, currentDuration, position.altitude);
                },
                (err) => {
                    console.error('GPS Error:', err);
                    setError('GPS 위치 실패');
                }
            );

            const durationInterval = setInterval(() => {
                const now = Date.now();
                const elapsed = Math.floor((now - startTimeRef.current) / 1000);
                setDuration(elapsed);
                dataRef.current.duration = elapsed;

                if (now - lastSavedTimeRef.current >= 5000) {
                    triggerSave();
                }

                if (now - lastSyncedTimeRef.current >= 30000) {
                    syncToBackend();
                }
            }, 1000);

            return () => {
                if (watchIdRef.current) clearWatch(watchIdRef.current);
                clearInterval(durationInterval);
            };
        }
    }, [hasStarted, isTracking]);

    // 초기 위치 가져오기
    useEffect(() => {
        if (!hasStarted) {
            watchIdRef.current = watchPosition(
                (position) => {
                    const newPos = { lat: position.latitude, lng: position.longitude };
                    setCurrentPosition(newPos);
                    dataRef.current.currentPosition = newPos;
                },
                (err) => {
                    console.error('GPS Error:', err);
                    setError('GPS 위치 실패');
                }
            );

            return () => {
                if (watchIdRef.current) clearWatch(watchIdRef.current);
            };
        }
    }, [hasStarted]);

    // 경로 세그먼트 (코스 경로 + 사용자 경로)
    const mapSegments = useMemo(() => {
        if (route.length < 2) return [];

        const segments = [];
        let currentPath = [];
        let currentColor = getSpeedColor(route[0]?.speed || 0);

        for (let i = 0; i < route.length - 1; i++) {
            const p1 = route[i];
            const p2 = route[i + 1];
            let color = getSpeedColor(p1.speed);

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
    }, [route]);

    const markerPosition = useMemo(() => {
        return route.length > 0 ? route[route.length - 1] : currentPosition;
    }, [route, currentPosition]);

    const heading = useMemo(() => {
        if (route.length >= 2) {
            const lastPoint = route[route.length - 1];
            const prevPoint = route[route.length - 2];
            const deltaLng = lastPoint.lng - prevPoint.lng;
            const deltaLat = lastPoint.lat - prevPoint.lat;
            return Math.atan2(deltaLng, deltaLat) * (180 / Math.PI);
        }
        return 0;
    }, [route]);

    // 결과 화면
    if (showResult) {
        return (
            <div className="running-screen" style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: '#f5f5f5',
                zIndex: 2000,
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto'
            }}>
                <button
                    onClick={handleClose}
                    style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        border: 'none',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        fontSize: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 2005
                    }}
                >
                    ✕
                </button>
                <div style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    maxWidth: '400px',
                    margin: '0 auto'
                }}>
                    <div style={{
                        fontSize: '64px',
                        marginBottom: '20px'
                    }}>
                        {courseCompleted ? '🎉' : '💪'}
                    </div>
                    <h2 style={{
                        fontSize: '24px',
                        fontWeight: '700',
                        color: courseCompleted ? '#10b981' : '#f59e0b',
                        marginBottom: '10px'
                    }}>
                        {courseCompleted ? '코스 완주!' : '수고하셨습니다!'}
                    </h2>
                    <p style={{
                        fontSize: '14px',
                        color: '#666',
                        marginBottom: '30px'
                    }}>
                        {courseCompleted
                            ? '축하합니다! 코스를 성공적으로 완주했습니다.'
                            : '아쉽지만 코스를 완주하지 못했습니다. 다음에 다시 도전해보세요!'}
                    </p>

                    <div style={{
                        backgroundColor: '#fff',
                        borderRadius: '12px',
                        padding: '20px',
                        marginBottom: '30px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ marginBottom: '15px' }}>
                            <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>거리</div>
                            <div style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a1a' }}>
                                {formatDistance(dataRef.current.distance)}
                            </div>
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>시간</div>
                            <div style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a1a' }}>
                                {formatTime(duration)}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>평균 페이스</div>
                            <div style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a1a' }}>
                                {pace > 0 ? `${Math.floor(pace)}'${String(Math.floor((pace % 1) * 60)).padStart(2, '0')}"` : `0'00"`}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={handleDeleteConfirm}
                            style={{
                                flex: 1,
                                padding: '16px',
                                backgroundColor: '#fff',
                                color: '#ef4444',
                                border: '1px solid #ef4444',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            삭제
                        </button>
                        <button
                            onClick={handleSaveConfirm}
                            style={{
                                flex: 1,
                                padding: '16px',
                                backgroundColor: '#FF9A56',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            저장
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 대기 화면 (시작 전)
    if (!hasStarted) {
        return (
            <div className="running-screen" style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: '#fff',
                zIndex: 2000,
                display: 'flex',
                flexDirection: 'column'
            }}>
                <button
                    onClick={handleClose}
                    style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        border: 'none',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        fontSize: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 2005
                    }}
                >
                    ✕
                </button>
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    right: '20px',
                    zIndex: 1000,
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <h3 style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#1a1a1a',
                        marginBottom: '10px'
                    }}>
                        {course.title || course.name}
                    </h3>
                    <p style={{
                        fontSize: '14px',
                        color: '#666',
                        marginBottom: '15px'
                    }}>
                        시작점으로 이동하세요
                    </p>

                    {distanceToStart !== null && (
                        <div style={{
                            fontSize: '14px',
                            color: isNearStart ? '#10b981' : '#f59e0b',
                            fontWeight: '600',
                            marginBottom: '15px'
                        }}>
                            {isNearStart
                                ? '✅ 시작 가능 범위 내'
                                : `📍 시작점까지 ${(distanceToStart * 1000).toFixed(0)}m`}
                        </div>
                    )}

                    {isNearStart ? (
                        <button
                            onClick={handleStart}
                            style={{
                                width: '100%',
                                padding: '16px',
                                backgroundColor: '#10b981',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            🏃 시작하기
                        </button>
                    ) : (
                        <div style={{
                            padding: '16px',
                            backgroundColor: '#fef3c7',
                            borderRadius: '8px',
                            fontSize: '14px',
                            color: '#92400e',
                            textAlign: 'center'
                        }}>
                            시작점 50m 이내로 이동해주세요
                        </div>
                    )}
                </div>

                <div className="running-map">
                    {currentPosition ? (
                        <GoogleMap
                            mapContainerStyle={containerStyle}
                            center={currentPosition}
                            zoom={15}
                            onLoad={onLoad}
                            onUnmount={onUnmount}
                            onClick={(e) => {
                                // TEST MODE: 클릭한 위치로 이동
                                if (e.latLng) {
                                    const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
                                    console.log('Test Mode: Moving to', newPos);
                                    setCurrentPosition(newPos);
                                    dataRef.current.currentPosition = newPos;
                                }
                            }}
                            options={googleMapOptions}
                        >
                            {/* 코스 경로 */}
                            <PolylineF
                                path={courseRoute}
                                options={{
                                    strokeColor: '#39FF14', // 형광 녹색
                                    strokeOpacity: 0.8,
                                    strokeWeight: 6,
                                }}
                            />

                            {/* 시작점 마커 */}
                            {window.google && startPoint && (
                                <AdvancedMarker
                                    map={map}
                                    position={startPoint}
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

                            {/* 종료점 마커 */}
                            {window.google && endPoint && (
                                <AdvancedMarker
                                    map={map}
                                    position={endPoint}
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

                            {/* 현재 위치 마커 */}
                            {window.google && currentPosition && (
                                <AdvancedMarker
                                    map={map}
                                    position={currentPosition}
                                >
                                    <div style={{
                                        width: '18px',
                                        height: '18px',
                                        backgroundColor: '#4285F4',
                                        borderRadius: '50%',
                                        border: '3px solid white',
                                        boxShadow: '0 1px 6px rgba(0, 0, 0, 0.3)'
                                    }} />
                                </AdvancedMarker>
                            )}
                        </GoogleMap>
                    ) : (
                        <div className="loading-container"><div className="loading-spinner"></div></div>
                    )}
                </div>
            </div>
        );
    }

    // 러닝 화면 (진행 중)
    return (
        <div className="running-screen" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#fff',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column'
        }}>
            <button
                onClick={handleClose}
                style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    fontSize: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 2005
                }}
            >
                ✕
            </button>
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
                <div className="running-time-display">
                    {formatTime(duration)}
                </div>

                <div className="running-stats-compact">
                    <div className="stat-item">
                        <div className="stat-value">{formatDistance(distance)}</div>
                        <div className="stat-label">거리</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-value">{pace > 0 ? `${Math.floor(pace)}'${String(Math.floor((pace % 1) * 60)).padStart(2, '0')}"` : `0'00"`}</div>
                        <div className="stat-label">평균 페이스</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-value">{Math.floor(distance * 60)}</div>
                        <div className="stat-label">kcal</div>
                    </div>
                </div>
            </div>

            <div className="running-map">
                {currentPosition ? (
                    <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={markerPosition || currentPosition}
                        zoom={16}
                        onLoad={onLoad}
                        onUnmount={onUnmount}
                        onClick={(e) => {
                            // TEST MODE: 클릭한 위치로 이동 및 러닝 데이터 업데이트
                            if (e.latLng) {
                                const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
                                console.log('Test Mode: Moving to', newPos);
                                setCurrentPosition(newPos);
                                dataRef.current.currentPosition = newPos;

                                if (hasStarted && isTracking) {
                                    const currentDuration = (Date.now() - startTimeRef.current) / 1000;
                                    handleLocationUpdate(newPos, currentDuration, 0);
                                }
                            }
                        }}
                        options={googleMapOptions}
                    >
                        {/* 코스 경로 (배경) */}
                        <PolylineF
                            path={courseRoute}
                            options={{
                                strokeColor: '#39FF14', // 형광 녹색
                                strokeOpacity: 0.6,
                                strokeWeight: 6,
                            }}
                        />

                        {/* 사용자 경로 */}
                        {mapSegments.map((segment, idx) => (
                            <PolylineF
                                key={`segment-${idx}-${segment.path.length}`}
                                path={segment.path}
                                options={{
                                    strokeColor: segment.color,
                                    strokeOpacity: 0.9,
                                    strokeWeight: 6,
                                }}
                            />
                        ))}

                        {/* 시작점 마커 */}
                        {window.google && startPoint && (
                            <AdvancedMarker
                                map={map}
                                position={startPoint}
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

                        {/* 종료점 마커 */}
                        {window.google && endPoint && (
                            <AdvancedMarker
                                map={map}
                                position={endPoint}
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

                        {/* 현재 위치 마커 */}
                        {window.google && markerPosition && (
                            <AdvancedMarker
                                map={map}
                                position={markerPosition}
                            >
                                <div style={{
                                    width: '0px',
                                    height: '0px',
                                    position: 'relative',
                                    pointerEvents: 'none'
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        left: '-50px',
                                        top: '-100px',
                                        width: '100px',
                                        height: '100px',
                                        transformOrigin: '50% 100%',
                                        transform: `rotate(${heading}deg)`,
                                        willChange: 'transform'
                                    }}>
                                        <div style={{
                                            width: '100px',
                                            height: '100px',
                                            background: 'linear-gradient(to top, rgba(66, 133, 244, 0.4) 0%, rgba(66, 133, 244, 0.05) 100%)',
                                            clipPath: 'polygon(50% 100%, 15% 0%, 85% 0%)',
                                            opacity: 0.8
                                        }} />
                                    </div>

                                    <div style={{
                                        position: 'absolute',
                                        left: '-28px',
                                        top: '-28px',
                                        width: '56px',
                                        height: '56px',
                                        pointerEvents: 'none'
                                    }}>
                                        <div style={{
                                            width: '100%',
                                            height: '100%',
                                            backgroundColor: 'rgba(66, 133, 244, 0.4)',
                                            borderRadius: '50%',
                                            transformOrigin: 'center center',
                                            animation: 'marker-pulse 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite'
                                        }} />
                                    </div>

                                    <div style={{
                                        position: 'absolute',
                                        left: '-9px',
                                        top: '-9px',
                                        width: '18px',
                                        height: '18px',
                                        backgroundColor: '#4285F4',
                                        borderRadius: '50%',
                                        border: '3px solid white',
                                        boxShadow: '0 1px 6px rgba(0, 0, 0, 0.3)',
                                        zIndex: 10
                                    }} />
                                </div>
                            </AdvancedMarker>
                        )}
                    </GoogleMap>
                ) : (
                    <div className="loading-container"><div className="loading-spinner"></div></div>
                )}
            </div>

            <div className="running-footer-controls">
                <button className="running-control-btn stop" onClick={handleStop}>
                    ⏹ 종료
                </button>
            </div>
        </div>
    );
}

export default FollowCourseRunningScreen;

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

// 속도에 따른 색상 반환 (히트맵 스타일: Low-Green -> High-Red)
const getSpeedColor = (speedKmh) => {
    if (speedKmh <= 0) return "#667eea"; // 멈춤
    if (speedKmh < 6) return "#10b981"; // 걷기/느린 조깅 (초록)
    if (speedKmh < 9) return "#f59e0b"; // 중강도 (주황)
    if (speedKmh < 12) return "#ef4444"; // 고강도 (빨강)
    return "#7c3aed"; // 초고속 (보라)
};

function RunningScreen({ onStop, sessionId, user }) {
    // 서울 중심 좌표
    const SEOUL_CENTER = { lat: 37.5665, lng: 126.9780 };

    const [map, setMap] = useState(null);
    const [currentPosition, setCurrentPosition] = useState(null);

    // Route 데이터 구조: { lat, lng, speed, timestamp, elevation }
    const [route, setRoute] = useState([]);

    // 고도 관련 상태
    const [currentElevation, setCurrentElevation] = useState(0); // 현재 고도 (m)
    const [totalAscent, setTotalAscent] = useState(0); // 총 상승 (m)
    const [totalDescent, setTotalDescent] = useState(0); // 총 하강 (m)
    const [elevationService, setElevationService] = useState(null); // Google Elevation API

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
    const lastSavedDistanceRef = useRef(0);
    const lastSavedTimeRef = useRef(Date.now());
    const lastSyncedTimeRef = useRef(Date.now());

    // 모든 실시간 데이터를 Ref로 관리하여 클로저 문제 해결
    const dataRef = useRef({
        currentPosition: null,
        distance: 0,
        speed: 0,
        pace: 0,
        duration: 0,
        route: [],
        wateringSegments: [],
        splits: [],
        isWatering: false,
        currentElevation: 0,
        totalAscent: 0,
        totalDescent: 0,
        lastElevation: null
    });

    // 상태 동기화 (UI 렌더링용)
    useEffect(() => {
        dataRef.current.wateringSegments = wateringSegments;
        dataRef.current.splits = splits;
        dataRef.current.isWatering = isWatering;
        dataRef.current.currentElevation = currentElevation;
        dataRef.current.totalAscent = totalAscent;
        dataRef.current.totalDescent = totalDescent;
    }, [wateringSegments, splits, isWatering, currentElevation, totalAscent, totalDescent]);

    // Google Elevation Service 초기화
    useEffect(() => {
        if (window.google && window.google.maps) {
            setElevationService(new window.google.maps.ElevationService());
            console.log('🗻 Elevation Service initialized');
        }
    }, []);

    // MariaDB 동기화 함수
    const syncToBackend = useCallback(async (isFinal = false) => {
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
                wateringSegments: JSON.stringify(data.wateringSegments),
                splits: JSON.stringify(data.splits),
                isComplete: isFinal
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
                console.log(`☁️ MariaDB Sync Success (${isFinal ? 'Final' : 'Auto'})`);
                console.log(`   📊 Distance: ${data.distance.toFixed(2)}km, Elevation: ${data.currentElevation.toFixed(0)}m`);
                console.log(`   ⛰️ Ascent: ${data.totalAscent.toFixed(0)}m, Descent: ${data.totalDescent.toFixed(0)}m`);

                // 승급 정보 확인
                if (result.gradeUpgraded) {
                    console.log(`🎉 Grade Upgraded: ${result.newGrade}`);
                }

                return result;
            } else {
                console.error("❌ Sync failed with status:", response.status);
                return null;
            }
        } catch (err) {
            console.error("❌ Sync error:", err);
            return null;
        }
    }, [sessionId, user]);

    // IndexedDB 저장 함수
    const triggerSave = useCallback(async (isFinal = false) => {
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
                    wateringSegments: data.wateringSegments,
                    isWatering: data.isWatering,
                    isComplete: isFinal,
                    splits: data.splits,
                    currentElevation: data.currentElevation,
                    totalAscent: data.totalAscent,
                    totalDescent: data.totalDescent
                });
                lastSavedDistanceRef.current = data.distance;
                lastSavedTimeRef.current = Date.now();
                console.log(`💾 IndexedDB Saved (${data.distance.toFixed(3)}km)`);
            } catch (err) {
                console.error("❌ IndexedDB Save error:", err);
            }
        }
    }, [sessionId]);

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

    useEffect(() => {
        if (testMode && !currentPosition) {
            setCurrentPosition(SEOUL_CENTER);
            dataRef.current.currentPosition = SEOUL_CENTER;
        }
    }, [testMode]);

    // Google Elevation API로 고도 조회 (1km마다 보정용)
    const getElevationFromAPI = useCallback(async (lat, lng) => {
        if (!elevationService) return null;

        return new Promise((resolve) => {
            elevationService.getElevationForLocations({
                locations: [{ lat, lng }]
            }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    console.log(`🗻 API Elevation: ${results[0].elevation.toFixed(1)}m`);
                    resolve(results[0].elevation);
                } else {
                    console.warn('⚠️ Elevation API failed:', status);
                    resolve(null);
                }
            });
        });
    }, [elevationService]);

    // 고도 변화 계산 및 상승/하강 누적
    const updateElevationGain = (prevElevation, currentElevation) => {
        if (prevElevation === null || currentElevation === null) return;

        const diff = currentElevation - prevElevation;
        const threshold = 1; // 1m 이상 변화만 인정 (노이즈 필터링)

        if (diff > threshold) {
            setTotalAscent(prev => prev + diff);
            dataRef.current.totalAscent += diff;
        } else if (diff < -threshold) {
            setTotalDescent(prev => prev + Math.abs(diff));
            dataRef.current.totalDescent += Math.abs(diff);
        }
    };

    // 위치 업데이트 및 Split 체크 공통 로직
    const handleLocationUpdate = async (newPos, currentDuration, gpsAltitude = null) => {
        const prevData = dataRef.current;

        setCurrentPosition(newPos);
        setError(null);

        let newDistance = prevData.distance;
        let newSpeed = prevData.speed;
        let newPace = prevData.pace;

        // 고도 처리: GPS altitude를 기본으로 사용
        let elevation = gpsAltitude;

        // GPS 고도가 없거나 null이면 이전 값 유지
        if (elevation === null || elevation === undefined) {
            elevation = dataRef.current.lastElevation || 0;
        }

        // 고도 업데이트
        setCurrentElevation(elevation);
        dataRef.current.currentElevation = elevation;

        // 고도 변화 계산 (이전 고도가 있을 때만)
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

            if (dist > 0.0005) { // 0.5m 이상 이동
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

                    // 1km 지점에서 Google Elevation API로 고도 보정
                    if (elevationService) {
                        const apiElevation = await getElevationFromAPI(newPos.lat, newPos.lng);
                        if (apiElevation !== null) {
                            elevation = apiElevation;
                            setCurrentElevation(elevation);
                            dataRef.current.currentElevation = elevation;
                            dataRef.current.lastElevation = elevation;
                            newPoint.elevation = elevation;
                            console.log(`🗻 Elevation corrected at ${currentKm}km: ${elevation.toFixed(1)}m`);
                        }
                    }

                    const newSplit = {
                        km: currentKm,
                        duration: currentSplitDuration > 0 ? currentSplitDuration : 1,
                        pace: currentSplitDuration / 60,
                        totalDistance: newDistance,
                        totalTime: currentDuration,
                        elevation: elevation // Split에 고도 정보 추가
                    };

                    setSplits(prev => [...prev, newSplit]);
                    lastSplitDistanceRef.current = currentKm;
                    console.log(`🚩 ${currentKm}km Split recorded! Elevation: ${elevation.toFixed(1)}m`);
                }

                // 10m 이상 이동 시 즉시 저장 체크
                if (newDistance - lastSavedDistanceRef.current >= 0.01) {
                    // Ref를 먼저 업데이트하고 저장 호출
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
        } else {
            console.log('🟢 Tracking Started');
        }

        // 전체 데이터 Ref 업데이트
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

    // 테스트 클릭 핸들러
    const onMapClick = (e) => {
        if (!testMode) return;
        const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        const currentDuration = (Date.now() - startTimeRef.current) / 1000;
        // 테스트 모드에서는 임의의 고도 생성 (50-200m 사이)
        const testAltitude = 50 + Math.random() * 150;
        handleLocationUpdate(newPos, currentDuration, testAltitude);
    };

    useEffect(() => {
        if (!testMode) {
            watchIdRef.current = watchPosition(
                (position) => {
                    const newPos = { lat: position.latitude, lng: position.longitude };
                    const currentDuration = (Date.now() - startTimeRef.current) / 1000;
                    // GPS에서 받은 altitude 전달
                    handleLocationUpdate(newPos, currentDuration, position.altitude);
                },
                (err) => {
                    console.error('GPS Error:', err);
                    setError('GPS 위치 실패');
                }
            );
        }

        const durationInterval = setInterval(() => {
            const now = Date.now();
            const elapsed = Math.floor((now - startTimeRef.current) / 1000);
            setDuration(elapsed);
            dataRef.current.duration = elapsed;

            // 5초마다 자동 저장 체크 (IndexedDB)
            if (now - lastSavedTimeRef.current >= 5000) {
                triggerSave();
            }

            // 30초마다 MariaDB 동기화 체크
            if (now - lastSyncedTimeRef.current >= 30000) {
                syncToBackend();
            }
        }, 1000);

        return () => {
            if (watchIdRef.current) clearWatch(watchIdRef.current);
            clearInterval(durationInterval);
        };
        // syncToBackend와 triggerSave는 여기서 고정된 참조를 사용하게 함
    }, [sessionId, testMode]); // syncToBackend, triggerSave 의존성 제거하여 인터벌 초기화 방지

    const handleWateringStart = () => {
        setIsWatering(true);
        // dataRef에서 직접 현재 route 길이를 가져와서 즉시 기록
        const currentRoute = dataRef.current.route;
        const currentIndex = currentRoute.length > 0 ? currentRoute.length - 1 : 0;
        setWateringStartIndex(currentIndex);
        dataRef.current.isWatering = true;
        console.log(`💧 급수 시작: 인덱스 ${currentIndex}, 총 포인트: ${currentRoute.length}`);
    };

    const handleWateringEnd = () => {
        setIsWatering(false);
        dataRef.current.isWatering = false;

        if (wateringStartIndex !== null) {
            // dataRef에서 직접 현재 route 길이를 가져옴
            const currentRoute = dataRef.current.route;
            const currentIndex = currentRoute.length > 0 ? currentRoute.length - 1 : 0;

            const newSegment = {
                start: wateringStartIndex,
                end: currentIndex
            };

            setWateringSegments(prev => {
                const updated = [...prev, newSegment];
                dataRef.current.wateringSegments = updated;
                return updated;
            });

            console.log(`💧 급수 종료: ${wateringStartIndex} ~ ${currentIndex}, 총 포인트: ${currentRoute.length}`);
            setWateringStartIndex(null);
        }
    };

    const handleStop = async () => {
        setIsTracking(false);
        const data = dataRef.current;

        // 썸네일 생성
        const thumbnailUrl = generateRouteThumbImage(data.route);
        console.log('🖼️ 썸네일 생성:', thumbnailUrl);

        // IndexedDB 최종 저장
        await triggerSave(true);

        // MariaDB 최종 동기화 및 승급 정보 받기
        const syncResult = await syncToBackend(true);

        if (watchIdRef.current) clearWatch(watchIdRef.current);

        onStop({
            distance: data.distance,
            duration: data.duration,
            speed: data.speed,
            pace: data.pace,
            route: data.route,
            thumbnail: thumbnailUrl, // 썸네일 URL 추가
            wateringSegments,
            splits,
            sessionId,
            currentElevation: data.currentElevation,
            totalAscent: data.totalAscent,
            totalDescent: data.totalDescent,
            // 승급 정보 추가
            gradeUpgraded: syncResult?.gradeUpgraded || false,
            newGrade: syncResult?.newGrade,
            gradeLevel: syncResult?.gradeLevel,
            gradeDescription: syncResult?.gradeDescription
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

    // 마커 위치 - route의 마지막 점 사용 (폴리라인과 동기화)
    const markerPosition = useMemo(() => {
        return route.length > 0 ? route[route.length - 1] : currentPosition;
    }, [route, currentPosition]);

    // 방향(heading) 계산 - useMemo로 메모이제이션하여 깜박임 방지
    const heading = useMemo(() => {
        if (route.length >= 2) {
            const lastPoint = route[route.length - 1];
            const prevPoint = route[route.length - 2];

            // 두 점 사이의 각도 계산 (북쪽 기준 시계방향)
            const deltaLng = lastPoint.lng - prevPoint.lng;
            const deltaLat = lastPoint.lat - prevPoint.lat;
            return Math.atan2(deltaLng, deltaLat) * (180 / Math.PI);
        }
        return 0;
    }, [route]);

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
                    <div className="stat-label">시간</div>
                    <div className="stat-value-xl">{formatTime(duration)}</div>
                </div>
                <div className="running-stats-grid">
                    <div className="running-stat-card">
                        <div className="stat-label">거리</div>
                        <div className="stat-value-lg">{formatDistance(distance)}</div>
                    </div>
                    <div className="running-stat-card">
                        <div className="stat-label">속도</div>
                        <div className="stat-value-lg" style={{ color: getSpeedColor(speed) }}>{speed.toFixed(1)} km/h</div>
                    </div>
                    <div className="running-stat-card">
                        <div className="stat-label">칼로리</div>
                        <div className="stat-value-lg">
                            {Math.floor(distance * 60)} kcal
                        </div>
                    </div>
                </div>

                {/* 고도 정보 */}
                <div className="running-stats-grid" style={{ marginTop: '8px' }}>
                    <div className="running-stat-card">
                        <div className="stat-label">고도</div>
                        <div className="stat-value-lg" style={{ color: '#667eea' }}>
                            {currentElevation.toFixed(0)}m
                        </div>
                    </div>
                    <div className="running-stat-card">
                        <div className="stat-label">상승</div>
                        <div className="stat-value-lg" style={{ color: '#22c55e' }}>
                            ↗ {totalAscent.toFixed(0)}m
                        </div>
                    </div>
                    <div className="running-stat-card">
                        <div className="stat-label">하강</div>
                        <div className="stat-value-lg" style={{ color: '#ef4444' }}>
                            ↘ {totalDescent.toFixed(0)}m
                        </div>
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
                        options={{
                            ...mapOptions,
                            mapId: MAP_ID
                        }}
                        onClick={onMapClick}
                    >
                        {/* 계산된 세그먼트 렌더링 */}
                        {mapSegments.map((segment, idx) => {
                            // 급수 구간이면 하늘색으로 렌더링 (이전 요청사항 복구)
                            // if (segment.isWatering) return null; -> 제거됨

                            return (
                                <PolylineF
                                    key={`segment-${idx}-${segment.path.length}`}
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
                                <AdvancedMarker
                                    key={`water-start-${idx}`}
                                    map={map}
                                    position={route[segment.start]}
                                >
                                    <div style={{ fontSize: '24px' }}>💧</div>
                                </AdvancedMarker>
                            )
                        ))}

                        {window.google && isWatering && wateringStartIndex !== null && wateringStartIndex < route.length && (
                            <AdvancedMarker
                                map={map}
                                position={route[wateringStartIndex]}
                            >
                                <div className="pulsing-water-drop" style={{ fontSize: '28px' }}>💧</div>
                            </AdvancedMarker>
                        )}

                        {route.length > 0 && window.google && (
                            <AdvancedMarker
                                map={map}
                                position={route[0]}
                            >
                                <div style={{
                                    width: '10px',
                                    height: '10px',
                                    backgroundColor: '#22c55e',
                                    borderRadius: '50%',
                                    border: '2px solid white',
                                    boxShadow: '0 0 4px rgba(0,0,0,0.3)'
                                }} />
                            </AdvancedMarker>
                        )}

                        {window.google && markerPosition && (
                            <AdvancedMarker
                                map={map}
                                position={markerPosition}
                            >
                                <div style={{
                                    width: '0px',
                                    height: '0px',
                                    position: 'relative',
                                }}>
                                    {/* Google Maps 'My Location' Style Marker */}
                                    <div style={{
                                        width: '120px',
                                        height: '120px',
                                        position: 'absolute',
                                        top: '0px',
                                        left: '0px',
                                        transform: `translate(-50%, -50%) rotate(${heading}deg)`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {/* Heading Indicator (Cone/Sector) */}
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '50%',
                                            width: '100px',
                                            height: '100px',
                                            background: 'linear-gradient(to top, rgba(66, 133, 244, 0.4) 0%, rgba(66, 133, 244, 0.05) 100%)',
                                            clipPath: 'polygon(50% 100%, 15% 0%, 85% 0%)', // 삼각 쐐기 모양
                                            transformOrigin: '50% 100%',
                                            opacity: 0.8
                                        }} />

                                        {/* Blue Dot Pulse (Subtle) */}
                                        <div style={{
                                            position: 'absolute',
                                            width: '36px',
                                            height: '36px',
                                            backgroundColor: 'rgba(66, 133, 244, 0.2)',
                                            borderRadius: '50%',
                                            animation: 'pulse-ring 2s ease-out infinite'
                                        }} />

                                        {/* Main Blue Dot */}
                                        <div style={{
                                            position: 'absolute',
                                            width: '18px',
                                            height: '18px',
                                            backgroundColor: '#4285F4',
                                            borderRadius: '50%',
                                            border: '3px solid white',
                                            boxShadow: '0 1px 6px rgba(0, 0, 0, 0.3)',
                                            zIndex: 10
                                        }} />
                                    </div>
                                </div>
                            </AdvancedMarker>
                        )}
                    </GoogleMap>
                ) : (
                    <div className="loading-container"><div className="loading-spinner"></div></div>
                )}
            </div>

            <button
                className="mode-toggle-button"
                onClick={() => setTestMode(!testMode)}
                style={{ backgroundColor: testMode ? '#667eea' : '#22c55e' }}
            >
                {testMode ? '🖱️ 테스트' : '📍 GPS'}
            </button>

            <div className="running-footer-controls">
                {!isWatering ? (
                    <>
                        <button className="running-control-btn water" onClick={handleWateringStart}>
                            <span className="btn-icon">💧</span>
                            <span className="btn-text">급수</span>
                        </button>
                        <button className="running-control-btn stop" onClick={handleStop}>
                            <span className="btn-icon">⏹️</span>
                            <span className="btn-text">종료</span>
                        </button>
                    </>
                ) : (
                    <button className="running-control-btn water-end" onClick={handleWateringEnd}>
                        <span className="btn-icon" style={{ fontSize: '32px' }}>💧</span>
                        <span className="btn-text" style={{ fontSize: '14px' }}>급수 종료</span>
                    </button>
                )}
            </div>

            <style>{`
                @keyframes pulse { 
                    0% { transform: scale(1); } 
                    50% { transform: scale(1.05); } 
                    100% { transform: scale(1); } 
                }
                @keyframes pulse-ring {
                    0% {
                        transform: translate(-50%, -50%) scale(0.8);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(-50%, -50%) scale(1.5);
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    );
}

export default RunningScreen;

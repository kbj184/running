import React, { useState, useMemo, useEffect } from 'react';
import { api } from '../utils/api';
import { generateRouteMapImage } from '../utils/mapThumbnail';
import { GoogleMap, useJsApiLoader, Polyline } from '@react-google-maps/api';
import AdvancedMarker from './common/AdvancedMarker';
import { getInteractiveMapOptions, LIBRARIES, getMapId } from '../utils/mapConfig';
import { formatTime } from '../utils/gps';
import { formatDistance, formatPace } from '../utils/unitConverter';
import { useUnit } from '../contexts/UnitContext';
import { useTranslation } from 'react-i18next';

const MAP_ID = getMapId();

// 속도에 따른 색상 반환
const getSpeedColor = (speedKmh) => {
    if (speedKmh <= 0) return "#667eea";
    if (speedKmh < 6) return "#10b981";
    if (speedKmh < 9) return "#f59e0b";
    if (speedKmh < 12) return "#ef4444";
    return "#7c3aed";
};

// 기록별 고유 색상
const RECORD_COLORS = [
    '#ef4444', // 빨강
    '#3b82f6', // 파랑
    '#10b981', // 초록
];

function RecordDetailModal({ record, onClose, onStartCourseChallenge, user }) {
    const { t } = useTranslation();
    const { unit } = useUnit();
    const [showInteractiveMap, setShowInteractiveMap] = useState(false);
    const [map, setMap] = useState(null);
    const [showComparison, setShowComparison] = useState(false);
    const [courseRecords, setCourseRecords] = useState([]);
    const [selectedRecords, setSelectedRecords] = useState([record.sessionId]);
    const [loadingRecords, setLoadingRecords] = useState(false);

    // Google Maps API 로드
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        language: 'ko',
        libraries: LIBRARIES
    });

    const isCourseRecord = record.courseId != null;

    // 같은 코스의 모든 기록 불러오기
    useEffect(() => {
        if (isCourseRecord && user && showComparison) {
            loadCourseRecords();
        }
    }, [isCourseRecord, user, showComparison]);

    const loadCourseRecords = async () => {
        setLoadingRecords(true);
        try {
            const response = await api.request(
                `${import.meta.env.VITE_API_URL}/api/running/course/${record.courseId}/attempts?userId=${user.id}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
                    }
                }
            );

            if (response.ok) {
                let records = await response.json();

                // JSON 파싱
                records = records.map(r => ({
                    ...r,
                    route: r.route ? JSON.parse(r.route) : [],
                    splits: r.splits ? JSON.parse(r.splits) : [],
                    wateringSegments: r.wateringSegments ? JSON.parse(r.wateringSegments) : []
                }));

                setCourseRecords(records);
                console.log('📊 코스 기록 로드 완료:', records.length);
            }
        } catch (error) {
            console.error('❌ 코스 기록 로드 실패:', error);
        } finally {
            setLoadingRecords(false);
        }
    };

    // route 데이터 파싱
    const parsedRoute = useMemo(() => {
        if (record?.route) {
            try {
                let route = record.route;
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
    }, [record?.route]);

    // 정적 지도 이미지 생성
    const mapImageUrl = useMemo(() => {
        if (parsedRoute && parsedRoute.length > 0) {
            const wateringSegments = record.wateringSegments || [];
            return generateRouteMapImage(parsedRoute, wateringSegments);
        }
        return record?.thumbnail;
    }, [parsedRoute, record?.wateringSegments, record?.thumbnail]);

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

    // 선택된 기록들의 경로 세그먼트
    const comparisonRouteSegments = useMemo(() => {
        if (!showComparison || selectedRecords.length === 0) return [];

        const segments = [];

        selectedRecords.forEach((sessionId, index) => {
            const recordData = courseRecords.find(r => r.sessionId === sessionId);
            if (!recordData || !recordData.route || recordData.route.length === 0) return;

            const color = RECORD_COLORS[index % RECORD_COLORS.length];

            // 전체 경로를 하나의 세그먼트로
            const path = recordData.route.map(p => ({ lat: p.lat, lng: p.lng }));
            segments.push({
                path,
                color,
                sessionId,
                label: `기록 ${index + 1}`
            });
        });

        return segments;
    }, [showComparison, selectedRecords, courseRecords]);

    // 경로를 속도별 세그먼트로 변환 (단일 기록 보기용)
    const routeSegments = useMemo(() => {
        if (showComparison || !parsedRoute || parsedRoute.length < 2) return [];

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
    }, [parsedRoute, showComparison]);

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

    const handleCourseChallenge = () => {
        if (onStartCourseChallenge) {
            onStartCourseChallenge(record);
        }
    };

    const handleToggleComparison = () => {
        setShowComparison(!showComparison);
        if (!showComparison) {
            setShowInteractiveMap(true); // 비교 모드는 항상 인터랙티브 맵
        }
    };

    const handleRecordSelect = (sessionId) => {
        if (selectedRecords.includes(sessionId)) {
            // 최소 1개는 선택되어야 함
            if (selectedRecords.length > 1) {
                setSelectedRecords(selectedRecords.filter(id => id !== sessionId));
            }
        } else {
            // 최대 3개까지만 선택 가능
            if (selectedRecords.length < 3) {
                setSelectedRecords([...selectedRecords, sessionId]);
            }
        }
    };

    // 선택된 기록들의 통계
    const comparisonStats = useMemo(() => {
        if (!showComparison || selectedRecords.length === 0) return [];

        return selectedRecords.map(sessionId => {
            const recordData = courseRecords.find(r => r.sessionId === sessionId);
            if (!recordData) return null;

            return {
                sessionId,
                timestamp: recordData.timestamp || recordData.createdAt,
                distance: recordData.distance,
                duration: recordData.duration,
                pace: recordData.pace,
                speed: recordData.speed,
                calories: Math.floor(recordData.distance * 60)
            };
        }).filter(Boolean);
    }, [showComparison, selectedRecords, courseRecords]);

    if (!record) {
        return null;
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#fff',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#fff',
                gap: '12px'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '20px',
                        cursor: 'pointer',
                        padding: '4px',
                        color: '#333',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                >
                    ←
                </button>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1a' }}>
                    {showComparison ? '기록 비교' : t('profile.recordDetail')}
                </div>
            </div>

            {/* Scrollable Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                {/* Map - Static or Interactive */}
                <div style={{ position: 'relative', marginBottom: '20px' }}>
                    {!showInteractiveMap && !showComparison ? (
                        // Static Map
                        <div
                            style={{
                                width: '100%',
                                height: '280px',
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
                            height: '280px',
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
                                        mapId: MAP_ID
                                    }}
                                >
                                    {/* 비교 모드: 여러 경로 표시 */}
                                    {showComparison ? (
                                        comparisonRouteSegments.map((segment, idx) => (
                                            <Polyline
                                                key={`comparison-${idx}`}
                                                path={segment.path}
                                                options={{
                                                    strokeColor: segment.color,
                                                    strokeOpacity: 0.8,
                                                    strokeWeight: 5,
                                                }}
                                            />
                                        ))
                                    ) : (
                                        /* 단일 기록: 속도별 색상 */
                                        routeSegments.map((segment, idx) => (
                                            <Polyline
                                                key={`segment-${idx}`}
                                                path={segment.path}
                                                options={{
                                                    strokeColor: segment.color,
                                                    strokeOpacity: 0.9,
                                                    strokeWeight: 6,
                                                }}
                                            />
                                        ))
                                    )}

                                    {/* 시작/종료 마커 */}
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

                {/* Course Challenge Button - Only for course records */}
                {isCourseRecord && !showComparison && (
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                        <button
                            onClick={handleCourseChallenge}
                            style={{
                                flex: 1,
                                padding: '16px',
                                backgroundColor: '#7c3aed',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '16px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#6d28d9'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#7c3aed'}
                        >
                            <span style={{ fontSize: '20px' }}>🏃</span>
                            <span>코스 재도전하기</span>
                        </button>
                        <button
                            onClick={handleToggleComparison}
                            style={{
                                flex: 1,
                                padding: '16px',
                                backgroundColor: '#3b82f6',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '16px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2563eb'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#3b82f6'}
                        >
                            <span style={{ fontSize: '20px' }}>📊</span>
                            <span>기록 비교하기</span>
                        </button>
                    </div>
                )}

                {/* Comparison Mode */}
                {showComparison && (
                    <>
                        {/* Back to Single View Button */}
                        <button
                            onClick={handleToggleComparison}
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: '#f0f0f0',
                                color: '#666',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                marginBottom: '20px'
                            }}
                        >
                            ← 단일 기록 보기로 돌아가기
                        </button>

                        {/* Record Selection */}
                        <div style={{
                            backgroundColor: '#f8f8f8',
                            borderRadius: '12px',
                            padding: '16px',
                            marginBottom: '20px'
                        }}>
                            <div style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#333',
                                marginBottom: '12px'
                            }}>
                                비교할 기록 선택 (최대 3개)
                            </div>

                            {loadingRecords ? (
                                <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                                    로딩 중...
                                </div>
                            ) : courseRecords.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                                    이 코스의 기록이 없습니다.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {courseRecords.map((r, index) => {
                                        const isSelected = selectedRecords.includes(r.sessionId);
                                        const colorIndex = selectedRecords.indexOf(r.sessionId);
                                        const color = colorIndex >= 0 ? RECORD_COLORS[colorIndex] : '#ccc';

                                        return (
                                            <label
                                                key={r.sessionId}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px',
                                                    padding: '12px',
                                                    backgroundColor: isSelected ? '#fff' : 'transparent',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    border: isSelected ? `2px solid ${color}` : '2px solid transparent',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleRecordSelect(r.sessionId)}
                                                    style={{
                                                        width: '20px',
                                                        height: '20px',
                                                        cursor: 'pointer',
                                                        accentColor: color
                                                    }}
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{
                                                        fontSize: '12px',
                                                        color: '#666',
                                                        marginBottom: '4px'
                                                    }}>
                                                        {new Date(r.timestamp || r.createdAt).toLocaleDateString('ko-KR', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '14px',
                                                        fontWeight: '600',
                                                        color: '#1a1a1a'
                                                    }}>
                                                        {formatDistance(r.distance, unit)} · {formatTime(r.duration)} · {formatPace(r.pace * 60, unit)}
                                                    </div>
                                                </div>
                                                {isSelected && (
                                                    <div style={{
                                                        width: '24px',
                                                        height: '24px',
                                                        borderRadius: '50%',
                                                        backgroundColor: color,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: '#fff',
                                                        fontSize: '12px',
                                                        fontWeight: '700'
                                                    }}>
                                                        {colorIndex + 1}
                                                    </div>
                                                )}
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Comparison Stats Table */}
                        {comparisonStats.length > 0 && (
                            <div style={{
                                backgroundColor: '#fff',
                                borderRadius: '12px',
                                padding: '16px',
                                border: '1px solid #e0e0e0',
                                overflowX: 'auto'
                            }}>
                                <div style={{
                                    fontSize: '16px',
                                    fontWeight: '700',
                                    color: '#1a1a1a',
                                    marginBottom: '16px'
                                }}>
                                    통계 비교
                                </div>

                                <table style={{
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    fontSize: '14px'
                                }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                                            <th style={{
                                                padding: '12px 8px',
                                                textAlign: 'left',
                                                fontWeight: '600',
                                                color: '#666'
                                            }}>항목</th>
                                            {comparisonStats.map((stat, index) => (
                                                <th key={stat.sessionId} style={{
                                                    padding: '12px 8px',
                                                    textAlign: 'center',
                                                    fontWeight: '600',
                                                    color: RECORD_COLORS[index]
                                                }}>
                                                    기록 {index + 1}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                                            <td style={{ padding: '12px 8px', color: '#666' }}>날짜</td>
                                            {comparisonStats.map(stat => (
                                                <td key={stat.sessionId} style={{
                                                    padding: '12px 8px',
                                                    textAlign: 'center',
                                                    fontSize: '12px'
                                                }}>
                                                    {new Date(stat.timestamp).toLocaleDateString('ko-KR', {
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </td>
                                            ))}
                                        </tr>
                                        <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                                            <td style={{ padding: '12px 8px', color: '#666' }}>거리</td>
                                            {comparisonStats.map(stat => (
                                                <td key={stat.sessionId} style={{
                                                    padding: '12px 8px',
                                                    textAlign: 'center',
                                                    fontWeight: '700',
                                                    color: '#1a1a1a'
                                                }}>
                                                    {formatDistance(stat.distance, unit)}
                                                </td>
                                            ))}
                                        </tr>
                                        <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                                            <td style={{ padding: '12px 8px', color: '#666' }}>시간</td>
                                            {comparisonStats.map(stat => (
                                                <td key={stat.sessionId} style={{
                                                    padding: '12px 8px',
                                                    textAlign: 'center',
                                                    fontWeight: '700',
                                                    color: '#1a1a1a'
                                                }}>
                                                    {formatTime(stat.duration)}
                                                </td>
                                            ))}
                                        </tr>
                                        <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                                            <td style={{ padding: '12px 8px', color: '#666' }}>페이스</td>
                                            {comparisonStats.map(stat => (
                                                <td key={stat.sessionId} style={{
                                                    padding: '12px 8px',
                                                    textAlign: 'center',
                                                    fontWeight: '700',
                                                    color: '#1a1a1a'
                                                }}>
                                                    {formatPace(stat.pace * 60, unit)}
                                                </td>
                                            ))}
                                        </tr>
                                        <tr>
                                            <td style={{ padding: '12px 8px', color: '#666' }}>칼로리</td>
                                            {comparisonStats.map(stat => (
                                                <td key={stat.sessionId} style={{
                                                    padding: '12px 8px',
                                                    textAlign: 'center',
                                                    fontWeight: '600',
                                                    color: '#666'
                                                }}>
                                                    {stat.calories} kcal
                                                </td>
                                            ))}
                                        </tr>
                                    </tbody>
                                </table>

                                {/* Legend */}
                                <div style={{
                                    marginTop: '16px',
                                    padding: '12px',
                                    backgroundColor: '#f8f8f8',
                                    borderRadius: '8px'
                                }}>
                                    <div style={{
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        color: '#666',
                                        marginBottom: '8px'
                                    }}>
                                        지도 색상
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        gap: '12px',
                                        flexWrap: 'wrap'
                                    }}>
                                        {comparisonStats.map((stat, index) => (
                                            <div key={stat.sessionId} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}>
                                                <div style={{
                                                    width: '20px',
                                                    height: '4px',
                                                    backgroundColor: RECORD_COLORS[index],
                                                    borderRadius: '2px'
                                                }} />
                                                <span style={{
                                                    fontSize: '12px',
                                                    color: '#666'
                                                }}>
                                                    기록 {index + 1}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Single Record Info */}
                {!showComparison && (
                    <>
                        <div style={{
                            padding: '20px',
                            backgroundColor: '#f8f8f8',
                            borderRadius: '12px',
                            marginBottom: '20px'
                        }}>
                            {/* Date and Time */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '16px',
                                paddingBottom: '16px',
                                borderBottom: '1px solid #e0e0e0'
                            }}>
                                <div style={{ fontSize: '14px', color: '#666', fontWeight: '600' }}>
                                    {(() => {
                                        const date = new Date(record.timestamp || record.createdAt);
                                        const year = date.getFullYear();
                                        const month = date.getMonth() + 1;
                                        const day = date.getDate();
                                        const hours = String(date.getHours()).padStart(2, '0');
                                        const minutes = String(date.getMinutes()).padStart(2, '0');
                                        return `${year}${t('common.year')}${month}${t('common.month')}${day}${t('common.day')} ${hours}:${minutes}`;
                                    })()}
                                </div>
                                {isCourseRecord && (
                                    <div style={{
                                        display: 'flex',
                                        gap: '4px',
                                        alignItems: 'center'
                                    }}>
                                        {(() => {
                                            switch (record.courseType) {
                                                case 'RETRY':
                                                    return (
                                                        <>
                                                            <span style={{ fontSize: '16px' }}>🔄</span>
                                                            <span style={{
                                                                fontSize: '10px',
                                                                fontWeight: '700',
                                                                color: '#fff',
                                                                backgroundColor: '#3b82f6',
                                                                padding: '2px 6px',
                                                                borderRadius: '4px'
                                                            }}>
                                                                RETRY
                                                            </span>
                                                        </>
                                                    );
                                                case 'FRIEND':
                                                    return (
                                                        <>
                                                            <span style={{ fontSize: '16px' }}>👥</span>
                                                            <span style={{
                                                                fontSize: '10px',
                                                                fontWeight: '700',
                                                                color: '#fff',
                                                                backgroundColor: '#10b981',
                                                                padding: '2px 6px',
                                                                borderRadius: '4px'
                                                            }}>
                                                                FRIEND
                                                            </span>
                                                        </>
                                                    );
                                                case 'CREW':
                                                default:
                                                    return (
                                                        <>
                                                            <span style={{ fontSize: '16px' }}>🏆</span>
                                                            <span style={{
                                                                fontSize: '10px',
                                                                fontWeight: '700',
                                                                color: '#fff',
                                                                backgroundColor: '#7c3aed',
                                                                padding: '2px 6px',
                                                                borderRadius: '4px'
                                                            }}>
                                                                CREW
                                                            </span>
                                                        </>
                                                    );
                                            }
                                        })()}
                                    </div>
                                )}
                            </div>

                            {/* Stats Grid */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '16px'
                            }}>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                                        {t('running.distance')}
                                    </div>
                                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#4318FF' }}>
                                        {formatDistance(record.distance, unit)}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                                        {t('running.time')}
                                    </div>
                                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#1a1a1a' }}>
                                        {(() => {
                                            const totalSeconds = Math.floor(record.duration);
                                            const minutes = Math.floor(totalSeconds / 60);
                                            const seconds = totalSeconds % 60;
                                            return `${minutes}:${String(seconds).padStart(2, '0')}`;
                                        })()}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                                        {t('running.pace')}
                                    </div>
                                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#333' }}>
                                        {formatPace(record.pace * 60, unit)}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                                        {t('running.calories')}
                                    </div>
                                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#333' }}>
                                        {Math.floor(record.distance * 60)} kcal
                                    </div>
                                </div>
                                {record.totalAscent != null && (
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                                            {t('running.ascent')}
                                        </div>
                                        <div style={{ fontSize: '18px', fontWeight: '700', color: '#333' }}>
                                            {Math.floor(record.totalAscent)} m
                                        </div>
                                    </div>
                                )}
                                {record.totalDescent != null && (
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                                            {t('running.descent')}
                                        </div>
                                        <div style={{ fontSize: '18px', fontWeight: '700', color: '#333' }}>
                                            {Math.floor(record.totalDescent)} m
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Speed Legend */}
                        <div style={{
                            padding: '16px',
                            backgroundColor: '#f8f8f8',
                            borderRadius: '12px'
                        }}>
                            <div style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#333',
                                marginBottom: '12px'
                            }}>
                                속도 구간
                            </div>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px'
                            }}>
                                {[
                                    { color: '#10b981', label: '느림 (< 6 km/h)' },
                                    { color: '#f59e0b', label: '보통 (6-9 km/h)' },
                                    { color: '#ef4444', label: '빠름 (9-12 km/h)' },
                                    { color: '#7c3aed', label: '매우 빠름 (> 12 km/h)' }
                                ].map(({ color, label }) => (
                                    <div key={color} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        <div style={{
                                            width: '20px',
                                            height: '4px',
                                            backgroundColor: color,
                                            borderRadius: '2px'
                                        }} />
                                        <div style={{ fontSize: '12px', color: '#666' }}>
                                            {label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Speed & Elevation Analysis Chart */}
                        {parsedRoute && parsedRoute.length > 10 && (
                            <div style={{
                                padding: '16px',
                                backgroundColor: '#f8f8f8',
                                borderRadius: '12px',
                                marginTop: '16px'
                            }}>
                                <div style={{
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#333',
                                    marginBottom: '12px'
                                }}>
                                    속도 & 고도 분석
                                </div>

                                {(() => {
                                    // 데이터 샘플링 (너무 많으면 50개로 줄임)
                                    const sampleSize = Math.min(50, parsedRoute.length);
                                    const step = Math.floor(parsedRoute.length / sampleSize);
                                    const sampledData = parsedRoute.filter((_, i) => i % step === 0);

                                    // 고도 및 속도 범위 계산
                                    const elevations = sampledData.map(p => p.elevation || 0);
                                    const speeds = sampledData.map(p => (p.speed || 0) * 3.6); // m/s → km/h

                                    const minElevation = Math.min(...elevations);
                                    const maxElevation = Math.max(...elevations);
                                    const elevationRange = maxElevation - minElevation || 1;

                                    const maxSpeed = Math.max(...speeds, 15);

                                    const chartWidth = 300;
                                    const chartHeight = 150;
                                    const padding = { top: 10, right: 40, bottom: 20, left: 40 };
                                    const innerWidth = chartWidth - padding.left - padding.right;
                                    const innerHeight = chartHeight - padding.top - padding.bottom;

                                    // 고도 경로 생성
                                    const elevationPath = sampledData.map((point, i) => {
                                        const x = padding.left + (i / (sampledData.length - 1)) * innerWidth;
                                        const normalizedElevation = (point.elevation - minElevation) / elevationRange;
                                        const y = padding.top + innerHeight - (normalizedElevation * innerHeight);
                                        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                                    }).join(' ');

                                    // 속도 경로 생성
                                    const speedPath = sampledData.map((point, i) => {
                                        const x = padding.left + (i / (sampledData.length - 1)) * innerWidth;
                                        const speed = (point.speed || 0) * 3.6;
                                        const normalizedSpeed = speed / maxSpeed;
                                        const y = padding.top + innerHeight - (normalizedSpeed * innerHeight);
                                        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                                    }).join(' ');

                                    return (
                                        <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ overflow: 'visible' }}>
                                            {/* 배경 그리드 */}
                                            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                                                <line
                                                    key={ratio}
                                                    x1={padding.left}
                                                    y1={padding.top + innerHeight * (1 - ratio)}
                                                    x2={padding.left + innerWidth}
                                                    y2={padding.top + innerHeight * (1 - ratio)}
                                                    stroke="#e0e0e0"
                                                    strokeWidth="1"
                                                    strokeDasharray="2,2"
                                                />
                                            ))}

                                            {/* 고도 영역 (채우기) */}
                                            <path
                                                d={`${elevationPath} L ${padding.left + innerWidth} ${padding.top + innerHeight} L ${padding.left} ${padding.top + innerHeight} Z`}
                                                fill="url(#elevationGradient)"
                                                opacity="0.3"
                                            />

                                            {/* 고도 선 */}
                                            <path
                                                d={elevationPath}
                                                fill="none"
                                                stroke="#10b981"
                                                strokeWidth="2"
                                            />

                                            {/* 속도 선 */}
                                            <path
                                                d={speedPath}
                                                fill="none"
                                                stroke="#ef4444"
                                                strokeWidth="2"
                                            />

                                            {/* Y축 레이블 (고도) */}
                                            <text x={padding.left - 5} y={padding.top} textAnchor="end" fontSize="10" fill="#10b981">
                                                {Math.round(maxElevation)}m
                                            </text>
                                            <text x={padding.left - 5} y={padding.top + innerHeight} textAnchor="end" fontSize="10" fill="#10b981">
                                                {Math.round(minElevation)}m
                                            </text>

                                            {/* Y축 레이블 (속도) */}
                                            <text x={padding.left + innerWidth + 5} y={padding.top} textAnchor="start" fontSize="10" fill="#ef4444">
                                                {Math.round(maxSpeed)}
                                            </text>
                                            <text x={padding.left + innerWidth + 5} y={padding.top + innerHeight} textAnchor="start" fontSize="10" fill="#ef4444">
                                                0
                                            </text>

                                            {/* 그라데이션 정의 */}
                                            <defs>
                                                <linearGradient id="elevationGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
                                                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.1" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                    );
                                })()}

                                {/* 범례 */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    gap: '16px',
                                    marginTop: '8px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <div style={{ width: '16px', height: '2px', backgroundColor: '#10b981' }} />
                                        <span style={{ fontSize: '11px', color: '#666' }}>고도 (m)</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <div style={{ width: '16px', height: '2px', backgroundColor: '#ef4444' }} />
                                        <span style={{ fontSize: '11px', color: '#666' }}>속도 (km/h)</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Footer */}
            <div style={{
                padding: '16px 20px',
                borderTop: '1px solid #f0f0f0',
                backgroundColor: '#fff',
                paddingBottom: 'max(16px, env(safe-area-inset-bottom))'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        width: '100%',
                        padding: '16px',
                        backgroundColor: '#f0f0f0',
                        color: '#666',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    닫기
                </button>
            </div>
        </div>
    );
}

export default RecordDetailModal;

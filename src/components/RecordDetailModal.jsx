import React, { useState, useMemo } from 'react';
import { generateRouteMapImage } from '../utils/mapThumbnail';
import { GoogleMap, useJsApiLoader, Polyline } from '@react-google-maps/api';
import AdvancedMarker from './common/AdvancedMarker';
import { getInteractiveMapOptions, LIBRARIES, getMapId } from '../utils/mapConfig';
import { formatTime } from '../utils/gps';
import { formatDistance, formatPace } from '../utils/unitConverter';
import { useUnit } from '../contexts/UnitContext';
import { useTranslation } from 'react-i18next';

const MAP_ID = getMapId();

// 속도에 따른 색상
const getSpeedColor = (speedKmh) => {
    if (speedKmh <= 0) return "#667eea";
    if (speedKmh < 6) return "#10b981";
    if (speedKmh < 9) return "#f59e0b";
    if (speedKmh < 12) return "#ef4444";
    return "#7c3aed";
};

function RecordDetailModal({ record, onClose, onStartCourseChallenge }) {
    const { t } = useTranslation();
    const { unit } = useUnit();
    const [showInteractiveMap, setShowInteractiveMap] = useState(false);
    const [map, setMap] = useState(null);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        language: 'ko',
        libraries: LIBRARIES
    });

    const isCourseRecord = record.courseId != null;

    // route 파싱
    const parsedRoute = useMemo(() => {
        if (record?.route) {
            try {
                let route = record.route;
                if (typeof route === 'string') {
                    route = JSON.parse(route);
                }
                return Array.isArray(route) ? route : [];
            } catch (e) {
                return [];
            }
        }
        return [];
    }, [record?.route]);

    // 지도 이미지 URL
    const mapImageUrl = useMemo(() => {
        if (parsedRoute && parsedRoute.length > 0) {
            return generateRouteMapImage(parsedRoute);
        }
        return null;
    }, [parsedRoute]);

    // 지도 중심
    const mapCenter = useMemo(() => {
        if (parsedRoute && parsedRoute.length > 0) {
            const mid = Math.floor(parsedRoute.length / 2);
            return { lat: parsedRoute[mid].lat, lng: parsedRoute[mid].lng };
        }
        return { lat: 37.5665, lng: 126.9780 };
    }, [parsedRoute]);

    // 마커
    const markers = useMemo(() => {
        if (!parsedRoute || parsedRoute.length === 0) return {};
        return {
            start: { lat: parsedRoute[0].lat, lng: parsedRoute[0].lng },
            goal: { lat: parsedRoute[parsedRoute.length - 1].lat, lng: parsedRoute[parsedRoute.length - 1].lng }
        };
    }, [parsedRoute]);

    // 속도별 경로 세그먼트
    const routeSegments = useMemo(() => {
        if (!parsedRoute || parsedRoute.length < 2) return [];

        const segments = [];
        let currentPath = [];
        let currentColor = getSpeedColor((parsedRoute[0]?.speed || 0) * 3.6);

        for (let i = 0; i < parsedRoute.length - 1; i++) {
            const p1 = parsedRoute[i];
            const p2 = parsedRoute[i + 1];
            const color = getSpeedColor((p1.speed || 0) * 3.6);

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
    }, [parsedRoute]);

    if (!record) return null;

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
                backgroundColor: '#fff'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '20px',
                        cursor: 'pointer',
                        padding: '4px',
                        marginRight: '12px'
                    }}
                >
                    ←
                </button>
                <div style={{ fontSize: '18px', fontWeight: '700' }}>
                    {t('profile.recordDetail')}
                </div>
            </div>

            {/* Scrollable Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                {/* Map */}
                <div style={{ marginBottom: '20px' }}>
                    {!showInteractiveMap ? (
                        <div
                            style={{
                                width: '100%',
                                height: '280px',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                backgroundColor: '#f0f0f0',
                                cursor: 'pointer'
                            }}
                            onClick={() => setShowInteractiveMap(true)}
                        >
                            {mapImageUrl && (
                                <img
                                    src={mapImageUrl}
                                    alt="러닝 경로"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            )}
                        </div>
                    ) : (
                        <div style={{ width: '100%', height: '280px', borderRadius: '12px', overflow: 'hidden' }}>
                            {isLoaded && parsedRoute.length > 0 && (
                                <GoogleMap
                                    mapContainerStyle={{ width: '100%', height: '100%' }}
                                    center={mapCenter}
                                    zoom={14}
                                    onLoad={setMap}
                                    options={{ mapId: MAP_ID }}
                                >
                                    {routeSegments.map((segment, idx) => (
                                        <Polyline
                                            key={idx}
                                            path={segment.path}
                                            options={{
                                                strokeColor: segment.color,
                                                strokeOpacity: 0.9,
                                                strokeWeight: 6
                                            }}
                                        />
                                    ))}
                                    {markers.start && (
                                        <AdvancedMarker map={map} position={markers.start}>
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                backgroundColor: '#22c55e',
                                                borderRadius: '50%',
                                                border: '3px solid white',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '14px',
                                                fontWeight: '800',
                                                color: 'white'
                                            }}>S</div>
                                        </AdvancedMarker>
                                    )}
                                    {markers.goal && (
                                        <AdvancedMarker map={map} position={markers.goal}>
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                backgroundColor: '#ef4444',
                                                borderRadius: '50%',
                                                border: '3px solid white',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '14px',
                                                fontWeight: '800',
                                                color: 'white'
                                            }}>G</div>
                                        </AdvancedMarker>
                                    )}
                                </GoogleMap>
                            )}
                        </div>
                    )}
                </div>

                {/* Date */}
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
                    {(() => {
                        const date = new Date(record.timestamp || record.createdAt);
                        return `${date.getFullYear()}${t('common.year')}${date.getMonth() + 1}${t('common.month')}${date.getDate()}${t('common.day')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                    })()}
                </div>

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                    <div>
                        <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>거리</div>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#4318FF' }}>
                            {formatDistance(record.distance, unit)}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>시간</div>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#1a1a1a' }}>
                            {formatTime(record.duration)}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>페이스</div>
                        <div style={{ fontSize: '18px', fontWeight: '700', color: '#333' }}>
                            {formatPace(record.pace * 60, unit)}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>칼로리</div>
                        <div style={{ fontSize: '18px', fontWeight: '700', color: '#333' }}>
                            {Math.floor(record.distance * 60)} kcal
                        </div>
                    </div>
                    {record.totalAscent != null && (
                        <div>
                            <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>상승</div>
                            <div style={{ fontSize: '18px', fontWeight: '700', color: '#333' }}>
                                {Math.floor(record.totalAscent)} m
                            </div>
                        </div>
                    )}
                    {record.totalDescent != null && (
                        <div>
                            <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>하강</div>
                            <div style={{ fontSize: '18px', fontWeight: '700', color: '#333' }}>
                                {Math.floor(record.totalDescent)} m
                            </div>
                        </div>
                    )}
                </div>

                {/* Speed Legend */}
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>속도 구간</div>
                    {[
                        { color: '#10b981', label: '느림 (< 6 km/h)' },
                        { color: '#f59e0b', label: '보통 (6-9 km/h)' },
                        { color: '#ef4444', label: '빠름 (9-12 km/h)' },
                        { color: '#7c3aed', label: '매우 빠름 (> 12 km/h)' }
                    ].map(({ color, label }) => (
                        <div key={color} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <div style={{ width: '20px', height: '4px', backgroundColor: color }} />
                            <div style={{ fontSize: '12px', color: '#666' }}>{label}</div>
                        </div>
                    ))}
                </div>

                {/* Course Challenge Button */}
                {isCourseRecord && onStartCourseChallenge && (
                    <button
                        onClick={() => onStartCourseChallenge(record)}
                        style={{
                            width: '100%',
                            padding: '16px',
                            backgroundColor: '#7c3aed',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '16px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            marginBottom: '12px'
                        }}
                    >
                        🏃 코스 재도전하기
                    </button>
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

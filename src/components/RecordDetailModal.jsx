import React, { useState, useMemo } from 'react';
import { generateRouteMapImage } from '../utils/mapThumbnail';
import { GoogleMap, useJsApiLoader, Polyline } from '@react-google-maps/api';
import AdvancedMarker from './common/AdvancedMarker';
import { getInteractiveMapOptions, LIBRARIES, getMapId } from '../utils/mapConfig';
import { formatTime } from '../utils/gps';
import { formatDistance, formatPace } from '../utils/unitConverter';
import { useUnit } from '../contexts/UnitContext';
import { useTranslation } from 'react-i18next';
import './result-screen.css'; // ResultScreen 스타일 재사용

const MAP_ID = getMapId();

// 속도별 색상
const getSpeedColor = (speedKmh) => {
    if (speedKmh <= 0) return "#667eea";
    if (speedKmh < 6) return "#10b981";
    if (speedKmh < 9) return "#f59e0b";
    if (speedKmh < 12) return "#ef4444";
    return "#7c3aed";
};

// 고도 및 속도 분석 차트 (ResultScreen에서 가져옴)
const SpeedElevationChart = ({ splits }) => {
    if (!splits || splits.length === 0) return null;

    const data = splits.map(s => ({
        km: s.km,
        elevation: s.elevation || 0,
        speed: s.pace > 0 ? 60 / s.pace : 0
    }));

    const elevations = data.map(d => d.elevation);
    const speeds = data.map(d => d.speed);

    const maxEle = Math.max(...elevations, 1);
    const minEle = Math.min(...elevations, 0);
    const eleRange = maxEle - minEle || 1;

    const maxSpd = Math.max(...speeds, 1);
    const spdRange = maxSpd || 1;

    const viewBoxWidth = 400;
    const chartHeight = 150;
    const padding = 20;
    const innerWidth = viewBoxWidth - (padding * 2);
    const innerHeight = chartHeight - (padding * 1.5);

    return (
        <div className="speed-elevation-chart-wrapper">
            <svg width="100%" height={chartHeight} viewBox={`0 0 ${viewBoxWidth} ${chartHeight}`} style={{ overflow: 'visible' }}>
                {/* Elevation Area */}
                <path
                    d={data.map((d, i) => {
                        const x = padding + (i / (data.length - 1 || 1)) * innerWidth;
                        const y = chartHeight - padding - ((d.elevation - minEle) / eleRange) * innerHeight;
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ') + ` L ${padding + innerWidth} ${chartHeight - padding} L ${padding} ${chartHeight - padding} Z`}
                    fill="#667eea"
                    fillOpacity="0.1"
                />
                <path
                    d={data.map((d, i) => {
                        const x = padding + (i / (data.length - 1 || 1)) * innerWidth;
                        const y = chartHeight - padding - ((d.elevation - minEle) / eleRange) * innerHeight;
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#667eea"
                    strokeWidth="2"
                    strokeOpacity="0.4"
                    strokeDasharray="4 2"
                />

                {/* Speed Line */}
                <path
                    d={data.map((d, i) => {
                        const x = padding + (i / (data.length - 1 || 1)) * innerWidth;
                        const y = chartHeight - padding - (d.speed / spdRange) * innerHeight;
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#4318FF"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(67, 24, 255, 0.3))' }}
                />

                {/* Data Points */}
                {data.map((d, i) => {
                    const x = padding + (i / (data.length - 1 || 1)) * innerWidth;
                    const y = chartHeight - padding - (d.speed / spdRange) * innerHeight;
                    return (
                        <circle key={i} cx={x} cy={y} r="3" fill="#4318FF" />
                    );
                })}

                {/* Y-axis labels (optional but helpful) */}
                <text x={padding - 5} y={chartHeight - padding} textAnchor="end" fontSize="10" fill="#999">0</text>
                <text x={padding - 5} y={chartHeight - padding - innerHeight} textAnchor="end" fontSize="10" fill="#999">{Math.round(maxSpd)}</text>
            </svg>
            <div className="chart-legend">
                <div className="legend-item"><span className="dot ele"></span> 고도 (m)</div>
                <div className="legend-item"><span className="dot spd"></span> 속도 (km/h)</div>
            </div>
        </div>
    );
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

    // 데이터 파싱
    const parsedRoute = useMemo(() => {
        if (!record?.route) return [];
        try {
            return typeof record.route === 'string' ? JSON.parse(record.route) : record.route;
        } catch (e) { return []; }
    }, [record?.route]);

    const parsedSplits = useMemo(() => {
        if (!record?.splits) return [];
        try {
            return typeof record.splits === 'string' ? JSON.parse(record.splits) : record.splits;
        } catch (e) { return []; }
    }, [record?.splits]);

    const mapImageUrl = useMemo(() => {
        if (parsedRoute && parsedRoute.length > 0) {
            return generateRouteMapImage(parsedRoute);
        }
        return null;
    }, [parsedRoute]);

    const mapCenter = useMemo(() => {
        if (parsedRoute && parsedRoute.length > 0) {
            const mid = Math.floor(parsedRoute.length / 2);
            return { lat: parsedRoute[mid].lat, lng: parsedRoute[mid].lng };
        }
        return { lat: 37.5665, lng: 126.9780 };
    }, [parsedRoute]);

    const routeSegments = useMemo(() => {
        if (!parsedRoute || parsedRoute.length < 2) return [];
        const segments = [];
        let currentPath = [parsedRoute[0]];
        let currentColor = getSpeedColor((parsedRoute[0]?.speed || 0) * 3.6);

        for (let i = 0; i < parsedRoute.length - 1; i++) {
            const p1 = parsedRoute[i];
            const p2 = parsedRoute[i + 1];
            const color = getSpeedColor((p1.speed || 0) * 3.6);
            if (color !== currentColor) {
                segments.push({ path: [...currentPath], color: currentColor });
                currentPath = [p1];
                currentColor = color;
            }
            currentPath.push(p2);
        }
        segments.push({ path: currentPath, color: currentColor });
        return segments;
    }, [parsedRoute]);

    if (!record) return null;

    return (
        <div className="result-screen-container" style={{ position: 'fixed', zIndex: 3000 }}>
            {/* Header: 2번 내용(날짜)이 1번 위치로 이동 */}
            <div className="result-header-fixed">
                <button className="result-close-x" onClick={onClose} style={{ left: '16px', top: '50%', transform: 'translateY(-50%)' }}>←</button>
                <div className="result-datetime" style={{ flex: 1, textAlign: 'center', fontSize: '18px', fontWeight: '800' }}>
                    {(() => {
                        const d = new Date(record.timestamp || record.createdAt);
                        return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                    })()}
                </div>
            </div>

            {/* 거리 및 시간: 3번 내용이 지도 위로 이동 */}
            <section className="result-summary-section" style={{ paddingBottom: '0' }}>
                <div className="result-main-stats-row">
                    <div className="result-main-stat-item">
                        <div className="result-stat-label">거리</div>
                        <div className="result-stat-value-huge">{formatDistance(record.distance, unit)}</div>
                    </div>
                    <div className="result-main-stat-item center">
                        <div className="result-stat-label">시간</div>
                        <div className="result-stat-value-huge" style={{ color: '#1a1a1a' }}>{formatTime(record.duration)}</div>
                    </div>
                </div>
            </section>

            {/* Map Section */}
            <section className="result-card-section" style={{ padding: '10px 20px 20px' }}>
                <div className="result-map-card" style={{ height: '320px', borderRadius: '24px' }}>
                    {!showInteractiveMap ? (
                        <div style={{ width: '100%', height: '100%', cursor: 'pointer' }} onClick={() => setShowInteractiveMap(true)}>
                            {mapImageUrl && <img src={mapImageUrl} alt="Route" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        </div>
                    ) : (
                        isLoaded && (
                            <GoogleMap
                                mapContainerStyle={{ width: '100%', height: '100%' }}
                                center={mapCenter}
                                zoom={14}
                                onLoad={setMap}
                                options={{
                                    ...(getInteractiveMapOptions() || {}),
                                    mapId: getMapId()
                                }}
                            >
                                {routeSegments.map((s, idx) => (
                                    <Polyline key={idx} path={s.path} options={{ strokeColor: s.color, strokeOpacity: 0.9, strokeWeight: 6 }} />
                                ))}
                            </GoogleMap>
                        )
                    )}
                </div>
            </section>

            {/* 속도 구간 범례: 지도 바로 아래로 이동 */}
            <section className="result-card-section" style={{ marginTop: '-10px' }}>
                <div className="result-secondary-stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '12px', background: '#f8fafc' }}>
                    {[
                        { color: '#10b981', label: '느림 (< 6 km/h)' },
                        { color: '#f59e0b', label: '보통 (6-9 km/h)' },
                        { color: '#ef4444', label: '빠름 (9-12 km/h)' },
                        { color: '#7c3aed', label: '매우 빠름 (> 12 km/h)' }
                    ].map(({ color, label }) => (
                        <div key={color} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '16px', height: '4px', backgroundColor: color, borderRadius: '2px' }} />
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>{label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 상세 데이터 박스 (이미지 0번 스타일) */}
            <section className="result-summary-section" style={{ marginTop: '-10px' }}>
                <div className="result-secondary-stats-grid">
                    <div className="result-secondary-item">
                        <div className="result-secondary-label">페이스</div>
                        <div className="result-secondary-value">{formatPace(record.pace * 60, unit)}</div>
                    </div>
                    <div className="result-secondary-item">
                        <div className="result-secondary-label">칼로리</div>
                        <div className="result-secondary-value">{Math.floor(record.distance * 60)} kcal</div>
                    </div>
                    <div className="result-secondary-item">
                        <div className="result-secondary-label">평균 속도</div>
                        <div className="result-secondary-value">{(record.distance / (record.duration / 3600)).toFixed(1)} <small>km/h</small></div>
                    </div>
                </div>

                <div className="result-secondary-stats-grid" style={{ marginTop: '12px' }}>
                    <div className="result-secondary-item">
                        <div className="result-secondary-label">↗ 상승</div>
                        <div className="result-secondary-value" style={{ color: '#22c55e' }}>{Math.floor(record.totalAscent || 0)} <small>m</small></div>
                    </div>
                    <div className="result-secondary-item">
                        <div className="result-secondary-label">↘ 하강</div>
                        <div className="result-secondary-value" style={{ color: '#ef4444' }}>{Math.floor(record.totalDescent || 0)} <small>m</small></div>
                    </div>
                    <div className="result-secondary-item">
                        <div className="result-secondary-label">기록 타입</div>
                        <div className="result-secondary-value">{record.courseType || 'NORMAL'}</div>
                    </div>
                </div>
            </section>

            {/* Analysis Chart */}
            {parsedSplits && parsedSplits.length > 0 && (
                <section className="result-card-section">
                    <div className="result-section-title-simple">
                        <span>📈</span> 고도 및 속도 분석 (1km)
                    </div>
                    <SpeedElevationChart splits={parsedSplits} />
                </section>
            )}

            {/* Splits List */}
            {parsedSplits && parsedSplits.length > 0 && (
                <section className="result-card-section">
                    <div className="result-section-title-simple">
                        <span>🚩</span> 구간 기록 (1km)
                    </div>
                    <div className="splits-list">
                        {parsedSplits.map((split, idx) => (
                            <div className="split-row-item" key={idx}>
                                <div className="split-km-badge">{split.km} km</div>
                                <div className="split-time-value">{formatTime(split.duration)}</div>
                                <div className="split-pace-value">{split.pace.toFixed(2)} 분/km</div>
                                {split.elevation != null && (
                                    <div className="split-elevation-value" style={{ color: '#667eea', fontSize: '12px' }}>
                                        🗻 {Math.floor(split.elevation)}m
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Actions */}
            <div className="result-footer-actions">
                {isCourseRecord && onStartCourseChallenge && (
                    <button
                        className="result-btn result-btn-save"
                        style={{ backgroundColor: '#7c3aed' }}
                        onClick={() => onStartCourseChallenge(record)}
                    >
                        <span>🏃</span> 코스 재도전하기
                    </button>
                )}
                <button className="result-btn" style={{ backgroundColor: '#f1f5f9', color: '#64748b', flex: isCourseRecord ? 0 : 1 }} onClick={onClose}>
                    닫기
                </button>
            </div>
        </div>
    );
}

export default RecordDetailModal;

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { GoogleMap, useJsApiLoader, Polyline } from '@react-google-maps/api';
import { api } from '../utils/api';
import { formatTime } from '../utils/gps';
import { formatDistance, formatPace } from '../utils/unitConverter';
import { useUnit } from '../contexts/UnitContext';
import { LIBRARIES, getInteractiveMapOptions, getMapId } from '../utils/mapConfig';
import './result-screen.css';

function CourseComparisonModal({ record, user, onClose, onStartCourseChallenge }) {
    const { t } = useTranslation();
    const { unit } = useUnit();
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAttemptIds, setSelectedAttemptIds] = useState([]);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        language: 'ko',
        libraries: LIBRARIES
    });

    useEffect(() => {
        if (record && record.courseId) {
            fetchAttempts();
        }
    }, [record]);

    const fetchAttempts = async () => {
        if (!record || !record.courseId) {
            console.warn('⚠️ Comparison record has no courseId:', record);
            setLoading(false);
            return;
        }

        console.log('🔄 Fetching attempts and original course for id:', record.courseId);
        setLoading(true);
        try {
            const authHeader = {
                'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
            };

            // 1. 모든 시도 기록 가져오기
            const attemptsResponse = await api.request(`${import.meta.env.VITE_API_URL}/api/running/course/${record.courseId}/attempts?userId=${user.id}`, {
                method: 'GET',
                headers: authHeader
            });

            // 2. 원본 코스 정보 가져오기
            const courseResponse = await api.request(`${import.meta.env.VITE_API_URL}/api/running/course/${record.courseId}`, {
                method: 'GET',
                headers: authHeader
            });

            let parsedAttempts = [];
            let originalCourse = null;

            if (attemptsResponse.ok) {
                const data = await attemptsResponse.json();
                console.log('📋 Attempts meta data:', data.length);
                parsedAttempts = data.map(item => ({
                    ...item,
                    route: typeof item.route === 'string' ? JSON.parse(item.route) : item.route,
                    splits: typeof item.splits === 'string' ? JSON.parse(item.splits) : item.splits
                }));
            } else {
                console.error('❌ Failed to fetch attempts:', attemptsResponse.status);
            }

            if (courseResponse.ok) {
                const courseData = await courseResponse.json();
                console.log('📖 Original course data loaded:', courseData);
                originalCourse = {
                    sessionId: 'original',
                    courseId: courseData.id,
                    title: '원본 코스',
                    courseType: 'OFFICIAL',
                    distance: courseData.distance,
                    duration: 0,
                    pace: 0,
                    totalAscent: 0,
                    route: typeof courseData.routeData === 'string' ? JSON.parse(courseData.routeData) : courseData.routeData,
                    createdAt: courseData.createdAt,
                    isOriginal: true
                };
            } else {
                console.error('❌ Failed to fetch original course:', courseResponse.status);
            }

            // 원본 코스를 목록 최상단에 추가
            const finalAttempts = originalCourse ? [originalCourse, ...parsedAttempts] : parsedAttempts;
            console.log('🏁 Final attempts list for comparison:', finalAttempts.map(a => a.sessionId));
            setAttempts(finalAttempts);

            // 기본 선택: 현재 기록 + 원본 코스 (없으면 첫 번째 기록)
            const currentId = record.sessionId;
            const targetId = originalCourse ? 'original' : (finalAttempts[1]?.sessionId || finalAttempts[0]?.sessionId);

            console.log('🎯 Selection IDs:', { currentId, targetId });

            if (currentId && targetId) {
                setSelectedAttemptIds(currentId === targetId ? [currentId] : [targetId, currentId]);
            } else if (currentId) {
                setSelectedAttemptIds([currentId]);
            }
        } catch (err) {
            console.error('Failed to fetch attempts:', err);
        } finally {
            setLoading(false);
        }
    };

    const selectedAttempts = useMemo(() => {
        return attempts.filter(a => selectedAttemptIds.includes(a.sessionId));
    }, [attempts, selectedAttemptIds]);

    const mapCenter = useMemo(() => {
        if (selectedAttempts.length > 0 && selectedAttempts[0].route.length > 0) {
            const r = selectedAttempts[0].route;
            return { lat: r[Math.floor(r.length / 2)].lat, lng: r[Math.floor(r.length / 2)].lng };
        }
        return { lat: 37.5665, lng: 126.9780 };
    }, [selectedAttempts]);

    const colors = ['#4318FF', '#ef4444', '#10b981', '#f59e0b', '#7c3aed'];

    const toggleAttempt = (id) => {
        setSelectedAttemptIds(prev => {
            if (prev.includes(id)) {
                if (prev.length === 1) return prev; // Keep at least one
                return prev.filter(i => i !== id);
            }
            if (prev.length >= 3) return [...prev.slice(1), id]; // Max 3 for comparison
            return [...prev, id];
        });
    };

    if (!record) return null;

    return (
        <div className="result-screen-container" style={{ position: 'fixed', zIndex: 3000, backgroundColor: '#f8fafc' }}>
            <div className="result-header-fixed">
                <button className="result-close-x" onClick={onClose} style={{ left: '16px', top: '50%', transform: 'translateY(-50%)' }}>←</button>
                <div className="result-datetime" style={{ flex: 1, textAlign: 'center', fontSize: '18px', fontWeight: '800' }}>
                    🚩 코스 기록비교
                </div>
            </div>

            <div style={{ padding: '20px', paddingTop: '10px' }}>
                {/* Attempt Selection Chips */}
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '12px' }}>
                    {attempts.map((attempt, idx) => {
                        const isSelected = selectedAttemptIds.includes(attempt.sessionId);
                        const colorIdx = selectedAttemptIds.indexOf(attempt.sessionId);
                        return (
                            <button
                                key={attempt.sessionId}
                                onClick={() => toggleAttempt(attempt.sessionId)}
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '20px',
                                    border: isSelected ? `2px solid ${colors[colorIdx]}` : '1px solid #e2e8f0',
                                    backgroundColor: isSelected ? `${colors[colorIdx]}10` : '#fff',
                                    color: isSelected ? colors[colorIdx] : '#64748b',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    whiteSpace: 'nowrap',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {new Date(attempt.timestamp || attempt.createdAt).toLocaleDateString()} ({attempt.courseType || 'NORMAL'})
                            </button>
                        );
                    })}
                </div>

                {/* Map View */}
                <div className="result-map-card" style={{ height: '260px', borderRadius: '24px', marginBottom: '20px' }}>
                    {isLoaded && (
                        <GoogleMap
                            mapContainerStyle={{ width: '100%', height: '100%' }}
                            center={mapCenter}
                            zoom={14}
                            options={{
                                ...(getInteractiveMapOptions() || {}),
                                mapId: getMapId()
                            }}
                        >
                            {selectedAttempts.map((attempt, idx) => (
                                <Polyline
                                    key={attempt.sessionId}
                                    path={attempt.route}
                                    options={{
                                        strokeColor: colors[selectedAttemptIds.indexOf(attempt.sessionId)],
                                        strokeOpacity: 0.8,
                                        strokeWeight: 5
                                    }}
                                />
                            ))}
                        </GoogleMap>
                    )}
                </div>

                {/* Comparison Table */}
                <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: `100px repeat(${selectedAttempts.length}, 1fr)`, gap: '12px' }}>
                        {/* Labels */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '40px' }}>
                            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>거리</div>
                            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>시간</div>
                            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>페이스</div>
                            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>평균 속도</div>
                            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>상승 고도</div>
                        </div>

                        {/* Values for each selected attempt */}
                        {selectedAttempts.map((attempt, idx) => {
                            const color = colors[selectedAttemptIds.indexOf(attempt.sessionId)];
                            const date = new Date(attempt.timestamp || attempt.createdAt);
                            return (
                                <div key={attempt.sessionId} style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                                    <div style={{
                                        padding: '4px 8px',
                                        backgroundColor: color,
                                        color: '#fff',
                                        borderRadius: '8px',
                                        fontSize: '10px',
                                        fontWeight: '800',
                                        marginBottom: '4px'
                                    }}>
                                        {attempt.isOriginal ? 'GOAL' : `${date.getMonth() + 1}/${date.getDate()}`}
                                    </div>
                                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>{formatDistance(attempt.distance, unit)}</div>
                                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>{attempt.duration > 0 ? formatTime(attempt.duration) : '--:--'}</div>
                                    <div style={{ fontSize: '15px', fontWeight: '800', color: color }}>{attempt.pace > 0 ? formatPace(attempt.pace * 60, unit) : '--\'--"'}</div>
                                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>{attempt.duration > 0 ? (attempt.distance / (attempt.duration / 3600)).toFixed(1) : '0.0'} <small style={{ fontSize: '10px' }}>km/h</small></div>
                                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#22c55e' }}>{attempt.totalAscent > 0 ? `${Math.floor(attempt.totalAscent)}m` : '--'}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Comparison Insights (Optional) */}
                {selectedAttempts.length >= 2 && (
                    <div style={{ marginTop: '20px', padding: '16px', background: 'linear-gradient(135deg, #4318FF 0%, #7c3aed 100%)', borderRadius: '20px', color: '#fff' }}>
                        <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>🚀 분석 요약</div>
                        <div style={{ fontSize: '13px', opacity: 0.9 }}>
                            {(() => {
                                const best = [...selectedAttempts].sort((a, b) => a.duration - b.duration)[0];
                                const bestDate = new Date(best.timestamp || best.createdAt).toLocaleDateString();
                                return `${bestDate} 기록이 가장 빠릅니다! 전체적으로 실력이 향상되고 있네요.`;
                            })()}
                        </div>
                    </div>
                )}
            </div>

            <div className="result-footer-actions">
                {onStartCourseChallenge && (
                    <button
                        className="result-btn result-btn-save"
                        style={{ backgroundColor: '#7c3aed' }}
                        onClick={() => onStartCourseChallenge(record)}
                    >
                        <span>🏃</span> 코스 재도전하기
                    </button>
                )}
                <button className="result-btn" style={{ backgroundColor: '#f1f5f9', color: '#64748b', flex: onStartCourseChallenge ? 0 : 1 }} onClick={onClose}>
                    닫기
                </button>
            </div>
        </div>
    );
}

export default CourseComparisonModal;

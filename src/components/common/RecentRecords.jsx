import { useState, useEffect, useMemo } from 'react';
import { formatDistance, formatTime } from '../../utils/gps';
import { generateRouteThumbImage } from '../../utils/mapThumbnail';
import { api } from '../../utils/api';

const thumbnailMapStyle = {
    width: '110px',
    height: '100px',
    borderRadius: '8px'
};

function RouteThumbnail({ route, thumbnail }) {
    // useMemo로 썸네일 URL 캐싱 (무한 재생성 방지)
    const thumbnailUrl = useMemo(() => {
        if (route && route.length > 0) {
            return generateRouteThumbImage(route);
        }
        return thumbnail;
    }, [route, thumbnail]);

    if (!thumbnailUrl) {
        return (
            <div style={{
                ...thumbnailMapStyle,
                background: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
                fontSize: '12px'
            }}>
                🗺️
            </div>
        );
    }

    return (
        <div style={{
            ...thumbnailMapStyle,
            overflow: 'hidden',
            position: 'relative'
        }}>
            <img
                src={thumbnailUrl}
                alt="경로 썸네일"
                style={{
                    width: '100%',
                    height: '120%',
                    objectFit: 'cover',
                    display: 'block',
                    position: 'relative',
                    top: '-10%'
                }}
                onError={(e) => {
                    e.target.style.display = 'none';
                    const fallback = document.createElement('div');
                    Object.assign(fallback.style, {
                        ...thumbnailMapStyle,
                        background: '#f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#999',
                        fontSize: '12px'
                    });
                    fallback.textContent = '🗺️';
                    e.target.parentElement.appendChild(fallback);
                }}
            />
        </div>
    );
}

function RecentRecords({ onRefresh, onRecordClick, user }) {
    const [records, setRecords] = useState([]);
    const [stats, setStats] = useState({
        totalDistance: 0,
        totalDuration: 0,
        avgPace: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && user.id) {
            loadRecords();
        }
    }, [onRefresh, user]);

    const loadRecords = async () => {
        console.log('📋 서버에서 기록 로딩 시작... User ID:', user?.id);
        setLoading(true);
        try {
            const response = await api.request(`${import.meta.env.VITE_API_URL}/api/running/sessions/completed?userId=${user.id}`, {
                method: 'GET',
                headers: {
                    'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
                }
            });

            if (response.ok) {
                let sessions = await response.json();
                console.log('📋 서버 응답 데이터:', sessions);

                // 배열이 아니면 빈 배열로 처리
                if (!Array.isArray(sessions)) {
                    console.warn('⚠️ 서버 응답이 배열이 아닙니다:', typeof sessions);
                    sessions = [];
                }

                // JSON 문자열 필드 파싱
                sessions = sessions.map(session => {
                    try {
                        return {
                            ...session,
                            route: session.route ? JSON.parse(session.route) : [],
                            splits: session.splits ? JSON.parse(session.splits) : [],
                            wateringSegments: session.wateringSegments ? JSON.parse(session.wateringSegments) : []
                        };
                    } catch (e) {
                        console.error('❌ JSON 파싱 실패:', e, session);
                        return {
                            ...session,
                            route: [],
                            splits: [],
                            wateringSegments: []
                        };
                    }
                });

                console.log('📋 서버에서 가져온 기록 수:', sessions.length);

                // 통계 계산
                if (sessions.length > 0) {
                    const totalDistance = sessions.reduce((sum, r) => sum + (r.distance || 0), 0);
                    const totalDuration = sessions.reduce((sum, r) => sum + (r.duration || 0), 0);
                    const avgPace = totalDistance > 0 ? (totalDuration / 60) / totalDistance : 0;

                    setStats({
                        totalDistance,
                        totalDuration,
                        avgPace
                    });
                }

                setRecords(sessions);
            } else {
                console.error('❌ 기록 로딩 실패:', response.status);
                setRecords([]);
            }
        } catch (err) {
            console.error('❌ 기록 로딩 실패:', err);
            setRecords([]);
        } finally {
            setLoading(false);
        }
    };

    if (records.length === 0) {
        return (
            <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#999'
            }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏃</div>
                <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>아직 기록이 없습니다</div>
                <div style={{ fontSize: '14px' }}>첫 러닝을 시작해보세요!</div>
            </div>
        );
    }

    return (
        <div style={{ width: '100%' }}>
            {/* 통계 섹션 */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                padding: '20px 16px',
                margin: '12px 0',
                backgroundColor: '#fff',
                borderRadius: '16px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                border: '1px solid #f0f0f0'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>총 거리</div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#1a1a1a' }}>
                        {formatDistance(stats.totalDistance)}
                    </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>총 시간</div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#1a1a1a' }}>
                        {formatTime(stats.totalDuration)}
                    </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>평균 페이스</div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#1a1a1a' }}>
                        {stats.avgPace.toFixed(1)} <span style={{ fontSize: '12px', fontWeight: '500' }}>min/km</span>
                    </div>
                </div>
            </div>

            {/* 최근 활동 섹션 */}
            <div style={{ padding: '0' }}>
                <h3 style={{
                    margin: '24px 0 12px 10px',
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#ffffff'
                }}>
                    최근활동
                </h3>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    padding: '0'
                }}>
                    {records.map(record => (
                        <div
                            key={record.sessionId}
                            onClick={() => onRecordClick(record)}
                            style={{
                                display: 'flex',
                                gap: '16px',
                                padding: '16px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                backgroundColor: '#fff',
                                borderRadius: '16px',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                                border: '1px solid #f0f0f0'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            {/* 썸네일 지도 (오버레이 없이 깔끔) */}
                            <div style={{ width: '110px', height: '100px', flexShrink: 0 }}>
                                <RouteThumbnail route={record.route} thumbnail={record.thumbnail} />
                            </div>

                            {/* 기록 정보 (거리 표시 복구) */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {/* 상단: 날짜 + 시간 */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'flex-start',
                                    alignItems: 'center',
                                    fontSize: '13px',
                                    color: '#666',
                                    fontWeight: '500'
                                }}>
                                    <span>
                                        {(() => {
                                            const date = new Date(record.timestamp);
                                            const year = date.getFullYear();
                                            const month = date.getMonth() + 1;
                                            const day = date.getDate();
                                            const hours = String(date.getHours()).padStart(2, '0');
                                            const minutes = String(date.getMinutes()).padStart(2, '0');
                                            return `${year}년${month}월${day}일 ${hours}:${minutes}`;
                                        })()}
                                    </span>
                                </div>

                                {/* 중간: 거리 강조 (24px) */}
                                <div style={{
                                    fontSize: '24px',
                                    fontWeight: '800',
                                    color: '#4318FF',
                                    lineHeight: '1.2'
                                }}>
                                    {formatDistance(record.distance)}
                                </div>

                                {/* 하단: 시간 + 페이스 + 칼로리 (14px) */}
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '12px',
                                    fontSize: '11px',
                                    color: '#444',
                                    fontWeight: '500'
                                }}>
                                    <span style={{ color: '#1a1a1a', fontWeight: '600' }}>
                                        {(() => {
                                            const totalSeconds = Math.floor(record.duration);
                                            const minutes = Math.floor(totalSeconds / 60);
                                            const seconds = totalSeconds % 60;
                                            return `${minutes}분 ${seconds}초`;
                                        })()}
                                    </span>
                                    <span>{record.pace.toFixed(1)} min/km</span>
                                    <span>{Math.floor(record.distance * 60)} kcal</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ height: '20px' }}></div>
            </div>
        </div>
    );
}

export default RecentRecords;

import { useState, useEffect } from 'react';
import { getRecentSessions } from '../../utils/db';
import { formatDistance, formatTime } from '../../utils/gps';
import { generateRouteThumbImage } from '../../utils/mapThumbnail';

const thumbnailMapStyle = {
    width: '120px',
    height: '100px',
    borderRadius: '8px'
};

function RouteThumbnail({ route, thumbnail }) {
    // 썸네일 URL이 있으면 사용, 없으면 route로 생성
    const thumbnailUrl = thumbnail || (route && route.length > 0 ? generateRouteThumbImage(route) : null);

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

function RecentRecords({ onRefresh, onRecordClick }) {
    const [records, setRecords] = useState([]);
    const [stats, setStats] = useState({
        totalDistance: 0,
        totalDuration: 0,
        avgSpeed: 0
    });

    useEffect(() => {
        loadRecords();
    }, [onRefresh]);

    const loadRecords = async () => {
        console.log('📋 최근 기록 로딩 시작...');
        try {
            // 모든 기록 가져오기
            const recent = await getRecentSessions(100);
            console.log('📋 가져온 기록 수:', recent.length);

            // 통계 계산
            if (recent.length > 0) {
                const totalDistance = recent.reduce((sum, r) => sum + r.distance, 0);
                const totalDuration = recent.reduce((sum, r) => sum + r.duration, 0);
                const avgSpeed = totalDuration > 0 ? (totalDistance / (totalDuration / 3600)) : 0;

                setStats({
                    totalDistance,
                    totalDuration,
                    avgSpeed
                });
            }

            setRecords(recent);
        } catch (err) {
            console.error('❌ 기록 로딩 실패:', err);
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
                padding: '20px 0',
                margin: '0',
                backgroundColor: '#f9f9f9',
                borderBottom: '1px solid #eee'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>총 거리</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a1a' }}>
                        {formatDistance(stats.totalDistance)}
                    </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>총 시간</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a1a' }}>
                        {formatTime(stats.totalDuration)}
                    </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>평균 속도</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a1a' }}>
                        {stats.avgSpeed.toFixed(1)} <span style={{ fontSize: '12px', fontWeight: '500' }}>km/h</span>
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
                            {/* 썸네일 지도 & 이동거리 오버레이 */}
                            <div style={{ position: 'relative', width: '120px', height: '100px', flexShrink: 0 }}>
                                <RouteThumbnail route={record.route} thumbnail={record.thumbnail} />
                                {/* 어두운 오버레이 */}
                                <div style={{
                                    position: 'absolute',
                                    top: 0, left: 0, right: 0, bottom: 0,
                                    backgroundColor: 'rgba(0,0,0,0.3)',
                                    borderRadius: '8px',
                                    pointerEvents: 'none'
                                }}></div>
                                {/* 이동 거리 텍스트 */}
                                <div style={{
                                    position: 'absolute',
                                    top: '50%', left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    fontSize: '20px',
                                    fontWeight: '800',
                                    color: '#fff',
                                    textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                                    width: '100%',
                                    textAlign: 'center',
                                    zIndex: 10
                                }}>
                                    {formatDistance(record.distance)}
                                </div>
                            </div>

                            {/* 기록 정보 */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px' }}>
                                {/* 상단: 날짜 + 시간 */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'flex-start',
                                    alignItems: 'center',
                                    fontSize: '14px',
                                    color: '#555',
                                    fontWeight: '600'
                                }}>
                                    <span>
                                        {new Date(record.timestamp).toLocaleDateString()}
                                        <span style={{ margin: '0 8px', color: '#ddd' }}>|</span>
                                        {new Date(record.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                    </span>
                                </div>

                                {/* 하단: 러닝시간 (크게) + 페이스/칼로리 */}
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '6px'
                                }}>
                                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#1a1a1a' }}>
                                        {(() => {
                                            const totalSeconds = Math.floor(record.duration);
                                            const minutes = Math.floor(totalSeconds / 60);
                                            const seconds = totalSeconds % 60;
                                            return `${minutes}분 ${seconds}초`;
                                        })()}
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px', fontSize: '14px', color: '#666', fontWeight: '500' }}>
                                        <span>{record.pace.toFixed(1)} min/km</span>
                                        <span style={{ color: '#eee' }}>|</span>
                                        <span>{Math.floor(record.distance * 60)} kcal</span>
                                    </div>
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

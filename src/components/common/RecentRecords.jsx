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
                // borderRadius: '16px', // 꽉 차게 보이려면 라운드 제거 혹은 유지? 이미지상 박스가 보여야 하니 유지하되 margin만 0?
                // 요청: "좌우로 최대한 확장". margin 0이면 화면 끝에 붙음.
                // borderRadius를 유지하면 끝이 둥글게 됨. 일단 유지.
                borderBottom: '1px solid #eee' // 구분선 추가
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
                    margin: '24px 0 12px 0',
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#ffffff'
                }}>
                    최근활동
                </h3>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0', // 아이템 간 간격 없애고 구분선으로 처리? 아니면 gap 유지? 리스트 느낌이니 gap 없애고 borderBottom 추천
                    padding: '0'
                }}>
                    {records.map(record => (
                        <div
                            key={record.sessionId}
                            onClick={() => onRecordClick(record)}
                            style={{
                                display: 'flex',
                                gap: '12px',
                                padding: '16px 0',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                backgroundColor: '#fff',
                                borderBottom: '1px solid #f0f0f0'
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}
                        >
                            {/* 썸네일 지도 */}
                            <RouteThumbnail route={record.route} thumbnail={record.thumbnail} />

                            {/* 기록 정보 */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {/* 상단: 날짜 + 시간 */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'flex-start',
                                    alignItems: 'center',
                                    fontSize: '11px',
                                    color: '#999',
                                    marginBottom: '4px'
                                }}>
                                    <span>
                                        {new Date(record.timestamp).toLocaleDateString()} {new Date(record.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                    </span>
                                </div>

                                {/* 중간: 키로미터 */}
                                <div style={{
                                    fontSize: '20px',
                                    fontWeight: '700',
                                    color: '#4318FF'
                                }}>
                                    {formatDistance(record.distance)}
                                </div>

                                {/* 하단: 러닝시간 + 분당 킬로미터 + 칼로리 */}
                                <div style={{
                                    display: 'flex',
                                    gap: '12px',
                                    fontSize: '12px',
                                    color: '#999'
                                }}>
                                    <span>
                                        {(() => {
                                            const h = Math.floor(record.duration / 3600);
                                            const m = Math.floor((record.duration % 3600) / 60);
                                            return h > 0 ? `${h}시 ${m}분` : `${m}분`;
                                        })()}
                                    </span>
                                    <span>{record.pace.toFixed(1)} min/km</span>
                                    <span>{Math.floor(record.distance * 60)} kcal</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 하단 여백 */}
                <div style={{ height: '20px' }}></div>
            </div>
        </div>
    );
}

export default RecentRecords;

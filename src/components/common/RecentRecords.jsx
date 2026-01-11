import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatTime } from '../../utils/gps';
import { formatDistance as formatDistanceUtil, formatPace } from '../../utils/unitConverter';
import { useUnit } from '../../contexts/UnitContext';
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

function RecentRecords({ onRefresh, onRecordClick, user, selectedDate, hideTitle = false, showAll = false, fetchUrl, filter, limit }) {
    const { t } = useTranslation();
    const { unit } = useUnit();
    const [records, setRecords] = useState([]);
    const [displayedRecords, setDisplayedRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && user.id) {
            loadRecords();
        }
    }, [user, fetchUrl]); // onRefresh를 제거하여 부모 리렌더링 시 자동 호출 방지



    const loadRecords = async () => {
        console.log('📋 서버에서 기록 로딩 시작... User ID:', user?.id);
        setLoading(true);
        try {
            const url = fetchUrl || `${import.meta.env.VITE_API_URL}/api/running/sessions/completed?userId=${user.id}`;
            const response = await api.request(url, {
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

    // 즐겨찾기 토글 함수
    const handleToggleBookmark = async (e, record) => {
        e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
        try {
            const response = await api.request(`${import.meta.env.VITE_API_URL}/api/running/session/${record.sessionId}/bookmark`, {
                method: 'POST',
                headers: {
                    'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
                }
            });

            if (response.ok) {
                const updatedSession = await response.json();
                console.log('✅ 즐겨찾기 업데이트 성공:', updatedSession.isBookmarked);

                // 로컬 상태 업데이트
                const updatedRecords = records.map(r =>
                    r.sessionId === record.sessionId ? { ...r, isBookmarked: updatedSession.isBookmarked } : r
                );
                setRecords(updatedRecords);

                // 부모 컴포넌트 리프레시 요청 (필요한 경우)
                if (onRefresh) onRefresh();
            }
        } catch (err) {
            console.error('❌ 즐겨찾기 토글 실패:', err);
        }
    };

    // selectedDate 및 filter에 따라 기록 필터링
    useEffect(() => {
        let filtered = [...records];

        if (selectedDate) {
            filtered = filtered.filter(r => {
                const recordDate = new Date(r.timestamp);
                return recordDate.toDateString() === selectedDate.toDateString();
            });
        }

        if (typeof filter === 'function') {
            filtered = filtered.filter(filter);
        }

        // limit 적용
        if (limit && limit > 0) {
            filtered = filtered.slice(0, limit);
        }

        if (showAll || selectedDate) {
            setDisplayedRecords(filtered);
        } else {
            setDisplayedRecords([]); // 날짜 미선택 시 표시하지 않음
        }
    }, [records, selectedDate, showAll, filter, limit]);

    if (records.length === 0) {
        return (
            <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#999'
            }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏃</div>
                <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>{t('profile.noRecords')}</div>
                <div style={{ fontSize: '14px' }}>첫 러닝을 시작해보세요!</div>
            </div>
        );
    }

    return (
        <div style={{ width: '100%' }}>

            {/* 최근 활동 섹션 */}
            <div style={{ padding: '0' }}>
                {!hideTitle && (
                    <h3 style={{
                        margin: '24px 0 12px 10px',
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#ffffff'
                    }}>
                        {t('profile.recentRecords')}
                    </h3>
                )}

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    padding: '0'
                }}>
                    {displayedRecords.map(record => (
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
                                    fontWeight: '500',
                                    gap: '8px'
                                }}>
                                    <span>
                                        {(() => {
                                            const date = new Date(record.timestamp);
                                            const year = date.getFullYear();
                                            const month = date.getMonth() + 1;
                                            const day = date.getDate();
                                            const hours = String(date.getHours()).padStart(2, '0');
                                            const minutes = String(date.getMinutes()).padStart(2, '0');
                                            return `${year}${t('common.year')}${month}${t('common.month')}${day}${t('common.day')} ${hours}:${minutes}`;
                                        })()}
                                    </span>
                                    {record.courseId && (
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
                                                                <span style={{ fontSize: '14px' }}>🔄</span>
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
                                                                <span style={{ fontSize: '14px' }}>👥</span>
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
                                                                <span style={{ fontSize: '14px' }}>🏆</span>
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

                                {/* 중간: 거리 강조 (24px) */}
                                <div style={{
                                    fontSize: '24px',
                                    fontWeight: '800',
                                    color: '#4318FF',
                                    lineHeight: '1.2'
                                }}>
                                    {formatDistanceUtil(record.distance, unit)}
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
                                            return `${minutes}${t('common.minute')} ${seconds}${t('common.second')}`;
                                        })()}
                                    </span>
                                    <span>{formatPace(record.pace * 60, unit)}</span>
                                    <span>{Math.floor(record.distance * 60)} kcal</span>
                                </div>
                            </div>

                            {/* 즐겨찾기 아이콘 (우측 하단) */}
                            <div
                                onClick={(e) => handleToggleBookmark(e, record)}
                                style={{
                                    alignSelf: 'flex-end',
                                    fontSize: '24px',
                                    padding: '4px',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <span style={{ color: record.isBookmarked ? '#ff4d4f' : '#ccc' }}>
                                    {record.isBookmarked ? '❤️' : '🤍'}
                                </span>
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

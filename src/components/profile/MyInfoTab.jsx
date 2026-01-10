import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getGradeInfo, getBadgeStyle, RUNNER_GRADE_INFO } from '../../constants/runnerGradeInfo';
import { formatDistance } from '../../utils/gps';
import { api } from '../../utils/api';

function MyInfoTab({ user }) {
    const { t } = useTranslation();
    const [activityArea, setActivityArea] = useState(null);
    const [isLoadingArea, setIsLoadingArea] = useState(true);
    const [myCrews, setMyCrews] = useState({ primaryCrew: null, secondaryCrews: [] });
    const [isLoadingCrews, setIsLoadingCrews] = useState(true);
    const [userStats, setUserStats] = useState(user.stats || null);

    useEffect(() => {
        const fetchUserStats = async () => {
            if (!userStats && user.id) {
                try {
                    const response = await api.request(`${import.meta.env.VITE_API_URL}/user/${user.id}/profile`, {
                        headers: {
                            'Authorization': user.accessToken?.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
                        }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        if (data.stats) {
                            setUserStats(data.stats);
                        }
                    }
                } catch (error) {
                    console.error('Failed to fetch user stats for MyInfoTab:', error);
                }
            }
        };
        fetchUserStats();
    }, [user.id, userStats]);

    const displayBestDistance = userStats?.bestDistance || 0;

    useEffect(() => {
        const fetchActivityArea = async () => {
            if (!user || !user.accessToken) return;

            setIsLoadingArea(true);
            try {
                const response = await api.request(`${import.meta.env.VITE_API_URL}/user/activity-area`, {
                    method: 'GET',
                    headers: {
                        'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setActivityArea(data);
                    console.log('📍 주 활동 지역 정보:', data);
                }
            } catch (error) {
                console.error('주 활동 지역 조회 실패:', error);
            } finally {
                setIsLoadingArea(false);
            }
        };

        fetchActivityArea();
    }, [user]);

    useEffect(() => {
        const fetchMyCrews = async () => {
            if (!user || !user.accessToken) return;

            setIsLoadingCrews(true);
            try {
                const response = await api.request(`${import.meta.env.VITE_API_URL}/crew/my-crews`, {
                    method: 'GET',
                    headers: {
                        'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setMyCrews(data);
                    console.log('👥 내 크루 정보:', data);
                }
            } catch (error) {
                console.error('내 크루 조회 실패:', error);
            } finally {
                setIsLoadingCrews(false);
            }
        };

        fetchMyCrews();
    }, [user]);

    // Google Static Maps API로 지도 이미지 URL 생성
    const getMapImageUrl = (latitude, longitude) => {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        const zoom = 14;
        const size = '600x300';
        const markerColor = '0x00f2fe';

        return `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=${zoom}&size=${size}&markers=color:${markerColor}%7C${latitude},${longitude}&key=${apiKey}&style=feature:poi|visibility:off&style=feature:transit|visibility:off`;
    };

    // 대표 크루 설정
    const handleSetPrimaryCrew = async (crewId) => {
        if (!user || !user.accessToken) return;

        try {
            const response = await api.request(`${import.meta.env.VITE_API_URL}/crew/${crewId}/set-primary`, {
                method: 'PUT',
                headers: {
                    'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
                }
            });

            if (response.ok) {
                alert('대표 크루가 변경되었습니다!');
                // 크루 목록 새로고침
                const crewsResponse = await api.request(`${import.meta.env.VITE_API_URL}/crew/my-crews`, {
                    method: 'GET',
                    headers: {
                        'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
                    }
                });
                if (crewsResponse.ok) {
                    const data = await crewsResponse.json();
                    setMyCrews(data);
                }
            } else {
                const error = await response.text();
                alert('대표 크루 변경 실패: ' + error);
            }
        } catch (error) {
            console.error('대표 크루 변경 오류:', error);
            alert('대표 크루 변경 중 오류가 발생했습니다.');
        }
    };

    return (
        <div>
            <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: '700' }}>{t('profile.tabs.info')}</h2>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                maxWidth: '600px'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '20px',
                    backgroundColor: '#f9f9f9',
                    borderRadius: '12px'
                }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                        {user.nicknameImage ? (
                            <img src={user.nicknameImage} alt={user.nickname} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', backgroundColor: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>👤</div>
                        )}
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>{user.nickname}</div>
                        <div style={{ fontSize: '14px', color: '#666' }}>{user.email}</div>
                    </div>
                </div>

                {user.runnerGrade && (() => {
                    const gradeInfo = getGradeInfo(user.runnerGrade);
                    return (
                        <div style={{
                            padding: '24px',
                            backgroundColor: '#fff',
                            borderRadius: '16px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                            border: '1px solid #f0f0f0'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '20px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '32px' }}>{gradeInfo.emoji}</span>
                                    <div>
                                        <div style={{ fontSize: '14px', color: '#94a3b8', fontWeight: '500' }}>{t('profile.grade')}</div>
                                        <div style={{ fontSize: '20px', fontWeight: '800', color: gradeInfo.color, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {gradeInfo.name}
                                            {gradeInfo.badge && (
                                                <span style={getBadgeStyle(gradeInfo.badge, gradeInfo.color)}>
                                                    {gradeInfo.badge}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 게이지 바 영역 */}
                            <div style={{ marginTop: '16px' }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '8px'
                                }}>
                                    <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>
                                        {formatDistance(gradeInfo.minDistance)}
                                    </span>
                                    <span style={{ fontSize: '15px', color: gradeInfo.color, fontWeight: '800' }}>
                                        {formatDistance(displayBestDistance)}
                                    </span>
                                    <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>
                                        {formatDistance(gradeInfo.maxDistance)}
                                    </span>
                                </div>
                                <div style={{
                                    height: '14px',
                                    backgroundColor: '#f1f5f9',
                                    borderRadius: '7px',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)'
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: 0,
                                        height: '100%',
                                        width: (() => {
                                            const best = displayBestDistance;
                                            const min = gradeInfo.minDistance;
                                            const max = gradeInfo.maxDistance;
                                            if (max === min) return '100%';
                                            const progress = ((best - min) / (max - min)) * 100;
                                            return `${Math.min(100, Math.max(0, progress))}%`;
                                        })(),
                                        background: `linear-gradient(90deg, ${gradeInfo.color} 0%, ${gradeInfo.color}dd 100%)`,
                                        borderRadius: '7px',
                                        transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                        boxShadow: `0 0 10px ${gradeInfo.color}40`,
                                        overflow: 'hidden'
                                    }}>
                                        {/* Shine 효과 */}
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                                            animation: 'gauge-shine 2s infinite linear'
                                        }} />
                                    </div>
                                </div>
                                <style>{`
                                    @keyframes gauge-shine {
                                        0% { transform: translateX(-100%); }
                                        100% { transform: translateX(100%); }
                                    }
                                `}</style>
                                <div style={{
                                    marginTop: '10px',
                                    fontSize: '13px',
                                    color: '#64748b',
                                    fontWeight: '500',
                                    textAlign: 'center'
                                }}>
                                    다음 등급까지 {(() => {
                                        const best = displayBestDistance;
                                        const max = gradeInfo.maxDistance;
                                        const remain = max - best;
                                        return remain > 0 ? `${formatDistance(remain)}` : '목표 달성!';
                                    })()} 남음
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* 내 크루 */}
                {isLoadingCrews ? (
                    <div style={{
                        padding: '20px',
                        backgroundColor: '#f9f9f9',
                        borderRadius: '12px',
                        textAlign: 'center',
                        color: '#999'
                    }}>
                        크루 정보 로딩 중...
                    </div>
                ) : (myCrews.primaryCrew || myCrews.secondaryCrews.length > 0) ? (
                    <div style={{
                        padding: '20px',
                        backgroundColor: '#f9f9f9',
                        borderRadius: '12px'
                    }}>
                        <div style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>내 크루</div>

                        {/* 대표 크루 */}
                        {myCrews.primaryCrew && (() => {
                            let crewImage;
                            try {
                                crewImage = JSON.parse(myCrews.primaryCrew.imageUrl);
                            } catch {
                                crewImage = { url: myCrews.primaryCrew.imageUrl };
                            }

                            return (
                                <div style={{
                                    padding: '16px',
                                    backgroundColor: '#fff',
                                    borderRadius: '12px',
                                    border: '2px solid #fa8231',
                                    marginBottom: myCrews.secondaryCrews.length > 0 ? '16px' : '0'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '50px',
                                            height: '50px',
                                            borderRadius: '10px',
                                            background: crewImage.bg || '#ddd',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '24px',
                                            flexShrink: 0,
                                            overflow: 'hidden'
                                        }}>
                                            {crewImage.url ? (
                                                <img src={crewImage.url} alt={myCrews.primaryCrew.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                crewImage.emoji || '🏃'
                                            )}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                                <span style={{ fontSize: '16px', fontWeight: '700' }}>{myCrews.primaryCrew.name}</span>
                                                <span style={{
                                                    fontSize: '10px',
                                                    fontWeight: '600',
                                                    color: '#fa8231',
                                                    background: '#fff0e6',
                                                    padding: '2px 6px',
                                                    borderRadius: '6px'
                                                }}>
                                                    🌟 대표 크루
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#888' }}>
                                                {myCrews.primaryCrew.memberCount || 0}명
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* 보조 크루 */}
                        {myCrews.secondaryCrews.length > 0 && (
                            <div>
                                <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
                                    보조 크루 ({myCrews.secondaryCrews.length})
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {myCrews.secondaryCrews.map((crew) => {
                                        let crewImage;
                                        try {
                                            crewImage = JSON.parse(crew.imageUrl);
                                        } catch {
                                            crewImage = { url: crew.imageUrl };
                                        }

                                        return (
                                            <div key={crew.id} style={{
                                                padding: '12px',
                                                backgroundColor: '#fff',
                                                borderRadius: '10px',
                                                border: '1px solid #e0e0e0',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px'
                                            }}>
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '8px',
                                                    background: crewImage.bg || '#ddd',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '20px',
                                                    flexShrink: 0,
                                                    overflow: 'hidden'
                                                }}>
                                                    {crewImage.url ? (
                                                        <img src={crewImage.url} alt={crew.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        crewImage.emoji || '🏃'
                                                    )}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '2px' }}>{crew.name}</div>
                                                    <div style={{ fontSize: '11px', color: '#888' }}>{crew.memberCount || 0}명</div>
                                                </div>
                                                <button
                                                    onClick={() => handleSetPrimaryCrew(crew.id)}
                                                    style={{
                                                        padding: '6px 12px',
                                                        borderRadius: '8px',
                                                        border: '1px solid #fa8231',
                                                        backgroundColor: '#fff',
                                                        color: '#fa8231',
                                                        fontSize: '11px',
                                                        fontWeight: '600',
                                                        cursor: 'pointer',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    대표로 설정
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                ) : null}

                {/* 주 활동 지역 정보 */}
                {isLoadingArea ? (
                    <div style={{
                        padding: '20px',
                        backgroundColor: '#f9f9f9',
                        borderRadius: '12px',
                        textAlign: 'center',
                        color: '#999'
                    }}>
                        {t('common.loading')}
                    </div>
                ) : activityArea ? (
                    <div style={{
                        padding: '20px',
                        backgroundColor: '#f9f9f9',
                        borderRadius: '12px'
                    }}>
                        <div style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>주 활동 지역</div>

                        {/* 지도 이미지 */}
                        {activityArea.latitude && activityArea.longitude && (
                            <div style={{
                                width: '100%',
                                height: '200px',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                marginBottom: '12px',
                                border: '1px solid #e0e0e0'
                            }}>
                                <img
                                    src={getMapImageUrl(activityArea.latitude, activityArea.longitude)}
                                    alt="주 활동 지역"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                />
                            </div>
                        )}

                        {/* 전체 주소 */}
                        {activityArea.adminLevelFull && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '8px',
                                padding: '12px',
                                backgroundColor: '#fff',
                                borderRadius: '8px',
                                border: '1px solid #e0e0e0'
                            }}>
                                <span style={{ fontSize: '16px', flexShrink: 0 }}>📍</span>
                                <span style={{
                                    fontSize: '14px',
                                    color: '#333',
                                    lineHeight: '1.5',
                                    wordBreak: 'keep-all'
                                }}>
                                    {activityArea.adminLevelFull}
                                </span>
                            </div>
                        )}
                    </div>
                ) : null}
            </div>
        </div>
    );
}

export default MyInfoTab;

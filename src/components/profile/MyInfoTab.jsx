import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getGradeInfo, getBadgeStyle } from '../../constants/runnerGradeInfo';
import { api } from '../../utils/api';

function MyInfoTab({ user }) {
    const { t } = useTranslation();
    const [activityArea, setActivityArea] = useState(null);
    const [isLoadingArea, setIsLoadingArea] = useState(true);

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

    // Google Static Maps API로 지도 이미지 URL 생성
    const getMapImageUrl = (latitude, longitude) => {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        const zoom = 14;
        const size = '600x300';
        const markerColor = '0x00f2fe';

        return `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=${zoom}&size=${size}&markers=color:${markerColor}%7C${latitude},${longitude}&key=${apiKey}&style=feature:poi|visibility:off&style=feature:transit|visibility:off`;
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
                            padding: '20px',
                            backgroundColor: '#f9f9f9',
                            borderRadius: '12px'
                        }}>
                            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>{t('profile.grade')}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '32px' }}>{gradeInfo.emoji}</span>
                                <span style={{ fontSize: '20px', fontWeight: '700', color: gradeInfo.color }}>
                                    {gradeInfo.nameKo}
                                </span>
                                {gradeInfo.badge && (
                                    <span style={getBadgeStyle(gradeInfo.badge, gradeInfo.color)}>
                                        {gradeInfo.badge}
                                    </span>
                                )}
                            </div>
                            <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>{gradeInfo.description}</div>
                        </div>
                    );
                })()}

                {user.crewName && (
                    <div style={{
                        padding: '20px',
                        backgroundColor: '#f9f9f9',
                        borderRadius: '12px'
                    }}>
                        <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>{t('crew.name')}</div>
                        <div style={{ fontSize: '18px', fontWeight: '700' }}>{user.crewName}</div>
                    </div>
                )}

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

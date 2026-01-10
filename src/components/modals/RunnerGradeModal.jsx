import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatDistance } from '../../utils/gps';
import { getGradeInfo, getBadgeStyle, RUNNER_GRADE_INFO } from '../../constants/runnerGradeInfo';
import { api } from '../../utils/api';
import './RunnerGradeModal.css';

function RunnerGradeModal({ user, onClose }) {
    const { t } = useTranslation();
    const [userStats, setUserStats] = React.useState(user.stats || null);
    const currentGrade = user.runnerGrade ? getGradeInfo(user.runnerGrade) : null;

    React.useEffect(() => {
        const fetchStats = async () => {
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
                    console.error('Failed to fetch user stats for grade modal:', error);
                }
            }
        };
        fetchStats();
    }, [user.id, userStats]);

    // use userStats if available
    const displayBestDistance = userStats?.bestDistance || 0;

    return (
        <div className="result-screen-overlay">
            <div className="result-screen-container">
                {/* 헤더 */}
                <div className="result-header">
                    <button
                        className="back-button"
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '24px',
                            cursor: 'pointer',
                            padding: '8px',
                            color: '#333'
                        }}
                    >
                        ←
                    </button>
                    <h1 className="result-title">🏅 {t('modal.runnerGrade.title')}</h1>
                    <div style={{ width: '40px' }}></div>
                </div>

                {/* 스크롤 가능한 컨텐츠 영역 */}
                <div className="result-content" style={{ paddingBottom: '40px' }}>
                    {/* 현재 등급 카드 */}
                    {currentGrade && (
                        <div style={{
                            background: `linear-gradient(135deg, ${currentGrade.color}15 0%, ${currentGrade.color}05 100%)`,
                            border: `3px solid ${currentGrade.color}`,
                            borderRadius: '20px',
                            padding: '32px 24px',
                            marginBottom: '32px',
                            textAlign: 'center',
                            boxShadow: `0 8px 24px ${currentGrade.color}20`
                        }}>
                            <div style={{
                                fontSize: '14px',
                                color: '#666',
                                marginBottom: '12px',
                                fontWeight: '600',
                                letterSpacing: '0.5px'
                            }}>
                                {t('profile.grade')}
                            </div>
                            <div style={{ fontSize: '64px', marginBottom: '12px' }}>
                                {currentGrade.emoji}
                            </div>
                            <div style={{
                                fontSize: '28px',
                                fontWeight: '800',
                                color: currentGrade.color,
                                marginBottom: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px'
                            }}>
                                {currentGrade.nameKo}
                                {currentGrade.badge && (
                                    <span style={{
                                        ...getBadgeStyle(currentGrade.badge, currentGrade.color),
                                        fontSize: '14px',
                                        padding: '4px 12px'
                                    }}>
                                        {currentGrade.badge}
                                    </span>
                                )}
                            </div>
                            {/* 업적 진행도 게이지 */}
                            <div style={{ marginTop: '24px' }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '8px',
                                    padding: '0 4px'
                                }}>
                                    <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>
                                        {formatDistance(currentGrade.minDistance)}
                                    </span>
                                    <span style={{ fontSize: '14px', color: currentGrade.color, fontWeight: '800' }}>
                                        {formatDistance(displayBestDistance)}
                                    </span>
                                    <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>
                                        {formatDistance(currentGrade.maxDistance)}
                                    </span>
                                </div>
                                <div style={{
                                    height: '12px',
                                    backgroundColor: 'rgba(0,0,0,0.05)',
                                    borderRadius: '6px',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: 0,
                                        height: '100%',
                                        width: (() => {
                                            const best = displayBestDistance;
                                            const min = currentGrade.minDistance;
                                            const max = currentGrade.maxDistance;
                                            if (max === min) return '100%';
                                            const progress = ((best - min) / (max - min)) * 100;
                                            return `${Math.min(100, Math.max(0, progress))}%`;
                                        })(),
                                        background: `linear-gradient(90deg, ${currentGrade.color} 0%, ${currentGrade.color}dd 100%)`,
                                        borderRadius: '6px',
                                        transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                        boxShadow: `0 0 10px ${currentGrade.color}40`,
                                        overflow: 'hidden'
                                    }}>
                                        <div className="gauge-shine-effect"></div>
                                    </div>
                                </div>
                                <div style={{
                                    marginTop: '8px',
                                    fontSize: '12px',
                                    color: '#94a3b8',
                                    fontWeight: '500'
                                }}>
                                    다음 등급까지 {(() => {
                                        const best = displayBestDistance;
                                        const max = currentGrade.maxDistance;
                                        const remain = max - best;
                                        return remain > 0 ? `${formatDistance(remain)}` : '목표 달성!';
                                    })()} 남음
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 등급 시스템 설명 */}
                    <div style={{
                        backgroundColor: '#f8f9fa',
                        borderRadius: '16px',
                        padding: '20px',
                        marginBottom: '24px'
                    }}>
                        <h3 style={{
                            fontSize: '16px',
                            fontWeight: '700',
                            marginBottom: '12px',
                            color: '#333'
                        }}>
                            📊 {t('modal.runnerGrade.title')}
                        </h3>
                        <p style={{
                            fontSize: '14px',
                            color: '#666',
                            lineHeight: '1.6',
                            margin: 0
                        }}>
                            {t('modal.runnerGrade.description')}
                        </p>
                    </div>

                    {/* 모든 등급 목록 */}
                    <h3 style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        marginBottom: '16px',
                        color: '#333'
                    }}>
                        {t('modal.runnerGrade.criteria')}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {Object.entries(RUNNER_GRADE_INFO).map(([key, grade]) => {
                            const isCurrentGrade = user.runnerGrade === key;
                            return (
                                <div
                                    key={key}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px',
                                        padding: '16px',
                                        backgroundColor: isCurrentGrade ? `${grade.color}08` : '#fff',
                                        border: isCurrentGrade ? `2px solid ${grade.color}` : '2px solid #e0e0e0',
                                        borderRadius: '16px',
                                        transition: 'all 0.2s',
                                        boxShadow: isCurrentGrade ? `0 4px 12px ${grade.color}15` : '0 2px 8px rgba(0,0,0,0.04)'
                                    }}
                                >
                                    <div style={{
                                        fontSize: '36px',
                                        flexShrink: 0,
                                        width: '48px',
                                        textAlign: 'center'
                                    }}>
                                        {grade.emoji}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            marginBottom: '6px',
                                            flexWrap: 'wrap'
                                        }}>
                                            <span style={{
                                                fontSize: '18px',
                                                fontWeight: '700',
                                                color: grade.color
                                            }}>
                                                {grade.nameKo}
                                            </span>
                                            {grade.badge && (
                                                <span style={{
                                                    ...getBadgeStyle(grade.badge, grade.color),
                                                    fontSize: '11px'
                                                }}>
                                                    {grade.badge}
                                                </span>
                                            )}
                                            {isCurrentGrade && (
                                                <span style={{
                                                    fontSize: '11px',
                                                    padding: '3px 10px',
                                                    backgroundColor: grade.color,
                                                    color: '#fff',
                                                    borderRadius: '12px',
                                                    fontWeight: '700',
                                                    letterSpacing: '0.3px'
                                                }}>
                                                    {t('profile.grade')}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{
                                            fontSize: '13px',
                                            color: '#666',
                                            lineHeight: '1.5'
                                        }}>
                                            {grade.description}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* 하단 여백 */}
                    <div style={{ height: '40px' }}></div>
                </div>
            </div>
        </div>
    );
}

export default RunnerGradeModal;

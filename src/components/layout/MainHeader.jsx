import React from 'react';
import { getGradeInfo, getGradeBadgeStyle, getBadgeStyle } from '../../constants/runnerGradeInfo';

function MainHeader({ user, onProfileClick, onGradeClick }) {
    return (
        <div className="main-header">
            <div className="main-logo">llrun</div>
            <div className="main-user-profile">
                {/* Crew Badge if joined */}
                {user.crewName && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'rgba(255,255,255,0.1)',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        marginRight: '8px',
                        border: '1px solid rgba(255,255,255,0.2)'
                    }}>
                        <span style={{ fontSize: '14px' }}>
                            {(() => {
                                if (!user.crewImage) return '🏃';
                                try {
                                    const img = JSON.parse(user.crewImage);
                                    if (img.url) {
                                        return <img src={img.url} alt="crew" style={{ width: '16px', height: '16px', borderRadius: '50%', objectFit: 'cover' }} />;
                                    }
                                    return img.emoji || '🏃';
                                } catch {
                                    if (user.crewImage.startsWith('http')) {
                                        return <img src={user.crewImage} alt="crew" style={{ width: '16px', height: '16px', borderRadius: '50%', objectFit: 'cover' }} />;
                                    }
                                    return '🏃';
                                }
                            })()}
                        </span>
                        <span style={{ color: '#fff', fontWeight: '600' }}>{user.crewName}</span>
                    </div>
                )}

                {/* Runner Grade Badge */}
                {user.runnerGrade && (() => {
                    const gradeInfo = getGradeInfo(user.runnerGrade);
                    return (
                        <div
                            style={{
                                ...getGradeBadgeStyle(user.runnerGrade),
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onClick={onGradeClick}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.05)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <span>{gradeInfo.emoji}</span>
                            <span>{gradeInfo.nameKo}</span>
                            {gradeInfo.badge && (
                                <span style={getBadgeStyle(gradeInfo.badge, gradeInfo.color)}>
                                    {gradeInfo.badge}
                                </span>
                            )}
                        </div>
                    );
                })()}

                <div
                    className="user-profile-section"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: '8px',
                        transition: 'all 0.2s'
                    }}
                    onClick={onProfileClick}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                >
                    <div className="user-profile-image">
                        {user.nicknameImage ? (
                            <img src={user.nicknameImage} alt={user.nickname} />
                        ) : (
                            <div className="default-profile-icon">👤</div>
                        )}
                    </div>
                    <span className="user-nickname">{user.nickname}</span>
                </div>
            </div>
        </div>
    );
}

export default MainHeader;

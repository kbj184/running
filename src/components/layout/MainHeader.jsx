import React from 'react';
import { getGradeInfo, getGradeBadgeStyle, getBadgeStyle } from '../../constants/runnerGradeInfo';

function MainHeader({ user, onProfileClick, onGradeClick }) {
    return (
        <div className="main-header">
            <div className="main-logo">llrun</div>
            <div className="main-user-profile">
                {/* Runner Grade Badge - Elite만 표시 */}
                {user.runnerGrade && (() => {
                    const gradeInfo = getGradeInfo(user.runnerGrade);
                    // Elite 등급만 배지로 표시
                    if (gradeInfo.badge === 'Elite') {
                        return (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '6px 12px',
                                    backgroundColor: '#fff',
                                    borderRadius: '20px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                                onClick={onGradeClick}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                }}
                            >
                                <span>👑</span>
                                <span style={{ color: '#1a1a1a' }}>Elite</span>
                            </div>
                        );
                    }
                    return null;
                })()}

                {/* User Avatar */}
                <div
                    className="user-profile-section"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                    onClick={onProfileClick}
                >
                    <div className="user-profile-image">
                        {user.nicknameImage ? (
                            <img src={user.nicknameImage} alt={user.nickname} />
                        ) : (
                            <div className="default-profile-icon">👤</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MainHeader;

import React from 'react';
import { getGradeInfo } from '../../constants/runnerGradeInfo';

function MainHeader({ user, activeTab, onProfileClick, onGradeClick }) {
    // 탭별 캐치 프레이즈 결정
    const getCatchPhrase = () => {
        if (activeTab === 'profile') return "I'm a runner";
        if (activeTab === 'crew') return "We are a crew";
        return "We are runners";
    };

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            height: '56px',
            background: '#f5f5f7',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 16px',
            borderBottom: '1px solid #e8e8e8'
        }}>
            {/* Logo + Catch Phrase */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
            }}>
                <div style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    color: '#1a1a1a',
                    fontStyle: 'italic',
                    letterSpacing: '-1.5px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                    llrun
                </div>
                <div style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#666',
                    fontStyle: 'italic',
                    letterSpacing: '-0.3px',
                    paddingLeft: '12px',
                    borderLeft: '1px solid #d0d0d0'
                }}>
                    {getCatchPhrase()}
                </div>
            </div>

            {/* Right Section: Runner Grade Badge + Avatar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
            }}>
                {/* Runner Grade Badge - show for all grades */}
                {user.runnerGrade && (() => {
                    const gradeInfo = getGradeInfo(user.runnerGrade);
                    return (
                        <div
                            onClick={onGradeClick}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '6px 14px',
                                backgroundColor: '#ffffff',
                                borderRadius: '20px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                                border: '1px solid #f0f0f0'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.03)';
                                e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,0,0,0.12)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)';
                            }}
                        >
                            <span style={{ fontSize: '16px' }}>{gradeInfo.emoji}</span>
                            <span style={{ color: '#1a1a1a', fontSize: '14px' }}>
                                {gradeInfo.badge || gradeInfo.nameKo}
                            </span>
                        </div>
                    );
                })()}

                {/* User Avatar + Nickname */}
                <div
                    onClick={onProfileClick}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    <div
                        style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            background: '#e0e0e0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid #ffffff',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        {user.nicknameImage ? (
                            <img
                                src={user.nicknameImage}
                                alt={user.nickname}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                            />
                        ) : (
                            <div style={{ fontSize: '22px' }}>👤</div>
                        )}
                    </div>
                    <span style={{
                        fontSize: '15px',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        maxWidth: '80px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}>
                        {user.nickname}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default MainHeader;

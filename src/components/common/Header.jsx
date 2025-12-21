import React from 'react';
import './label-toggle.css';

function Header({ totalRunners, proCount, eliteCount, advancedCount, showLabels, onToggleLabels, userCrew, onOpenCreateCrew, onOpenCrewDetail, user, onLogout }) {
    return (
        <header className="app-header">
            <div className="header-content">
                <div className="header-title">
                    <span className="header-icon">🏃</span>
                    <h1>러닝 맵</h1>
                </div>
                <div className="header-stats">
                    <span className="stat-item">
                        <span className="stat-value">{totalRunners}</span>
                        <span className="stat-label">전체</span>
                    </span>
                    <span className="stat-divider">|</span>
                    <span className="stat-item">
                        <span className="stat-value">{advancedCount}</span>
                        <span className="stat-label">고급</span>
                    </span>
                    <span className="stat-divider">|</span>
                    <span className="stat-item">
                        <span className="stat-value">{proCount}</span>
                        <span className="stat-label">프로</span>
                    </span>
                    <span className="stat-divider">|</span>
                    <span className="stat-item">
                        <span className="stat-value">{eliteCount}</span>
                        <span className="stat-label">엘리트</span>
                    </span>
                </div>

                <div className="header-actions" style={{ display: 'flex', gap: '8px' }}>
                    {!userCrew ? (
                        <button
                            className="create-crew-button"
                            onClick={onOpenCreateCrew}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '20px',
                                border: 'none',
                                backgroundColor: '#1a1a1a',
                                color: 'white',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '14px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }}
                        >
                            <span>✨</span> 크루 만들기
                        </button>
                    ) : (
                        <button
                            className="my-crew-badge"
                            onClick={onOpenCrewDetail}
                            style={{
                                padding: '8px 16px',
                                background: userCrew.image.bg,
                                borderRadius: '20px',
                                color: 'white',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '14px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'transform 0.1s'
                            }}
                        >
                            <span>{userCrew.image.emoji}</span>
                            <span>{userCrew.name}</span>
                            <span style={{
                                fontSize: '10px',
                                background: 'rgba(0,0,0,0.2)',
                                padding: '2px 6px',
                                borderRadius: '10px'
                            }}>👑 CAPTAIN</span>
                        </button>
                    )}

                    <button
                        className="label-toggle-button"
                        onClick={onToggleLabels}
                        title={showLabels ? "지명 숨기기" : "지명 표시"}
                    >
                        <span className="toggle-icon">{showLabels ? '🏷️' : '🚫'}</span>
                        <span className="toggle-text">{showLabels ? '지명 ON' : '지명 OFF'}</span>
                    </button>

                    {user && (
                        <div className="user-section" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px', paddingLeft: '12px', borderLeft: '1px solid rgba(255,255,255,0.2)' }}>
                            <span style={{ fontSize: '14px', color: '#e0e0e0' }}>
                                <span style={{ marginRight: '6px' }}>👋</span>
                                {user.name}님
                            </span>
                            <button
                                onClick={onLogout}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    background: 'rgba(255,255,255,0.1)',
                                    color: '#bdbdbd',
                                    fontSize: '12px',
                                    cursor: 'pointer'
                                }}
                            >
                                로그아웃
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Header;

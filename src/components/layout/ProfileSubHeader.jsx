import React from 'react';

function ProfileSubHeader({ profileTab, onTabChange }) {
    return (
        <div style={{
            position: 'fixed',
            top: '60px',
            left: 0,
            right: 0,
            backgroundColor: '#fff',
            borderBottom: '1px solid #e0e0e0',
            zIndex: 999,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
            <div style={{
                display: 'flex',
                gap: '0',
                padding: '0 20px',
                maxWidth: '1200px',
                margin: '0 auto'
            }}>
                <button
                    onClick={() => onTabChange('records')}
                    style={{
                        flex: 1,
                        padding: '16px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: profileTab === 'records' ? '3px solid #1a1a1a' : '3px solid transparent',
                        color: profileTab === 'records' ? '#1a1a1a' : '#888',
                        fontWeight: profileTab === 'records' ? '700' : '500',
                        fontSize: '15px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    내 기록
                </button>
                <button
                    onClick={() => onTabChange('info')}
                    style={{
                        flex: 1,
                        padding: '16px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: profileTab === 'info' ? '3px solid #1a1a1a' : '3px solid transparent',
                        color: profileTab === 'info' ? '#1a1a1a' : '#888',
                        fontWeight: profileTab === 'info' ? '700' : '500',
                        fontSize: '15px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    내 정보
                </button>
                <button
                    onClick={() => onTabChange('settings')}
                    style={{
                        flex: 1,
                        padding: '16px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: profileTab === 'settings' ? '3px solid #1a1a1a' : '3px solid transparent',
                        color: profileTab === 'settings' ? '#1a1a1a' : '#888',
                        fontWeight: profileTab === 'settings' ? '700' : '500',
                        fontSize: '15px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                    }}
                >
                    <span>⚙️</span>
                </button>
            </div>
        </div>
    );
}

export default ProfileSubHeader;

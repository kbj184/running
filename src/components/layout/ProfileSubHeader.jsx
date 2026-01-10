import React from 'react';
import { useTranslation } from 'react-i18next';

function ProfileSubHeader({ profileTab, onTabChange, unreadCount }) {
    const { t } = useTranslation();

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            backgroundColor: '#fff',
            borderBottom: '1px solid #e0e0e0',
            zIndex: 999,
            // boxShadow는 MainHeader와 겹치므로 상황에 따라 조정, 일단 유지
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
                    {t('profile.tabs.records')}
                </button>
                <button
                    onClick={() => onTabChange('courses')}
                    style={{
                        flex: 1,
                        padding: '16px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: profileTab === 'courses' ? '3px solid #1a1a1a' : '3px solid transparent',
                        color: profileTab === 'courses' ? '#1a1a1a' : '#888',
                        fontWeight: profileTab === 'courses' ? '700' : '500',
                        fontSize: '15px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    {t('profile.tabs.courses')}
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
                    {t('profile.tabs.info')}
                </button>
                <button
                    onClick={() => onTabChange('follow')}
                    style={{
                        flex: 1,
                        padding: '16px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: profileTab === 'follow' ? '3px solid #1a1a1a' : '3px solid transparent',
                        color: profileTab === 'follow' ? '#1a1a1a' : '#888',
                        fontWeight: profileTab === 'follow' ? '700' : '500',
                        fontSize: '15px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                    }}
                >
                    <span>👥</span>
                </button>
                <button
                    onClick={() => onTabChange('notifications')}
                    style={{
                        flex: 1,
                        padding: '16px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: profileTab === 'notifications' ? '3px solid #1a1a1a' : '3px solid transparent',
                        color: profileTab === 'notifications' ? '#1a1a1a' : '#888',
                        fontWeight: profileTab === 'notifications' ? '700' : '500',
                        fontSize: '15px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative'
                    }}
                >
                    <span>🔔</span>
                    {unreadCount > 0 && (
                        <span style={{
                            position: 'absolute',
                            top: '8px',
                            right: 'calc(50% - 14px)',
                            backgroundColor: '#ff4d4f',
                            color: 'white',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            height: '16px',
                            minWidth: '16px',
                            padding: '0 4px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 0 2px #fff'
                        }}>
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
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

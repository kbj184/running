import React from 'react';
import { useTranslation } from 'react-i18next';

function ProfileSubHeader({ profileTab, onTabChange }) {
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
                        justifyContent: 'center'
                    }}
                >
                    <span>🔔</span>
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

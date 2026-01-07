import React from 'react';
import { useTranslation } from 'react-i18next';

function BottomNavigation({ activeTab, onTabChange, onStartRunning, onProfileClick }) {
    const { t } = useTranslation();

    const navItemStyle = (isActive) => ({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        color: isActive ? '#1a1a1a' : '#999999',
        fontSize: '11px',
        fontWeight: isActive ? '600' : '500',
        cursor: 'pointer',
        transition: 'all 0.2s',
        flex: 1,
        padding: '8px 0'
    });

    const iconStyle = {
        fontSize: '24px',
        marginBottom: '2px'
    };

    return (
        <div style={{
            position: 'relative', // Changed from fixed
            // bottom, left, right removed
            width: '100%', // Ensure full width
            height: '68px',
            background: '#ffffff',
            borderTop: '1px solid #e8e8e8',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            padding: '0',
            boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
            zIndex: 1000
        }}>
            {/* Home */}
            <div
                style={navItemStyle(activeTab === 'home')}
                onClick={() => onTabChange('home')}
            >
                <div style={iconStyle}>🏠</div>
                <span>홈</span>
            </div>

            {/* Running Center */}
            <div
                style={navItemStyle(activeTab === 'running')}
                onClick={() => onTabChange('running')}
            >
                <div style={iconStyle}>🏃</div>
                <span>러닝센터</span>
            </div>

            {/* Play Button - Center */}
            <div
                onClick={onStartRunning}
                style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #ff4444 0%, #ee3333 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    marginTop: '-34px',
                    boxShadow: '0 6px 20px rgba(255, 68, 68, 0.4)',
                    border: '4px solid #ffffff'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 68, 68, 0.5)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 68, 68, 0.4)';
                }}
            >
                <div style={{
                    fontSize: '32px',
                    color: '#ffffff',
                    marginLeft: '3px'
                }}>
                    ▶
                </div>
            </div>

            {/* Crew */}
            <div
                style={navItemStyle(activeTab === 'crew')}
                onClick={() => {
                    onTabChange('crew');
                }}
            >
                <div style={iconStyle}>👥</div>
                <span>Crew</span>
            </div>

            {/* My */}
            <div
                style={navItemStyle(activeTab === 'profile')}
                onClick={() => onTabChange('profile')}
            >
                <div style={iconStyle}>👤</div>
                <span>My</span>
            </div>
        </div>
    );
}

export default BottomNavigation;

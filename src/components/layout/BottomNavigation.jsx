import React from 'react';
import { useTranslation } from 'react-i18next';

function BottomNavigation({ activeTab, onTabChange, onStartRunning, onProfileClick }) {
    const { t } = useTranslation();

    return (
        <div className="main-bottom-nav">
            <div
                className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
                onClick={() => onTabChange('home')}
            >
                <div className="nav-icon">🏠</div>
                <span>{t('navigation.home')}</span>
            </div>
            <div
                className={`nav-item ${activeTab === 'running' ? 'active' : ''}`}
                onClick={() => onTabChange('running')}
            >
                <div className="nav-icon">🏃</div>
                <span>{t('navigation.running')}</span>
            </div>

            {/* Play Button */}
            <div
                className="nav-item play-button"
                onClick={onStartRunning}
            >
                <div className="play-icon">▶️</div>
            </div>

            <div
                className={`nav-item ${activeTab === 'crew' ? 'active' : ''}`}
                onClick={() => onTabChange('crew')}
            >
                <div className="nav-icon">👥</div>
                <span>{t('navigation.crew')}</span>
            </div>
            <div
                className="nav-item"
                onClick={onProfileClick}
            >
                <div className="nav-icon">👤</div>
                <span>{t('navigation.my')}</span>
            </div>
        </div>
    );
}

export default BottomNavigation;

import React from 'react';

function BottomNavigation({ activeTab, onTabChange, onStartRunning }) {
    return (
        <div className="main-bottom-nav">
            <div
                className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
                onClick={() => onTabChange('home')}
            >
                <div className="nav-icon">🏠</div>
                <span>홈</span>
            </div>
            <div
                className={`nav-item ${activeTab === 'running' ? 'active' : ''}`}
                onClick={() => onTabChange('running')}
            >
                <div className="nav-icon">🏃</div>
                <span>런닝센터</span>
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
                <span>Crew</span>
            </div>
            <div
                className={`nav-item ${activeTab === 'myrun' ? 'active' : ''}`}
                onClick={() => onTabChange('myrun')}
            >
                <div className="nav-icon">📊</div>
                <span>MyRun</span>
            </div>
        </div>
    );
}

export default BottomNavigation;

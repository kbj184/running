import React from 'react';

function Header({ totalRunners, proCount, eliteCount }) {
    return (
        <header className="app-header">
            <div className="header-content">
                <div className="header-title">
                    <span className="header-icon">🏃</span>
                    <h1>러닝 맵</h1>
                </div>
                <div className="header-stats">
                    <div className="stat-item">
                        <div className="stat-value">{totalRunners}</div>
                        <div className="stat-label">전체 러너</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-value">{proCount}</div>
                        <div className="stat-label">프로 러너</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-value">{eliteCount}</div>
                        <div className="stat-label">엘리트</div>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Header;

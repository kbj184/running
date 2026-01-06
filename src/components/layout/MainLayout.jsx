import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import MainHeader from './MainHeader';
import BottomNavigation from './BottomNavigation';

function MainLayout({ user, onProfileClick, onGradeClick, onStartRunning }) {
    const location = useLocation();
    const navigate = useNavigate();

    // URL에서 현재 활성 탭 추출
    const getActiveTab = () => {
        const path = location.pathname;
        if (path.startsWith('/running')) return 'running';
        if (path.startsWith('/crew')) return 'crew';
        if (path.startsWith('/profile')) return 'profile';
        return 'home';
    };

    const activeTab = getActiveTab();

    const handleTabChange = (tab) => {
        // 탭별 기본 경로로 이동
        const routes = {
            home: '/',
            running: '/running',
            crew: '/crew',
            profile: '/profile'
        };
        navigate(routes[tab] || '/');
    };

    return (
        <div className="main-app-container">
            {/* Fixed Header */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column'
            }}>
                <MainHeader
                    user={user}
                    onProfileClick={onProfileClick}
                    onGradeClick={onGradeClick}
                />
            </div>

            {/* Scrollable Content Area */}
            <div className="main-content" style={{
                marginTop: 'var(--header-height)'
            }}>
                <Outlet /> {/* 자식 라우트가 여기 렌더링됩니다 */}
            </div>

            {/* Fixed Bottom Navigation */}
            <BottomNavigation
                activeTab={activeTab}
                onTabChange={handleTabChange}
                onStartRunning={onStartRunning}
                onProfileClick={onProfileClick}
            />
        </div>
    );
}

export default MainLayout;

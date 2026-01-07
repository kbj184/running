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

        // Profile 탭인 경우 onProfileClick도 호출
        if (tab === 'profile' && onProfileClick) {
            onProfileClick();
        }

        navigate(routes[tab] || '/');
    };

    return (
        <div className="main-app-container">
            {/* Header - Now part of flex flow */}
            <div style={{
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0 // Prevent header from shrinking
            }}>
                <MainHeader
                    user={user}
                    activeTab={activeTab}
                    onProfileClick={onProfileClick}
                    onGradeClick={onGradeClick}
                />
            </div>

            {/* Scrollable Content Area - Fills remaining space */}
            <div className="main-content" style={{
                marginTop: 0, // Remove margin
                flex: 1, // Take remaining space
                overflowY: 'auto'
            }}>
                <Outlet /> {/* 자식 라우트가 여기 렌더링됩니다 */}
            </div>

            {/* Bottom Navigation - Now part of flex flow */}
            <div style={{ flexShrink: 0 }}>
                <BottomNavigation
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    onStartRunning={onStartRunning}
                    onProfileClick={onProfileClick}
                />
            </div>
        </div>
    );
}

export default MainLayout;

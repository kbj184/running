import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ProfileSubHeader from '../layout/ProfileSubHeader';

function ProfileMenu({ profileTab, children }) {
    const navigate = useNavigate();
    const location = useLocation();

    // URL에서 현재 프로필 탭 추출
    const currentTab = profileTab || location.pathname.split('/')[2] || 'records';

    const handleTabChange = (tab) => {
        navigate(`/profile/${tab}`);
    };

    return (
        <div className="tab-content profile-tab">
            {/* ProfileSubHeader 추가 */}
            <div style={{
                position: 'sticky',
                top: 'calc(var(--header-height) - 56px)',
                zIndex: 90,
                backgroundColor: '#fff'
            }}>
                <ProfileSubHeader
                    profileTab={currentTab}
                    onTabChange={handleTabChange}
                />
            </div>

            <div style={{ padding: '20px' }}>
                {children}
            </div>
        </div>
    );
}

export default ProfileMenu;

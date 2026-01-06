import React from 'react';
import ProfileSubHeader from '../layout/ProfileSubHeader';
import MyRecordsTab from './MyRecordsTab';
import MyInfoTab from './MyInfoTab';
import SettingsTab from './SettingsTab';

function ProfileMenu({ profileTab, user, refreshRecords, onRecordClick, onLogout, onUserUpdate, onTabChange }) {
    return (
        <div className="tab-content profile-tab">
            {/* ProfileSubHeader 추가 */}
            <div style={{
                position: 'sticky',
                top: 'var(--header-height)',
                zIndex: 90,
                backgroundColor: '#fff'
            }}>
                <ProfileSubHeader
                    profileTab={profileTab}
                    onTabChange={onTabChange}
                />
            </div>

            <div style={{ padding: '20px' }}>
                {profileTab === 'records' && (
                    <MyRecordsTab
                        refreshRecords={refreshRecords}
                        onRecordClick={onRecordClick}
                        user={user}
                    />
                )}

                {profileTab === 'info' && (
                    <MyInfoTab user={user} />
                )}

                {profileTab === 'settings' && (
                    <SettingsTab
                        user={user}
                        onLogout={onLogout}
                        onUserUpdate={onUserUpdate}
                    />
                )}
            </div>
        </div>
    );
}

export default ProfileMenu;

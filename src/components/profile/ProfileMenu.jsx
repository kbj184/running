import React from 'react';
import MyRecordsTab from './MyRecordsTab';
import MyInfoTab from './MyInfoTab';
import SettingsTab from './SettingsTab';

function ProfileMenu({ profileTab, user, refreshRecords, onRecordClick, onLogout, onUserUpdate }) {
    return (
        <div className="tab-content profile-tab" style={{ padding: '20px' }}>
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
    );
}

export default ProfileMenu;

import React from 'react';
import MyRecordsTab from './MyRecordsTab';
import MyInfoTab from './MyInfoTab';
import SettingsTab from './SettingsTab';

function ProfileMenu({ profileTab, user, refreshRecords, onRecordClick, onLogout }) {
    return (
        <div className="tab-content profile-tab" style={{ padding: '20px' }}>
            {profileTab === 'records' && (
                <MyRecordsTab
                    refreshRecords={refreshRecords}
                    onRecordClick={onRecordClick}
                />
            )}

            {profileTab === 'info' && (
                <MyInfoTab user={user} />
            )}

            {profileTab === 'settings' && (
                <SettingsTab onLogout={onLogout} />
            )}
        </div>
    );
}

export default ProfileMenu;

import React from 'react';
import RecentRecords from '../common/RecentRecords';

function MyRunTab({ refreshRecords, onRecordClick, user }) {
    return (
        <div className="tab-content myrun-tab">
            <RecentRecords
                onRefresh={refreshRecords}
                onRecordClick={onRecordClick}
                user={user}
            />
        </div>
    );
}

export default MyRunTab;

import React from 'react';
import RecentRecords from '../common/RecentRecords';

function MyRecordsTab({ refreshRecords, onRecordClick, user }) {
    return (
        <div>
            <RecentRecords
                onRefresh={refreshRecords}
                onRecordClick={onRecordClick}
                user={user}
            />
        </div>
    );
}

export default MyRecordsTab;

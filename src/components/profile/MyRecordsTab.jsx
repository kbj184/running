import React from 'react';
import RecentRecords from '../common/RecentRecords';

function MyRecordsTab({ refreshRecords, onRecordClick }) {
    return (
        <div>
            <RecentRecords
                onRefresh={refreshRecords}
                onRecordClick={onRecordClick}
            />
        </div>
    );
}

export default MyRecordsTab;

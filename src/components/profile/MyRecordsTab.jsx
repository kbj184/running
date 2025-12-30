import React from 'react';
import RecentRecords from '../common/RecentRecords';

function MyRecordsTab({ refreshRecords, onRecordClick }) {
    return (
        <div>
            <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: '700' }}>내 기록</h2>
            <RecentRecords
                onRefresh={refreshRecords}
                onRecordClick={onRecordClick}
            />
        </div>
    );
}

export default MyRecordsTab;

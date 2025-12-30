import React from 'react';
import RecentRecords from '../common/RecentRecords';

function MyRunTab({ refreshRecords, onRecordClick }) {
    return (
        <div className="tab-content myrun-tab">
            <RecentRecords
                onRefresh={refreshRecords}
                onRecordClick={onRecordClick}
            />
        </div>
    );
}

export default MyRunTab;

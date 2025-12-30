import React from 'react';
import RecentRecords from '../common/RecentRecords';

function MyRunTab({ refreshRecords, onRecordClick }) {
    return (
        <div className="tab-content myrun-tab">
            <div className="myrun-section">
                <h2>My Running Records</h2>
                <RecentRecords
                    onRefresh={refreshRecords}
                    onRecordClick={onRecordClick}
                />
            </div>
        </div>
    );
}

export default MyRunTab;

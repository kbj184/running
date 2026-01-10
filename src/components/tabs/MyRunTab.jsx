import React from 'react';
import MyRecordsTab from './my/MyRecordsTab';

function MyRunTab({ refreshRecords, onRecordClick, user }) {
    return (
        <div className="tab-content myrun-tab">
            <MyRecordsTab
                user={user}
                onRecordClick={onRecordClick}
            />
        </div>
    );
}

export default MyRunTab;

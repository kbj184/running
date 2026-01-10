import React from 'react';
import MyRecordsTabNew from '../tabs/my/MyRecordsTab';

function MyRecordsTab({ refreshRecords, onRecordClick, user }) {
    return (
        <div>
            <MyRecordsTabNew
                user={user}
                onRecordClick={onRecordClick}
            />
        </div>
    );
}

export default MyRecordsTab;

import React, { useState } from 'react';
import CrewSubHeader from '../layout/CrewSubHeader';
import CrewHomeTab from './crew/CrewHomeTab';
import CrewRankingTab from './crew/CrewRankingTab';
import CrewCreateTab from './crew/CrewCreateTab';

function CrewTab({ user, allCrews, onCrewClick, onRefreshCrews }) {
    const [crewTab, setCrewTab] = useState('home');

    const handleCrewCreated = (newCrew) => {
        // 크루 생성 성공 시 크루 홈 탭으로 이동하고 목록 새로고침
        setCrewTab('home');
        if (onRefreshCrews) {
            onRefreshCrews();
        }
    };

    return (
        <div className="tab-content crew-tab">
            <CrewSubHeader crewTab={crewTab} onTabChange={setCrewTab} />

            {crewTab === 'home' && (
                <CrewHomeTab
                    allCrews={allCrews}
                    onCrewClick={onCrewClick}
                />
            )}

            {crewTab === 'ranking' && (
                <CrewRankingTab
                    allCrews={allCrews}
                />
            )}

            {crewTab === 'create' && (
                <CrewCreateTab
                    user={user}
                    onCreate={handleCrewCreated}
                />
            )}
        </div>
    );
}

export default CrewTab;

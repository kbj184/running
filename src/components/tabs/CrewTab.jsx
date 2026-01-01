import React from 'react';
import CrewHomeTab from './crew/CrewHomeTab';
import CrewRankingTab from './crew/CrewRankingTab';
import CrewCreateTab from './crew/CrewCreateTab';

function CrewTab({ user, allCrews, onCrewClick, onRefreshCrews, crewTab = 'home', onCrewTabChange }) {
    const handleCrewCreated = (newCrew) => {
        // 크루 생성 성공 시 크루 홈 탭으로 이동하고 목록 새로고침
        if (onCrewTabChange) {
            onCrewTabChange('home');
        }
        if (onRefreshCrews) {
            onRefreshCrews();
        }
    };

    return (
        <div className="tab-content crew-tab">
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

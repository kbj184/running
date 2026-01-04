import React, { useState } from 'react';
import CrewHomeTab from './crew/CrewHomeTab';
import CrewRankingTab from './crew/CrewRankingTab';
import CrewCreateTab from './crew/CrewCreateTab';
import CrewDetailPage from './crew/CrewDetailPage';

function CrewTab({ user, allCrews, onRefreshCrews, crewTab = 'home', onCrewTabChange }) {
    const [selectedCrew, setSelectedCrew] = useState(null);

    const handleCrewCreated = (newCrew) => {
        // 크루 생성 성공 시 크루 홈 탭으로 이동하고 목록 새로고침
        if (onCrewTabChange) {
            onCrewTabChange('home');
        }
        if (onRefreshCrews) {
            onRefreshCrews();
        }
    };

    const handleCrewClick = (crew) => {
        setSelectedCrew(crew);
    };

    const handleBack = () => {
        setSelectedCrew(null);
    };

    // 상세 페이지 뷰
    if (selectedCrew) {
        return (
            <div className="tab-content crew-tab">
                <CrewDetailPage
                    crew={selectedCrew}
                    user={user}
                    onBack={handleBack}
                    onUpdateUser={() => {
                        if (onRefreshCrews) onRefreshCrews();
                    }}
                />
            </div>
        );
    }

    return (
        <div className="tab-content crew-tab">
            {crewTab === 'home' && (
                <CrewHomeTab
                    allCrews={allCrews}
                    onCrewClick={handleCrewClick}
                    onRefreshCrews={onRefreshCrews}
                />
            )}

            {crewTab === 'ranking' && (
                <CrewRankingTab
                    allCrews={allCrews}
                    onCrewClick={handleCrewClick}
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

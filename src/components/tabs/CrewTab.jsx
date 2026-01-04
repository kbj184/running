import React, { useState } from 'react';
import CrewHomeTab from './crew/CrewHomeTab';
import CrewRankingTab from './crew/CrewRankingTab';
import CrewCreateTab from './crew/CrewCreateTab';
import CrewDetailPage from './crew/CrewDetailPage';
import CrewSubHeader from '../layout/CrewSubHeader';

import CrewEditPage from './crew/CrewEditPage'; // Import 추가 필요

function CrewTab({ user, allCrews, onRefreshCrews, crewTab = 'home', onCrewTabChange }) {
    const [selectedCrew, setSelectedCrew] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

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
        setIsEditing(false);
    };

    const handleBack = () => {
        setSelectedCrew(null);
        setIsEditing(false);
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleEditCancel = () => {
        setIsEditing(false);
    };

    const handleEditComplete = (updatedCrew) => {
        setSelectedCrew(updatedCrew);
        setIsEditing(false);
        if (onRefreshCrews) onRefreshCrews();
    };

    // 상세 페이지 또는 수정 페이지 뷰
    if (selectedCrew) {
        if (isEditing) {
            return (
                <div className="tab-content crew-tab">
                    <CrewEditPage
                        crew={selectedCrew}
                        user={user}
                        onCancel={handleEditCancel}
                        onComplete={handleEditComplete}
                    />
                </div>
            );
        }

        return (
            <div className="tab-content crew-tab">
                <CrewDetailPage
                    crew={selectedCrew}
                    user={user}
                    onBack={handleBack}
                    onEdit={handleEdit}
                    onUpdateUser={() => {
                        if (onRefreshCrews) onRefreshCrews();
                    }}
                />
            </div>
        );
    }

    return (
        <div className="tab-content crew-tab">
            {/* 고정된 서브 헤더 */}
            <div style={{
                position: 'fixed',
                top: 'var(--header-height)',
                left: 0,
                right: 0,
                zIndex: 90
            }}>
                <CrewSubHeader
                    crewTab={crewTab}
                    onTabChange={onCrewTabChange}
                />
            </div>

            {/* 서브 헤더 높이만큼 여백 확보 */}
            <div style={{ paddingTop: '60px' }}>
                {crewTab === 'home' && (
                    <CrewHomeTab
                        allCrews={allCrews}
                        onCrewClick={handleCrewClick}
                        onRefreshCrews={onRefreshCrews}
                        user={user}
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
        </div>
    );
}

export default CrewTab;

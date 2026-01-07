import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CrewHomeTab from './crew/CrewHomeTab';
import CrewRankingTab from './crew/CrewRankingTab';
import CrewCreateTab from './crew/CrewCreateTab';
import CrewDetailPage from './crew/CrewDetailPage';
import CrewSubHeader from '../layout/CrewSubHeader';
import CrewEditPage from './crew/CrewEditPage';

import { api } from '../../utils/api';

function CrewTab({ user, allCrews, onRefreshCrews, crewTab = 'home', onCrewTabChange }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [selectedCrew, setSelectedCrew] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    const fetchCrewDetail = async (crewId) => {
        if (!user) return;
        try {
            const response = await api.request(`${import.meta.env.VITE_API_URL}/crew/${crewId}`, {
                headers: {
                    'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setSelectedCrew(data);
            }
        } catch (error) {
            console.error('Failed to fetch crew detail:', error);
        }
    };

    // URL 기반 크루 상세 페이지 감지
    useEffect(() => {
        const pathParts = location.pathname.split('/');
        // URL 구조: /crew/detail/:id
        if (pathParts[2] === 'detail' && pathParts[3]) {
            const crewId = parseInt(pathParts[3]);
            // state에서 먼저 찾고, 없으면 allCrews에서 찾기
            const crew = location.state?.crew || allCrews.find(c => c.id === crewId);
            if (crew) {
                setSelectedCrew(crew);
                setIsEditing(false);
            } else {
                // 목록에 없으면(딥링크 등) 직접 패치
                fetchCrewDetail(crewId);
            }
        } else {
            // 상세 페이지가 아니면 크루 선택 해제 (브라우저 뒤로가기 지원)
            setSelectedCrew(null);
            setIsEditing(false);
        }
    }, [location.pathname, allCrews, location.state, user]);

    const handleCrewCreated = (newCrew) => {
        if (onCrewTabChange) {
            onCrewTabChange('home');
        }
        if (onRefreshCrews) {
            onRefreshCrews();
        }
    };

    const handleCrewClick = (crew) => {
        // 클릭 시 URL 변경 -> useEffect가 감지하여 state 업데이트
        // state에 crew 객체를 담아 보내서 즉시 렌더링 가능하게 함
        navigate(`/crew/detail/${crew.id}`, { state: { crew } });
    };

    const handleBack = () => {
        navigate('/crew');
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
            <div style={{ paddingTop: '43px' }}>
                {crewTab === 'home' && (
                    <CrewHomeTab
                        allCrews={allCrews}
                        onCrewClick={handleCrewClick}
                        onRefreshCrews={onRefreshCrews}
                        user={user}
                    />
                )}

                {crewTab === 'ranking' && (
                    <CrewRankingTab />
                )}

                {crewTab === 'create' && (
                    <CrewCreateTab
                        user={user}
                        onCreate={handleCrewCreated}
                    />
                )}

                {crewTab === 'more' && (
                    <div style={{
                        padding: '40px 20px',
                        textAlign: 'center',
                        backgroundColor: '#f8f9fa',
                        minHeight: 'calc(100vh - var(--header-height) - 60px)'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚙️</div>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a1a', marginBottom: '8px' }}>
                            더보기
                        </h2>
                        <p style={{ fontSize: '14px', color: '#666' }}>
                            추가 기능이 곧 제공될 예정입니다
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CrewTab;

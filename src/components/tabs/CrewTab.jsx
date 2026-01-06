import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CrewHomeTab from './crew/CrewHomeTab';
import CrewRankingTab from './crew/CrewRankingTab';
import CrewCreateTab from './crew/CrewCreateTab';
import CrewDetailPage from './crew/CrewDetailPage';
import CrewSubHeader from '../layout/CrewSubHeader';
import CrewEditPage from './crew/CrewEditPage';
import CrewBoardTab from './crew/CrewBoardTab';
import PostDetailPage from './crew/PostDetailPage';
import PostEditorPage from './crew/PostEditorPage';

function CrewTab({ user, allCrews, onRefreshCrews, crewTab = 'home', onCrewTabChange }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [selectedCrew, setSelectedCrew] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [viewMode, setViewMode] = useState('list'); // 'list', 'board', 'post', 'editor'
    const [selectedPost, setSelectedPost] = useState(null);
    const [editingPost, setEditingPost] = useState(null);

    // URL 기반 크루 상세 페이지 감지
    useEffect(() => {
        const pathParts = location.pathname.split('/');
        // /crew/detail/:id 형태 감지
        if (pathParts[2] === 'detail' && pathParts[3]) {
            const crewId = parseInt(pathParts[3]);
            const crew = location.state?.crew || allCrews.find(c => c.id === crewId);
            if (crew) {
                setSelectedCrew(crew);
                setIsEditing(false);
                setViewMode('list');
            }
        }
    }, [location, allCrews]);

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
        setViewMode('list');
    };

    const handleBack = () => {
        // URL 기반 네비게이션으로 변경
        navigate('/crew');
        setSelectedCrew(null);
        setIsEditing(false);
        setViewMode('list');
        setSelectedPost(null);
        setEditingPost(null);
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

    // Board navigation handlers
    const handleViewBoard = () => {
        setViewMode('board');
    };

    const handlePostClick = (post) => {
        setSelectedPost(post);
        setViewMode('post');
    };

    const handleCreatePost = () => {
        setEditingPost(null);
        setViewMode('editor');
    };

    const handleEditPost = (post) => {
        setEditingPost(post);
        setViewMode('editor');
    };

    const handleBackToBoard = () => {
        setViewMode('board');
        setSelectedPost(null);
        setEditingPost(null);
    };

    const handlePostComplete = () => {
        setViewMode('board');
        setSelectedPost(null);
        setEditingPost(null);
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

        // 게시판 뷰
        if (viewMode === 'board') {
            return (
                <div className="tab-content crew-tab">
                    <CrewBoardTab
                        crew={selectedCrew}
                        user={user}
                        onPostClick={handlePostClick}
                        onCreatePost={handleCreatePost}
                        onBack={handleBack}
                    />
                </div>
            );
        }

        // 게시글 상세 뷰
        if (viewMode === 'post' && selectedPost) {
            return (
                <div className="tab-content crew-tab">
                    <PostDetailPage
                        postId={selectedPost.id}
                        crew={selectedCrew}
                        user={user}
                        onBack={handleBackToBoard}
                        onEdit={handleEditPost}
                    />
                </div>
            );
        }

        // 게시글 작성/수정 뷰
        if (viewMode === 'editor') {
            return (
                <div className="tab-content crew-tab">
                    <PostEditorPage
                        crew={selectedCrew}
                        user={user}
                        post={editingPost}
                        onCancel={handleBackToBoard}
                        onComplete={handlePostComplete}
                    />
                </div>
            );
        }

        // 크루 상세 페이지 (기본)
        return (
            <div className="tab-content crew-tab">
                <CrewDetailPage
                    crew={selectedCrew}
                    user={user}
                    onBack={handleBack}
                    onEdit={handleEdit}
                    onViewBoard={handleViewBoard}
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
                        onCrewCreated={handleCrewCreated}
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

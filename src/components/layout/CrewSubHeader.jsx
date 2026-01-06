import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function CrewSubHeader() {
    const navigate = useNavigate();
    const location = useLocation();

    // URL에서 현재 크루 탭 추출
    const pathParts = location.pathname.split('/');
    const crewTab = pathParts[2] || 'home'; // /crew/ranking -> 'ranking', /crew -> 'home'

    const handleTabChange = (tab) => {
        if (tab === 'home') {
            navigate('/crew');
        } else {
            navigate(`/crew/${tab}`);
        }
    };

    return (
        <div style={{
            position: 'sticky',
            top: 'calc(var(--header-height) - 56px)',
            width: '100%',
            backgroundColor: '#f8f9fa',
            borderBottom: '1px solid #e0e0e0',
            zIndex: 90
        }}>
            <div style={{
                display: 'flex',
                gap: '0',
                margin: '0 auto'
            }}>
                <button
                    onClick={() => handleTabChange('home')}
                    style={{
                        flex: 1,
                        padding: '10px 12px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: crewTab === 'home' ? '2px solid #1a1a1a' : '2px solid transparent',
                        color: crewTab === 'home' ? '#1a1a1a' : '#888',
                        fontWeight: crewTab === 'home' ? '700' : '500',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    크루 홈
                </button>
                <button
                    onClick={() => handleTabChange('ranking')}
                    style={{
                        flex: 1,
                        padding: '10px 12px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: crewTab === 'ranking' ? '2px solid #1a1a1a' : '2px solid transparent',
                        color: crewTab === 'ranking' ? '#1a1a1a' : '#888',
                        fontWeight: crewTab === 'ranking' ? '700' : '500',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    크루 랭킹
                </button>
                <button
                    onClick={() => handleTabChange('create')}
                    style={{
                        flex: 1,
                        padding: '10px 12px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: crewTab === 'create' ? '2px solid #1a1a1a' : '2px solid transparent',
                        color: crewTab === 'create' ? '#1a1a1a' : '#888',
                        fontWeight: crewTab === 'create' ? '700' : '500',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    크루 만들기
                </button>
                <button
                    onClick={() => handleTabChange('more')}
                    style={{
                        flex: 1,
                        padding: '10px 12px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: crewTab === 'more' ? '2px solid #1a1a1a' : '2px solid transparent',
                        color: crewTab === 'more' ? '#1a1a1a' : '#888',
                        fontWeight: crewTab === 'more' ? '700' : '500',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    더보기
                </button>
            </div>
        </div>
    );
}

export default CrewSubHeader;

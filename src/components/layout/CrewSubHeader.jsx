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
            top: 0,
            width: '100%',
            backgroundColor: '#fff',
            borderBottom: '1px solid #e0e0e0',
            zIndex: 90,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
            <div style={{
                display: 'flex',
                gap: '0',
                padding: '0 20px',
                maxWidth: '1200px',
                margin: '0 auto'
            }}>
                <button
                    onClick={() => handleTabChange('home')}
                    style={{
                        flex: 1,
                        padding: '16px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: crewTab === 'home' ? '3px solid #1a1a1a' : '3px solid transparent',
                        color: crewTab === 'home' ? '#1a1a1a' : '#888',
                        fontWeight: crewTab === 'home' ? '700' : '500',
                        fontSize: '15px',
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
                        padding: '16px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: crewTab === 'ranking' ? '3px solid #1a1a1a' : '3px solid transparent',
                        color: crewTab === 'ranking' ? '#1a1a1a' : '#888',
                        fontWeight: crewTab === 'ranking' ? '700' : '500',
                        fontSize: '15px',
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
                        padding: '16px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: crewTab === 'create' ? '3px solid #1a1a1a' : '3px solid transparent',
                        color: crewTab === 'create' ? '#1a1a1a' : '#888',
                        fontWeight: crewTab === 'create' ? '700' : '500',
                        fontSize: '15px',
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
                        padding: '16px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: crewTab === 'more' ? '3px solid #1a1a1a' : '3px solid transparent',
                        color: crewTab === 'more' ? '#1a1a1a' : '#888',
                        fontWeight: crewTab === 'more' ? '700' : '500',
                        fontSize: '15px',
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

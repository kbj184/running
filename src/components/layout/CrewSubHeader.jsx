import React from 'react';
import { useTranslation } from 'react-i18next';

function CrewSubHeader({ crewTab, onTabChange }) {
    const { t } = useTranslation();

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            backgroundColor: '#fff',
            borderBottom: '1px solid #e0e0e0',
            zIndex: 999,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
            <div style={{
                display: 'flex',
                gap: '0',
                margin: '0 auto'
            }}>
                <button
                    onClick={() => onTabChange('home')}
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
                    onClick={() => onTabChange('ranking')}
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
                    onClick={() => onTabChange('create')}
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
            </div>
        </div>
    );
}

export default CrewSubHeader;

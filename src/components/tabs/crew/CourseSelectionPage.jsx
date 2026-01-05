import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../../utils/api';
import { generateRouteThumbImage } from '../../../utils/mapThumbnail';

function CourseSelectionPage({ user, crewId, onBack, onSelectRecord }) {
    const [runningRecords, setRunningRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRunningRecords();
    }, []);

    const getAuthHeaders = () => {
        if (!user || !user.accessToken) return {};
        return {
            'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
        };
    };

    const fetchRunningRecords = async () => {
        try {
            setLoading(true);
            const response = await api.request(`${import.meta.env.VITE_API_URL}/api/running/sessions/completed?userId=${user.id}`, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                console.log('Fetched running records:', data);
                setRunningRecords(data);
            } else {
                console.error('Failed to fetch records, status:', response.status);
            }
        } catch (error) {
            console.error('Failed to fetch running records:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#fff',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <header style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
            }}>
                <button
                    onClick={onBack}
                    style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '20px',
                        cursor: 'pointer',
                        padding: '4px',
                        color: '#333',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                >
                    ←
                </button>
                <h2 style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#333'
                }}>
                    나의 러닝 활동에서 선택
                </h2>
            </header>

            {/* Content */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px'
            }}>
                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                        로딩 중...
                    </div>
                ) : runningRecords.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                        <div style={{ fontSize: '40px', marginBottom: '10px' }}>🏃</div>
                        <div style={{ fontSize: '14px' }}>러닝 기록이 없습니다</div>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gap: '12px',
                        maxWidth: '600px',
                        margin: '0 auto'
                    }}>
                        {runningRecords.map(record => (
                            <RecordCard
                                key={record.id}
                                record={record}
                                onClick={() => onSelectRecord(record)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function RecordCard({ record, onClick }) {
    const thumbnailUrl = useMemo(() => {
        if (record.route) {
            try {
                const route = JSON.parse(record.route);
                if (route && route.length > 0) {
                    return generateRouteThumbImage(route);
                }
            } catch (e) {
                console.error('Failed to parse route:', e);
            }
        }
        return record.thumbnail;
    }, [record.route, record.thumbnail]);

    return (
        <div
            onClick={onClick}
            style={{
                display: 'flex',
                gap: '16px',
                padding: '16px',
                border: '1px solid #e0e0e0',
                borderRadius: '12px',
                cursor: 'pointer',
                backgroundColor: '#fff',
                transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f8f8';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fff';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            {/* Thumbnail */}
            <div style={{
                width: '100px',
                height: '100px',
                flexShrink: 0,
                backgroundColor: '#f0f0f0',
                borderRadius: '8px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {thumbnailUrl ? (
                    <img
                        src={thumbnailUrl}
                        alt="Running route"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }}
                        onError={(e) => {
                            e.target.style.display = 'none';
                            const fallback = document.createElement('div');
                            fallback.style.cssText = 'font-size:30px;color:#ccc;';
                            fallback.textContent = '🗺️';
                            e.target.parentElement.appendChild(fallback);
                        }}
                    />
                ) : (
                    <div style={{ fontSize: '30px', color: '#ccc' }}>🗺️</div>
                )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                    <div style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#333',
                        marginBottom: '4px'
                    }}>
                        {record.startAddress || '러닝 코스'}
                    </div>
                    <div style={{ fontSize: '13px', color: '#999' }}>
                        {new Date(record.timestamp || Date.now()).toLocaleDateString()} • {Math.floor(record.duration / 60)}분
                    </div>
                </div>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '8px'
                }}>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#FF9A56' }}>
                        {record.distance?.toFixed(2)} km
                    </div>
                    <div style={{
                        padding: '4px 12px',
                        backgroundColor: '#f0f0f0',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: '#666'
                    }}>
                        선택하기 →
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CourseSelectionPage;

import { useState, useEffect } from 'react';
import { getRecentSessions } from '../../utils/db';
import { formatDistance, formatTime } from '../../utils/gps';

function RecentRecords({ onRefresh, onRecordClick }) {
    const [records, setRecords] = useState([]);
    const [hasMore, setHasMore] = useState(false);

    useEffect(() => {
        loadRecords();
    }, [onRefresh]);

    const loadRecords = async () => {
        try {
            // 4개를 가져와서 3개만 보여주고, 4번째가 있으면 '더보기' 버튼 표시
            const recent = await getRecentSessions(4);
            if (recent.length > 3) {
                setRecords(recent.slice(0, 3));
                setHasMore(true);
            } else {
                setRecords(recent);
                setHasMore(false);
            }
        } catch (err) {
            console.error('Failed to load recent records:', err);
        }
    };

    if (records.length === 0) {
        return null;
    }

    return (
        <div className="recent-records-container" style={{
            position: 'absolute',
            bottom: '30px',
            left: '20px',
            zIndex: 1000,
            width: '320px',
            maxHeight: '400px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
        }}>
            <h3 style={{
                margin: '0 0 5px 5px',
                color: '#fff',
                fontSize: '16px',
                fontWeight: '600',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }}>
                📅 최근 활동
            </h3>

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }}>
                {records.map(record => (
                    <div key={record.sessionId}
                        onClick={() => onRecordClick(record)}
                        style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            borderRadius: '12px',
                            padding: '12px 16px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            cursor: 'pointer',
                            transition: 'transform 0.2s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '12px',
                            color: '#64748b'
                        }}>
                            <span>{new Date(record.timestamp).toLocaleDateString()}</span>
                            <span>{new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-end'
                        }}>
                            <div style={{
                                fontSize: '18px',
                                fontWeight: '700',
                                color: '#1e293b'
                            }}>
                                {formatDistance(record.distance)}
                            </div>
                            <div style={{
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#64748b'
                            }}>
                                {formatTime(record.duration)}
                            </div>
                        </div>

                        <div style={{
                            fontSize: '12px',
                            color: '#64748b',
                            display: 'flex',
                            gap: '8px'
                        }}>
                            <span>⚡ {record.pace.toFixed(2)} min/km</span>
                            <span>🔥 {Math.floor(record.distance * 60)} kcal</span>
                        </div>
                    </div>
                ))}
            </div>

            {hasMore && (
                <button style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    backdropFilter: 'blur(4px)',
                    transition: 'background-color 0.2s'
                }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.9)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.8)'}
                >
                    더보기 +
                </button>
            )}
        </div>
    );
}

export default RecentRecords;

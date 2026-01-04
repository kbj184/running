import React, { useState, useEffect } from 'react';
import { api } from '../../../utils/api';

function CrewCourseTab({ crew, user, userRole }) {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRegisterModal, setShowRegisterModal] = useState(false);

    useEffect(() => {
        fetchCourses();
    }, [crew.id]);

    const getAuthHeaders = () => {
        if (!user || !user.accessToken) return {};
        return {
            'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
        };
    };

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const response = await api.request(`${import.meta.env.VITE_API_URL}/crew/${crew.id}/courses`, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                setCourses(data);
            }
        } catch (error) {
            console.error('Failed to fetch courses:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                로딩 중...
            </div>
        );
    }

    const isMember = userRole === 'CAPTAIN' || userRole === 'MEMBER';

    return (
        <div style={{ padding: '20px' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
            }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>
                    러닝 코스 ({courses.length})
                </h3>
                {user && (
                    <button
                        onClick={() => setShowRegisterModal(true)}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#FF9A56',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        + 코스 등록
                    </button>
                )}
            </div>

            {/* Course List */}
            {courses.length === 0 ? (
                <div style={{
                    padding: '60px 20px',
                    textAlign: 'center',
                    color: '#999',
                    backgroundColor: '#f8f8f8',
                    borderRadius: '12px'
                }}>
                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>🏃</div>
                    <div style={{ fontSize: '15px' }}>등록된 코스가 없습니다</div>
                    {isMember && (
                        <div style={{ fontSize: '13px', marginTop: '8px', color: '#bbb' }}>
                            첫 번째 코스를 등록해보세요!
                        </div>
                    )}
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gap: '16px'
                }}>
                    {courses.map(course => (
                        <div
                            key={course.id}
                            style={{
                                backgroundColor: '#fff',
                                border: '1px solid #e0e0e0',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            <div style={{ display: 'flex' }}>
                                {/* Thumbnail */}
                                {course.mapThumbnailUrl && (
                                    <div style={{
                                        width: '120px',
                                        height: '120px',
                                        flexShrink: 0,
                                        backgroundColor: '#f0f0f0'
                                    }}>
                                        <img
                                            src={course.mapThumbnailUrl}
                                            alt={course.name}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Content */}
                                <div style={{
                                    flex: 1,
                                    padding: '16px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between'
                                }}>
                                    <div>
                                        <div style={{
                                            fontSize: '16px',
                                            fontWeight: '700',
                                            color: '#333',
                                            marginBottom: '8px'
                                        }}>
                                            {course.name}
                                        </div>
                                        {course.description && (
                                            <div style={{
                                                fontSize: '13px',
                                                color: '#666',
                                                marginBottom: '12px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {course.description}
                                            </div>
                                        )}
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div style={{
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            color: '#FF9A56'
                                        }}>
                                            {course.distance?.toFixed(2)} km
                                        </div>
                                        <div style={{
                                            fontSize: '12px',
                                            color: '#999'
                                        }}>
                                            {course.creatorNickname}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Register Modal */}
            {showRegisterModal && (
                <CourseRegistrationModal
                    user={user}
                    crewId={crew.id}
                    onClose={() => setShowRegisterModal(false)}
                    onSuccess={() => {
                        setShowRegisterModal(false);
                        fetchCourses();
                    }}
                />
            )}
        </div>
    );
}

function CourseRegistrationModal({ user, crewId, onClose, onSuccess }) {
    const [runningRecords, setRunningRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [registering, setRegistering] = useState(false);

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

    const handleRegister = async () => {
        if (!selectedRecord) return;

        try {
            setRegistering(true);
            const courseData = {
                name: `${selectedRecord.startAddress || '러닝 코스'} - ${new Date(selectedRecord.createdAt).toLocaleDateString()}`,
                description: `거리: ${selectedRecord.distance?.toFixed(2)}km, 시간: ${Math.floor(selectedRecord.duration / 60)}분`,
                distance: selectedRecord.distance,
                routeData: selectedRecord.routeData,
                mapThumbnailUrl: selectedRecord.mapThumbnailUrl
            };

            const response = await api.request(`${import.meta.env.VITE_API_URL}/crew/${crewId}/courses`, {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(courseData)
            });

            if (response.ok) {
                onSuccess();
            } else {
                alert('코스 등록에 실패했습니다.');
            }
        } catch (error) {
            console.error('Failed to register course:', error);
            alert('코스 등록 중 오류가 발생했습니다.');
        } finally {
            setRegistering(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: '#fff',
                borderRadius: '16px',
                padding: '24px',
                maxWidth: '500px',
                width: '100%',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>나의 러닝 활동에서 선택</span>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '24px',
                            cursor: 'pointer',
                            color: '#999',
                            padding: 0,
                            lineHeight: 1
                        }}
                    >
                        ×
                    </button>
                </h3>

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
                    <>
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            marginBottom: '16px'
                        }}>
                            {runningRecords.map(record => (
                                <div
                                    key={record.id}
                                    onClick={() => setSelectedRecord(record)}
                                    style={{
                                        padding: '12px',
                                        marginBottom: '8px',
                                        border: selectedRecord?.id === record.id ? '2px solid #FF9A56' : '1px solid #e0e0e0',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        backgroundColor: selectedRecord?.id === record.id ? '#fff5f0' : '#fff',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (selectedRecord?.id !== record.id) {
                                            e.currentTarget.style.backgroundColor = '#f8f8f8';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (selectedRecord?.id !== record.id) {
                                            e.currentTarget.style.backgroundColor = '#fff';
                                        }
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginBottom: '4px'
                                    }}>
                                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                                            {record.startAddress || '러닝 코스'}
                                        </div>
                                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#FF9A56' }}>
                                            {record.distance?.toFixed(2)} km
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#999' }}>
                                        {new Date(record.createdAt).toLocaleDateString()} • {Math.floor(record.duration / 60)}분
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={onClose}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    backgroundColor: '#f0f0f0',
                                    color: '#666',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                취소
                            </button>
                            <button
                                onClick={handleRegister}
                                disabled={!selectedRecord || registering}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    backgroundColor: selectedRecord && !registering ? '#FF9A56' : '#ccc',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: selectedRecord && !registering ? 'pointer' : 'not-allowed'
                                }}
                            >
                                {registering ? '등록 중...' : '등록'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default CrewCourseTab;

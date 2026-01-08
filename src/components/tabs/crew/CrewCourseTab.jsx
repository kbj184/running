import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../../utils/api';
import { generateRouteThumbImage } from '../../../utils/mapThumbnail';

function CrewCourseTab({ crew, user, userRole, refreshKey, onCourseClick, onCourseCreate }) {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCourses();
    }, [crew.id, refreshKey]);

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

    const handleOfficialStatus = async (e, course) => {
        e.stopPropagation();
        const action = course.isOfficial ? '해제' : '지정';
        if (!window.confirm(`'${course.title}' 코스를 공식 코스로 ${action}하시겠습니까?`)) return;

        try {
            const response = await api.request(`${import.meta.env.VITE_API_URL}/crew/${crew.id}/courses/${course.id}/official`, {
                method: 'PUT',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isOfficial: !course.isOfficial })
            });

            if (response.ok) {
                alert(`공식 코스 ${action} 완료`);
                fetchCourses();
            } else {
                alert('요청 실패');
            }
        } catch (error) {
            console.error('Official status error:', error);
            alert('오류가 발생했습니다.');
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                로딩 중...
            </div>
        );
    }

    const isMember = ['captain', 'vice_captain', 'member'].includes(userRole?.toLowerCase());

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
                        onClick={onCourseCreate}
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
                            onClick={() => onCourseClick && onCourseClick(course)}
                            style={{
                                backgroundColor: '#fff',
                                border: '1px solid #e0e0e0',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                display: 'flex',
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
                            {/* Thumbnail */}
                            <div style={{
                                width: '120px',
                                height: '120px',
                                flexShrink: 0,
                                backgroundColor: '#f0f0f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden'
                            }}>
                                <CourseThumbnail course={course} />
                            </div>

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
                                        marginBottom: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        {course.isOfficial && (
                                            <span style={{
                                                fontSize: '10px',
                                                fontWeight: '700',
                                                color: '#fff',
                                                background: '#FF9A56',
                                                padding: '2px 6px',
                                                borderRadius: '4px'
                                            }}>
                                                OFFICIAL
                                            </span>
                                        )}
                                        {course.title || course.name}
                                    </div>
                                    {course.description && (
                                        <div style={{
                                            fontSize: '13px',
                                            color: '#666',
                                            marginBottom: '12px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical'
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
                                        color: '#999',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span style={{ fontSize: '12px' }}>{course.liked ? '❤️' : '🤍'}</span>
                                            <span style={{ fontWeight: '500' }}>{course.likeCount || 0}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span style={{ fontSize: '12px' }}>🏃</span>
                                            <span style={{ fontWeight: '500' }}>{course.runCount || 0}</span>
                                        </div>

                                        {/* Official Toggle for Admin */}
                                        {(userRole === 'captain' || userRole === 'vice_captain') && (
                                            <button
                                                onClick={(e) => handleOfficialStatus(e, course)}
                                                style={{
                                                    padding: '2px 6px',
                                                    fontSize: '10px',
                                                    backgroundColor: course.isOfficial ? '#fff' : '#DCFCE7',
                                                    border: `1px solid ${course.isOfficial ? '#d1d5db' : '#16A34A'}`,
                                                    color: course.isOfficial ? '#6b7280' : '#16A34A',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontWeight: '600'
                                                }}
                                            >
                                                {course.isOfficial ? '해제' : '공식등록'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function CourseThumbnail({ course }) {
    const thumbnailUrl = useMemo(() => {
        if (course.routeData) {
            try {
                const route = JSON.parse(course.routeData);
                if (route && route.length > 0) {
                    return generateRouteThumbImage(route);
                }
            } catch (e) {
                console.error('Failed to parse route data:', e);
            }
        }
        return course.mapThumbnailUrl;
    }, [course.routeData, course.mapThumbnailUrl]);

    if (!thumbnailUrl) {
        return (
            <div style={{
                fontSize: '40px',
                color: '#ccc'
            }}>
                🗺️
            </div>
        );
    }

    return (
        <img
            src={thumbnailUrl}
            alt={course.name}
            style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
            }}
            onError={(e) => {
                e.target.style.display = 'none';
                const fallback = document.createElement('div');
                Object.assign(fallback.style, {
                    fontSize: '40px',
                    color: '#ccc'
                });
                fallback.textContent = '🗺️';
                e.target.parentElement.appendChild(fallback);
            }}
        />
    );
}

export default CrewCourseTab;

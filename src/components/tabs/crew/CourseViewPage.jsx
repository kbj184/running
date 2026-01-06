import React, { useState, useMemo, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Polyline, Marker } from '@react-google-maps/api';
import { generateRouteMapImage } from '../../../utils/mapThumbnail';
import { api } from '../../../utils/api';

const LIBRARIES = ['places', 'marker'];
const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;

// 속도에 따른 색상 반환
const getSpeedColor = (speedKmh) => {
    if (speedKmh <= 0) return "#667eea";
    if (speedKmh < 6) return "#10b981";
    if (speedKmh < 9) return "#f59e0b";
    if (speedKmh < 12) return "#ef4444";
    return "#7c3aed";
};

function CourseViewPage({ course, user, onClose, onFollowRunning, refreshKey }) {
    const [showInteractiveMap, setShowInteractiveMap] = useState(false);
    const [map, setMap] = useState(null);
    const [isLiked, setIsLiked] = useState(!!course.liked);
    const [likeCount, setLikeCount] = useState(course.likeCount || 0);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const [attempts, setAttempts] = useState([]);
    const [loadingAttempts, setLoadingAttempts] = useState(false);

    useEffect(() => {
        fetchComments();
        fetchAttempts();
    }, [course.id, refreshKey]);

    const fetchComments = async () => {
        try {
            setLoadingComments(true);
            const response = await api.request(`${import.meta.env.VITE_API_URL}/crew/${course.crewId}/courses/${course.id}/comments`);
            if (response.ok) {
                const data = await response.json();
                setComments(data);
            }
        } catch (error) {
            console.error('Failed to fetch comments:', error);
        } finally {
            setLoadingComments(false);
        }
    };

    const fetchAttempts = async () => {
        if (!user) return;

        try {
            setLoadingAttempts(true);
            const response = await api.request(`${import.meta.env.VITE_API_URL}/api/running/course/${course.id}/attempts?userId=${user.id}`);
            if (response.ok) {
                const data = await response.json();
                setAttempts(data);
            }
        } catch (error) {
            console.error('Failed to fetch attempts:', error);
        } finally {
            setLoadingAttempts(false);
        }
    };

    const handleToggleLike = async () => {
        try {
            const response = await api.request(`${import.meta.env.VITE_API_URL}/crew/${course.crewId}/courses/${course.id}/like`, {
                method: 'POST'
            });
            if (response.ok) {
                setIsLiked(prev => !prev);
                setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
            }
        } catch (error) {
            console.error('Like toggle failed:', error);
        }
    };

    const handleCreateComment = async () => {
        if (!newComment.trim()) return;

        try {
            const response = await api.request(`${import.meta.env.VITE_API_URL}/crew/${course.crewId}/courses/${course.id}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: newComment.trim() })
            });

            if (response.ok) {
                setNewComment('');
                fetchComments();
            }
        } catch (error) {
            console.error('Failed to create comment:', error);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!confirm('댓글을 삭제하시겠습니까?')) return;

        try {
            const response = await api.request(`${import.meta.env.VITE_API_URL}/crew/${course.crewId}/courses/${course.id}/comments/${commentId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                fetchComments();
            }
        } catch (error) {
            console.error('Failed to delete comment:', error);
        }
    };

    // Google Maps API 로드
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        language: 'ko',
        libraries: LIBRARIES
    });

    // route 데이터 파싱
    const parsedRoute = useMemo(() => {
        if (course.routeData) {
            try {
                let route = course.routeData;
                if (typeof route === 'string') {
                    route = JSON.parse(route);
                }
                if (Array.isArray(route) && route.length > 0) {
                    return route;
                }
            } catch (e) {
                console.error('Failed to parse route:', e);
            }
        }
        return null;
    }, [course.routeData]);

    // 정적 지도 이미지 생성
    const mapImageUrl = useMemo(() => {
        if (parsedRoute && parsedRoute.length > 0) {
            return generateRouteMapImage(parsedRoute, []);
        }
        return course.mapThumbnailUrl;
    }, [parsedRoute, course.mapThumbnailUrl]);

    // 지도 중심점 계산
    const mapCenter = useMemo(() => {
        if (!parsedRoute || parsedRoute.length === 0) return { lat: 37.5665, lng: 126.9780 };

        const lats = parsedRoute.map(p => p.lat);
        const lngs = parsedRoute.map(p => p.lng);

        return {
            lat: (Math.min(...lats) + Math.max(...lats)) / 2,
            lng: (Math.min(...lngs) + Math.max(...lngs)) / 2
        };
    }, [parsedRoute]);

    // 경로를 속도별 세그먼트로 변환
    const routeSegments = useMemo(() => {
        if (!parsedRoute || parsedRoute.length < 2) return [];

        const segments = [];
        let currentPath = [];
        let currentColor = getSpeedColor(parsedRoute[0]?.speed || 0);

        for (let i = 0; i < parsedRoute.length - 1; i++) {
            const p1 = parsedRoute[i];
            const p2 = parsedRoute[i + 1];
            let color = getSpeedColor(p1.speed || 0);

            if (currentPath.length === 0) {
                currentPath.push({ lat: p1.lat, lng: p1.lng });
                currentColor = color;
            }

            if (color !== currentColor) {
                currentPath.push({ lat: p1.lat, lng: p1.lng });
                segments.push({ path: [...currentPath], color: currentColor });
                currentPath = [{ lat: p1.lat, lng: p1.lng }];
                currentColor = color;
            }

            currentPath.push({ lat: p2.lat, lng: p2.lng });
        }

        if (currentPath.length > 0) {
            segments.push({ path: currentPath, color: currentColor });
        }

        return segments;
    }, [parsedRoute]);

    // 마커 위치
    const markers = useMemo(() => {
        if (!parsedRoute || parsedRoute.length === 0) return { start: null, goal: null };
        return {
            start: parsedRoute[0],
            goal: parsedRoute[parsedRoute.length - 1]
        };
    }, [parsedRoute]);

    // 지도 로드 콜백
    const onLoad = (mapInstance) => {
        setMap(mapInstance);
        if (parsedRoute && parsedRoute.length > 0) {
            const bounds = new window.google.maps.LatLngBounds();
            parsedRoute.forEach(point => {
                bounds.extend({ lat: point.lat, lng: point.lng });
            });
            mapInstance.fitBounds(bounds);
        }
    };

    // 날짜 포맷팅
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return `${date.getFullYear()}년${date.getMonth() + 1}월${date.getDate()}일`;
    };



    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#fff',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                padding: '16px',
                borderBottom: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#fff',
                gap: '12px'
            }}>
                <button
                    type="button"
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '20px',
                        cursor: 'pointer',
                        color: '#333',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                >
                    ←
                </button>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1a' }}>
                    {course.title || course.name}
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        type="button"
                        onClick={handleToggleLike}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px',
                            color: isLiked ? '#ef4444' : '#666',
                            fontSize: '14px',
                            fontWeight: '600'
                        }}
                    >
                        <span>{isLiked ? '❤️' : '🤍'}</span>
                        <span>{likeCount}</span>
                    </button>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                        {formatDate(course.createdAt)}
                    </div>
                </div>
            </div>

            {/* Content Scroll Area */}
            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '40px' }}>
                {/* Distance - Big */}
                <div style={{
                    padding: '30px 20px',
                    textAlign: 'center',
                    backgroundColor: '#fff'
                }}>
                    <div style={{
                        fontSize: '48px',
                        fontWeight: '700',
                        color: '#6366f1',
                        letterSpacing: '-1px'
                    }}>
                        {course.distance?.toFixed(2)}km
                    </div>
                </div>

                {/* Map - Static or Interactive */}
                <div style={{
                    position: 'relative',
                    padding: '0 20px'
                }}>
                    {!showInteractiveMap ? (
                        // Static Map
                        <div
                            style={{
                                width: '100%',
                                height: '300px',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                backgroundColor: '#f0f0f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                position: 'relative'
                            }}
                            onClick={() => setShowInteractiveMap(true)}
                        >
                            {mapImageUrl ? (
                                <img
                                    src={mapImageUrl}
                                    alt="러닝 경로"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        const errorDiv = document.createElement('div');
                                        errorDiv.style.cssText = 'display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-size:16px;';
                                        errorDiv.textContent = '지도 로딩 실패';
                                        e.target.parentElement.appendChild(errorDiv);
                                    }}
                                />
                            ) : (
                                <div style={{ fontSize: '40px', color: '#ccc' }}>🗺️</div>
                            )}
                        </div>
                    ) : (
                        // Interactive Map
                        <div style={{
                            width: '100%',
                            height: '300px',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            position: 'relative'
                        }}>
                            {isLoaded && parsedRoute && parsedRoute.length > 0 ? (
                                <GoogleMap
                                    mapContainerStyle={{
                                        width: '100%',
                                        height: '100%',
                                        borderRadius: '12px'
                                    }}
                                    center={mapCenter}
                                    zoom={14}
                                    onLoad={onLoad}
                                    onUnmount={() => setMap(null)}
                                    options={{
                                        mapId: MAP_ID,
                                        disableDefaultUI: false,
                                        zoomControl: true,
                                        mapTypeControl: false,
                                        streetViewControl: false,
                                        fullscreenControl: true,
                                    }}
                                >
                                    {/* 속도별 경로 세그먼트 */}
                                    {routeSegments.map((segment, idx) => (
                                        <Polyline
                                            key={`segment-${idx}`}
                                            path={segment.path}
                                            options={{
                                                strokeColor: segment.color,
                                                strokeOpacity: 0.9,
                                                strokeWeight: 6,
                                            }}
                                        />
                                    ))}

                                    {/* S (Start) 마커 */}
                                    {markers.start && (
                                        <Marker
                                            position={markers.start}
                                            icon={{
                                                path: window.google.maps.SymbolPath.CIRCLE,
                                                fillColor: '#22c55e',
                                                fillOpacity: 1,
                                                strokeColor: '#ffffff',
                                                strokeWeight: 3,
                                                scale: 16,
                                            }}
                                            label={{
                                                text: 'S',
                                                color: '#ffffff',
                                                fontSize: '14px',
                                                fontWeight: 'bold'
                                            }}
                                            zIndex={100}
                                        />
                                    )}

                                    {/* G (Goal) 마커 */}
                                    {markers.goal && (
                                        <Marker
                                            position={markers.goal}
                                            icon={{
                                                path: window.google.maps.SymbolPath.CIRCLE,
                                                fillColor: '#ef4444',
                                                fillOpacity: 1,
                                                strokeColor: '#ffffff',
                                                strokeWeight: 3,
                                                scale: 16,
                                            }}
                                            label={{
                                                text: 'G',
                                                color: '#ffffff',
                                                fontSize: '14px',
                                                fontWeight: 'bold'
                                            }}
                                            zIndex={100}
                                        />
                                    )}
                                </GoogleMap>
                            ) : (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '100%',
                                    color: '#999',
                                    backgroundColor: '#f5f5f5'
                                }}>
                                    지도 로딩 중...
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Description */}
                {course.description && (
                    <div style={{
                        padding: '20px',
                        flex: 1
                    }}>
                        <div style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#333',
                            marginBottom: '8px'
                        }}>
                            코스 설명
                        </div>
                        <div style={{
                            fontSize: '14px',
                            color: '#666',
                            lineHeight: '1.6',
                            whiteSpace: 'pre-wrap'
                        }}>
                            {course.description}
                        </div>
                    </div>
                )}

                {/* Footer Info */}
                <div style={{
                    padding: '16px 20px',
                    borderTop: '1px solid #f0f0f0',
                    backgroundColor: '#fff',
                    marginTop: 'auto'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '13px',
                        color: '#666'
                    }}>
                        <div>등록자: {course.creatorNickname}</div>
                    </div>
                </div>

                {/* 따라 달리기 버튼 */}
                <div style={{
                    padding: '20px',
                    backgroundColor: '#fff',
                    borderTop: '1px solid #f0f0f0'
                }}>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Follow running button clicked!');
                            console.log('onFollowRunning prop:', onFollowRunning);
                            if (onFollowRunning) {
                                onFollowRunning(course);
                            } else {
                                console.error('onFollowRunning prop is missing!');
                            }
                        }}
                        style={{
                            position: 'relative',
                            zIndex: 10,
                            width: '100%',
                            padding: '16px',
                            backgroundColor: '#10b981',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                    >
                        🏃 이 코스 따라 달리기
                    </button>
                </div>

                {/* 따라 달리기 기록 */}
                {attempts.length > 0 && (
                    <div style={{
                        padding: '20px',
                        backgroundColor: '#fff',
                        borderTop: '8px solid #f5f5f5'
                    }}>
                        <div style={{
                            fontSize: '16px',
                            fontWeight: '700',
                            color: '#1a1a1a',
                            marginBottom: '16px'
                        }}>
                            따라 달리기 기록 ({attempts.length})
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {attempts.map(attempt => (
                                <div
                                    key={attempt.id}
                                    style={{
                                        padding: '16px',
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '8px',
                                        border: attempt.courseCompleted ? '2px solid #10b981' : '1px solid #e0e0e0'
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '8px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                color: attempt.courseCompleted ? '#10b981' : '#f59e0b'
                                            }}>
                                                {attempt.courseCompleted ? '✅ 완주' : '💪 미완주'}
                                            </div>
                                            <div style={{
                                                fontSize: '13px',
                                                color: '#4b5563',
                                                fontWeight: '500'
                                            }}>
                                                {user?.nickname || 'Unknown'}
                                            </div>
                                        </div>
                                        <div style={{
                                            fontSize: '12px',
                                            color: '#999'
                                        }}>
                                            {new Date(attempt.timestamp || attempt.createdAt).toLocaleDateString('ko-KR', {
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </div>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        gap: '16px',
                                        fontSize: '13px',
                                        color: '#666'
                                    }}>
                                        <div>
                                            <span style={{ fontWeight: '600', color: '#1a1a1a' }}>
                                                {attempt.distance?.toFixed(2) || '0.00'}km
                                            </span>
                                        </div>
                                        <div>
                                            <span style={{ fontWeight: '600', color: '#1a1a1a' }}>
                                                {Math.floor((attempt.duration || 0) / 60)}:{String((attempt.duration || 0) % 60).padStart(2, '0')}
                                            </span>
                                        </div>
                                        {attempt.pace > 0 && (
                                            <div>
                                                <span style={{ fontWeight: '600', color: '#1a1a1a' }}>
                                                    {Math.floor(attempt.pace)}'{String(Math.floor((attempt.pace % 1) * 60)).padStart(2, '0')}"/km
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Comments Section */}
                <div style={{
                    padding: '20px',
                    backgroundColor: '#fff',
                    borderTop: '8px solid #f5f5f5'
                }}>
                    <div style={{
                        fontSize: '16px',
                        fontWeight: '700',
                        color: '#1a1a1a',
                        marginBottom: '16px'
                    }}>
                        댓글 {comments.length}
                    </div>

                    {/* Comment Input */}
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        marginBottom: '20px'
                    }}>
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleCreateComment()}
                            placeholder="댓글을 입력하세요..."
                            style={{
                                flex: 1,
                                padding: '12px',
                                border: '1px solid #e0e0e0',
                                borderRadius: '8px',
                                fontSize: '14px',
                                outline: 'none'
                            }}
                        />
                        <button
                            onClick={handleCreateComment}
                            disabled={!newComment.trim()}
                            style={{
                                padding: '12px 20px',
                                backgroundColor: newComment.trim() ? '#FF9A56' : '#e0e0e0',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: newComment.trim() ? 'pointer' : 'not-allowed'
                            }}
                        >
                            등록
                        </button>
                    </div>

                    {/* Comments List */}
                    {loadingComments ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                            로딩 중...
                        </div>
                    ) : comments.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                            첫 번째 댓글을 남겨보세요!
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {comments.map(comment => (
                                <div
                                    key={comment.id}
                                    style={{
                                        padding: '12px',
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '8px'
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '8px'
                                    }}>
                                        <div style={{
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            color: '#1a1a1a'
                                        }}>
                                            {comment.authorNickname}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{
                                                fontSize: '12px',
                                                color: '#999'
                                            }}>
                                                {new Date(comment.createdAt).toLocaleDateString('ko-KR', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </div>
                                            {user && comment.authorId === user.id && (
                                                <button
                                                    onClick={() => handleDeleteComment(comment.id)}
                                                    style={{
                                                        padding: '4px 8px',
                                                        backgroundColor: 'transparent',
                                                        border: 'none',
                                                        color: '#ef4444',
                                                        fontSize: '12px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    삭제
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{
                                        fontSize: '14px',
                                        color: '#333',
                                        lineHeight: '1.5',
                                        whiteSpace: 'pre-wrap'
                                    }}>
                                        {comment.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CourseViewPage;

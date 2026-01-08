import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';

const NotificationItem = ({ notification, onRead, onDelete }) => {
    const navigate = useNavigate();
    const isRead = notification.read;
    const [showDelete, setShowDelete] = useState(false);

    // Format date relative to now
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return '방금 전';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
        return `${date.getMonth() + 1}월 ${date.getDate()}일`;
    };

    const getIcon = (type) => {
        switch (type) {
            case 'CREW_JOIN_REQUEST': return '👋';
            case 'CREW_JOIN_APPROVED': return '✅';
            case 'CREW_JOIN_REJECTED': return '❌';
            case 'CREW_INVITATION': return '📩';
            case 'RUNNER_GRADE_UPGRADE': return '🏆';
            default: return '📢';
        }
    };

    const handleClick = () => {
        // Navigate based on relatedUrl
        if (notification.relatedUrl && notification.relatedUrl !== '/') {
            // 이동 확인 메시지
            if (window.confirm(`${notification.title}\n\n해당 페이지로 이동하시겠습니까?`)) {
                // Mark as read first
                onRead(notification);
                console.log("Navigating to:", notification.relatedUrl);
                navigate(notification.relatedUrl);
            }
        } else {
            // URL이 없는 경우 읽음 처리만
            onRead(notification);
        }
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation(); // Prevent navigation when clicking delete

        // 삭제 전에 읽음 처리
        onRead(notification);

        if (window.confirm('이 알림을 삭제하시겠습니까?')) {
            onDelete(notification.id);
        }
    };

    return (
        <div
            onClick={handleClick}
            style={{
                padding: '16px',
                backgroundColor: isRead ? '#fff' : '#fff9f0',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                gap: '12px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                position: 'relative'
            }}
        >
            <div style={{
                fontSize: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: isRead ? '#f5f5f5' : '#fff',
                border: isRead ? 'none' : '1px solid #FF9A56',
                flexShrink: 0
            }}>
                {getIcon(notification.type)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontSize: '14px',
                    fontWeight: isRead ? '500' : '700',
                    color: '#1a1a1a',
                    marginBottom: '4px'
                }}>
                    {notification.title}
                </div>
                <div style={{
                    fontSize: '13px',
                    color: '#666',
                    marginBottom: '6px',
                    lineHeight: '1.4'
                }}>
                    {notification.message}
                </div>
                <div style={{
                    fontSize: '11px',
                    color: '#999'
                }}>
                    {formatDate(notification.createdDate)}
                </div>
            </div>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                {!isRead && (
                    <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#FF9A56'
                    }} />
                )}
                <button
                    onClick={handleDeleteClick}
                    style={{
                        padding: '6px 10px',
                        fontSize: '12px',
                        color: '#999',
                        backgroundColor: 'transparent',
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.color = '#ff4444';
                        e.target.style.borderColor = '#ff4444';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.color = '#999';
                        e.target.style.borderColor = '#e0e0e0';
                    }}
                >
                    삭제
                </button>
            </div>
        </div>
    );
};

function MyNotificationsTab({ user, onRead }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, [user, page]);

    const fetchNotifications = async () => {
        try {
            const response = await api.request(`${import.meta.env.VITE_API_URL}/api/notifications?page=${page}&size=20`, {
                headers: {
                    'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (page === 0) {
                    setNotifications(data.content);
                } else {
                    setNotifications(prev => [...prev, ...data.content]);
                }
                setHasMore(!data.last);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRead = async (notification) => {
        if (!notification.read) {
            try {
                await api.request(`${import.meta.env.VITE_API_URL}/api/notifications/${notification.id}/read`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
                    }
                });

                setNotifications(prev => prev.map(n =>
                    n.id === notification.id ? { ...n, read: true } : n
                ));

                // Callback to update global unread count
                if (onRead) {
                    onRead();
                }
            } catch (error) {
                console.error('Failed to mark as read:', error);
            }
        }
    };

    const handleDelete = async (notificationId) => {
        try {
            const response = await api.request(`${import.meta.env.VITE_API_URL}/api/notifications/${notificationId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
                }
            });

            if (response.ok) {
                // Remove from local state
                setNotifications(prev => prev.filter(n => n.id !== notificationId));

                // Update unread count if needed
                if (onRead) {
                    onRead();
                }
            }
        } catch (error) {
            console.error('Failed to delete notification:', error);
            alert('알림 삭제에 실패했습니다.');
        }
    };

    if (loading && page === 0) {
        return <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>로딩 중...</div>;
    }

    if (notifications.length === 0) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 20px',
                color: '#999'
            }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>새로운 알림이 없습니다</div>
            </div>
        );
    }

    return (
        <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
            {notifications.map(notification => (
                <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRead={handleRead}
                    onDelete={handleDelete}
                />
            ))}

            {hasMore && (
                <button
                    onClick={() => setPage(p => p + 1)}
                    style={{
                        width: '100%',
                        padding: '16px',
                        border: 'none',
                        background: 'transparent',
                        color: '#666',
                        cursor: 'pointer',
                        borderTop: '1px solid #f0f0f0'
                    }}
                >
                    더 보기
                </button>
            )}
        </div>
    );
}

export default MyNotificationsTab;

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

function ChatRoomScreen() {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [otherUser, setOtherUser] = useState(null);
    const messagesEndRef = useRef(null);
    const pollingIntervalRef = useRef(null);

    const currentUser = JSON.parse(localStorage.getItem('running_user'));

    useEffect(() => {
        fetchMessages();
        markAsRead();

        // Start polling for new messages every 3 seconds
        pollingIntervalRef.current = setInterval(() => {
            fetchMessages(true);
        }, 3000);

        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, [roomId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchMessages = async (silent = false) => {
        try {
            if (!silent) setLoading(true);

            const response = await api.request(`${import.meta.env.VITE_API_URL}/api/chat/${roomId}/messages?page=0&size=100`, {
                headers: {
                    'Authorization': currentUser.accessToken.startsWith('Bearer ') ? currentUser.accessToken : `Bearer ${currentUser.accessToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setMessages(data.content || []);

                // Get other user info from first message
                if (data.content && data.content.length > 0 && !otherUser) {
                    const firstMessage = data.content[0];
                    const otherUserId = firstMessage.senderId === currentUser.id ?
                        data.content.find(m => m.senderId !== currentUser.id)?.senderId :
                        firstMessage.senderId;

                    if (otherUserId) {
                        fetchOtherUserInfo(otherUserId);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const fetchOtherUserInfo = async (userId) => {
        try {
            const response = await api.request(`${import.meta.env.VITE_API_URL}/user/${userId}/profile`, {
                headers: {
                    'Authorization': currentUser.accessToken.startsWith('Bearer ') ? currentUser.accessToken : `Bearer ${currentUser.accessToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setOtherUser(data);
            }
        } catch (error) {
            console.error('Failed to fetch other user info:', error);
        }
    };

    const markAsRead = async () => {
        try {
            await api.request(`${import.meta.env.VITE_API_URL}/api/chat/${roomId}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': currentUser.accessToken.startsWith('Bearer ') ? currentUser.accessToken : `Bearer ${currentUser.accessToken}`
                }
            });
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            const response = await api.request(`${import.meta.env.VITE_API_URL}/api/chat/${roomId}/message`, {
                method: 'POST',
                headers: {
                    'Authorization': currentUser.accessToken.startsWith('Bearer ') ? currentUser.accessToken : `Bearer ${currentUser.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: newMessage })
            });

            if (response.ok) {
                setNewMessage('');
                fetchMessages(true); // Refresh messages
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            alert('메시지 전송에 실패했습니다.');
        } finally {
            setSending(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleBack = () => {
        navigate('/chat');
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? '오후' : '오전';
        const displayHours = hours % 12 || 12;
        return `${ampm} ${displayHours}:${minutes.toString().padStart(2, '0')}`;
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#f5f5f5',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #FF9A56 0%, #FF6B45 100%)',
                padding: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                flexShrink: 0
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <button
                        onClick={handleBack}
                        style={{
                            background: 'rgba(255,255,255,0.25)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: '8px',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                            cursor: 'pointer',
                            color: '#fff',
                            padding: 0
                        }}
                    >
                        ←
                    </button>
                    <h1 style={{
                        margin: 0,
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#fff',
                        textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        {otherUser?.nickname || '채팅'}
                    </h1>
                </div>
            </div>

            {/* Messages */}
            <div style={{
                flex: 1,
                overflow: 'auto',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
            }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                        로딩 중...
                    </div>
                ) : messages.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        color: '#999'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
                        <div style={{ fontSize: '16px' }}>첫 메시지를 보내보세요!</div>
                    </div>
                ) : (
                    messages.map((message, index) => {
                        const isMyMessage = message.senderId === currentUser.id;
                        const showTime = index === messages.length - 1 ||
                            messages[index + 1]?.senderId !== message.senderId;

                        return (
                            <div
                                key={message.id}
                                style={{
                                    display: 'flex',
                                    justifyContent: isMyMessage ? 'flex-end' : 'flex-start',
                                    alignItems: 'flex-end',
                                    gap: '8px'
                                }}
                            >
                                {!isMyMessage && showTime && (
                                    <div style={{
                                        fontSize: '11px',
                                        color: '#999',
                                        marginBottom: '4px'
                                    }}>
                                        {formatTime(message.createdDate)}
                                    </div>
                                )}

                                <div style={{
                                    maxWidth: '70%',
                                    padding: '12px 16px',
                                    borderRadius: isMyMessage ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                    backgroundColor: isMyMessage ? '#FF9A56' : '#fff',
                                    color: isMyMessage ? '#fff' : '#1a1a1a',
                                    fontSize: '15px',
                                    lineHeight: '1.4',
                                    wordBreak: 'break-word',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                }}>
                                    {message.message}
                                </div>

                                {isMyMessage && showTime && (
                                    <div style={{
                                        fontSize: '11px',
                                        color: '#999',
                                        marginBottom: '4px'
                                    }}>
                                        {formatTime(message.createdDate)}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
                onSubmit={handleSendMessage}
                style={{
                    padding: '16px',
                    backgroundColor: '#fff',
                    borderTop: '1px solid #e0e0e0',
                    flexShrink: 0
                }}
            >
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center'
                }}>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="메시지를 입력하세요..."
                        disabled={sending}
                        style={{
                            flex: 1,
                            padding: '12px 16px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '24px',
                            fontSize: '15px',
                            outline: 'none',
                            backgroundColor: '#f9f9f9'
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            border: 'none',
                            backgroundColor: newMessage.trim() && !sending ? '#FF9A56' : '#e0e0e0',
                            color: '#fff',
                            fontSize: '20px',
                            cursor: newMessage.trim() && !sending ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            flexShrink: 0
                        }}
                    >
                        ➤
                    </button>
                </div>
            </form>
        </div>
    );
}

export default ChatRoomScreen;

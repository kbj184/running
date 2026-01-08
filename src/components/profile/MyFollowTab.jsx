import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { RUNNER_GRADES } from '../../constants/runnerGrades';

function MyFollowTab({ user }) {
    const navigate = useNavigate();
    const [activeSubTab, setActiveSubTab] = useState('followers');
    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);
    const [mutualFollows, setMutualFollows] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFollowData();
    }, [user, activeSubTab]);

    const fetchFollowData = async () => {
        setLoading(true);
        try {
            let endpoint = '';
            switch (activeSubTab) {
                case 'followers':
                    endpoint = '/api/follow/followers';
                    break;
                case 'following':
                    endpoint = '/api/follow/following';
                    break;
                case 'mutual':
                    endpoint = '/api/follow/mutual';
                    break;
                default:
                    return;
            }

            const response = await api.request(`${import.meta.env.VITE_API_URL}${endpoint}`, {
                headers: {
                    'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                switch (activeSubTab) {
                    case 'followers':
                        setFollowers(data);
                        break;
                    case 'following':
                        setFollowing(data);
                        break;
                    case 'mutual':
                        setMutualFollows(data);
                        break;
                }
            }
        } catch (error) {
            console.error('Failed to fetch follow data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUnfollow = async (userId) => {
        if (!window.confirm('팔로우를 취소하시겠습니까?')) return;

        try {
            const response = await api.request(`${import.meta.env.VITE_API_URL}/api/follow/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
                }
            });

            if (response.ok) {
                // Refresh the list
                fetchFollowData();
            }
        } catch (error) {
            console.error('Failed to unfollow:', error);
            alert('팔로우 취소에 실패했습니다.');
        }
    };

    const handleUserClick = (userId) => {
        navigate(`/user/${userId}/profile`);
    };

    const getGradeInfo = (gradeName) => {
        return RUNNER_GRADES[gradeName] || RUNNER_GRADES.BEGINNER;
    };

    const renderUserList = (users, showUnfollowButton = false) => {
        if (loading) {
            return <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>로딩 중...</div>;
        }

        if (users.length === 0) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '60px 20px',
                    color: '#999'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
                    <div style={{ fontSize: '16px', fontWeight: '600' }}>
                        {activeSubTab === 'followers' && '아직 팔로워가 없습니다'}
                        {activeSubTab === 'following' && '아직 팔로우한 사람이 없습니다'}
                        {activeSubTab === 'mutual' && '아직 맞팔로우한 사람이 없습니다'}
                    </div>
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
                {users.map(userItem => {
                    const gradeInfo = getGradeInfo(userItem.runnerGrade);
                    return (
                        <div
                            key={userItem.id}
                            style={{
                                padding: '16px',
                                borderBottom: '1px solid #f0f0f0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                            }}
                            onClick={() => handleUserClick(userItem.id)}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            {/* Profile Image */}
                            <div style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                backgroundColor: '#f0f0f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px',
                                flexShrink: 0,
                                overflow: 'hidden'
                            }}>
                                {userItem.nicknameImage ? (
                                    <img
                                        src={userItem.nicknameImage}
                                        alt={userItem.nickname}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    '👤'
                                )}
                            </div>

                            {/* User Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    fontSize: '15px',
                                    fontWeight: '600',
                                    color: '#1a1a1a',
                                    marginBottom: '4px'
                                }}>
                                    {userItem.nickname}
                                </div>
                                <div style={{
                                    fontSize: '13px',
                                    color: gradeInfo.color,
                                    fontWeight: '500'
                                }}>
                                    {gradeInfo.icon} {gradeInfo.label}
                                </div>
                            </div>

                            {/* Unfollow Button */}
                            {showUnfollowButton && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleUnfollow(userItem.id);
                                    }}
                                    style={{
                                        padding: '8px 16px',
                                        fontSize: '13px',
                                        color: '#666',
                                        backgroundColor: '#f5f5f5',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        fontWeight: '500'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = '#fff';
                                        e.target.style.borderColor = '#ff4444';
                                        e.target.style.color = '#ff4444';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = '#f5f5f5';
                                        e.target.style.borderColor = '#e0e0e0';
                                        e.target.style.color = '#666';
                                    }}
                                >
                                    언팔로우
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div>
            {/* Sub Tabs */}
            <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '20px',
                borderBottom: '2px solid rgba(255,255,255,0.1)'
            }}>
                <button
                    onClick={() => setActiveSubTab('followers')}
                    style={{
                        flex: 1,
                        padding: '12px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: activeSubTab === 'followers' ? '3px solid #FF9A56' : '3px solid transparent',
                        color: activeSubTab === 'followers' ? '#fff' : 'rgba(255,255,255,0.6)',
                        fontWeight: activeSubTab === 'followers' ? '700' : '500',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    팔로워
                </button>
                <button
                    onClick={() => setActiveSubTab('following')}
                    style={{
                        flex: 1,
                        padding: '12px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: activeSubTab === 'following' ? '3px solid #FF9A56' : '3px solid transparent',
                        color: activeSubTab === 'following' ? '#fff' : 'rgba(255,255,255,0.6)',
                        fontWeight: activeSubTab === 'following' ? '700' : '500',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    팔로잉
                </button>
                <button
                    onClick={() => setActiveSubTab('mutual')}
                    style={{
                        flex: 1,
                        padding: '12px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: activeSubTab === 'mutual' ? '3px solid #FF9A56' : '3px solid transparent',
                        color: activeSubTab === 'mutual' ? '#fff' : 'rgba(255,255,255,0.6)',
                        fontWeight: activeSubTab === 'mutual' ? '700' : '500',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    맞팔로우
                </button>
            </div>

            {/* User List */}
            {activeSubTab === 'followers' && renderUserList(followers, false)}
            {activeSubTab === 'following' && renderUserList(following, true)}
            {activeSubTab === 'mutual' && renderUserList(mutualFollows, false)}
        </div>
    );
}

export default MyFollowTab;

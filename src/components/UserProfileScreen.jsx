import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { RUNNER_GRADES } from '../constants/runnerGrades';

function UserProfileScreen() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [followStatus, setFollowStatus] = useState({ isFollowing: false, isFollower: false });
    const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
    const [followLoading, setFollowLoading] = useState(false);

    useEffect(() => {
        fetchUserProfile();
        fetchFollowStatus();
        fetchFollowCounts();
    }, [userId]);

    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            const user = JSON.parse(localStorage.getItem('running_user'));

            const response = await api.request(`${import.meta.env.VITE_API_URL}/user/${userId}/profile`, {
                headers: {
                    'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setProfile(data);
            } else {
                setError('프로필을 불러올 수 없습니다.');
            }
        } catch (err) {
            console.error('Failed to fetch user profile:', err);
            setError('프로필을 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const fetchFollowStatus = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('running_user'));
            const response = await api.request(`${import.meta.env.VITE_API_URL}/api/follow/status/${userId}`, {
                headers: {
                    'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setFollowStatus(data);
            }
        } catch (error) {
            console.error('Failed to fetch follow status:', error);
        }
    };

    const fetchFollowCounts = async () => {
        try {
            const response = await api.request(`${import.meta.env.VITE_API_URL}/api/follow/counts/${userId}`);
            if (response.ok) {
                const data = await response.json();
                setFollowCounts(data);
            }
        } catch (error) {
            console.error('Failed to fetch follow counts:', error);
        }
    };

    const handleFollowToggle = async () => {
        setFollowLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('running_user'));
            const method = followStatus.isFollowing ? 'DELETE' : 'POST';

            const response = await api.request(`${import.meta.env.VITE_API_URL}/api/follow/${userId}`, {
                method,
                headers: {
                    'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
                }
            });

            if (response.ok) {
                // Update follow status
                setFollowStatus(prev => ({
                    ...prev,
                    isFollowing: !prev.isFollowing
                }));
                // Update counts
                setFollowCounts(prev => ({
                    ...prev,
                    followers: prev.followers + (followStatus.isFollowing ? -1 : 1)
                }));
            }
        } catch (error) {
            console.error('Failed to toggle follow:', error);
            alert('팔로우 처리에 실패했습니다.');
        } finally {
            setFollowLoading(false);
        }
    };

    const isOwnProfile = () => {
        const user = JSON.parse(localStorage.getItem('running_user'));
        return user && user.id && user.id.toString() === userId;
    };

    const handleBack = () => {
        navigate(-1);
    };

    const formatDuration = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    const formatPace = (pace) => {
        if (!pace || pace === 0) return '-';
        const minutes = Math.floor(pace);
        const seconds = Math.floor((pace - minutes) * 60);
        return `${minutes}'${seconds.toString().padStart(2, '0')}"`;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return '오늘';
        if (diffDays === 1) return '어제';
        if (diffDays < 7) return `${diffDays}일 전`;

        return `${date.getMonth() + 1}월 ${date.getDate()}일`;
    };

    // Parse profile image
    const getProfileImage = () => {
        if (!profile?.nicknameImage) return null;

        try {
            const parsed = JSON.parse(profile.nicknameImage);
            return parsed.url || null;
        } catch {
            if (profile.nicknameImage.startsWith('http')) {
                return profile.nicknameImage;
            }
            return null;
        }
    };

    const getGradeInfo = (gradeName) => {
        return RUNNER_GRADES[gradeName] || RUNNER_GRADES.BEGINNER;
    };

    if (loading) {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999
            }}>
                <div style={{ textAlign: 'center', color: '#666' }}>
                    <div style={{ fontSize: '24px', marginBottom: '12px' }}>👤</div>
                    <div>프로필 로딩 중...</div>
                </div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: '#fff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999
            }}>
                <div style={{ textAlign: 'center', color: '#666', marginBottom: '24px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>😕</div>
                    <div>{error || '프로필을 찾을 수 없습니다.'}</div>
                </div>
                <button
                    onClick={handleBack}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: '#FF9A56',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '15px',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    돌아가기
                </button>
            </div>
        );
    }

    const profileImage = getProfileImage();
    const gradeInfo = getGradeInfo(profile.runnerGrade);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#fff',
            zIndex: 9999,
            overflow: 'auto',
            animation: 'slideInRight 0.3s ease-out'
        }}>
            <style>{`
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                    }
                    to {
                        transform: translateX(0);
                    }
                }
            `}</style>

            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #FF9A56 0%, #FF6B45 100%)',
                padding: '16px',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
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
                        fontSize: '20px',
                        fontWeight: '700',
                        color: '#fff',
                        textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        {profile.nickname}
                    </h1>
                </div>
            </div>

            {/* Profile Content */}
            <div style={{ padding: '24px 20px', paddingBottom: '80px' }}>
                {/* Profile Header */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: '32px'
                }}>
                    {/* Profile Image */}
                    <div style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        backgroundColor: '#e0e0e0',
                        margin: '0 auto 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}>
                        {profileImage ? (
                            <img src={profileImage} alt={profile.nickname} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <span style={{ fontSize: '48px' }}>👤</span>
                        )}
                    </div>

                    {/* Nickname */}
                    <h2 style={{
                        margin: '0 0 12px 0',
                        fontSize: '24px',
                        fontWeight: '700',
                        color: '#1a1a1a'
                    }}>
                        {profile.nickname}
                    </h2>

                    {/* Runner Grade Badge */}
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        backgroundColor: gradeInfo.color + '15',
                        marginBottom: '12px'
                    }}>
                        <span style={{ fontSize: '16px' }}>{gradeInfo.emoji}</span>
                        <span style={{
                            fontSize: '14px',
                            fontWeight: '700',
                            color: gradeInfo.color
                        }}>
                            {gradeInfo.name}
                        </span>
                    </div>

                    {/* Activity Area */}
                    {profile.activityAreaLevel2 && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            color: '#666',
                            fontSize: '14px',
                            marginBottom: '16px'
                        }}>
                            <span>📍</span>
                            <span>{profile.activityAreaLevel2}</span>
                        </div>
                    )}

                    {/* Follow Counts */}
                    <div style={{
                        display: 'flex',
                        gap: '24px',
                        justifyContent: 'center',
                        marginBottom: '16px'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                fontSize: '20px',
                                fontWeight: '700',
                                color: '#1a1a1a'
                            }}>
                                {followCounts.followers}
                            </div>
                            <div style={{
                                fontSize: '13px',
                                color: '#666'
                            }}>
                                팔로워
                            </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                fontSize: '20px',
                                fontWeight: '700',
                                color: '#1a1a1a'
                            }}>
                                {followCounts.following}
                            </div>
                            <div style={{
                                fontSize: '13px',
                                color: '#666'
                            }}>
                                팔로잉
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons - Only show for other users' profiles */}
                    {!isOwnProfile() && (
                        <div style={{
                            display: 'flex',
                            gap: '8px',
                            justifyContent: 'center'
                        }}>
                            <button
                                onClick={handleFollowToggle}
                                disabled={followLoading}
                                style={{
                                    flex: 1,
                                    padding: '12px 24px',
                                    backgroundColor: followStatus.isFollowing ? '#f5f5f5' : '#FF9A56',
                                    color: followStatus.isFollowing ? '#666' : '#fff',
                                    border: followStatus.isFollowing ? '1px solid #e0e0e0' : 'none',
                                    borderRadius: '8px',
                                    fontSize: '15px',
                                    fontWeight: '600',
                                    cursor: followLoading ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    opacity: followLoading ? 0.6 : 1
                                }}
                            >
                                {followLoading ? '처리중...' :
                                    followStatus.isMutual ? '맞팔로우' :
                                        followStatus.isFollowing ? '팔로잉' :
                                            followStatus.isFollower ? '팔로우 백' :
                                                '팔로우'}
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        const user = JSON.parse(localStorage.getItem('running_user'));
                                        const response = await api.request(`${import.meta.env.VITE_API_URL}/api/chat/room/${userId}`, {
                                            method: 'POST',
                                            headers: {
                                                'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
                                            }
                                        });
                                        if (response.ok) {
                                            const data = await response.json();
                                            navigate(`/chat/${data.roomId}`, {
                                                state: { otherUserNickname: data.otherUserNickname || profile?.nickname }
                                            });
                                        }
                                    } catch (error) {
                                        console.error('Failed to create chat room:', error);
                                    }
                                }}
                                style={{
                                    flex: 1,
                                    padding: '12px 24px',
                                    backgroundColor: '#fff',
                                    color: '#FF9A56',
                                    border: '1px solid #FF9A56',
                                    borderRadius: '8px',
                                    fontSize: '15px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                💬 메시지
                            </button>
                        </div>
                    )}
                </div>

                {/* Statistics Grid */}
                <div style={{
                    marginBottom: '32px'
                }}>
                    <h3 style={{
                        margin: '0 0 16px 0',
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#1a1a1a'
                    }}>
                        러닝 기록
                    </h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '12px'
                    }}>
                        {/* Total Runs */}
                        <div style={{
                            backgroundColor: '#f8f9fa',
                            borderRadius: '12px',
                            padding: '16px',
                            textAlign: 'center'
                        }}>
                            <div style={{
                                fontSize: '13px',
                                color: '#666',
                                marginBottom: '8px'
                            }}>
                                총 러닝
                            </div>
                            <div style={{
                                fontSize: '24px',
                                fontWeight: '700',
                                color: '#1a1a1a'
                            }}>
                                {profile.stats.totalRuns}
                                <span style={{ fontSize: '14px', fontWeight: '600', marginLeft: '4px' }}>회</span>
                            </div>
                        </div>

                        {/* Total Distance */}
                        <div style={{
                            backgroundColor: '#f8f9fa',
                            borderRadius: '12px',
                            padding: '16px',
                            textAlign: 'center'
                        }}>
                            <div style={{
                                fontSize: '13px',
                                color: '#666',
                                marginBottom: '8px'
                            }}>
                                총 거리
                            </div>
                            <div style={{
                                fontSize: '24px',
                                fontWeight: '700',
                                color: '#1a1a1a'
                            }}>
                                {profile.stats.totalDistance.toFixed(1)}
                                <span style={{ fontSize: '14px', fontWeight: '600', marginLeft: '4px' }}>km</span>
                            </div>
                        </div>

                        {/* Best Distance */}
                        <div style={{
                            backgroundColor: '#f8f9fa',
                            borderRadius: '12px',
                            padding: '16px',
                            textAlign: 'center'
                        }}>
                            <div style={{
                                fontSize: '13px',
                                color: '#666',
                                marginBottom: '8px'
                            }}>
                                최장 거리
                            </div>
                            <div style={{
                                fontSize: '24px',
                                fontWeight: '700',
                                color: '#FF9A56'
                            }}>
                                {profile.stats.bestDistance.toFixed(1)}
                                <span style={{ fontSize: '14px', fontWeight: '600', marginLeft: '4px' }}>km</span>
                            </div>
                        </div>

                        {/* Best Pace */}
                        <div style={{
                            backgroundColor: '#f8f9fa',
                            borderRadius: '12px',
                            padding: '16px',
                            textAlign: 'center'
                        }}>
                            <div style={{
                                fontSize: '13px',
                                color: '#666',
                                marginBottom: '8px'
                            }}>
                                최고 페이스
                            </div>
                            <div style={{
                                fontSize: '24px',
                                fontWeight: '700',
                                color: '#FF9A56'
                            }}>
                                {formatPace(profile.stats.bestPace)}
                                <span style={{ fontSize: '14px', fontWeight: '600', marginLeft: '4px' }}>/km</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activities */}
                {profile.recentActivities && profile.recentActivities.length > 0 && (
                    <div>
                        <h3 style={{
                            margin: '0 0 16px 0',
                            fontSize: '18px',
                            fontWeight: '700',
                            color: '#1a1a1a'
                        }}>
                            최근 활동
                        </h3>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                        }}>
                            {profile.recentActivities.map((activity, index) => (
                                <div
                                    key={activity.sessionId || index}
                                    style={{
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '12px',
                                        padding: '16px',
                                        display: 'flex',
                                        gap: '12px'
                                    }}
                                >
                                    {/* Thumbnail */}
                                    {activity.thumbnail && (
                                        <div style={{
                                            width: '80px',
                                            height: '80px',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            flexShrink: 0,
                                            backgroundColor: '#e0e0e0'
                                        }}>
                                            <img
                                                src={activity.thumbnail}
                                                alt="route"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        </div>
                                    )}

                                    {/* Activity Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontSize: '13px',
                                            color: '#999',
                                            marginBottom: '8px'
                                        }}>
                                            {formatDate(activity.date)}
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'baseline',
                                            gap: '8px',
                                            marginBottom: '8px'
                                        }}>
                                            <span style={{
                                                fontSize: '20px',
                                                fontWeight: '700',
                                                color: '#1a1a1a'
                                            }}>
                                                {activity.distance.toFixed(2)}
                                            </span>
                                            <span style={{
                                                fontSize: '14px',
                                                color: '#666'
                                            }}>
                                                km
                                            </span>
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            gap: '12px',
                                            fontSize: '13px',
                                            color: '#666'
                                        }}>
                                            <span>⏱️ {formatDuration(activity.duration)}</span>
                                            <span>⚡ {formatPace(activity.pace)}/km</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* No Activities Message */}
                {(!profile.recentActivities || profile.recentActivities.length === 0) && (
                    <div style={{
                        textAlign: 'center',
                        padding: '40px 20px',
                        color: '#999'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏃</div>
                        <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                            아직 러닝 기록이 없습니다
                        </div>
                        <div style={{ fontSize: '14px' }}>
                            첫 러닝을 시작해보세요!
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default UserProfileScreen;

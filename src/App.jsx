import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { LoadScript } from '@react-google-maps/api';
import './running-styles.css';
import './main-layout.css';
import { RUNNER_GRADES } from './constants/runnerGrades';
import { deleteSession } from './utils/db';
import { api } from './utils/api';
import { useFcm } from './hooks/useFcm';

// Google Maps 라이브러리 배열을 상수로 선언 (재렌더링 시 재생성 방지)
const GOOGLE_MAPS_LIBRARIES = ['marker', 'places'];

// Layout Components
import MainLayout from './components/layout/MainLayout';
import MainHeader from './components/layout/MainHeader';
import ProfileSubHeader from './components/layout/ProfileSubHeader';
import CrewSubHeader from './components/layout/CrewSubHeader';
import BottomNavigation from './components/layout/BottomNavigation';

// Tab Components
import HomeTab from './components/tabs/HomeTab';
import RunningTab from './components/tabs/RunningTab';
import CrewTab from './components/tabs/CrewTab';
import MyRunTab from './components/tabs/MyRunTab';

// Profile Components
import ProfileMenu from './components/profile/ProfileMenu';
import MyRecordsTab from './components/profile/MyRecordsTab';
import MyCourseTab from './components/profile/MyCourseTab';
import MyInfoTab from './components/profile/MyInfoTab';
import MyNotificationsTab from './components/profile/MyNotificationsTab';
import MyFollowTab from './components/profile/MyFollowTab';
import SettingsTab from './components/profile/SettingsTab';

// Crew Components
import CrewHomeTab from './components/tabs/crew/CrewHomeTab';
import CrewRankingTab from './components/tabs/crew/CrewRankingTab';
import CrewCreateTab from './components/tabs/crew/CrewCreateTab';
import CrewLayout from './components/layout/CrewLayout';

// Modal Components
import RunnerGradeModal from './components/modals/RunnerGradeModal';

// Screen Components
import CountdownScreen from './components/CountdownScreen';
import RunningScreen from './components/RunningScreen';
import FollowCourseRunningScreen from './components/FollowCourseRunningScreen';
import ResultScreen from './components/ResultScreen';
import LoginScreen from './components/auth/LoginScreen';
import NicknameRegistration from './components/auth/NicknameRegistration';
import UserProfileScreen from './components/UserProfileScreen';
import ChatListScreen from './components/ChatListScreen';
import ChatRoomScreen from './components/ChatRoomScreen';
import RecordDetailModal from './components/RecordDetailModal';
import CourseComparisonModal from './components/CourseComparisonModal';

// Existing Modals


function App() {
    // User & Auth State
    const [user, setUser] = useState(null);
    const [isAuthChecking, setIsAuthChecking] = useState(true);

    // Runner State
    const [runners, setRunners] = useState([]);
    const [stats, setStats] = useState({});
    const [selectedRunner, setSelectedRunner] = useState(null);
    const [showLabels, setShowLabels] = useState(false);

    // Running State
    const [isRunning, setIsRunning] = useState(false);
    const [screenMode, setScreenMode] = useState('map');
    const [runningResult, setRunningResult] = useState(null);
    const [sessionId, setSessionId] = useState(null);
    const [refreshRecords, setRefreshRecords] = useState(0);
    const [savedScrollPosition, setSavedScrollPosition] = useState(0);

    // Navigation State
    const [activeTab, setActiveTab] = useState('home');

    // Crew State
    const [userCrew, setUserCrew] = useState(null);
    const [selectedCrew, setSelectedCrew] = useState(null);
    const [allCrews, setAllCrews] = useState([]);
    const [showCrewDetailModal, setShowCrewDetailModal] = useState(false);

    // Profile Menu State
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [profileTab, setProfileTab] = useState('records');

    // Modal State
    const [showRunnerGradeModal, setShowRunnerGradeModal] = useState(false);
    const [showRecordDetailModal, setShowRecordDetailModal] = useState(false);
    const [showCourseComparisonModal, setShowCourseComparisonModal] = useState(false);
    const [selectedRecordForDetail, setSelectedRecordForDetail] = useState(null);
    const [courseToFollow, setCourseToFollow] = useState(null);

    // Initialize FCM
    const { notification: incomingNotification } = useFcm(user);

    // Notification State
    const [unreadCount, setUnreadCount] = useState(0);

    // Listen for incoming notifications to update unread count
    useEffect(() => {
        if (incomingNotification) {
            console.log("🔔 Notification received, refreshing unread count");
            fetchUnreadCount();
        }
    }, [incomingNotification]);

    // Refetch count when app becomes visible/focused
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && user) {
                fetchUnreadCount();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [user]);

    const fetchUnreadCount = async () => {
        if (!user) return;
        try {
            const response = await api.request(`${import.meta.env.VITE_API_URL}/api/notifications/unread-count`, {
                headers: {
                    'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setUnreadCount(data.count);
            }
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    };

    useEffect(() => {
        if (user) {
            fetchUnreadCount();
        }
    }, [user, activeTab]); // Refresh on tab change


    // Token Refresh Event Listener
    useEffect(() => {
        const handleTokenRefresh = (e) => {
            const newToken = e.detail;
            console.log('🔄 Access Token updated via event:', newToken);
            setUser(prev => {
                if (prev) {
                    const updated = { ...prev, accessToken: newToken };
                    localStorage.setItem('running_user', JSON.stringify(updated));
                    return updated;
                }
                return prev;
            });
        };

        window.addEventListener('token-refreshed', handleTokenRefresh);
        return () => window.removeEventListener('token-refreshed', handleTokenRefresh);
    }, []);

    // Handle dynamic viewport height for mobile
    useEffect(() => {
        const setVh = () => {
            let vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        setVh();
        window.addEventListener('resize', setVh);
        window.addEventListener('orientationchange', setVh);
        return () => {
            window.removeEventListener('resize', setVh);
            window.removeEventListener('orientationchange', setVh);
        };
    }, []);

    // Auth Check
    const checkAuth = async () => {
        setIsAuthChecking(true);
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const isOAuthCallback = urlParams.has('code') || window.location.pathname.includes('/oauth2/callback');

            if (isOAuthCallback) {
                console.log('🔐 OAuth 콜백 감지됨');
                window.history.replaceState({}, document.title, window.location.pathname);
            }

            console.log('🔄 토큰 갱신 시도...');
            const refreshResponse = await fetch(`${import.meta.env.VITE_API_URL}/refresh/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });

            if (refreshResponse.ok) {
                let accessToken = refreshResponse.headers.get('Authorization');
                if (accessToken && accessToken.startsWith('Bearer ')) {
                    accessToken = accessToken.substring(7);
                }
                console.log('🔑 갱신된 Access Token:', accessToken);

                if (accessToken) {
                    console.log('👤 내 정보(my) 호출 중...');
                    const myResponse = await api.request(`${import.meta.env.VITE_API_URL}/my`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        }
                    });

                    if (myResponse.ok) {
                        const userData = await myResponse.json();
                        userData.accessToken = accessToken;

                        console.log('✅ 자동 로그인 & 정보 조회 성공:', userData);
                        setUser(userData);
                        localStorage.setItem('running_user', JSON.stringify(userData));
                    } else {
                        console.log('❌ 내 정보 조회 실패:', myResponse.status);
                        throw new Error('Failed to fetch user info');
                    }
                } else {
                    console.log('❌ Access Token이 헤더에 없습니다.');
                    throw new Error('No access token');
                }
            } else {
                console.log('❌ 리프레시 토큰 만료 또는 실패:', refreshResponse.status);
                throw new Error('Refresh token invalid');
            }
        } catch (error) {
            console.error('❌ 인증 체크 실패:', error);
            setUser(null);
            localStorage.removeItem('running_user');
        } finally {
            setIsAuthChecking(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    // Fetch Crews
    const fetchCrews = async (filters = {}) => {
        if (!user) return;
        try {
            // 필터 파라미터 구성
            const queryParams = new URLSearchParams();
            if (filters.level1) queryParams.append('adminLevel1', filters.level1);
            if (filters.level2) queryParams.append('adminLevel2', filters.level2);
            if (filters.level3) queryParams.append('adminLevel3', filters.level3);

            const queryString = queryParams.toString();
            const url = `${import.meta.env.VITE_API_URL}/crew/all${queryString ? `?${queryString}` : ''}`;

            const response = await api.request(url, {
                method: 'GET',
                headers: {
                    'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
                }
            });

            if (response.ok) {
                const crews = await response.json();
                setAllCrews(crews);
            }
        } catch (error) {
            console.error('크루 목록 로드 실패:', error);
        }
    };

    useEffect(() => {
        if (activeTab === 'crew') {
            fetchCrews();
        }
    }, [activeTab, user]);

    // Handlers
    const handleLogin = (userData) => {
        console.log('✅ 로그인 성공:', userData);
        setUser(userData);
        localStorage.setItem('running_user', JSON.stringify(userData));
    };

    const handleLogout = () => {
        console.log('👋 로그아웃');
        setUser(null);
        localStorage.removeItem('running_user');
        setScreenMode('map');
    };

    const handleUserUpdate = (updatedUser) => {
        console.log('✅ 사용자 정보 업데이트:', updatedUser);
        const newUserData = { ...user, ...updatedUser };
        setUser(newUserData);
        localStorage.setItem('running_user', JSON.stringify(newUserData));
    };

    // Fetch Real User Running Data
    const fetchRunningCenterData = async () => {
        if (!user) return;
        try {
            const response = await api.request(`${import.meta.env.VITE_API_URL}/api/running/running-center/latest`, {
                headers: {
                    'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('📍 Running Center Data:', data);

                // Transform backend data to runner format
                const transformedRunners = data.map((session, index) => {
                    // Parse route data
                    let route = [];
                    try {
                        route = typeof session.route === 'string' ? JSON.parse(session.route) : session.route;
                    } catch (e) {
                        console.error('Failed to parse route:', e);
                        route = [];
                    }

                    // Get current position (last point in route)
                    const position = route.length > 0 ? route[route.length - 1] : { lat: 37.5665, lng: 126.9780 };

                    // Validate grade
                    const validGrade = session.grade && RUNNER_GRADES[session.grade]
                        ? session.grade
                        : 'BEGINNER';

                    return {
                        id: session.userId || index,
                        nickname: session.nickname || '익명',
                        position: position,
                        grade: validGrade,
                        distance: (session.distance || 0).toFixed(1),
                        speed: (session.speed || 0).toFixed(1),
                        duration: Math.floor((session.duration || 0) / 60), // seconds to minutes
                        route: route,
                        pace: (session.pace || 0).toFixed(1),
                        profileImageUrl: session.profileImageUrl,
                        userId: session.userId
                    };
                });

                setRunners(transformedRunners);

                // Calculate stats
                const newStats = {};
                Object.keys(RUNNER_GRADES).forEach(grade => {
                    newStats[grade] = transformedRunners.filter(r => r.grade === grade).length;
                });
                setStats(newStats);
            }
        } catch (error) {
            console.error('Failed to fetch running center data:', error);
        }
    };

    // Initialize and periodically refresh running center data
    useEffect(() => {
        if (user) {
            fetchRunningCenterData();

            // Refresh every 30 seconds
            const interval = setInterval(() => {
                fetchRunningCenterData();
            }, 30000);

            return () => clearInterval(interval);
        }
    }, [user]);

    const handleRefresh = () => {
        fetchRunningCenterData();
        setSelectedRunner(null);
    };

    const handleRunnerClick = (runner) => {
        setSelectedRunner(runner);
    };

    const handleClosePanel = () => {
        setSelectedRunner(null);
    };

    const handleStartToggle = () => {
        if (!isRunning) {
            setScreenMode('countdown');
        }
    };

    const handleCountdownComplete = () => {
        setIsRunning(true);
        setSessionId(`session_${Date.now()}`);
        setScreenMode('running');
    };

    const handleRunningStop = async (result) => {
        setIsRunning(false);
        setRunningResult(result);

        if (result.gradeUpgraded) {
            console.log('🎉 Grade Upgraded! Refreshing user info...');
            await checkAuth();
        }

        setScreenMode('result');
    };

    const handleRecordClick = (record) => {
        // 현재 스크롤 위치 저장
        const scrollPosition = window.scrollY || document.documentElement.scrollTop;
        setSavedScrollPosition(scrollPosition);
        console.log('📍 스크롤 위치 저장:', scrollPosition);

        // 새로운 RecordDetailModal 사용
        setSelectedRecordForDetail(record);
        setShowRecordDetailModal(true);
    };

    // 도전하기 핸들러
    const handleStartCourseChallenge = async (record) => {
        console.log('🏃 코스 재도전 시작 (원본 데이터):', record);

        // 코스 ID 추출 (record.courseId가 우선, 없으면 record.id 사용 - 코스 자체일 경우 대비)
        const targetCourseId = record.courseId || record.id;
        console.log('🎯 타겟 코스 ID:', targetCourseId);

        // 기본값: 현재 기록의 데이터 사용 (백업용)
        let courseData = {
            id: targetCourseId,
            courseId: targetCourseId, // 필드명 혼선 방지 위해 둘 다 설정
            name: record.title || record.name || `코스 재도전 - ${new Date(record.timestamp || record.createdAt).toLocaleDateString()}`,
            routeData: record.route,
            distance: record.distance,
            courseType: 'RETRY'
        };

        // 만약 targetCourseId가 있다면 서버에서 원본 코스 정보를 가져옴 (크루 코스 따라하기와 동일한 로직)
        if (targetCourseId) {
            try {
                const response = await api.request(`${import.meta.env.VITE_API_URL}/api/running/course/${targetCourseId}`);
                if (response.ok) {
                    const originalCourse = await response.json();
                    console.log('📖 원본 코스 정보 로드 성공:', originalCourse);
                    courseData = {
                        ...courseData,
                        id: originalCourse.id || courseData.id,
                        courseId: originalCourse.id || courseData.courseId,
                        name: originalCourse.title || originalCourse.name || courseData.name,
                        routeData: originalCourse.routeData || courseData.routeData,
                        distance: originalCourse.distance || courseData.distance
                    };
                } else {
                    console.warn(`⚠️ 코스 정보 조회 실패 (${response.status}). 기존 데이터를 사용합니다.`);
                }
            } catch (err) {
                console.warn('⚠️ 원본 코스를 불러올 수 없어 현재 기록 데이터를 유지합니다:', err);
            }
        }

        console.log('🚀 최종 설정된 courseData:', courseData);
        setCourseToFollow(courseData);
        setScreenMode('follow_course'); // 카운트다운 없이 즉시 위치 조절 화면으로 진입
        setShowRecordDetailModal(false);
        setShowCourseComparisonModal(false);
    };

    const handleChallengeRecordClick = (record) => {
        setSelectedRecordForDetail(record);
        setShowCourseComparisonModal(true);
    };

    const handleFollowCourseStop = async (result) => {
        setIsRunning(false);
        setRunningResult(result);
        setCourseToFollow(null);

        if (result.gradeUpgraded) {
            console.log('🎉 Grade Upgraded! Refreshing user info...');
            await checkAuth();
        }

        setScreenMode('result');
    };

    const handleCloseFollowCourse = () => {
        setCourseToFollow(null);
        setScreenMode('map');
    };

    const handleSave = () => {
        console.log('💾 저장하기 버튼 클릭!');
        setScreenMode('map');
        setRunningResult(null);
        setSessionId(null);
        setRefreshRecords(prev => prev + 1);

        // 저장된 스크롤 위치로 복원
        setTimeout(() => {
            window.scrollTo(0, savedScrollPosition);
            console.log('📍 스크롤 위치 복원:', savedScrollPosition);
        }, 0);
    };

    const handleDelete = async () => {
        if (sessionId) {
            try {
                // 1. IndexedDB 삭제
                await deleteSession(sessionId);
                console.log('🗑️ IndexedDB 세션 삭제 완료:', sessionId);

                // 2. MariaDB(백엔드) 삭제
                if (user && user.accessToken) {
                    const response = await api.request(`${import.meta.env.VITE_API_URL}/api/running/session/${sessionId}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
                        }
                    });

                    if (response.ok) {
                        console.log('☁️ MariaDB 세션 삭제 완료:', sessionId);
                    } else {
                        console.error('❌ MariaDB 세션 삭제 실패:', response.status);
                    }
                }
            } catch (err) {
                console.error('❌ 세션 삭제 에러:', err);
            }
        }
        setScreenMode('map');
        setRunningResult(null);
        setSessionId(null);
        setRefreshRecords(prev => prev + 1);

        // 저장된 스크롤 위치로 복원
        setTimeout(() => {
            window.scrollTo(0, savedScrollPosition);
            console.log('📍 스크롤 위치 복원:', savedScrollPosition);
        }, 0);
    };

    const handleToggleLabels = () => {
        setShowLabels(prev => !prev);
    };

    const handleCreateCrew = (crewData) => {
        setUserCrew({
            ...crewData,
            role: 'captain',
            memberCount: 1,
            createdAt: new Date().toISOString()
        });
        fetchCrews();
        checkAuth();
        setShowCreateCrewModal(false);
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setShowProfileMenu(false);

        // 크루 탭으로 이동 시 항상 크루 홈으로 리셋
        if (tab === 'crew') {
            setUser(prev => ({ ...prev, crewTab: 'home' }));
        }
    };

    const handleProfileClick = () => {
        if (!showProfileMenu) {
            setShowProfileMenu(true);
            setProfileTab('records');
        }
    };

    const handleProfileTabChange = (tab) => {
        setProfileTab(tab);
    };



    // Loading Screen
    if (isAuthChecking) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: '#1a1a1a',
                color: '#fff',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                <div className="spinner" style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid rgba(255,255,255,0.3)',
                    borderRadius: '50%',
                    borderTopColor: '#fff',
                    animation: 'spin 1s ease-in-out infinite'
                }}></div>
                <div>Running Crew 접속 중...</div>
                <style>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    // Login Screen
    if (!user) {
        return <LoginScreen onLogin={handleLogin} />;
    }

    // Countdown Screen
    if (screenMode === 'countdown') {
        return <CountdownScreen onComplete={handleCountdownComplete} />;
    }

    // Main App Screen (including Running Screen and Result Screen inside LoadScript)
    return (
        <BrowserRouter>
            <LoadScript
                id="google-map-script"
                googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                libraries={GOOGLE_MAPS_LIBRARIES}
                loadingElement={<div>Loading Maps...</div>}
            >
                {/* Nickname & Activity Area Registration Screen */}
                {(!user.nickname || !user.activityAreaRegistered) ? (
                    <NicknameRegistration user={user} onComplete={handleLogin} />
                ) : (
                    /* Running Screen */
                    screenMode === 'running' ? (
                        <RunningScreen onStop={handleRunningStop} sessionId={sessionId} user={user} />
                    ) : screenMode === 'follow_course' && courseToFollow ? (
                        /* Follow Course Running Screen */
                        <FollowCourseRunningScreen
                            course={courseToFollow}
                            onStop={handleFollowCourseStop}
                            onClose={handleCloseFollowCourse}
                            user={user}
                        />
                    ) : (screenMode === 'result' || screenMode === 'view_record') && runningResult ? (
                        /* Result Screen - shown when viewing records */
                        <ResultScreen
                            result={runningResult}
                            onSave={handleSave}
                            onDelete={handleDelete}
                            mode={screenMode === 'view_record' ? 'view' : 'finish'}
                        />
                    ) : (
                        /* Main App with React Router */
                        <Routes>
                            <Route path="/" element={
                                <MainLayout
                                    user={user}
                                    onProfileClick={handleProfileClick}
                                    onGradeClick={() => setShowRunnerGradeModal(true)}
                                    onStartRunning={handleStartToggle}
                                />
                            }>
                                {/* Home Tab */}
                                <Route index element={<HomeTab />} />

                                {/* Running Tab */}
                                <Route path="running" element={
                                    <RunningTab
                                        runners={runners}
                                        stats={stats}
                                        selectedRunner={selectedRunner}
                                        isRunning={isRunning}
                                        showLabels={showLabels}
                                        onRunnerClick={handleRunnerClick}
                                        onRefresh={handleRefresh}
                                        onStartToggle={handleStartToggle}
                                        onToggleLabels={handleToggleLabels}
                                        onClosePanel={handleClosePanel}
                                    />
                                } />

                                {/* Crew Tab - URL 기반 서브 라우팅 */}
                                <Route path="crew" element={<CrewLayout />}>
                                    <Route index element={
                                        <CrewHomeTab
                                            allCrews={allCrews}
                                            onRefreshCrews={fetchCrews}
                                            user={user}
                                        />
                                    } />
                                    <Route path="ranking" element={<CrewRankingTab allCrews={allCrews} />} />
                                    <Route path="create" element={
                                        <CrewCreateTab
                                            user={user}
                                            onCreate={() => {
                                                window.location.href = '/crew';
                                                fetchCrews();
                                            }}
                                        />
                                    } />
                                    {/* Crew 상세 및 기타 페이지는 CrewTab에서 처리 */}
                                    <Route path="*" element={
                                        <CrewTab
                                            user={user}
                                            allCrews={allCrews}
                                            onRefreshCrews={fetchCrews}
                                            crewTab={user.crewTab || 'home'}
                                            onCrewTabChange={(tab) => setUser(prev => ({ ...prev, crewTab: tab }))}
                                        />
                                    } />
                                </Route>



                                {/* Profile Tab - URL 기반 서브 라우팅 */}
                                <Route path="profile">
                                    <Route index element={<Navigate to="records" replace />} />
                                    <Route path="records" element={
                                        <ProfileMenu profileTab="records" unreadCount={unreadCount}>
                                            <MyRecordsTab
                                                refreshRecords={refreshRecords}
                                                onRecordClick={handleRecordClick}
                                                user={user}
                                            />
                                        </ProfileMenu>
                                    } />
                                    <Route path="courses" element={
                                        <ProfileMenu profileTab="courses" unreadCount={unreadCount}>
                                            <MyCourseTab
                                                user={user}
                                                onRecordClick={handleRecordClick}
                                                onChallengeRecordClick={handleChallengeRecordClick}
                                            />
                                        </ProfileMenu>
                                    } />
                                    <Route path="info" element={
                                        <ProfileMenu profileTab="info" unreadCount={unreadCount}>
                                            <MyInfoTab user={user} />
                                        </ProfileMenu>
                                    } />
                                    <Route path="notifications" element={
                                        <ProfileMenu profileTab="notifications" unreadCount={unreadCount}>
                                            <MyNotificationsTab
                                                user={user}
                                                onRead={() => {
                                                    // Decrease global count locally or re-fetch
                                                    setUnreadCount(prev => Math.max(0, prev - 1));
                                                }}
                                            />
                                        </ProfileMenu>
                                    } />
                                    <Route path="follow" element={
                                        <ProfileMenu profileTab="follow" unreadCount={unreadCount}>
                                            <MyFollowTab user={user} />
                                        </ProfileMenu>
                                    } />
                                    <Route path="settings" element={
                                        <ProfileMenu profileTab="settings" unreadCount={unreadCount}>
                                            <SettingsTab
                                                user={user}
                                                onLogout={handleLogout}
                                                onUserUpdate={handleUserUpdate}
                                            />
                                        </ProfileMenu>
                                    } />
                                </Route>

                                {/* User Profile - 독립적인 풀페이지 라우트 */}
                                <Route path="/user/:userId/profile" element={<UserProfileScreen />} />
                            </Route>
                            {/* Chat - 독립적인 풀페이지 라우트 */}
                            <Route path="/chat" element={<ChatListScreen />} />
                            <Route path="/chat/:roomId" element={<ChatRoomScreen />} />
                        </Routes>
                    )
                )}

                {/* Runner Grade Modal - 전역 모달 */}
                {showRunnerGradeModal && (
                    <RunnerGradeModal
                        user={user}
                        onClose={() => setShowRunnerGradeModal(false)}
                    />
                )}

                {/* Record Detail Modal - 전역 모달 */}
                {showRecordDetailModal && selectedRecordForDetail && (
                    <RecordDetailModal
                        record={selectedRecordForDetail}
                        user={user}
                        onClose={() => {
                            setShowRecordDetailModal(false);
                            setSelectedRecordForDetail(null);
                        }}
                        onStartCourseChallenge={handleStartCourseChallenge}
                    />
                )}

                {/* Course Comparison Modal - 전역 모달 */}
                {showCourseComparisonModal && selectedRecordForDetail && (
                    <CourseComparisonModal
                        record={selectedRecordForDetail}
                        user={user}
                        onClose={() => setShowCourseComparisonModal(false)}
                        onStartCourseChallenge={handleStartCourseChallenge}
                    />
                )}
            </LoadScript>
        </BrowserRouter >
    );
}

export default App;

import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { LoadScript } from '@react-google-maps/api';
import './running-styles.css';
import './main-layout.css';
import { RUNNER_GRADES } from './constants/runnerGrades';
import { generateRunners } from './utils/runnerUtils';
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
import MyInfoTab from './components/profile/MyInfoTab';
import MyNotificationsTab from './components/profile/MyNotificationsTab';
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
import ResultScreen from './components/ResultScreen';
import LoginScreen from './components/auth/LoginScreen';
import NicknameRegistration from './components/auth/NicknameRegistration';
import UserProfileScreen from './components/UserProfileScreen';

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

    // Initialize FCM
    const { notification: incomingNotification } = useFcm(user);

    // Notification State
    const [unreadCount, setUnreadCount] = useState(0);

    // Listen for incoming notifications to update unread count
    useEffect(() => {
        if (incomingNotification) {
            setUnreadCount(prev => prev + 1);
        }
    }, [incomingNotification]);

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

    // Initialize Runners
    useEffect(() => {
        const initialRunners = generateRunners(50);
        setRunners(initialRunners);

        const newStats = {};
        Object.keys(RUNNER_GRADES).forEach(grade => {
            newStats[grade] = initialRunners.filter(r => r.grade === grade).length;
        });
        setStats(newStats);

        const interval = setInterval(() => {
            setRunners(prevRunners =>
                prevRunners.map(runner => {
                    const newPosition = {
                        lat: runner.position.lat + (Math.random() - 0.5) * 0.001,
                        lng: runner.position.lng + (Math.random() - 0.5) * 0.001
                    };
                    return {
                        ...runner,
                        position: newPosition,
                        route: [...runner.route.slice(0, -1), newPosition]
                    };
                })
            );
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const handleRefresh = () => {
        const newRunners = generateRunners(50);
        setRunners(newRunners);

        const newStats = {};
        Object.keys(RUNNER_GRADES).forEach(grade => {
            newStats[grade] = newRunners.filter(r => r.grade === grade).length;
        });
        setStats(newStats);
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

        setRunningResult(record);
        setSessionId(record.sessionId);
        setScreenMode('view_record');
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
                                            onCrewCreated={() => {
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



                                /* Profile Tab - URL 기반 서브 라우팅 */
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
            </LoadScript>
        </BrowserRouter>
    );
}

export default App;

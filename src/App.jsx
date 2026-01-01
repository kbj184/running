import { useState, useEffect } from 'react';
import { LoadScript } from '@react-google-maps/api';
import './running-styles.css';
import './main-layout.css';
import { RUNNER_GRADES } from './constants/runnerGrades';
import { generateRunners } from './utils/runnerUtils';
import { deleteSession } from './utils/db';
import { api } from './utils/api';

// Google Maps 라이브러리 배열을 상수로 선언 (재렌더링 시 재생성 방지)
const GOOGLE_MAPS_LIBRARIES = ['marker', 'places'];

// Layout Components
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

// Modal Components
import RunnerGradeModal from './components/modals/RunnerGradeModal';

// Screen Components
import CountdownScreen from './components/CountdownScreen';
import RunningScreen from './components/RunningScreen';
import ResultScreen from './components/ResultScreen';
import LoginScreen from './components/auth/LoginScreen';
import NicknameRegistration from './components/auth/NicknameRegistration';

// Existing Modals
import CrewDetailModal from './components/common/CrewDetailModal';

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
    const fetchCrews = async () => {
        if (!user) return;
        try {
            const response = await api.request(`${import.meta.env.VITE_API_URL}/crew/nearby?radiusKm=3`, {
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

    const handleCrewClick = (crew) => {
        setSelectedCrew(crew);
        setShowCrewDetailModal(true);
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

    // Nickname & Activity Area Registration Screen
    if (!user.nickname || !user.activityAreaRegistered) {
        return <NicknameRegistration user={user} onComplete={handleLogin} />;
    }

    // Countdown Screen
    if (screenMode === 'countdown') {
        return <CountdownScreen onComplete={handleCountdownComplete} />;
    }

    // Running Screen
    if (screenMode === 'running') {
        return <RunningScreen onStop={handleRunningStop} sessionId={sessionId} user={user} />;
    }

    // Main App Screen (including Result Screen inside LoadScript)
    return (
        <LoadScript
            googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
            libraries={GOOGLE_MAPS_LIBRARIES}
            loadingElement={<div>Loading Maps...</div>}
        >
            {/* Result Screen - shown when viewing records */}
            {(screenMode === 'result' || screenMode === 'view_record') && runningResult ? (
                <ResultScreen
                    result={runningResult}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    mode={screenMode === 'view_record' ? 'view' : 'finish'}
                />
            ) : (
                <div className="main-app-container">
                    {/* Fixed Header Container (MainHeader + optional ProfileSubHeader) */}
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: 1000,
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <MainHeader
                            user={user}
                            onProfileClick={handleProfileClick}
                            onGradeClick={() => setShowRunnerGradeModal(true)}
                        />

                        {showProfileMenu && (
                            <ProfileSubHeader
                                profileTab={profileTab}
                                onTabChange={handleProfileTabChange}
                            />
                        )}

                        {activeTab === 'crew' && !showProfileMenu && (
                            <CrewSubHeader
                                crewTab={user.crewTab || 'home'}
                                onTabChange={(tab) => setUser(prev => ({ ...prev, crewTab: tab }))}
                            />
                        )}
                    </div>

                    {/* Scrollable Content Area */}
                    <div className="main-content" style={{
                        marginTop: showProfileMenu ? 'calc(var(--header-height) + 60px)' :
                            (activeTab === 'crew' && !showProfileMenu) ? 'calc(var(--header-height) + 60px)' :
                                'var(--header-height)'
                    }}>
                        {/* Home Tab */}
                        {activeTab === 'home' && !showProfileMenu && <HomeTab />}

                        {/* Profile Menu Content */}
                        {showProfileMenu && (
                            <ProfileMenu
                                profileTab={profileTab}
                                user={user}
                                refreshRecords={refreshRecords}
                                onRecordClick={handleRecordClick}
                                onLogout={handleLogout}
                                onUserUpdate={handleUserUpdate}
                            />
                        )}

                        {/* Running Center Tab */}
                        {activeTab === 'running' && !showProfileMenu && (
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
                        )}

                        {/* Crew Tab */}
                        {activeTab === 'crew' && !showProfileMenu && (
                            <CrewTab
                                user={user}
                                allCrews={allCrews}
                                onCrewClick={handleCrewClick}
                                onRefreshCrews={fetchCrews}
                                crewTab={user.crewTab || 'home'}
                                onCrewTabChange={(tab) => setUser(prev => ({ ...prev, crewTab: tab }))}
                            />
                        )}

                        {/* MyRun Tab */}
                        {activeTab === 'myrun' && !showProfileMenu && (
                            <MyRunTab
                                refreshRecords={refreshRecords}
                                onRecordClick={handleRecordClick}
                                user={user}
                            />
                        )}



                        <CrewDetailModal
                            isOpen={showCrewDetailModal}
                            onClose={() => {
                                setShowCrewDetailModal(false);
                                setSelectedCrew(null);
                            }}
                            crew={selectedCrew}
                            user={user}
                            onUpdateUser={() => {
                                checkAuth();
                                fetchCrews();
                            }}
                        />

                        {/* Runner Grade Modal */}
                        {showRunnerGradeModal && (
                            <RunnerGradeModal
                                user={user}
                                onClose={() => setShowRunnerGradeModal(false)}
                            />
                        )}
                    </div>

                    {/* Fixed Bottom Navigation */}
                    <BottomNavigation
                        activeTab={activeTab}
                        onTabChange={handleTabChange}
                        onStartRunning={handleStartToggle}
                        onProfileClick={handleProfileClick}
                    />
                </div>
            )}
        </LoadScript>
    );
}

export default App;

import { useState, useEffect } from 'react';
import './running-styles.css';
import './main-layout.css';
import { RUNNER_GRADES } from './constants/runnerGrades';
import { getGradeInfo, getGradeBadgeStyle, getBadgeStyle, RUNNER_GRADE_INFO } from './constants/runnerGradeInfo';
import { generateRunners } from './utils/runnerUtils';
import Header from './components/common/Header';
import MapView from './components/map/MapView';
import RunnerDetailPanel from './components/runner/RunnerDetailPanel';
import CountdownScreen from './components/CountdownScreen';
import RunningScreen from './components/RunningScreen';
import ResultScreen from './components/ResultScreen';
import RecentRecords from './components/common/RecentRecords';
import CreateCrewModal from './components/common/CreateCrewModal';
import CrewDetailModal from './components/common/CrewDetailModal';
import LoginScreen from './components/auth/LoginScreen';
import NicknameRegistration from './components/auth/NicknameRegistration';
import { deleteSession } from './utils/db';
import { api } from './utils/api';

function App() {
    const [user, setUser] = useState(null); // 로그인 상태
    const [runners, setRunners] = useState([]);
    const [stats, setStats] = useState({});
    const [selectedRunner, setSelectedRunner] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [screenMode, setScreenMode] = useState('map'); // 'map', 'countdown', 'running', 'result'
    const [runningResult, setRunningResult] = useState(null);
    const [sessionId, setSessionId] = useState(null);
    const [refreshRecords, setRefreshRecords] = useState(0); // 최근 기록 새로고침 트리거
    const [showLabels, setShowLabels] = useState(false); // 지명 표시 여부 (기본: OFF)
    const [activeTab, setActiveTab] = useState('home'); // 'home', 'running', 'crew', 'myrun'

    // 크루 관련 상태
    const [userCrew, setUserCrew] = useState(null);
    const [selectedCrew, setSelectedCrew] = useState(null); // 상세 보기용 크루
    const [allCrews, setAllCrews] = useState([]);
    const [showCreateCrewModal, setShowCreateCrewModal] = useState(false);
    const [showCrewDetailModal, setShowCrewDetailModal] = useState(false);
    const [showRunnerGradeModal, setShowRunnerGradeModal] = useState(false);

    // 프로필 메뉴 상태
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [profileTab, setProfileTab] = useState('records'); // 'records', 'info', 'settings'

    const [isAuthChecking, setIsAuthChecking] = useState(true); // 인증 체크 상태

    useEffect(() => {
        // 토큰 갱신 이벤트 리스너: API 호출 중 토큰이 갱신되면 상태 업데이트
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

    const checkAuth = async () => {
        setIsAuthChecking(true);
        try {
            // OAuth 콜백 처리: URL에서 OAuth 관련 파라미터 확인
            const urlParams = new URLSearchParams(window.location.search);
            const isOAuthCallback = urlParams.has('code') || window.location.pathname.includes('/oauth2/callback');

            if (isOAuthCallback) {
                console.log('🔐 OAuth 콜백 감지됨');
                // OAuth 콜백인 경우 URL 파라미터 제거 (깔끔한 URL 유지)
                window.history.replaceState({}, document.title, window.location.pathname);
            }

            // 1. Refresh Token으로 Access Token 갱신 시도
            console.log('🔄 토큰 갱신 시도...');
            const refreshResponse = await fetch(`${import.meta.env.VITE_API_URL}/refresh/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // 쿠키 포함
            });

            if (refreshResponse.ok) {
                let accessToken = refreshResponse.headers.get('Authorization');
                if (accessToken && accessToken.startsWith('Bearer ')) {
                    accessToken = accessToken.substring(7); // 'Bearer ' 제거
                }
                console.log('🔑 갱신된 Access Token:', accessToken);

                if (accessToken) {
                    // 2. 토큰으로 내 정보(my) 호출 - 공통 API 유틸 사용
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
                        // my 호출 시 받은 데이터에 토큰도 포함해서 관리
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

    const fetchCrews = async () => {
        if (!user) return;
        try {
            const response = await api.request(`${import.meta.env.VITE_API_URL}/crew/all`, {
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

    // 크루 탭 활성화 시 크루 목록 로드
    useEffect(() => {
        if (activeTab === 'crew') {
            fetchCrews();
        }
    }, [activeTab, user]);

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

    useEffect(() => {
        // 초기 러너 데이터 생성
        const initialRunners = generateRunners(50);
        setRunners(initialRunners);

        // 통계 계산
        const newStats = {};
        Object.keys(RUNNER_GRADES).forEach(grade => {
            newStats[grade] = initialRunners.filter(r => r.grade === grade).length;
        });
        setStats(newStats);

        // 5초마다 러너 위치 업데이트 (실시간 효과)
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
                        route: [...runner.route.slice(0, -1), newPosition] // 경로 업데이트
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
            // 카운트다운 시작
            setScreenMode('countdown');
        }
    };

    const handleCountdownComplete = () => {
        // 러닝 시작
        setIsRunning(true);
        setSessionId(`session_${Date.now()}`);
        setScreenMode('running');
    };

    const handleRunningStop = async (result) => {
        setIsRunning(false);
        setRunningResult(result);

        // 승급이 있으면 사용자 정보 새로고침
        if (result.gradeUpgraded) {
            console.log('🎉 Grade Upgraded! Refreshing user info...');
            await checkAuth(); // 사용자 정보 새로고침
        }

        setScreenMode('result');
    };

    // 기록 클릭 시 상세 화면 표시
    const handleRecordClick = (record) => {
        setRunningResult(record);
        setSessionId(record.sessionId);
        setScreenMode('view_record');
    };

    // 저장하고 홈으로 (또는 그냥 홈으로)
    const handleSave = () => {
        console.log('💾 저장하기 버튼 클릭!');
        console.log('📊 현재 세션 ID:', sessionId);
        console.log('📊 현재 결과 데이터:', runningResult);
        setScreenMode('map');
        setRunningResult(null);
        setSessionId(null);
        setRefreshRecords(prev => {
            const newValue = prev + 1;
            console.log('🔄 기록 새로고침 트리거:', newValue);
            return newValue;
        });
    };

    // 삭제하고 홈으로
    const handleDelete = async () => {
        if (sessionId) {
            try {
                await deleteSession(sessionId);
                console.log('🗑️ 세션 삭제 완료:', sessionId);
            } catch (err) {
                console.error('❌ 세션 삭제 실패:', err);
            }
        }
        setScreenMode('map');
        setRunningResult(null);
        setSessionId(null);
        setRefreshRecords(prev => prev + 1); // 기록 목록 새로고침
    };

    // 지명 표시 토글
    const handleToggleLabels = () => {
        setShowLabels(prev => !prev);
    };

    const handleCreateCrew = (crewData) => {
        setUserCrew({
            ...crewData,
            role: 'captain', // 만든 사람은 크루장이 됨
            memberCount: 1, // 본인 포함 1명
            createdAt: new Date().toISOString()
        });
        fetchCrews(); // 리스트 갱신
        checkAuth(); // 내 정보 갱신 (크루 정보 포함)
        setShowCreateCrewModal(false);
    };

    const totalRunners = runners.length;

    // 인증 체크 중 로딩 표시
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

    // 로그인하지 않은 경우 로그인/회원가입 화면 표시
    if (!user) {
        return <LoginScreen onLogin={handleLogin} />;
    }

    // 닉네임이 없는 경우 닉네임 등록 화면 표시
    if (!user.nickname) {
        return <NicknameRegistration user={user} onComplete={handleLogin} />;
    }

    // 카운트다운 화면 표시
    if (screenMode === 'countdown') {
        return <CountdownScreen onComplete={handleCountdownComplete} />;
    }

    // 러닝 화면 표시
    if (screenMode === 'running') {
        return <RunningScreen onStop={handleRunningStop} sessionId={sessionId} user={user} />;
    }

    // 결과 화면 표시 (러닝 완료 직후 또는 기록 조회)
    if ((screenMode === 'result' || screenMode === 'view_record') && runningResult) {
        return <ResultScreen
            result={runningResult}
            onSave={handleSave}
            onDelete={handleDelete}
            mode={screenMode === 'view_record' ? 'view' : 'finish'}
        />;
    }

    // 기본 맵 화면
    return (
        <div className="main-app-container">
            {/* Fixed Header */}
            <div className="main-header">
                <div className="main-logo">llrun</div>
                <div className="main-user-profile">
                    {/* Crew Badge if joined */}
                    {user.crewName && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(255,255,255,0.1)',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            marginRight: '8px',
                            border: '1px solid rgba(255,255,255,0.2)'
                        }}>
                            <span style={{ fontSize: '14px' }}>
                                {(() => {
                                    if (!user.crewImage) return '🏃';
                                    try {
                                        const img = JSON.parse(user.crewImage);
                                        if (img.url) {
                                            return <img src={img.url} alt="crew" style={{ width: '16px', height: '16px', borderRadius: '50%', objectFit: 'cover' }} />;
                                        }
                                        return img.emoji || '🏃';
                                    } catch {
                                        if (user.crewImage.startsWith('http')) {
                                            return <img src={user.crewImage} alt="crew" style={{ width: '16px', height: '16px', borderRadius: '50%', objectFit: 'cover' }} />;
                                        }
                                        return '🏃';
                                    }
                                })()}
                            </span>
                            <span style={{ color: '#fff', fontWeight: '600' }}>{user.crewName}</span>
                        </div>
                    )}

                    {/* Runner Grade Badge */}
                    {user.runnerGrade && (() => {
                        const gradeInfo = getGradeInfo(user.runnerGrade);
                        return (
                            <div
                                style={{
                                    ...getGradeBadgeStyle(user.runnerGrade),
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onClick={() => setShowRunnerGradeModal(true)}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <span>{gradeInfo.emoji}</span>
                                <span>{gradeInfo.nameKo}</span>
                                {gradeInfo.badge && (
                                    <span style={getBadgeStyle(gradeInfo.badge, gradeInfo.color)}>
                                        {gradeInfo.badge}
                                    </span>
                                )}
                            </div>
                        );
                    })()}

                    <div
                        className="user-profile-section"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '8px',
                            transition: 'all 0.2s'
                        }}
                        onClick={() => {
                            if (!showProfileMenu) {
                                setShowProfileMenu(true);
                                setProfileTab('records'); // 기본 탭으로 리셋
                            }
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    >
                        <div className="user-profile-image">
                            {user.nicknameImage ? (
                                <img src={user.nicknameImage} alt={user.nickname} />
                            ) : (
                                <div className="default-profile-icon">👤</div>
                            )}
                        </div>
                        <span className="user-nickname">{user.nickname}</span>
                    </div>
                </div>
            </div>

            {/* Profile Sub-Header */}
            {showProfileMenu && (
                <div style={{
                    position: 'fixed',
                    top: '60px',
                    left: 0,
                    right: 0,
                    backgroundColor: '#fff',
                    borderBottom: '1px solid #e0e0e0',
                    zIndex: 999,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <div style={{
                        display: 'flex',
                        gap: '0',
                        padding: '0 20px',
                        maxWidth: '1200px',
                        margin: '0 auto'
                    }}>
                        <button
                            onClick={() => setProfileTab('records')}
                            style={{
                                flex: 1,
                                padding: '16px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                borderBottom: profileTab === 'records' ? '3px solid #1a1a1a' : '3px solid transparent',
                                color: profileTab === 'records' ? '#1a1a1a' : '#888',
                                fontWeight: profileTab === 'records' ? '700' : '500',
                                fontSize: '15px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            내 기록
                        </button>
                        <button
                            onClick={() => setProfileTab('info')}
                            style={{
                                flex: 1,
                                padding: '16px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                borderBottom: profileTab === 'info' ? '3px solid #1a1a1a' : '3px solid transparent',
                                color: profileTab === 'info' ? '#1a1a1a' : '#888',
                                fontWeight: profileTab === 'info' ? '700' : '500',
                                fontSize: '15px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            내 정보
                        </button>
                        <button
                            onClick={() => setProfileTab('settings')}
                            style={{
                                flex: 1,
                                padding: '16px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                borderBottom: profileTab === 'settings' ? '3px solid #1a1a1a' : '3px solid transparent',
                                color: profileTab === 'settings' ? '#1a1a1a' : '#888',
                                fontWeight: profileTab === 'settings' ? '700' : '500',
                                fontSize: '15px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px'
                            }}
                        >
                            <span>⚙️</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Scrollable Content Area */}
            <div className="main-content" style={{ marginTop: showProfileMenu ? '60px' : '0' }}>
                {/* Home Tab */}
                {activeTab === 'home' && (
                    <div className="tab-content home-tab">
                        <div className="welcome-section">
                            <h1>Welcome to LLRun! 🏃</h1>
                            <p>함께 달리는 즐거움을 경험하세요</p>
                        </div>
                    </div>
                )}

                {/* Profile Menu Content */}
                {showProfileMenu && (
                    <div className="tab-content profile-tab" style={{ padding: '20px' }}>
                        {profileTab === 'records' && (
                            <div>
                                <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: '700' }}>내 기록</h2>
                                <RecentRecords
                                    onRefresh={refreshRecords}
                                    onRecordClick={handleRecordClick}
                                />
                            </div>
                        )}

                        {profileTab === 'info' && (
                            <div>
                                <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: '700' }}>내 정보</h2>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '16px',
                                    maxWidth: '600px'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px',
                                        padding: '20px',
                                        backgroundColor: '#f9f9f9',
                                        borderRadius: '12px'
                                    }}>
                                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                                            {user.nicknameImage ? (
                                                <img src={user.nicknameImage} alt={user.nickname} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', backgroundColor: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>👤</div>
                                            )}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>{user.nickname}</div>
                                            <div style={{ fontSize: '14px', color: '#666' }}>{user.email}</div>
                                        </div>
                                    </div>

                                    {user.runnerGrade && (() => {
                                        const gradeInfo = getGradeInfo(user.runnerGrade);
                                        return (
                                            <div style={{
                                                padding: '20px',
                                                backgroundColor: '#f9f9f9',
                                                borderRadius: '12px'
                                            }}>
                                                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>러너 등급</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '32px' }}>{gradeInfo.emoji}</span>
                                                    <span style={{ fontSize: '20px', fontWeight: '700', color: gradeInfo.color }}>
                                                        {gradeInfo.nameKo}
                                                    </span>
                                                    {gradeInfo.badge && (
                                                        <span style={getBadgeStyle(gradeInfo.badge, gradeInfo.color)}>
                                                            {gradeInfo.badge}
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>{gradeInfo.description}</div>
                                            </div>
                                        );
                                    })()}

                                    {user.crewName && (
                                        <div style={{
                                            padding: '20px',
                                            backgroundColor: '#f9f9f9',
                                            borderRadius: '12px'
                                        }}>
                                            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>소속 크루</div>
                                            <div style={{ fontSize: '18px', fontWeight: '700' }}>{user.crewName}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {profileTab === 'settings' && (
                            <div>
                                <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: '700' }}>설정</h2>
                                <div style={{ maxWidth: '600px' }}>
                                    <button
                                        onClick={handleLogout}
                                        style={{
                                            width: '100%',
                                            padding: '16px',
                                            backgroundColor: '#ef4444',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '16px',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        로그아웃
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Running Center Tab */}
                {activeTab === 'running' && (
                    <div className="tab-content running-tab">
                        {/* Map Controls Overlay - Right Side */}
                        <div className="map-controls-overlay">
                            <button
                                onClick={handleToggleLabels}
                                className={`map-control-icon-btn ${showLabels ? 'active' : ''}`}
                                title={showLabels ? '지명 ON' : '지명 OFF'}
                            >
                                📍
                            </button>
                        </div>

                        {/* Map */}
                        <MapView
                            runners={runners}
                            stats={stats}
                            selectedRunner={selectedRunner}
                            isRunning={isRunning}
                            onRunnerClick={handleRunnerClick}
                            onRefresh={handleRefresh}
                            onStartToggle={handleStartToggle}
                            showLabels={showLabels}
                        />

                        {/* Runner Detail Panel */}
                        <RunnerDetailPanel
                            runner={selectedRunner}
                            onClose={handleClosePanel}
                        />
                    </div>
                )}

                {/* Crew Tab */}
                {activeTab === 'crew' && (
                    <div className="tab-content crew-tab">
                        <div className="crew-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h2 style={{ margin: 0 }}>크루 목록</h2>
                                {!user.crewId && (
                                    <button
                                        onClick={() => setShowCreateCrewModal(true)}
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: '#1a1a1a',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        + 크루 만들기
                                    </button>
                                )}
                            </div>

                            {allCrews.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                                    <p>아직 생성된 크루가 없습니다.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {allCrews.map((crew) => {
                                        let crewImage;
                                        try {
                                            crewImage = JSON.parse(crew.imageUrl);
                                        } catch {
                                            crewImage = { url: crew.imageUrl };
                                        }

                                        return (
                                            <div
                                                key={crew.id}
                                                onClick={() => {
                                                    // 선택된 크루를 별도 state에 저장
                                                    setSelectedCrew({ ...crew, image: crewImage });
                                                    setShowCrewDetailModal(true);
                                                }}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '16px',
                                                    padding: '16px',
                                                    backgroundColor: '#fff',
                                                    borderRadius: '12px',
                                                    border: '1px solid #e0e0e0',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.boxShadow = 'none';
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: '60px',
                                                        height: '60px',
                                                        borderRadius: '12px',
                                                        background: crewImage.bg || '#ddd',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '32px',
                                                        flexShrink: 0,
                                                        overflow: 'hidden'
                                                    }}
                                                >
                                                    {crewImage.url ? (
                                                        <img src={crewImage.url} alt={crew.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        crewImage.emoji
                                                    )}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1a1a1a' }}>{crew.name}</h3>
                                                        <span style={{ fontSize: '12px', color: '#888', backgroundColor: '#f5f5f5', padding: '2px 6px', borderRadius: '4px' }}>
                                                            {crew.memberCount || 0}명
                                                        </span>
                                                    </div>
                                                    <p style={{ margin: 0, fontSize: '14px', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                                                        {crew.description || '설명이 없습니다.'}
                                                    </p>
                                                </div>
                                                <div style={{ fontSize: '24px', color: '#ccc' }}>›</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* MyRun Tab */}
                {activeTab === 'myrun' && (
                    <div className="tab-content myrun-tab">
                        <div className="myrun-section">
                            <h2>My Running Records</h2>
                            <RecentRecords
                                onRefresh={refreshRecords}
                                onRecordClick={handleRecordClick}
                            />
                        </div>
                    </div>
                )}

                {/* Modals */}
                <CreateCrewModal
                    isOpen={showCreateCrewModal}
                    onClose={() => setShowCreateCrewModal(false)}
                    onCreate={handleCreateCrew}
                    user={user}
                />

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
                    <div className="modal-overlay" onClick={() => setShowRunnerGradeModal(false)}>
                        <div className="runner-grade-modal" onClick={(e) => e.stopPropagation()} style={{
                            maxWidth: '500px',
                            maxHeight: '80vh',
                            overflowY: 'auto'
                        }}>
                            <h2 style={{ marginBottom: '20px', fontSize: '24px' }}>🏅 러너 등급</h2>

                            {/* 현재 등급 표시 */}
                            {user.runnerGrade && (() => {
                                const currentGrade = getGradeInfo(user.runnerGrade);
                                return (
                                    <div style={{
                                        background: `linear-gradient(135deg, ${currentGrade.color}20 0%, ${currentGrade.color}10 100%)`,
                                        border: `2px solid ${currentGrade.color}40`,
                                        borderRadius: '12px',
                                        padding: '16px',
                                        marginBottom: '24px',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>현재 등급</div>
                                        <div style={{ fontSize: '32px', marginBottom: '4px' }}>{currentGrade.emoji}</div>
                                        <div style={{ fontSize: '20px', fontWeight: '700', color: currentGrade.color, marginBottom: '4px' }}>
                                            {currentGrade.nameKo}
                                            {currentGrade.badge && (
                                                <span style={{
                                                    ...getBadgeStyle(currentGrade.badge, currentGrade.color),
                                                    marginLeft: '8px'
                                                }}>
                                                    {currentGrade.badge}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#888' }}>{currentGrade.description}</div>
                                    </div>
                                );
                            })()}

                            {/* 모든 등급 목록 */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {Object.entries(RUNNER_GRADE_INFO).map(([key, grade]) => {
                                    const isCurrentGrade = user.runnerGrade === key;
                                    return (
                                        <div
                                            key={key}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '12px',
                                                backgroundColor: isCurrentGrade ? `${grade.color}10` : '#f9f9f9',
                                                border: isCurrentGrade ? `2px solid ${grade.color}40` : '1px solid #e0e0e0',
                                                borderRadius: '10px',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <div style={{ fontSize: '28px', flexShrink: 0 }}>{grade.emoji}</div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                                    <span style={{ fontSize: '16px', fontWeight: '700', color: grade.color }}>
                                                        {grade.nameKo}
                                                    </span>
                                                    {grade.badge && (
                                                        <span style={getBadgeStyle(grade.badge, grade.color)}>
                                                            {grade.badge}
                                                        </span>
                                                    )}
                                                    {isCurrentGrade && (
                                                        <span style={{
                                                            fontSize: '11px',
                                                            padding: '2px 8px',
                                                            backgroundColor: grade.color,
                                                            color: '#fff',
                                                            borderRadius: '10px',
                                                            fontWeight: '600'
                                                        }}>
                                                            현재
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#666' }}>{grade.description}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => setShowRunnerGradeModal(false)}
                                style={{
                                    width: '100%',
                                    marginTop: '20px',
                                    padding: '12px',
                                    backgroundColor: '#1a1a1a',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Fixed Bottom Navigation */}
            <div className="main-bottom-nav">
                <div
                    className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveTab('home');
                        setShowProfileMenu(false);
                    }}
                >
                    <div className="nav-icon">🏠</div>
                    <span>홈</span>
                </div>
                <div
                    className={`nav-item ${activeTab === 'running' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveTab('running');
                        setShowProfileMenu(false);
                    }}
                >
                    <div className="nav-icon">🏃</div>
                    <span>런닝센터</span>
                </div>

                {/* Play Button */}
                <div
                    className="nav-item play-button"
                    onClick={handleStartToggle}
                >
                    <div className="play-icon">▶️</div>
                </div>

                <div
                    className={`nav-item ${activeTab === 'crew' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveTab('crew');
                        setShowProfileMenu(false);
                    }}
                >
                    <div className="nav-icon">👥</div>
                    <span>Crew</span>
                </div>
                <div
                    className={`nav-item ${activeTab === 'myrun' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveTab('myrun');
                        setShowProfileMenu(false);
                    }}
                >
                    <div className="nav-icon">📊</div>
                    <span>MyRun</span>
                </div>
            </div>
        </div>
    );
}

export default App;

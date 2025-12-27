import { useState, useEffect } from 'react';
import './running-styles.css';
import './main-layout.css';
import { RUNNER_GRADES } from './constants/runnerGrades';
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
    const [allCrews, setAllCrews] = useState([]);
    const [showCreateCrewModal, setShowCreateCrewModal] = useState(false);
    const [showCrewDetailModal, setShowCrewDetailModal] = useState(false);
    const [showRunnerGradeModal, setShowRunnerGradeModal] = useState(false);

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

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // OAuth 콜백 처리: URL에서 OAuth 관련 파라미터 확인
                const urlParams = new URLSearchParams(window.location.search);
                const isOAuthCallback = urlParams.has('code') || window.location.pathname.includes('/oauth2/callback');

                if (isOAuthCallback) {
                    console.log('🔐 OAuth 콜백 감지됨');
                    // OAuth 콜백인 경우 URL 파라미터 제거 (깔끔한 URL 유지)
                    window.history.replaceState({}, document.title, window.location.pathname);
                }

                // 1. 최초 접근 시 refresh token 호출 (부트스트랩 과정이므로 직접 호출)
                console.log('🔄 자동 로그인 시도...');
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

        checkAuth();
    }, []);

    // 크루 탭 활성화 시 크루 목록 로드
    useEffect(() => {
        if (activeTab === 'crew' && user) {
            const fetchCrews = async () => {
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

    const handleRunningStop = (result) => {
        setIsRunning(false);
        setRunningResult(result);
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

            {/* Scrollable Content Area */}
            <div className="main-content">
                {/* Home Tab */}
                {activeTab === 'home' && (
                    <div className="tab-content home-tab">
                        <div className="welcome-section">
                            <h1>Welcome to LLRun! 🏃</h1>
                            <p>함께 달리는 즐거움을 경험하세요</p>
                        </div>
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

                        {/* Runner Grade Button - Top Right */}
                        <button
                            onClick={() => setShowRunnerGradeModal(true)}
                            className="runner-grade-btn"
                            title="러너등급"
                        >
                            🏅
                        </button>

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
                            <h2>Crew</h2>
                            {userCrew ? (
                                <div className="crew-info">
                                    <h3>{userCrew.name}</h3>
                                    <p>{userCrew.description}</p>
                                    <button
                                        onClick={() => setShowCrewDetailModal(true)}
                                        className="view-crew-btn"
                                    >
                                        크루 상세보기
                                    </button>
                                </div>
                            ) : (
                                <div className="no-crew">
                                    <p>아직 크루가 없습니다</p>
                                    <button
                                        onClick={() => setShowCreateCrewModal(true)}
                                        className="create-crew-btn"
                                    >
                                        크루 만들기
                                    </button>
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
                    onClose={() => setShowCrewDetailModal(false)}
                    crew={userCrew}
                />

                {/* Runner Grade Modal */}
                {showRunnerGradeModal && (
                    <div className="modal-overlay" onClick={() => setShowRunnerGradeModal(false)}>
                        <div className="runner-grade-modal" onClick={(e) => e.stopPropagation()}>
                            <h2>🏅 러너 등급</h2>
                            <div className="grade-list">
                                <div className="grade-item">
                                    <span className="grade-badge beginner">초급</span>
                                    <span className="grade-count">{stats.BEGINNER || 0}명</span>
                                </div>
                                <div className="grade-item">
                                    <span className="grade-badge advanced">고급</span>
                                    <span className="grade-count">{stats.ADVANCED || 0}명</span>
                                </div>
                                <div className="grade-item">
                                    <span className="grade-badge pro">프로</span>
                                    <span className="grade-count">{stats.PRO || 0}명</span>
                                </div>
                                <div className="grade-item">
                                    <span className="grade-badge elite">엘리트</span>
                                    <span className="grade-count">{stats.ELITE || 0}명</span>
                                </div>
                            </div>
                            <button onClick={() => setShowRunnerGradeModal(false)} className="modal-close-btn">
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
                    onClick={() => setActiveTab('home')}
                >
                    <div className="nav-icon">🏠</div>
                    <span>홈</span>
                </div>
                <div
                    className={`nav-item ${activeTab === 'running' ? 'active' : ''}`}
                    onClick={() => setActiveTab('running')}
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
                    onClick={() => setActiveTab('crew')}
                >
                    <div className="nav-icon">👥</div>
                    <span>Crew</span>
                </div>
                <div
                    className={`nav-item ${activeTab === 'myrun' ? 'active' : ''}`}
                    onClick={() => setActiveTab('myrun')}
                >
                    <div className="nav-icon">📊</div>
                    <span>MyRun</span>
                </div>
            </div>
        </div>
    );
}

export default App;

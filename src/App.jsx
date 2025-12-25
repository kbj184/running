import { useState, useEffect } from 'react';
import './running-styles.css';
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

    // 크루 관련 상태
    const [userCrew, setUserCrew] = useState(null);
    const [showCreateCrewModal, setShowCreateCrewModal] = useState(false);
    const [showCrewDetailModal, setShowCrewDetailModal] = useState(false);

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
                const refreshResponse = await fetch('https://localhost:8443/refresh/token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include', // 쿠키 포함
                });

                if (refreshResponse.ok) {
                    const accessToken = refreshResponse.headers.get('Authorization');
                    console.log('🔑 갱신된 Access Token:', accessToken);

                    if (accessToken) {
                        // 2. 토큰으로 내 정보(my) 호출 - 공통 API 유틸 사용
                        console.log('👤 내 정보(my) 호출 중...');
                        const myResponse = await api.request('https://localhost:8443/my', {
                            method: 'GET',
                            headers: {
                                'Authorization': accessToken,
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
        <div className="app-container">
            {/* Header */}
            <Header
                totalRunners={totalRunners}
                advancedCount={stats.ADVANCED || 0}
                proCount={stats.PRO || 0}
                eliteCount={stats.ELITE || 0}
                showLabels={showLabels}
                onToggleLabels={handleToggleLabels}
                userCrew={userCrew}
                onOpenCreateCrew={() => setShowCreateCrewModal(true)}
                onOpenCrewDetail={() => setShowCrewDetailModal(true)}
                user={user}
                onLogout={handleLogout}
            />

            {/* Create Crew Modal */}
            <CreateCrewModal
                isOpen={showCreateCrewModal}
                onClose={() => setShowCreateCrewModal(false)}
                onCreate={handleCreateCrew}
            />

            {/* Crew Detail Modal */}
            <CrewDetailModal
                isOpen={showCrewDetailModal}
                onClose={() => setShowCrewDetailModal(false)}
                crew={userCrew}
            />

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

            {/* 최근 기록 (좌측 하단) */}
            <RecentRecords
                onRefresh={refreshRecords}
                onRecordClick={handleRecordClick}
            />

            {/* Runner Detail Panel */}
            <RunnerDetailPanel
                runner={selectedRunner}
                onClose={handleClosePanel}
            />
        </div>
    );
}

export default App;

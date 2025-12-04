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
import { deleteSession } from './utils/db';

function App() {
    const [runners, setRunners] = useState([]);
    const [stats, setStats] = useState({});
    const [selectedRunner, setSelectedRunner] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [screenMode, setScreenMode] = useState('map'); // 'map', 'countdown', 'running', 'result'
    const [runningResult, setRunningResult] = useState(null);
    const [sessionId, setSessionId] = useState(null);
    const [refreshRecords, setRefreshRecords] = useState(0); // 최근 기록 새로고침 트리거

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
        setScreenMode('map');
        setRunningResult(null);
        setSessionId(null);
        setRefreshRecords(prev => prev + 1); // 기록 목록 새로고침
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

    const totalRunners = runners.length;

    // 카운트다운 화면 표시
    if (screenMode === 'countdown') {
        return <CountdownScreen onComplete={handleCountdownComplete} />;
    }

    // 러닝 화면 표시
    if (screenMode === 'running') {
        return <RunningScreen onStop={handleRunningStop} sessionId={sessionId} />;
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
                proCount={stats.PRO || 0}
                eliteCount={stats.ELITE || 0}
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

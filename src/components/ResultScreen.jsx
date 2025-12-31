import { formatTime, formatDistance } from '../utils/gps';
import { useState, useEffect } from 'react';
import { generateRouteMapImage } from '../utils/mapThumbnail';
import './result-screen.css';

function ResultScreen({ result, onSave, onDelete, mode = 'finish' }) {
    const {
        distance,
        duration,
        speed,
        pace,
        route,
        thumbnail, // 썸네일 URL 추가
        wateringSegments = [],
        splits = [],
        currentElevation = 0,
        totalAscent = 0,
        totalDescent = 0,
        timestamp // 타임스탬프 추가
    } = result;

    // 승급 메시지 표시 여부 상태
    const [showGradeUpgrade, setShowGradeUpgrade] = useState(false);

    // 승급 메시지 최초 1회만 표시 체크
    useEffect(() => {
        if (result.gradeUpgraded && result.newGrade) {
            // 세션 ID를 키로 사용하여 이미 표시했는지 확인
            const sessionKey = `grade_shown_${result.sessionId || Date.now()}`;
            const alreadyShown = sessionStorage.getItem(sessionKey);

            if (!alreadyShown) {
                // 이번 세션에서 처음 보는 것이면 표시
                setShowGradeUpgrade(true);
                sessionStorage.setItem(sessionKey, 'true');
                console.log(`🎉 New Grade Achievement: ${result.newGrade}`);
            } else {
                console.log(`✓ Grade upgrade message already shown for this session`);
            }
        }
    }, []); // 빈 배열로 마운트 시 한 번만 실행

    const avgSpeed = speed || 0;
    const avgPace = pace || 0;
    const calories = Math.floor(distance * 60);

    // 지도 이미지 URL 생성 (썸네일이 없으면 route로 생성)
    const mapImageUrl = thumbnail || (route && route.length > 0 ? generateRouteMapImage(route) : null);

    // 날짜/시간 포맷팅 - 2025년12월30일 10:36~10:36 형식
    const runDate = timestamp ? new Date(timestamp) : new Date();
    const year = runDate.getFullYear();
    const month = runDate.getMonth() + 1;
    const day = runDate.getDate();

    // 시작 시간과 종료 시간 계산
    const endTime = runDate;
    const startTime = new Date(endTime.getTime() - duration * 1000);
    const startTimeStr = `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}`;
    const endTimeStr = `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`;
    const dateTimeStr = `${year}년${month}월${day}일 ${startTimeStr}~${endTimeStr}`;

    return (
        <div className="result-screen-container">
            {/* 고정 헤더 - X 버튼과 날짜/시간 */}
            <header className="result-header-fixed">
                <button className="result-close-x" onClick={onSave}>✕</button>
                <div className="result-datetime">
                    {dateTimeStr}
                </div>
            </header>

            {/* 승급 축하 배너 - 최초 1회만 표시 */}
            {showGradeUpgrade && (
                <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '20px',
                    margin: '0 20px 20px 20px',
                    borderRadius: '16px',
                    textAlign: 'center',
                    color: '#fff',
                    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
                    animation: 'slideDown 0.5s ease-out'
                }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎉</div>
                    <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>
                        등급 승급!
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>
                        {result.newGrade}
                    </div>
                    <div style={{ fontSize: '13px', opacity: 0.9 }}>
                        {result.gradeDescription}
                    </div>
                </div>
            )}

            {/* 거리 표시 - 라벨 없이 숫자만 */}
            <section className="result-distance-section">
                <div className="result-distance-value">{formatDistance(distance)}</div>
            </section>

            {/* 지도만 표기 */}
            <section className="result-card-section">
                <div className="result-map-card">
                    {!mapImageUrl ? (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '400px',
                            color: '#999',
                            fontSize: '16px',
                            backgroundColor: '#f5f5f5',
                            borderRadius: '12px'
                        }}>
                            경로 없음
                        </div>
                    ) : (
                        <img
                            src={mapImageUrl}
                            alt="러닝 경로"
                            style={{
                                width: '100%',
                                height: '400px',
                                objectFit: 'cover',
                                borderRadius: '12px',
                                display: 'block'
                            }}
                            onError={(e) => {
                                e.target.style.display = 'none';
                                const errorDiv = document.createElement('div');
                                errorDiv.style.cssText = 'display:flex;align-items:center;justify-content:center;height:400px;color:#999;background:#f5f5f5;border-radius:12px;';
                                errorDiv.textContent = '지도 로딩 실패';
                                e.target.parentElement.appendChild(errorDiv);
                            }}
                        />
                    )}
                </div>
            </section>

            {/* 런닝 데이터 표기 */}
            <section className="result-summary-section">
                <div className="result-section-title-simple" style={{ marginBottom: '16px', paddingLeft: '20px' }}>
                    <span>📊</span> 런닝 데이터
                </div>

                <div className="result-secondary-stats-grid">
                    <div className="result-secondary-item">
                        <div className="result-secondary-label">시간</div>
                        <div className="result-secondary-value">{formatTime(duration)}</div>
                    </div>
                    <div className="result-secondary-item">
                        <div className="result-secondary-label">평균 속도</div>
                        <div className="result-secondary-value">{avgSpeed.toFixed(1)} <small>km/h</small></div>
                    </div>
                    <div className="result-secondary-item">
                        <div className="result-secondary-label">평균 페이스</div>
                        <div className="result-secondary-value">{avgPace > 0 && avgPace < 100 ? avgPace.toFixed(1) : '0.0'} <small>분/km</small></div>
                    </div>
                </div>

                <div className="result-secondary-stats-grid" style={{ marginTop: '12px' }}>
                    <div className="result-secondary-item">
                        <div className="result-secondary-label">칼로리</div>
                        <div className="result-secondary-value">{calories} <small>kcal</small></div>
                    </div>
                    {(totalAscent > 0 || totalDescent > 0) && (
                        <>
                            <div className="result-secondary-item">
                                <div className="result-secondary-label">↗ 상승</div>
                                <div className="result-secondary-value" style={{ color: '#22c55e' }}>{totalAscent.toFixed(0)} <small>m</small></div>
                            </div>
                            <div className="result-secondary-item">
                                <div className="result-secondary-label">↘ 하강</div>
                                <div className="result-secondary-value" style={{ color: '#ef4444' }}>{totalDescent.toFixed(0)} <small>m</small></div>
                            </div>
                        </>
                    )}
                </div>
            </section>

            {splits && splits.length > 0 && (
                <section className="result-card-section">
                    <div className="result-section-title-simple">
                        <span>🚩</span> 구간 기록 (1km)
                    </div>
                    <div className="splits-list">
                        {splits.map((split, idx) => (
                            <div className="split-row-item" key={idx}>
                                <div className="split-km-badge">{split.km} km</div>
                                <div className="split-time-value">{formatTime(split.duration)}</div>
                                <div className="split-pace-value">{split.pace.toFixed(2)} 분/km</div>
                                {split.elevation !== undefined && (
                                    <div className="split-elevation-value" style={{ color: '#667eea', fontSize: '12px' }}>
                                        🗻 {split.elevation.toFixed(0)}m
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <div className="result-footer-actions">
                <button className="result-btn result-btn-delete" onClick={onDelete}>
                    <span>🗑️</span> 삭제
                </button>
                {mode === 'finish' && (
                    <button className="result-btn result-btn-save" onClick={onSave}>
                        기록 저장
                    </button>
                )}
            </div>
        </div>
    );
}

export default ResultScreen;

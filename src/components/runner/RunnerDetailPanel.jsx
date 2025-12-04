import React from 'react';
import { RUNNER_GRADES } from '../../constants/runnerGrades';

function RunnerDetailPanel({ runner, onClose }) {
    if (!runner) return null;

    return (
        <div className="runner-detail-panel">
            <div className="panel-header">
                <div className="panel-title">
                    <span className="panel-icon">🏃</span>
                    <h2>{runner.name}</h2>
                </div>
                <button className="close-button" onClick={onClose}>
                    ✕
                </button>
            </div>

            <div className="panel-content">
                {/* 등급 배지 */}
                <div className="detail-section">
                    <div
                        className="grade-badge-large"
                        style={{
                            backgroundColor: RUNNER_GRADES[runner.grade].color
                        }}
                    >
                        {RUNNER_GRADES[runner.grade].name}
                    </div>
                </div>

                {/* 주요 통계 */}
                <div className="detail-section">
                    <h3 className="section-title">주요 통계</h3>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon">📏</div>
                            <div className="stat-info">
                                <div className="stat-label">총 거리</div>
                                <div className="stat-value-large">{runner.distance} km</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">⏱️</div>
                            <div className="stat-info">
                                <div className="stat-label">러닝 시간</div>
                                <div className="stat-value-large">{runner.duration} 분</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">🏃‍♂️</div>
                            <div className="stat-info">
                                <div className="stat-label">평균 속도</div>
                                <div className="stat-value-large">{runner.speed} km/h</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">⚡</div>
                            <div className="stat-info">
                                <div className="stat-label">페이스</div>
                                <div className="stat-value-large">{runner.pace} 분/km</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 상세 정보 */}
                <div className="detail-section">
                    <h3 className="section-title">상세 정보</h3>
                    <div className="detail-list">
                        <div className="detail-item">
                            <span className="detail-label">🔥 소모 칼로리</span>
                            <span className="detail-value">{runner.calories} kcal</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">❤️ 평균 심박수</span>
                            <span className="detail-value">{runner.heartRate} bpm</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">📍 현재 위치</span>
                            <span className="detail-value">
                                {runner.position[0].toFixed(4)}, {runner.position[1].toFixed(4)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 경로 정보 */}
                <div className="detail-section">
                    <h3 className="section-title">경로 정보</h3>
                    <div className="route-info">
                        <div className="route-point">
                            <div className="route-marker start">🟢</div>
                            <div className="route-text">
                                <div className="route-label">시작 위치</div>
                                <div className="route-coords">
                                    {runner.route[0][0].toFixed(4)}, {runner.route[0][1].toFixed(4)}
                                </div>
                            </div>
                        </div>
                        <div className="route-divider"></div>
                        <div className="route-point">
                            <div className="route-marker current" style={{
                                backgroundColor: RUNNER_GRADES[runner.grade].color
                            }}>📍</div>
                            <div className="route-text">
                                <div className="route-label">현재 위치</div>
                                <div className="route-coords">
                                    {runner.position[0].toFixed(4)}, {runner.position[1].toFixed(4)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RunnerDetailPanel;

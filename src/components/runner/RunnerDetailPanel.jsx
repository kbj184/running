import React from 'react';
import { RUNNER_GRADES } from '../../constants/runnerGrades';

function RunnerDetailPanel({ runner, onClose }) {
    if (!runner) return null;

    return (
        <div className="runner-detail-panel">
            <div className="panel-header">
                <div className="panel-title">
                    <span
                        className="panel-grade-badge"
                        style={{
                            backgroundColor: RUNNER_GRADES[runner.grade].color
                        }}
                    >
                        {RUNNER_GRADES[runner.grade].name}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h2 style={{ margin: 0 }}>{runner.nickname}</h2>
                        {runner.crew && (
                            <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '6px',
                                background: runner.crew.bg,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                cursor: 'help'
                            }} title={`Crew: ${runner.crew.name}`}>
                                {runner.crew.emoji}
                            </div>
                        )}
                    </div>
                </div>
                <button className="close-button" onClick={onClose}>
                    ✕
                </button>
            </div>

            <div className="panel-content">

                {/* 주요 통계 */}
                <div className="detail-section">
                    <h3 className="section-title">주요 통계</h3>
                    <div className="stats-horizontal">
                        <span className="stat-inline">
                            <span className="stat-icon-inline">📏</span>
                            <span className="stat-value-inline">{runner.distance}</span>
                            <span className="stat-unit">km</span>
                        </span>
                        <span className="stat-divider-inline">|</span>
                        <span className="stat-inline">
                            <span className="stat-icon-inline">⏱️</span>
                            <span className="stat-value-inline">{runner.duration}</span>
                            <span className="stat-unit">분</span>
                        </span>
                        <span className="stat-divider-inline">|</span>
                        <span className="stat-inline">
                            <span className="stat-icon-inline">🏃‍♂️</span>
                            <span className="stat-value-inline">{runner.speed}</span>
                            <span className="stat-unit">km/h</span>
                        </span>
                        <span className="stat-divider-inline">|</span>
                        <span className="stat-inline">
                            <span className="stat-icon-inline">⚡</span>
                            <span className="stat-value-inline">{runner.pace}</span>
                            <span className="stat-unit">분/km</span>
                        </span>
                    </div>
                </div>

                {/* 상세 정보 - Only show if data exists */}
                {(runner.calories || runner.heartRate) && (
                    <div className="detail-section">
                        <h3 className="section-title">상세 정보</h3>
                        <div className="detail-list">
                            {runner.calories && (
                                <div className="detail-item">
                                    <span className="detail-label">🔥 소모 칼로리</span>
                                    <span className="detail-value">{runner.calories} kcal</span>
                                </div>
                            )}
                            {runner.heartRate && (
                                <div className="detail-item">
                                    <span className="detail-label">❤️ 평균 심박수</span>
                                    <span className="detail-value">{runner.heartRate} bpm</span>
                                </div>
                            )}
                            <div className="detail-item">
                                <span className="detail-label">📍 현재 위치</span>
                                <span className="detail-value">
                                    {runner.position.lat.toFixed(4)}, {runner.position.lng.toFixed(4)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* 경로 정보 */}
                {runner.route && runner.route.length > 0 && (
                    <div className="detail-section">
                        <h3 className="section-title">경로 정보</h3>
                        <div className="route-info">
                            <div className="route-point">
                                <div className="route-marker start">🟢</div>
                                <div className="route-text">
                                    <div className="route-label">시작 위치</div>
                                    <div className="route-coords">
                                        {runner.route[0].lat.toFixed(4)}, {runner.route[0].lng.toFixed(4)}
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
                                        {runner.position.lat.toFixed(4)}, {runner.position.lng.toFixed(4)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default RunnerDetailPanel;

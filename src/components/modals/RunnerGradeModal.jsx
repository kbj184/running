import React from 'react';
import { getGradeInfo, getBadgeStyle, RUNNER_GRADE_INFO } from '../../constants/runnerGradeInfo';
import './RunnerGradeModal.css';

function RunnerGradeModal({ user, onClose }) {
    const currentGrade = user.runnerGrade ? getGradeInfo(user.runnerGrade) : null;

    return (
        <div className="result-screen-overlay">
            <div className="result-screen-container">
                {/* 헤더 */}
                <div className="result-header">
                    <button
                        className="back-button"
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '24px',
                            cursor: 'pointer',
                            padding: '8px',
                            color: '#333'
                        }}
                    >
                        ←
                    </button>
                    <h1 className="result-title">🏅 러너 등급</h1>
                    <div style={{ width: '40px' }}></div>
                </div>

                {/* 스크롤 가능한 컨텐츠 영역 */}
                <div className="result-content" style={{ paddingBottom: '40px' }}>
                    {/* 현재 등급 카드 */}
                    {currentGrade && (
                        <div style={{
                            background: `linear-gradient(135deg, ${currentGrade.color}15 0%, ${currentGrade.color}05 100%)`,
                            border: `3px solid ${currentGrade.color}`,
                            borderRadius: '20px',
                            padding: '32px 24px',
                            marginBottom: '32px',
                            textAlign: 'center',
                            boxShadow: `0 8px 24px ${currentGrade.color}20`
                        }}>
                            <div style={{
                                fontSize: '14px',
                                color: '#666',
                                marginBottom: '12px',
                                fontWeight: '600',
                                letterSpacing: '0.5px'
                            }}>
                                현재 등급
                            </div>
                            <div style={{ fontSize: '64px', marginBottom: '12px' }}>
                                {currentGrade.emoji}
                            </div>
                            <div style={{
                                fontSize: '28px',
                                fontWeight: '800',
                                color: currentGrade.color,
                                marginBottom: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px'
                            }}>
                                {currentGrade.nameKo}
                                {currentGrade.badge && (
                                    <span style={{
                                        ...getBadgeStyle(currentGrade.badge, currentGrade.color),
                                        fontSize: '14px',
                                        padding: '4px 12px'
                                    }}>
                                        {currentGrade.badge}
                                    </span>
                                )}
                            </div>
                            <div style={{
                                fontSize: '15px',
                                color: '#666',
                                lineHeight: '1.6'
                            }}>
                                {currentGrade.description}
                            </div>
                        </div>
                    )}

                    {/* 등급 시스템 설명 */}
                    <div style={{
                        backgroundColor: '#f8f9fa',
                        borderRadius: '16px',
                        padding: '20px',
                        marginBottom: '24px'
                    }}>
                        <h3 style={{
                            fontSize: '16px',
                            fontWeight: '700',
                            marginBottom: '12px',
                            color: '#333'
                        }}>
                            📊 등급 시스템
                        </h3>
                        <p style={{
                            fontSize: '14px',
                            color: '#666',
                            lineHeight: '1.6',
                            margin: 0
                        }}>
                            러너 등급은 여러분의 최고 기록을 기반으로 자동으로 산정됩니다.
                            더 멀리, 더 빠르게 달릴수록 높은 등급을 획득할 수 있습니다!
                        </p>
                    </div>

                    {/* 모든 등급 목록 */}
                    <h3 style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        marginBottom: '16px',
                        color: '#333'
                    }}>
                        전체 등급
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {Object.entries(RUNNER_GRADE_INFO).map(([key, grade]) => {
                            const isCurrentGrade = user.runnerGrade === key;
                            return (
                                <div
                                    key={key}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px',
                                        padding: '16px',
                                        backgroundColor: isCurrentGrade ? `${grade.color}08` : '#fff',
                                        border: isCurrentGrade ? `2px solid ${grade.color}` : '2px solid #e0e0e0',
                                        borderRadius: '16px',
                                        transition: 'all 0.2s',
                                        boxShadow: isCurrentGrade ? `0 4px 12px ${grade.color}15` : '0 2px 8px rgba(0,0,0,0.04)'
                                    }}
                                >
                                    <div style={{
                                        fontSize: '36px',
                                        flexShrink: 0,
                                        width: '48px',
                                        textAlign: 'center'
                                    }}>
                                        {grade.emoji}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            marginBottom: '6px',
                                            flexWrap: 'wrap'
                                        }}>
                                            <span style={{
                                                fontSize: '18px',
                                                fontWeight: '700',
                                                color: grade.color
                                            }}>
                                                {grade.nameKo}
                                            </span>
                                            {grade.badge && (
                                                <span style={{
                                                    ...getBadgeStyle(grade.badge, grade.color),
                                                    fontSize: '11px'
                                                }}>
                                                    {grade.badge}
                                                </span>
                                            )}
                                            {isCurrentGrade && (
                                                <span style={{
                                                    fontSize: '11px',
                                                    padding: '3px 10px',
                                                    backgroundColor: grade.color,
                                                    color: '#fff',
                                                    borderRadius: '12px',
                                                    fontWeight: '700',
                                                    letterSpacing: '0.3px'
                                                }}>
                                                    현재 등급
                                                </span>
                                            )}
                                        </div>
                                        <div style={{
                                            fontSize: '13px',
                                            color: '#666',
                                            lineHeight: '1.5'
                                        }}>
                                            {grade.description}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* 하단 여백 */}
                    <div style={{ height: '40px' }}></div>
                </div>
            </div>
        </div>
    );
}

export default RunnerGradeModal;

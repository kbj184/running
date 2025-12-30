import React from 'react';
import { getGradeInfo, getBadgeStyle, RUNNER_GRADE_INFO } from '../../constants/runnerGradeInfo';

function RunnerGradeModal({ user, onClose }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
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
                    onClick={onClose}
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
    );
}

export default RunnerGradeModal;

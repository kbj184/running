import React from 'react';
import { getGradeInfo, getBadgeStyle } from '../../constants/runnerGradeInfo';

function MyInfoTab({ user }) {
    return (
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
    );
}

export default MyInfoTab;

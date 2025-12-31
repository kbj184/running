import React, { useState } from 'react';
import { api } from '../../utils/api';

function SettingsTab({ user, onLogout, onUserUpdate }) {
    const [nickname, setNickname] = useState(user?.nickname || '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await api.request(`${import.meta.env.VITE_API_URL}/user/profile`, {
                method: 'POST',
                headers: {
                    'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nickname: nickname,
                    nicknameImage: user.profileImage || user.nicknameImage
                })
            });

            if (response.ok) {
                const updatedUser = await response.json();
                alert('프로필이 업데이트되었습니다!');
                if (onUserUpdate) {
                    onUserUpdate(updatedUser);
                }
            } else {
                const errorText = await response.text();
                console.error('프로필 업데이트 실패:', errorText);
                alert('프로필 업데이트에 실패했습니다.');
            }
        } catch (error) {
            console.error('프로필 업데이트 실패:', error);
            alert('프로필 업데이트 중 오류가 발생했습니다.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ paddingBottom: '40px' }}>
            <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: '700' }}>설정</h2>
            <div style={{ maxWidth: '600px' }}>
                {/* 닉네임 변경 */}
                <div style={{
                    backgroundColor: '#fff',
                    padding: '24px',
                    borderRadius: '12px',
                    marginBottom: '20px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                        닉네임 변경
                    </h3>

                    {/* 현재 프로필 이미지 표시 */}
                    <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            margin: '0 auto',
                            backgroundColor: '#f0f0f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {user?.profileImage || user?.nicknameImage ? (
                                <img
                                    src={user.profileImage || user.nicknameImage}
                                    alt="프로필"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <span style={{ fontSize: '32px' }}>👤</span>
                            )}
                        </div>
                    </div>

                    {/* 닉네임 입력 */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#333'
                        }}>
                            닉네임
                        </label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="닉네임을 입력하세요"
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '14px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    {/* 저장 버튼 */}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        style={{
                            width: '100%',
                            padding: '14px',
                            backgroundColor: saving ? '#ccc' : '#4318FF',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: saving ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {saving ? '저장 중...' : '저장'}
                    </button>
                </div>

                {/* 구분선 */}
                <div style={{ height: '1px', backgroundColor: '#e0e0e0', margin: '30px 0' }}></div>

                {/* 로그아웃 버튼 */}
                <button
                    onClick={onLogout}
                    style={{
                        width: '100%',
                        padding: '16px',
                        backgroundColor: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        marginBottom: '40px'
                    }}
                >
                    로그아웃
                </button>
            </div>
        </div>
    );
}

export default SettingsTab;

import React, { useState } from 'react';
import { api } from '../../utils/api';

function SettingsTab({ user, onLogout, onUserUpdate }) {
    const [nickname, setNickname] = useState(user?.nickname || '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        // 닉네임이 변경되지 않았으면 저장하지 않음
        if (nickname === user?.nickname) {
            alert('변경된 내용이 없습니다.');
            return;
        }

        // 닉네임 검증
        if (!nickname || nickname.trim().length < 2) {
            alert('닉네임은 최소 2자 이상이어야 합니다.');
            return;
        }

        if (nickname.length > 10) {
            alert('닉네임은 최대 10자까지 가능합니다.');
            return;
        }

        if (!/^[가-힣a-zA-Z0-9]+$/.test(nickname)) {
            alert('닉네임은 한글, 영문, 숫자만 사용 가능합니다.');
            return;
        }

        setSaving(true);
        try {
            const response = await api.request(`${import.meta.env.VITE_API_URL}/user/profile`, {
                method: 'POST',
                headers: {
                    'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nickname: nickname.trim(),
                    nicknameImage: user.nicknameImage || user.profileImage
                })
            });

            if (response.ok) {
                const updatedUser = await response.json();
                alert('닉네임이 업데이트되었습니다!');
                if (onUserUpdate) {
                    onUserUpdate(updatedUser);
                }
            } else {
                const errorText = await response.text();
                console.error('프로필 업데이트 실패:', response.status, errorText);

                // 에러 메시지 파싱
                try {
                    const errorJson = JSON.parse(errorText);
                    alert(errorJson.message || '프로필 업데이트에 실패했습니다.');
                } catch {
                    alert(errorText || '프로필 업데이트에 실패했습니다.');
                }
            }
        } catch (error) {
            console.error('프로필 업데이트 실패:', error);
            alert('프로필 업데이트 중 오류가 발생했습니다: ' + error.message);
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
                            {user?.nicknameImage || user?.profileImage ? (
                                <img
                                    src={user.nicknameImage || user.profileImage}
                                    alt="프로필"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <span style={{ fontSize: '32px' }}>👤</span>
                            )}
                        </div>
                        <div style={{
                            marginTop: '8px',
                            fontSize: '12px',
                            color: '#999'
                        }}>
                            현재 프로필 이미지
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
                            placeholder="닉네임을 입력하세요 (2-10자)"
                            maxLength={10}
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '14px',
                                boxSizing: 'border-box'
                            }}
                        />
                        <div style={{
                            marginTop: '6px',
                            fontSize: '12px',
                            color: '#666'
                        }}>
                            한글, 영문, 숫자만 사용 가능 (2-10자)
                        </div>
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

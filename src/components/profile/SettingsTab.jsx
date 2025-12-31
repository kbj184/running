import React, { useState } from 'react';
import { api } from '../../utils/api';

function SettingsTab({ user, onLogout, onUserUpdate }) {
    const [nickname, setNickname] = useState(user?.nickname || '');
    const [profileImage, setProfileImage] = useState(null);
    const [profileImagePreview, setProfileImagePreview] = useState(user?.profileImage || '');
    const [saving, setSaving] = useState(false);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('nickname', nickname);
            if (profileImage) {
                formData.append('profileImage', profileImage);
            }

            const response = await api.request(`${import.meta.env.VITE_API_URL}/user/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
                },
                body: formData
            });

            if (response.ok) {
                const updatedUser = await response.json();
                alert('프로필이 업데이트되었습니다!');
                if (onUserUpdate) {
                    onUserUpdate(updatedUser);
                }
            } else {
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
        <div>
            <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: '700' }}>설정</h2>
            <div style={{ maxWidth: '600px' }}>
                {/* 닉네임 및 프로필 이미지 변경 */}
                <div style={{
                    backgroundColor: '#fff',
                    padding: '24px',
                    borderRadius: '12px',
                    marginBottom: '20px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                        닉네임 및 프로필 이미지 변경
                    </h3>

                    {/* 프로필 이미지 */}
                    <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                        <div style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            margin: '0 auto 12px',
                            backgroundColor: '#f0f0f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {profileImagePreview ? (
                                <img
                                    src={profileImagePreview}
                                    alt="프로필"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <span style={{ fontSize: '40px' }}>👤</span>
                            )}
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            style={{ display: 'none' }}
                            id="profile-image-input"
                        />
                        <label
                            htmlFor="profile-image-input"
                            style={{
                                display: 'inline-block',
                                padding: '8px 16px',
                                backgroundColor: '#4318FF',
                                color: '#fff',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            이미지 선택
                        </label>
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
                        cursor: 'pointer'
                    }}
                >
                    로그아웃
                </button>
            </div>
        </div>
    );
}

export default SettingsTab;

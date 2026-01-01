import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../utils/api';
import LanguageSwitcher from '../common/LanguageSwitcher';
import UnitSwitcher from '../common/UnitSwitcher';

function SettingsTab({ user, onLogout, onUserUpdate }) {
    const { t } = useTranslation();
    const [nickname, setNickname] = useState(user?.nickname || '');
    const [profileImage, setProfileImage] = useState(null);
    const [profileImagePreview, setProfileImagePreview] = useState(user?.nicknameImage || user?.profileImage || '');
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [activityArea, setActivityArea] = useState(null);

    useEffect(() => {
        fetchActivityArea();
    }, []);

    const fetchActivityArea = async () => {
        try {
            const response = await api.request(`${import.meta.env.VITE_API_URL}/user/activity-area`, {
                method: 'GET',
                headers: {
                    'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setActivityArea(data);
            }
        } catch (err) {
            console.error('Failed to fetch activity area:', err);
        }
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 파일 크기 체크 (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert(t('common.error') + ': ' + '이미지 크기는 5MB 이하여야 합니다.');
            return;
        }

        // 파일 형식 체크
        if (!file.type.startsWith('image/')) {
            alert(t('common.error') + ': ' + '이미지 파일만 업로드 가능합니다.');
            return;
        }

        setUploading(true);
        try {
            // Cloudinary에 업로드
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
                {
                    method: 'POST',
                    body: formData
                }
            );

            if (response.ok) {
                const data = await response.json();
                const imageUrl = data.secure_url;
                console.log('✅ Cloudinary 업로드 성공:', imageUrl);

                setProfileImagePreview(imageUrl);
                setProfileImage(imageUrl);
            } else {
                throw new Error('이미지 업로드 실패');
            }
        } catch (error) {
            console.error('❌ 이미지 업로드 실패:', error);
            alert('이미지 업로드에 실패했습니다.');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        // 닉네임이 변경되지 않고 이미지도 변경되지 않았으면 저장하지 않음
        if (nickname === user?.nickname && !profileImage) {
            alert('변경된 내용이 없습니다.');
            return;
        }

        // 닉네임 검증 (닉네임이 변경된 경우에만)
        if (nickname !== user?.nickname) {
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
                    nicknameImage: profileImage || user.nicknameImage || user.profileImage
                })
            });

            if (response.ok) {
                const updatedUser = await response.json();
                alert('프로필이 업데이트되었습니다!');
                if (onUserUpdate) {
                    onUserUpdate(updatedUser);
                }
                // 이미지 상태 초기화
                setProfileImage(null);
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
            <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: '700' }}>{t('profile.tabs.settings')}</h2>
            <div style={{ maxWidth: '600px' }}>
                {/* 언어 설정 */}
                <LanguageSwitcher />

                {/* 단위 설정 */}
                <UnitSwitcher />
                {/* 닉네임 및 프로필 이미지 변경 */}
                <div style={{
                    backgroundColor: '#fff',
                    padding: '24px',
                    borderRadius: '12px',
                    marginBottom: '20px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                        프로필 변경
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
                            justifyContent: 'center',
                            border: '2px solid #e0e0e0'
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
                            disabled={uploading}
                        />
                        <label
                            htmlFor="profile-image-input"
                            style={{
                                display: 'inline-block',
                                padding: '10px 20px',
                                backgroundColor: uploading ? '#ccc' : '#4318FF',
                                color: '#fff',
                                borderRadius: '8px',
                                cursor: uploading ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                fontWeight: '600'
                            }}
                        >
                            {uploading ? '업로드 중...' : '이미지 선택'}
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
                    </div>

                    {/* 저장 버튼 */}
                    <button
                        onClick={handleSave}
                        disabled={saving || uploading}
                        style={{
                            width: '100%',
                            padding: '14px',
                            backgroundColor: (saving || uploading) ? '#ccc' : '#4318FF',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: (saving || uploading) ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {saving ? '저장 중...' : '저장'}
                    </button>
                </div>

                {/* 주 활동 지역 표시 */}
                {activityArea && (
                    <div style={{
                        backgroundColor: '#fff',
                        padding: '24px',
                        borderRadius: '12px',
                        marginBottom: '20px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                    }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                            📍 주 활동 지역
                        </h3>
                        <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
                            {activityArea.adminLevel1} {activityArea.adminLevel2} {activityArea.adminLevel3}
                        </p>
                        <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #eee' }}>
                            <img
                                src={`https://maps.googleapis.com/maps/api/staticmap?center=${activityArea.latitude},${activityArea.longitude}&zoom=14&size=600x300&markers=color:red%7C${activityArea.latitude},${activityArea.longitude}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`}
                                alt="Activity Area Map"
                                style={{ width: '100%', display: 'block' }}
                            />
                        </div>
                    </div>
                )}

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
                    {t('header.logout')}
                </button>
            </div>
        </div>
    );
}

export default SettingsTab;

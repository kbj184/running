import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../utils/api';
import CrewActivityAreaSelection from './CrewActivityAreaSelection';

const CREW_IMAGES = [
    { id: 1, emoji: '🦁', bg: 'linear-gradient(135deg, #FF6B6B 0%, #C44569 100%)' },
    { id: 2, emoji: '🐯', bg: 'linear-gradient(135deg, #FFA502 0%, #FF6348 100%)' },
    { id: 3, emoji: '🐺', bg: 'linear-gradient(135deg, #747d8c 0%, #2f3542 100%)' },
    { id: 4, emoji: '🦅', bg: 'linear-gradient(135deg, #1e90ff 0%, #3742fa 100%)' },
    { id: 5, emoji: '🦊', bg: 'linear-gradient(135deg, #e056fd 0%, #be2edd 100%)' },
    { id: 6, emoji: '🐉', bg: 'linear-gradient(135deg, #badc58 0%, #6ab04c 100%)' },
    { id: 7, emoji: '⚡', bg: 'linear-gradient(135deg, #feca57 0%, #ff9f43 100%)' },
    { id: 8, emoji: '🔥', bg: 'linear-gradient(135deg, #ff4757 0%, #ff6b81 100%)' },
    { id: 9, emoji: '🛡️', bg: 'linear-gradient(135deg, #2ed573 0%, #7bed9f 100%)' },
    { id: 10, emoji: '👑', bg: 'linear-gradient(135deg, #5352ed 0%, #70a1ff 100%)' },
];



function CrewCreateTab({ user, onCreate }) {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedImageId, setSelectedImageId] = useState(CREW_IMAGES[0].id);
    const [uploadedImage, setUploadedImage] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [joinType, setJoinType] = useState('AUTO'); // 'AUTO' or 'APPROVAL'

    // 크루 이름 중복 확인 상태
    const [isCheckingName, setIsCheckingName] = useState(false);
    const [nameCheckResult, setNameCheckResult] = useState(null); // null | 'available' | 'unavailable'
    const [nameCheckMessage, setNameCheckMessage] = useState(''); // 중복 확인 결과 메시지

    // Toast 알림 상태
    const [toast, setToast] = useState({ show: false, message: '' });

    // Toast 표시 함수
    const showToast = (message) => {
        setToast({ show: true, message });
        setTimeout(() => {
            setToast({ show: false, message: '' });
        }, 3000); // 3초 후 사라짐
    };

    // 활동 지역 관련 상태
    const [activityAreas, setActivityAreas] = useState([]);

    // 크루 이름 중복 확인
    const handleCheckName = async () => {
        if (!name.trim()) {
            showToast('크루 이름을 입력해주세요.');
            return;
        }

        setIsCheckingName(true);
        setError(''); // 기존 에러 초기화 (혹시 남아있다면)

        try {
            const response = await api.request(
                `${import.meta.env.VITE_API_URL}/crew/check-name?name=${encodeURIComponent(name)}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': user.accessToken.startsWith('Bearer ')
                            ? user.accessToken
                            : `Bearer ${user.accessToken}`
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                setNameCheckResult(data.available ? 'available' : 'unavailable');
                setNameCheckMessage(data.message);
            } else {
                showToast('중복 확인 중 오류가 발생했습니다.');
            }
        } catch (err) {
            console.error('Name check error:', err);
            showToast('중복 확인 중 오류가 발생했습니다.');
        } finally {
            setIsCheckingName(false);
        }
    };

    // 이름 변경 시 중복 확인 결과 초기화
    const handleNameChange = (e) => {
        setName(e.target.value);
        setNameCheckResult(null);
        setNameCheckMessage('');
    };

    const handleAreaSelect = (locationData) => {
        const newArea = {
            id: Date.now(),
            ...locationData
        };

        setActivityAreas([newArea]);
    };

    const removeActivityArea = (areaId) => {
        setActivityAreas(activityAreas.filter(area => area.id !== areaId));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            showToast('파일 크기는 5MB 이하여야 합니다.');
            return;
        }

        if (!file.type.startsWith('image/')) {
            showToast('이미지 파일만 업로드 가능합니다.');
            return;
        }

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
            formData.append('folder', 'crews');

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
                {
                    method: 'POST',
                    body: formData,
                }
            );

            if (!response.ok) {
                throw new Error('이미지 업로드에 실패했습니다.');
            }

            const data = await response.json();
            setUploadedImage(data.secure_url);
            setSelectedImageId(null);
        } catch (err) {
            console.error('Upload error:', err);
            showToast('이미지 업로드 중 오류가 발생했습니다.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name.trim()) {
            showToast('크루 이름을 입력해주세요.');
            return;
        }

        if (activityAreas.length === 0) {
            showToast('최소 1개 이상의 활동 지역을 선택해주세요.');
            return;
        }

        if (!uploadedImage && !selectedImageId) {
            showToast('크루 이미지를 선택해주세요.');
            return;
        }

        setIsSubmitting(true);

        try {
            const selectedImage = CREW_IMAGES.find(img => img.id === selectedImageId) || CREW_IMAGES[0];
            let imageUrl;
            if (uploadedImage) {
                imageUrl = uploadedImage;
            } else {
                imageUrl = JSON.stringify(selectedImage);
            }

            const areasToSend = activityAreas.map(({ id, ...area }) => area);

            const requestBody = {
                name,
                description,
                imageUrl,
                joinType,
                activityAreas: areasToSend
            };

            const response = await api.request(`${import.meta.env.VITE_API_URL}/crew`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
                },
                body: JSON.stringify(requestBody)
            });

            if (response.ok) {
                const crewData = await response.json();
                onCreate({
                    ...crewData,
                    image: uploadedImage ? { url: uploadedImage } : selectedImage
                });

                setName('');
                setDescription('');
                setUploadedImage(null);
                setSelectedImageId(CREW_IMAGES[0].id);
                setActivityAreas([]);
                setJoinType('AUTO');
                setNameCheckResult(null); // 중복 확인 결과 초기화

                alert('크루가 성공적으로 생성되었습니다!');
            } else {
                const errorText = await response.text();
                showToast(errorText || '크루 생성에 실패했습니다.');
            }
        } catch (err) {
            console.error('Crew creation error:', err);
            showToast('크루 생성 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };



    return (
        <div style={{
            padding: '0',
            maxWidth: '600px',
            margin: '0 auto',
            height: '100%',
            backgroundColor: '#0f172a', // Deep navy background
            color: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
        }}>
            {/* 뒤로가기 헤더 */}
            <div style={{
                position: 'sticky',
                top: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                zIndex: 100
            }}>
                <button
                    onClick={() => navigate('/crew')}
                    style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#f8fafc',
                        fontSize: '20px',
                        transition: 'all 0.2s'
                    }}
                >
                    ←
                </button>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', letterSpacing: '-0.02em' }}>신규 크루 생성</h2>
            </div>

            {/* 본문 컨텐츠 */}
            <div style={{
                padding: '24px 20px',
                overflowY: 'auto',
                flex: 1,
                paddingBottom: '100px' // 버튼 공간
            }}>
                {/* Toast 메시지 */}
                {toast.show && (
                    <div style={{
                        position: 'fixed',
                        top: '80px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: '#1e293b',
                        color: '#38bdf8',
                        padding: '12px 24px',
                        borderRadius: '16px',
                        zIndex: 1000,
                        fontSize: '14px',
                        fontWeight: '600',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                        border: '1px solid rgba(56, 189, 248, 0.2)',
                        animation: 'fadeInDown 0.3s ease-out'
                    }}>
                        {toast.message}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                    {/* 크루 이름 */}
                    <div style={formSectionStyle}>
                        <label style={labelStyle}>크루 이름 <span style={{ color: '#ef4444' }}>*</span></label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                                type="text"
                                value={name}
                                onChange={handleNameChange}
                                placeholder="멋진 이름을 입력해 보세요"
                                style={{
                                    ...inputStyle,
                                    border: nameCheckResult === 'unavailable' ? '1px solid #ef4444' : (nameCheckResult === 'available' ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)'),
                                }}
                                required
                            />
                            <button
                                type="button"
                                onClick={handleCheckName}
                                disabled={!name.trim() || isCheckingName}
                                style={{
                                    ...secondaryButtonStyle,
                                    backgroundColor: nameCheckResult === 'available' ? '#10b981' : (nameCheckResult === 'unavailable' ? '#ef4444' : 'rgba(255,255,255,0.1)'),
                                    minWidth: '90px'
                                }}
                            >
                                {isCheckingName ? '확인 중' : (nameCheckResult === 'available' ? '완료' : '중복 확인')}
                            </button>
                        </div>
                        {nameCheckResult && (
                            <p style={{
                                margin: '8px 0 0 4px',
                                fontSize: '13px',
                                fontWeight: '500',
                                color: nameCheckResult === 'available' ? '#10b981' : '#ef4444',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                {nameCheckResult === 'available' ? '✓' : '⚠'} {nameCheckMessage}
                            </p>
                        )}
                    </div>

                    {/* 크루 설명 */}
                    <div style={formSectionStyle}>
                        <label style={labelStyle}>크루 설명</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="어떤 크루인지 소개해 주세요"
                            style={{
                                ...inputStyle,
                                minHeight: '100px',
                                resize: 'none',
                                lineHeight: '1.6'
                            }}
                        />
                    </div>

                    {/* 가입 방식 */}
                    <div style={formSectionStyle}>
                        <label style={labelStyle}>가입 방식 <span style={{ color: '#ef4444' }}>*</span></label>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div
                                onClick={() => setJoinType('AUTO')}
                                style={{
                                    ...choiceCardStyle,
                                    border: joinType === 'AUTO' ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                                    backgroundColor: joinType === 'AUTO' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255,255,255,0.03)',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                    <div style={{
                                        width: '18px',
                                        height: '18px',
                                        borderRadius: '50%',
                                        border: '2px solid #38bdf8',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {joinType === 'AUTO' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#38bdf8' }} />}
                                    </div>
                                    <span style={{ fontWeight: '700', fontSize: '15px' }}>자동 가입</span>
                                </div>
                                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>누구나 자유롭게 가입 가능</p>
                            </div>

                            <div
                                onClick={() => setJoinType('APPROVAL')}
                                style={{
                                    ...choiceCardStyle,
                                    border: joinType === 'APPROVAL' ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                                    backgroundColor: joinType === 'APPROVAL' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255,255,255,0.03)',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                    <div style={{
                                        width: '18px',
                                        height: '18px',
                                        borderRadius: '50%',
                                        border: '2px solid #38bdf8',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {joinType === 'APPROVAL' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#38bdf8' }} />}
                                    </div>
                                    <span style={{ fontWeight: '700', fontSize: '15px' }}>승인 후 가입</span>
                                </div>
                                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>크루장의 승인 단계 필요</p>
                            </div>
                        </div>
                    </div>

                    {/* 크루 활동 지역 */}
                    <div style={formSectionStyle}>
                        <label style={labelStyle}>크루 활동 지역 <span style={{ color: '#ef4444' }}>*</span></label>
                        <div style={{
                            backgroundColor: 'rgba(255,255,255,0.03)',
                            borderRadius: '20px',
                            overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.1)',
                        }}>
                            <CrewActivityAreaSelection
                                onSelect={handleAreaSelect}
                                embedded={true}
                            />
                        </div>
                    </div>

                    {/* 크루 이미지 */}
                    <div style={formSectionStyle}>
                        <label style={labelStyle}>크루 이미지</label>

                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                style={{ display: 'none' }}
                                id="crew-image-upload"
                                disabled={isUploading}
                            />
                            <label
                                htmlFor="crew-image-upload"
                                style={{
                                    flex: uploadedImage ? '0 0 auto' : '1',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: uploadedImage ? '0' : '24px',
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    border: '2px dashed rgba(255,255,255,0.1)',
                                    borderRadius: '20px',
                                    cursor: isUploading ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {uploadedImage ? (
                                    <div style={{ width: '80px', height: '80px', borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
                                        <img src={uploadedImage} alt="Uploaded" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <div
                                            onClick={(e) => { e.preventDefault(); setUploadedImage(null); setSelectedImageId(CREW_IMAGES[0].id); }}
                                            style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(0,0,0,0.5)', padding: '2px 6px', fontSize: '10px' }}
                                        >✕</div>
                                    </div>
                                ) : (
                                    <>
                                        <span style={{ fontSize: '24px', marginBottom: '8px' }}>📸</span>
                                        <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '500' }}>{isUploading ? '업로드 중...' : '사진 올리기'}</span>
                                    </>
                                )}
                            </label>

                            {!uploadedImage && (
                                <div style={{ flex: 2 }}>
                                    <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>또는 추천 이모지</div>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(5, 1fr)',
                                        gap: '8px'
                                    }}>
                                        {CREW_IMAGES.slice(0, 5).map((img) => (
                                            <button
                                                key={img.id}
                                                type="button"
                                                onClick={() => setSelectedImageId(img.id)}
                                                style={{
                                                    aspectRatio: '1',
                                                    borderRadius: '12px',
                                                    border: selectedImageId === img.id ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                                                    background: img.bg,
                                                    fontSize: '20px',
                                                    cursor: 'pointer',
                                                    opacity: selectedImageId === img.id ? 1 : 0.6,
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {img.emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 제출 버튼 */}
                    <div style={{ marginTop: '20px', paddingBottom: '40px' }}>
                        <button
                            type="submit"
                            disabled={isSubmitting || isUploading}
                            style={{
                                width: '100%',
                                padding: '18px',
                                backgroundColor: isSubmitting || isUploading ? '#334155' : '#38bdf8',
                                color: isSubmitting || isUploading ? '#64748b' : '#0f172a',
                                border: 'none',
                                borderRadius: '16px',
                                fontSize: '16px',
                                fontWeight: '800',
                                cursor: isSubmitting || isUploading ? 'not-allowed' : 'pointer',
                                boxShadow: isSubmitting || isUploading ? 'none' : '0 10px 15px -3px rgba(56, 189, 248, 0.3)',
                                transition: 'all 0.2s'
                            }}
                        >
                            {isSubmitting ? '구성원을 위해 준비 중...' : '크루 창설 완료 ✨'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Styles
const formSectionStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
};

const labelStyle = {
    fontSize: '15px',
    fontWeight: '700',
    color: '#e2e8f0',
    paddingLeft: '4px'
};

const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '14px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#f8fafc',
    fontSize: '16px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, background-color 0.2s'
};

const secondaryButtonStyle = {
    padding: '0 18px',
    borderRadius: '14px',
    border: 'none',
    color: '#f8fafc',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s'
};

const choiceCardStyle = {
    flex: 1,
    padding: '16px',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s'
};

export default CrewCreateTab;

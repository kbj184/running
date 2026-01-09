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
            maxWidth: '800px',
            margin: '0 auto',
            maxHeight: 'calc(100vh - var(--header-height) - 60px)',
            overflowY: 'auto',
            position: 'relative' // Toast 포지셔닝을 위해
        }}>
            {/* 뒤로가기 헤더 */}
            <div style={{
                position: 'sticky',
                top: 0,
                backgroundColor: '#fff',
                borderBottom: '1px solid #e0e0e0',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                zIndex: 10
            }}>
                <button
                    onClick={() => navigate('/crew')}
                    style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '24px',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        color: '#1a1a1a'
                    }}
                >
                    ←
                </button>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>크루 만들기</h2>
            </div>

            {/* 본문 컨텐츠 */}
            <div style={{ padding: '20px' }}>

                {/* Toast 메시지 */}
                {toast.show && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        color: 'white',
                        padding: '12px 24px',
                        borderRadius: '50px',
                        zIndex: 1000,
                        fontSize: '14px',
                        fontWeight: '500',
                        pointerEvents: 'none', // 클릭 통과
                        animation: 'fadeInOut 3s ease-in-out forwards',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}>
                        {toast.message}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* 크루 이름 */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1a1a1a' }}>
                            크루 이름 *
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                value={name}
                                onChange={handleNameChange}
                                placeholder="멋진 크루 이름을 입력하세요"
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: nameCheckResult === 'unavailable' ? '2px solid #ef4444' : (nameCheckResult === 'available' ? '2px solid #10b981' : '1px solid #e0e0e0'),
                                    fontSize: '16px',
                                    boxSizing: 'border-box',
                                    transition: 'all 0.2s',
                                    outline: 'none'
                                }}
                                required
                            />
                            <button
                                type="button"
                                onClick={handleCheckName}
                                disabled={!name.trim() || isCheckingName}
                                style={{
                                    padding: '0 20px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    backgroundColor: nameCheckResult === 'available' ? '#10b981' : (nameCheckResult === 'unavailable' ? '#ef4444' : '#1a1a1a'),
                                    color: 'white',
                                    fontWeight: '600',
                                    cursor: (!name.trim() || isCheckingName) ? 'not-allowed' : 'pointer',
                                    whiteSpace: 'nowrap',
                                    minWidth: '100px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {isCheckingName ? '확인 중' : (nameCheckResult === 'available' ? '확인 완료' : (nameCheckResult === 'unavailable' ? '사용 불가' : '중복 확인'))}
                            </button>
                        </div>
                        {/* 중복 확인 결과 메시지 - 성공/실패 모두 여기에 표시 */}
                        {nameCheckResult && (
                            <p style={{
                                margin: '6px 0 0 4px',
                                fontSize: '13px',
                                fontWeight: '500',
                                color: nameCheckResult === 'available' ? '#10b981' : '#ef4444'
                            }}>
                                {nameCheckResult === 'available' ? '✓ ' : '⚠ '}
                                {nameCheckMessage}
                            </p>
                        )}
                    </div>

                    {/* 크루 설명 */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1a1a1a' }}>
                            크루 설명
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="우리 크루는 어떤 곳인가요?"
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '10px',
                                border: '1px solid #e0e0e0',
                                fontSize: '16px',
                                minHeight: '80px',
                                resize: 'vertical',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    {/* 가입 방식 */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1a1a1a' }}>
                            가입 방식 *
                        </label>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <label style={{
                                flex: 1,
                                padding: '16px',
                                borderRadius: '10px',
                                border: joinType === 'AUTO' ? '2px solid #1a1a1a' : '1px solid #e0e0e0',
                                backgroundColor: joinType === 'AUTO' ? '#f8f9fa' : 'white',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}>
                                <input
                                    type="radio"
                                    name="joinType"
                                    value="AUTO"
                                    checked={joinType === 'AUTO'}
                                    onChange={(e) => setJoinType(e.target.value)}
                                    style={{ marginRight: '8px' }}
                                />
                                <span style={{ fontWeight: '600' }}>자동 가입</span>
                                <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0 24px' }}>
                                    누구나 바로 크루에 가입할 수 있습니다
                                </p>
                            </label>

                            <label style={{
                                flex: 1,
                                padding: '16px',
                                borderRadius: '10px',
                                border: joinType === 'APPROVAL' ? '2px solid #1a1a1a' : '1px solid #e0e0e0',
                                backgroundColor: joinType === 'APPROVAL' ? '#f8f9fa' : 'white',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}>
                                <input
                                    type="radio"
                                    name="joinType"
                                    value="APPROVAL"
                                    checked={joinType === 'APPROVAL'}
                                    onChange={(e) => setJoinType(e.target.value)}
                                    style={{ marginRight: '8px' }}
                                />
                                <span style={{ fontWeight: '600' }}>승인 후 가입</span>
                                <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0 24px' }}>
                                    크루장이 승인한 후에 가입됩니다
                                </p>
                            </label>
                        </div>
                    </div>

                    {/* 크루 활동 지역 */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1a1a1a' }}>
                            크루 활동 지역 *
                        </label>

                        <div style={{
                            backgroundColor: '#1a1a1a',
                            borderRadius: '16px',
                            padding: '20px',
                            border: '1px solid #333',
                        }}>
                            <CrewActivityAreaSelection
                                onSelect={handleAreaSelect}
                                embedded={true}
                            />
                        </div>
                    </div>

                    {/* 크루 이미지 */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: '#1a1a1a' }}>
                            크루 이미지
                        </label>

                        {/* 이미지 업로드 */}
                        <div style={{ marginBottom: '16px' }}>
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
                                    display: 'inline-block',
                                    padding: '10px 20px',
                                    backgroundColor: '#f3f4f6',
                                    border: '2px dashed #d1d5db',
                                    borderRadius: '10px',
                                    cursor: isUploading ? 'not-allowed' : 'pointer',
                                    fontWeight: '600',
                                    color: '#374151',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {isUploading ? '업로드 중...' : '📷 내 이미지 업로드'}
                            </label>
                        </div>

                        {/* 업로드된 이미지 미리보기 */}
                        {uploadedImage && (
                            <div style={{ marginBottom: '16px' }}>
                                <div
                                    onClick={() => {
                                        setUploadedImage(null);
                                        setSelectedImageId(CREW_IMAGES[0].id);
                                    }}
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        border: '3px solid #1a1a1a',
                                        cursor: 'pointer',
                                        position: 'relative'
                                    }}
                                >
                                    <img
                                        src={uploadedImage}
                                        alt="Uploaded"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                        }}
                                    />
                                </div>
                                <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>클릭하여 제거</p>
                            </div>
                        )}

                        {/* 기본 이미지 */}
                        {!uploadedImage && (
                            <>
                                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>또는 기본 이미지 선택</div>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(5, 1fr)',
                                    gap: '12px'
                                }}>
                                    {CREW_IMAGES.map((img) => (
                                        <button
                                            key={img.id}
                                            type="button"
                                            onClick={() => setSelectedImageId(img.id)}
                                            style={{
                                                width: '100%',
                                                aspectRatio: '1',
                                                borderRadius: '12px',
                                                border: selectedImageId === img.id ? '3px solid #1a1a1a' : '2px solid #e0e0e0',
                                                background: img.bg,
                                                fontSize: '24px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                transition: 'all 0.2s',
                                                transform: selectedImageId === img.id ? 'scale(1.05)' : 'scale(1)',
                                                boxShadow: selectedImageId === img.id ? '0 4px 12px rgba(0,0,0,0.15)' : '0 2px 4px rgba(0,0,0,0.05)'
                                            }}
                                        >
                                            {img.emoji}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* 제출 버튼 */}
                    <button
                        type="submit"
                        disabled={isSubmitting || isUploading}
                        style={{
                            width: '100%',
                            padding: '16px',
                            backgroundColor: isSubmitting || isUploading ? '#9ca3af' : '#1a1a1a',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '16px',
                            fontWeight: '700',
                            cursor: isSubmitting || isUploading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <span>✨</span> {isSubmitting ? '생성 중...' : '크루 생성하기'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default CrewCreateTab;

import React, { useState } from 'react';
import { api } from '../../utils/api';

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

function CreateCrewModal({ isOpen, onClose, onCreate, user }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedImageId, setSelectedImageId] = useState(CREW_IMAGES[0].id);
    const [uploadedImage, setUploadedImage] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file
        if (file.size > 5 * 1024 * 1024) {
            setError('파일 크기는 5MB 이하여야 합니다.');
            return;
        }

        if (!file.type.startsWith('image/')) {
            setError('이미지 파일만 업로드 가능합니다.');
            return;
        }

        setIsUploading(true);
        setError('');

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
            setSelectedImageId(null); // Clear default selection
        } catch (err) {
            console.error('Upload error:', err);
            setError('이미지 업로드 중 오류가 발생했습니다.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);
        setError('');

        try {
            const selectedImage = uploadedImage || CREW_IMAGES.find(img => img.id === selectedImageId);
            const imageUrl = uploadedImage || JSON.stringify(selectedImage);

            const response = await api.request(`${import.meta.env.VITE_API_URL}/crew`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
                },
                body: JSON.stringify({
                    name,
                    description,
                    imageUrl
                })
            });

            if (response.ok) {
                const crewData = await response.json();
                onCreate({
                    ...crewData,
                    image: uploadedImage ? { url: uploadedImage } : selectedImage
                });
                // Reset form
                setName('');
                setDescription('');
                setUploadedImage(null);
                setSelectedImageId(CREW_IMAGES[0].id);
            } else {
                const errorText = await response.text();
                setError(errorText || '크루 생성에 실패했습니다.');
            }
        } catch (err) {
            console.error('Crew creation error:', err);
            setError('크루 생성 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000,
            backdropFilter: 'blur(5px)'
        }}>
            <style>
                {`
                    @keyframes slideUp {
                        from { transform: translateY(20px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                `}
            </style>
            <div className="modal-content" style={{
                width: '90%',
                maxWidth: '500px',
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                padding: '24px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                animation: 'slideUp 0.3s ease-out'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#1a1a1a' }}>크루 만들기</h2>
                    <button onClick={onClose} style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '24px',
                        cursor: 'pointer',
                        color: '#666'
                    }}>✕</button>
                </div>

                {error && (
                    <div style={{
                        padding: '12px',
                        marginBottom: '16px',
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        borderRadius: '8px',
                        fontSize: '14px'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1a1a1a' }}>크루 이름</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="멋진 크루 이름을 입력하세요"
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '10px',
                                border: '1px solid #e0e0e0',
                                fontSize: '16px',
                                boxSizing: 'border-box'
                            }}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1a1a1a' }}>크루 설명</label>
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

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: '#1a1a1a' }}>크루 이미지</label>

                        {/* Image Upload Button */}
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

                        {/* Uploaded Image Preview */}
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

                        {/* Default Images */}
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
                                                border: selectedImageId === img.id ? '3px solid #1a1a1a' : '1px solid transparent',
                                                background: img.bg,
                                                fontSize: '24px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                transition: 'transform 0.2s',
                                                transform: selectedImageId === img.id ? 'scale(1.1)' : 'scale(1)'
                                            }}
                                        >
                                            {img.emoji}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

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

export default CreateCrewModal;

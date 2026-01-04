import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../../utils/api';

function PostEditorPage({ crew, user, post, onCancel, onComplete }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isPinned, setIsPinned] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);
    const textareaRef = useRef(null);

    const isEditMode = !!post;
    const isCaptain = crew && crew.captainId === user.id;

    useEffect(() => {
        if (post) {
            setTitle(post.title);
            setContent(post.content);
            setIsPinned(post.isPinned || false);
        }
    }, [post]);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 이미지 파일 검증
        if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 업로드 가능합니다.');
            return;
        }

        // 파일 크기 제한 (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('이미지 크기는 5MB 이하여야 합니다.');
            return;
        }

        setUploadingImage(true);
        setError('');

        try {
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

                // 커서 위치에 이미지 마크다운 삽입
                const textarea = textareaRef.current;
                const cursorPos = textarea.selectionStart;
                const textBefore = content.substring(0, cursorPos);
                const textAfter = content.substring(cursorPos);
                const imageMarkdown = `\n![이미지](${imageUrl})\n`;

                setContent(textBefore + imageMarkdown + textAfter);

                // 커서를 삽입된 이미지 뒤로 이동
                setTimeout(() => {
                    textarea.focus();
                    const newCursorPos = cursorPos + imageMarkdown.length;
                    textarea.setSelectionRange(newCursorPos, newCursorPos);
                }, 0);
            } else {
                throw new Error('이미지 업로드 실패');
            }
        } catch (err) {
            console.error('Image upload error:', err);
            setError('이미지 업로드 중 오류가 발생했습니다.');
        } finally {
            setUploadingImage(false);
            // 파일 input 초기화
            e.target.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title.trim()) {
            setError('제목을 입력해주세요.');
            return;
        }
        if (!content.trim()) {
            setError('내용을 입력해주세요.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const requestBody = {
                title,
                content,
                isPinned: isCaptain ? isPinned : false
            };

            if (!isEditMode) {
                requestBody.category = 'CREW';
                requestBody.crewId = crew.id;
            }

            const url = isEditMode
                ? `${import.meta.env.VITE_API_URL}/board/posts/${post.id}`
                : `${import.meta.env.VITE_API_URL}/board/posts`;

            const response = await api.request(url, {
                method: isEditMode ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': user.accessToken.startsWith('Bearer ')
                        ? user.accessToken
                        : `Bearer ${user.accessToken}`
                },
                body: JSON.stringify(requestBody)
            });

            if (response.ok) {
                const savedPost = await response.json();
                alert(isEditMode ? '게시글이 수정되었습니다.' : '게시글이 작성되었습니다.');
                onComplete(savedPost);
            } else {
                const errorText = await response.text();
                setError(errorText || '저장에 실패했습니다.');
            }
        } catch (err) {
            console.error('Submit error:', err);
            setError('저장 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ padding: '20px', paddingBottom: '80px', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '800', color: '#1a1a1a' }}>
                {isEditMode ? '게시글 수정' : '게시글 작성'}
            </h2>

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
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1a1a1a', fontSize: '14px' }}>
                        제목
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="제목을 입력하세요"
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid #e0e0e0',
                            fontSize: '16px',
                            boxSizing: 'border-box',
                            outline: 'none',
                            fontFamily: 'inherit'
                        }}
                        required
                    />
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label style={{ fontWeight: '600', color: '#1a1a1a', fontSize: '14px' }}>
                            내용
                        </label>
                        <label
                            htmlFor="image-upload"
                            style={{
                                padding: '6px 12px',
                                backgroundColor: uploadingImage ? '#9ca3af' : '#fff',
                                border: '1px solid #e0e0e0',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: uploadingImage ? 'not-allowed' : 'pointer',
                                color: '#666',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                        >
                            📷 {uploadingImage ? '업로드 중...' : '이미지 추가'}
                        </label>
                        <input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploadingImage}
                            style={{ display: 'none' }}
                        />
                    </div>
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="내용을 입력하세요&#10;&#10;이미지를 추가하려면 위의 '이미지 추가' 버튼을 클릭하세요."
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid #e0e0e0',
                            fontSize: '15px',
                            minHeight: '300px',
                            resize: 'vertical',
                            boxSizing: 'border-box',
                            outline: 'none',
                            fontFamily: 'inherit',
                            lineHeight: 1.6
                        }}
                        required
                    />
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
                        💡 이미지는 마크다운 형식으로 삽입됩니다. (예: ![이미지](URL))
                    </div>
                </div>

                {isCaptain && (
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            padding: '12px',
                            backgroundColor: '#fff',
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px'
                        }}>
                            <input
                                type="checkbox"
                                checked={isPinned}
                                onChange={(e) => setIsPinned(e.target.checked)}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <span style={{ fontWeight: '600', color: '#1a1a1a', fontSize: '14px' }}>
                                📌 공지사항으로 등록 (상단 고정)
                            </span>
                        </label>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        type="button"
                        onClick={onCancel}
                        style={{
                            flex: 1,
                            padding: '14px',
                            backgroundColor: '#f3f4f6',
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            color: '#1a1a1a'
                        }}
                    >
                        취소
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || uploadingImage}
                        style={{
                            flex: 2,
                            padding: '14px',
                            backgroundColor: (isSubmitting || uploadingImage) ? '#9ca3af' : '#1a1a1a',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '700',
                            cursor: (isSubmitting || uploadingImage) ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {isSubmitting ? '저장 중...' : (isEditMode ? '수정하기' : '작성하기')}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default PostEditorPage;

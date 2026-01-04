import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../../utils/api';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import ImageResize from 'quill-image-resize-module-react';

Quill.register('modules/imageResize', ImageResize);

function PostEditorPage({ crew, user, post, onCancel, onComplete }) {
    // ... (state lines 6-12)

    // ... (useEffect lines 16-22)

    // ... (imageHandler lines 25-78)

    // Quill 모듈 설정
    const modules = useMemo(() => ({
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'align': [] }],
                ['link', 'image'],
                ['clean']
            ],
            handlers: {
                // image: imageHandler // 이미지 핸들러 잠시 비활성화 (테스트) -> 다시 활성화 필요 시 주석 해제
                image: imageHandler
            }
        },
        imageResize: {
            parchment: Quill.import('parchment'),
            modules: ['Resize', 'DisplaySize']
        }
    }), []);

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike',
        'list', 'bullet',
        'color', 'background',
        'align',
        'link', 'image'
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title.trim()) {
            setError('제목을 입력해주세요.');
            return;
        }
        if (!content.trim() || content === '<p><br></p>') {
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
            <style>{`
                .ql-container.ql-snow {
                    border: 1px solid #e0e0e0;
                    border-bottom-left-radius: 8px;
                    border-bottom-right-radius: 8px;
                    background-color: #fff;
                }
                .ql-toolbar.ql-snow {
                    border: 1px solid #e0e0e0;
                    border-bottom: none;
                    border-top-left-radius: 8px;
                    border-top-right-radius: 8px;
                    background-color: #fff;
                }
                .ql-editor {
                    min-height: 300px;
                    font-size: 16px;
                    color: #1a1a1a;
                    font-family: inherit;
                    line-height: 1.6;
                }
                .ql-editor.ql-blank::before {
                    color: #999;
                    font-style: normal;
                }
            `}</style>
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
                            fontFamily: 'inherit',
                            color: '#1a1a1a'
                        }}
                        required
                    />
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1a1a1a', fontSize: '14px' }}>
                        내용
                    </label>
                    <div style={{}}>
                        <ReactQuill
                            theme="snow"
                            value={content}
                            onChange={setContent}
                            modules={modules}
                            formats={formats}
                            placeholder="내용을 입력하세요. 이미지를 추가하려면 툴바의 이미지 아이콘을 클릭하세요."
                        />
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
                        💡 텍스트 서식, 이미지, 링크 등을 자유롭게 추가할 수 있습니다.
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
                        disabled={isSubmitting}
                        style={{
                            flex: 2,
                            padding: '14px',
                            backgroundColor: isSubmitting ? '#9ca3af' : '#1a1a1a',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '700',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer'
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

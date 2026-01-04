import React, { useState, useEffect } from 'react';
import { api } from '../../../utils/api';

function PostDetailPage({ postId, crew, user, onBack, onEdit }) {
    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [commentContent, setCommentContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (postId) {
            fetchPost();
            fetchComments();
        }
    }, [postId]);

    const fetchPost = async () => {
        try {
            const response = await api.request(
                `${import.meta.env.VITE_API_URL}/board/posts/${postId}`,
                {
                    headers: {
                        'Authorization': user.accessToken.startsWith('Bearer ')
                            ? user.accessToken
                            : `Bearer ${user.accessToken}`
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                setPost(data);
            }
        } catch (error) {
            console.error('Failed to fetch post:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async () => {
        try {
            const response = await api.request(
                `${import.meta.env.VITE_API_URL}/board/posts/${postId}/comments`,
                {
                    headers: {
                        'Authorization': user.accessToken.startsWith('Bearer ')
                            ? user.accessToken
                            : `Bearer ${user.accessToken}`
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                setComments(data);
            }
        } catch (error) {
            console.error('Failed to fetch comments:', error);
        }
    };

    const handleSubmitComment = async (e) => {
        e.preventDefault();
        if (!commentContent.trim()) return;

        setIsSubmitting(true);
        try {
            const response = await api.request(
                `${import.meta.env.VITE_API_URL}/board/posts/${postId}/comments`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': user.accessToken.startsWith('Bearer ')
                            ? user.accessToken
                            : `Bearer ${user.accessToken}`
                    },
                    body: JSON.stringify({ content: commentContent })
                }
            );

            if (response.ok) {
                setCommentContent('');
                fetchComments();
                fetchPost(); // 댓글 수 업데이트
            }
        } catch (error) {
            console.error('Failed to submit comment:', error);
            alert('댓글 작성 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!confirm('댓글을 삭제하시겠습니까?')) return;

        try {
            const response = await api.request(
                `${import.meta.env.VITE_API_URL}/board/comments/${commentId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': user.accessToken.startsWith('Bearer ')
                            ? user.accessToken
                            : `Bearer ${user.accessToken}`
                    }
                }
            );

            if (response.ok) {
                fetchComments();
                fetchPost(); // 댓글 수 업데이트
            }
        } catch (error) {
            console.error('Failed to delete comment:', error);
            alert('댓글 삭제 중 오류가 발생했습니다.');
        }
    };

    const handleDeletePost = async () => {
        if (!confirm('게시글을 삭제하시겠습니까?')) return;

        try {
            const response = await api.request(
                `${import.meta.env.VITE_API_URL}/board/posts/${postId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': user.accessToken.startsWith('Bearer ')
                            ? user.accessToken
                            : `Bearer ${user.accessToken}`
                    }
                }
            );

            if (response.ok) {
                alert('게시글이 삭제되었습니다.');
                onBack();
            }
        } catch (error) {
            console.error('Failed to delete post:', error);
            alert('게시글 삭제 중 오류가 발생했습니다.');
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                로딩 중...
            </div>
        );
    }

    if (!post) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                게시글을 찾을 수 없습니다.
            </div>
        );
    }

    const isAuthor = post.authorId === user.id;
    const isCaptain = crew && crew.captainId === user.id;
    const canEdit = isAuthor || isCaptain;

    return (
        <div style={{ padding: '20px', paddingBottom: '80px', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            {/* 뒤로가기 */}
            <button
                onClick={onBack}
                style={{
                    marginBottom: '16px',
                    padding: '8px 16px',
                    backgroundColor: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    color: '#1a1a1a'
                }}
            >
                ← 목록으로
            </button>

            {/* 게시글 */}
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', marginBottom: '16px', border: '1px solid #e0e0e0' }}>
                {post.isPinned && (
                    <span style={{
                        display: 'inline-block',
                        fontSize: '11px',
                        fontWeight: '700',
                        color: '#92400e',
                        background: '#fef3c7',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        marginBottom: '12px'
                    }}>
                        📌 공지사항
                    </span>
                )}

                <h1 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: '800', color: '#1a1a1a', lineHeight: 1.4 }}>
                    {post.title}
                </h1>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {post.authorImage ? (
                            <img src={post.authorImage} alt={post.authorNickname} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <span style={{ fontSize: '16px' }}>👤</span>
                        )}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', color: '#1a1a1a', fontSize: '14px' }}>{post.authorNickname || '익명'}</div>
                        <div style={{ fontSize: '12px', color: '#999' }}>{formatDate(post.createdAt)}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#999' }}>
                        <span>👁️ {post.viewCount}</span>
                        <span>💬 {post.commentCount}</span>
                    </div>
                </div>

                <div
                    className="post-content"
                    style={{ fontSize: '15px', lineHeight: 1.8, color: '#1a1a1a', marginBottom: '24px' }}
                >
                    <style>{`
                        .post-content img {
                            max-width: 100%;
                            height: auto;
                            border-radius: 8px;
                            margin: 12px 0;
                            display: block;
                        }
                    `}</style>
                    <div dangerouslySetInnerHTML={{ __html: post.content }} />
                </div>

                {canEdit && (
                    <div style={{ display: 'flex', gap: '8px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
                        <button
                            onClick={() => onEdit(post)}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#f3f4f6',
                                border: '1px solid #e0e0e0',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                color: '#1a1a1a'
                            }}
                        >
                            수정
                        </button>
                        <button
                            onClick={handleDeletePost}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#fff',
                                border: '1px solid #fee2e2',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                color: '#ef4444'
                            }}
                        >
                            삭제
                        </button>
                    </div>
                )}
            </div>

            {/* 댓글 */}
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e0e0e0' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700', color: '#1a1a1a' }}>
                    댓글 {comments.length}
                </h3>

                {/* 댓글 작성 */}
                <form onSubmit={handleSubmitComment} style={{ marginBottom: '24px' }}>
                    <textarea
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        placeholder="댓글을 입력하세요"
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid #e0e0e0',
                            fontSize: '14px',
                            minHeight: '80px',
                            resize: 'vertical',
                            boxSizing: 'border-box',
                            outline: 'none',
                            fontFamily: 'inherit'
                        }}
                    />
                    <button
                        type="submit"
                        disabled={isSubmitting || !commentContent.trim()}
                        style={{
                            marginTop: '8px',
                            padding: '10px 20px',
                            backgroundColor: isSubmitting || !commentContent.trim() ? '#f3f4f6' : '#1a1a1a',
                            color: isSubmitting || !commentContent.trim() ? '#999' : 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '700',
                            cursor: isSubmitting || !commentContent.trim() ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {isSubmitting ? '작성 중...' : '댓글 작성'}
                    </button>
                </form>

                {/* 댓글 목록 */}
                {comments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
                        첫 번째 댓글을 작성해보세요!
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {comments.map((comment) => (
                            <div key={comment.id} style={{ paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                                        {comment.authorImage ? (
                                            <img src={comment.authorImage} alt={comment.authorNickname} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <span style={{ fontSize: '14px' }}>👤</span>
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                            <span style={{ fontWeight: '600', fontSize: '14px', color: '#1a1a1a' }}>
                                                {comment.authorNickname || '익명'}
                                            </span>
                                            <span style={{ fontSize: '12px', color: '#999' }}>
                                                {formatDate(comment.createdAt)}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '14px', color: '#1a1a1a', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                            {comment.content}
                                        </div>
                                        {comment.authorId === user.id && (
                                            <button
                                                onClick={() => handleDeleteComment(comment.id)}
                                                style={{
                                                    marginTop: '8px',
                                                    padding: '4px 10px',
                                                    backgroundColor: 'transparent',
                                                    border: 'none',
                                                    fontSize: '12px',
                                                    color: '#ef4444',
                                                    cursor: 'pointer',
                                                    fontWeight: '600'
                                                }}
                                            >
                                                삭제
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default PostDetailPage;

import React, { useState, useEffect } from 'react';
import { api } from '../../../utils/api';

function CrewBoardTab({ crew, user, userRole, onPostClick, onCreatePost, onBack }) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchInput, setSearchInput] = useState('');

    useEffect(() => {
        if (crew) {
            fetchPosts();
        }
    }, [crew, page, searchKeyword]);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                category: 'CREW',
                crewId: crew.id.toString(),
                page: page.toString(),
                size: '20'
            });

            if (searchKeyword) {
                params.append('keyword', searchKeyword);
            }

            const response = await api.request(
                `${import.meta.env.VITE_API_URL}/board/posts?${params.toString()}`,
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
                setPosts(data.content);
                setTotalPages(data.totalPages);
            }
        } catch (error) {
            console.error('Failed to fetch posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setSearchKeyword(searchInput);
        setPage(0);
    };

    const handlePostClick = (post) => {
        if (onPostClick) onPostClick(post);
    };

    const handleCreatePost = () => {
        if (onCreatePost) onCreatePost();
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const hours = Math.floor(diff / (1000 * 60 * 60));

        if (hours < 1) return '방금 전';
        if (hours < 24) return `${hours}시간 전`;
        if (hours < 48) return '어제';
        return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    };

    const handleFilterPost = async (e, post) => {
        e.stopPropagation();
        if (!window.confirm(post.isFiltered ? '게시글 필터를 해제하시겠습니까?' : '게시글을 필터링(숨김) 하시겠습니까?')) return;

        try {
            const response = await api.request(`${import.meta.env.VITE_API_URL}/board/posts/${post.id}/filter`, {
                method: 'PUT',
                headers: {
                    'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
                }
            });

            if (response.ok) {
                alert(post.isFiltered ? '필터가 해제되었습니다.' : '게시글이 필터링되었습니다.');
                fetchPosts();
            } else {
                alert('요청 실패');
            }
        } catch (error) {
            console.error('Filter error:', error);
            alert('오류가 발생했습니다.');
        }
    };

    const isAdmin = userRole === 'captain' || userRole === 'vice_captain';

    return (
        <div style={{ padding: '20px', paddingBottom: '80px', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            {/* 검색 및 글쓰기 */}
            <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="검색어를 입력하세요"
                        style={{
                            flex: 1,
                            padding: '10px 14px',
                            borderRadius: '8px',
                            border: '1px solid #e0e0e0',
                            fontSize: '14px',
                            outline: 'none'
                        }}
                    />
                    <button
                        onClick={handleSearch}
                        style={{
                            padding: '10px 16px',
                            backgroundColor: '#f3f4f6',
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            color: '#1a1a1a'
                        }}
                    >
                        🔍
                    </button>
                </div>
                <button
                    onClick={handleCreatePost}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#1a1a1a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                    }}
                >
                    ✏️ 글쓰기
                </button>
            </div>

            {/* 게시글 목록 */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>로딩 중...</div>
            ) : posts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                    <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>게시글이 없습니다</div>
                    <div style={{ fontSize: '14px' }}>첫 번째 게시글을 작성해보세요!</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {posts.map((post) => {
                        const isHidden = post.isFiltered && !isAdmin;

                        return (
                            <div
                                key={post.id}
                                onClick={() => !isHidden && handlePostClick(post)}
                                style={{
                                    backgroundColor: post.isPinned ? '#fffbeb' : (post.isFiltered ? '#f3f4f6' : '#fff'),
                                    border: post.isPinned ? '1px solid #fcd34d' : '1px solid #e0e0e0',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    cursor: isHidden ? 'default' : 'pointer',
                                    transition: 'all 0.2s',
                                    opacity: isHidden ? 0.7 : 1,
                                    position: 'relative'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                                            {post.isPinned && (
                                                <span style={{
                                                    fontSize: '10px',
                                                    fontWeight: '700',
                                                    color: '#92400e',
                                                    background: '#fef3c7',
                                                    padding: '2px 8px',
                                                    borderRadius: '4px'
                                                }}>
                                                    📌 공지
                                                </span>
                                            )}
                                            {post.isFiltered && (
                                                <span style={{
                                                    fontSize: '10px',
                                                    fontWeight: '700',
                                                    color: '#ef4444',
                                                    background: '#fee2e2',
                                                    padding: '2px 8px',
                                                    borderRadius: '4px'
                                                }}>
                                                    ⚠️ 관리자에 의해 숨겨짐
                                                </span>
                                            )}
                                            <h3 style={{
                                                margin: 0,
                                                fontSize: '16px',
                                                fontWeight: '700',
                                                color: isHidden ? '#9ca3af' : '#1a1a1a',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {isHidden ? '관리자에 의해 숨겨진 게시글입니다.' : post.title}
                                            </h3>
                                        </div>

                                        {!isHidden && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#999' }}>
                                                <span>{post.authorNickname || '익명'}</span>
                                                <span>•</span>
                                                <span>{formatDate(post.createdAt)}</span>
                                                <span>•</span>
                                                <span>👁️ {post.viewCount}</span>
                                                <span>•</span>
                                                <span>💬 {post.commentCount}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Admin Actions */}
                                    {isAdmin && (
                                        <button
                                            onClick={(e) => handleFilterPost(e, post)}
                                            style={{
                                                padding: '4px 8px',
                                                fontSize: '12px',
                                                color: post.isFiltered ? '#10b981' : '#ef4444',
                                                backgroundColor: 'white',
                                                border: `1px solid ${post.isFiltered ? '#10b981' : '#ef4444'}`,
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                marginLeft: '8px'
                                            }}
                                        >
                                            {post.isFiltered ? '숨김 해제' : '숨김'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 페이지네이션 */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
                    <button
                        onClick={() => setPage(Math.max(0, page - 1))}
                        disabled={page === 0}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: page === 0 ? '#f3f4f6' : '#fff',
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px',
                            cursor: page === 0 ? 'not-allowed' : 'pointer',
                            color: '#1a1a1a',
                            fontWeight: '600'
                        }}
                    >
                        이전
                    </button>
                    <span style={{ padding: '8px 16px', color: '#666', fontWeight: '600' }}>
                        {page + 1} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                        disabled={page >= totalPages - 1}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: page >= totalPages - 1 ? '#f3f4f6' : '#fff',
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px',
                            cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                            color: '#1a1a1a',
                            fontWeight: '600'
                        }}
                    >
                        다음
                    </button>
                </div>
            )}
        </div>
    );
}

export default CrewBoardTab;

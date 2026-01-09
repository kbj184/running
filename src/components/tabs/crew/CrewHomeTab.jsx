import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LocationFilter from './LocationFilter';
import { api } from '../../../utils/api';

// CSS for hiding scrollbar
const scrollContainerStyle = `
    .crew-horizontal-scroll::-webkit-scrollbar {
        display: none;
    }
`;

function CrewHomeTab({ allCrews, onRefreshCrews, user }) {
    const navigate = useNavigate();
    const [activeFilter, setActiveFilter] = useState({ level1: null, level2: null });
    const [myCrews, setMyCrews] = useState({ primaryCrew: null, secondaryCrews: [] });
    const [isLoadingMyCrews, setIsLoadingMyCrews] = useState(true);

    // 컴포넌트 마운트 시 크루 목록 로드
    useEffect(() => {
        if (onRefreshCrews) {
            onRefreshCrews(activeFilter);
        }
    }, []); // 빈 배열로 마운트 시 한 번만 실행

    // 내 크루 목록 로드
    useEffect(() => {
        const fetchMyCrews = async () => {
            if (!user || !user.accessToken) {
                setIsLoadingMyCrews(false);
                return;
            }

            setIsLoadingMyCrews(true);
            try {
                const response = await api.request(`${import.meta.env.VITE_API_URL}/crew/my-crews`, {
                    method: 'GET',
                    headers: {
                        'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setMyCrews(data);
                }
            } catch (error) {
                console.error('내 크루 조회 실패:', error);
            } finally {
                setIsLoadingMyCrews(false);
            }
        };

        fetchMyCrews();
    }, [user]);

    const handleFilterChange = (filter) => {
        setActiveFilter(filter);
        if (onRefreshCrews) {
            // 필터 변경 시 크루 목록 새로고침 (API 호출)
            onRefreshCrews(filter);
        }
    };

    const handleCrewClick = (crew) => {
        // CrewTab의 상세 페이지로 이동 (CrewTab이 처리)
        navigate(`/crew/detail/${crew.id}`, { state: { crew } });
    };

    const handleCreateCrew = () => {
        navigate('/crew/create');
    };

    // 내 크루 전체 목록 (대표 + 보조)
    const allMyCrews = [
        ...(myCrews.primaryCrew ? [myCrews.primaryCrew] : []),
        ...myCrews.secondaryCrews
    ];

    // 내 크루가 있는지 확인
    const hasMyCrews = allMyCrews.length > 0;

    return (
        <div style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - var(--header-height) - 60px)', position: 'relative' }}>
            <style>{scrollContainerStyle}</style>
            {/* 내 크루 섹션 - 크루가 있을 때만 표시 */}
            {!isLoadingMyCrews && hasMyCrews && (
                <div style={{
                    padding: '16px 0 24px 0',
                    borderBottom: '8px solid #f0f0f0'
                }}>
                    <div style={{
                        padding: '0 20px',
                        marginBottom: '12px'
                    }}>
                        <h2 style={{
                            fontSize: '18px',
                            fontWeight: '700',
                            color: '#1a1a1a',
                            margin: 0
                        }}>
                            내 크루
                        </h2>
                    </div>

                    {/* 가로 스크롤 크루 목록 */}
                    <div
                        className="crew-horizontal-scroll"
                        style={{
                            display: 'flex',
                            gap: '12px',
                            overflowX: 'auto',
                            padding: '0 20px',
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                            WebkitOverflowScrolling: 'touch'
                        }}>
                        {allMyCrews.map((crew, index) => {
                            let crewImage;
                            try {
                                crewImage = JSON.parse(crew.imageUrl);
                            } catch {
                                crewImage = { url: crew.imageUrl };
                            }

                            const isPrimary = index === 0 && myCrews.primaryCrew;

                            return (
                                <div
                                    key={crew.id}
                                    onClick={() => handleCrewClick({ ...crew, image: crewImage })}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '8px',
                                        minWidth: '80px',
                                        cursor: 'pointer',
                                        position: 'relative'
                                    }}
                                >
                                    <div
                                        style={{
                                            width: '70px',
                                            height: '70px',
                                            borderRadius: '50%',
                                            background: crewImage.bg || '#ddd',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '32px',
                                            flexShrink: 0,
                                            overflow: 'hidden',
                                            border: isPrimary ? '3px solid #fa8231' : 'none',
                                            position: 'relative'
                                        }}
                                    >
                                        {crewImage.url ? (
                                            <img src={crewImage.url} alt={crew.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            crewImage.emoji || '🏃'
                                        )}
                                        {isPrimary && (
                                            <div style={{
                                                position: 'absolute',
                                                bottom: '-2px',
                                                right: '-2px',
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '50%',
                                                backgroundColor: '#fa8231',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '12px',
                                                border: '2px solid #fff'
                                            }}>
                                                🌟
                                            </div>
                                        )}
                                    </div>
                                    <div style={{
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        color: '#1a1a1a',
                                        textAlign: 'center',
                                        maxWidth: '80px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {crew.name}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 지역별 크루 섹션 */}
            <div style={{ padding: '16px 20px 20px 20px' }}>
                <h2 style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#1a1a1a',
                    marginBottom: '16px',
                    marginTop: '8px'
                }}>
                    지역별 크루
                </h2>

                {/* 지역 필터 */}
                <LocationFilter
                    onFilterChange={handleFilterChange}
                    activeFilter={activeFilter}
                    user={user}
                />

                {/* 크루 목록 */}
                {allCrews.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#666', marginTop: '16px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
                        <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                            {activeFilter.level1 ? '해당 지역에 크루가 없습니다' : '아직 생성된 크루가 없습니다'}
                        </p>
                        <p style={{ fontSize: '14px' }}>
                            {activeFilter.level1 ? '다른 지역을 선택하거나\n' : ''}
                            크루 만들기 탭에서 새로운 크루를 만들어보세요!
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                        {allCrews.map((crew) => {
                            let crewImage;
                            try {
                                crewImage = JSON.parse(crew.imageUrl);
                            } catch {
                                crewImage = { url: crew.imageUrl };
                            }

                            return (
                                <div
                                    key={crew.id}
                                    onClick={() => handleCrewClick({ ...crew, image: crewImage })}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px',
                                        padding: '16px',
                                        backgroundColor: '#fff',
                                        borderRadius: '16px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
                                    }}
                                >
                                    <div
                                        style={{
                                            width: '70px',
                                            height: '70px',
                                            borderRadius: '16px',
                                            background: crewImage.bg || '#ddd',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '36px',
                                            flexShrink: 0,
                                            overflow: 'hidden'
                                        }}
                                    >
                                        {crewImage.url ? (
                                            <img src={crewImage.url} alt={crew.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            crewImage.emoji
                                        )}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h3 style={{
                                            margin: 0,
                                            fontSize: '17px',
                                            fontWeight: '700',
                                            color: '#1a1a1a',
                                            marginBottom: '8px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {crew.name}
                                        </h3>

                                        {/* 크루 메타 정보 */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                            <span style={{
                                                fontSize: '13px',
                                                color: '#666',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}>
                                                <span>👥</span>
                                                <span>{crew.memberCount || 0}명</span>
                                            </span>

                                            {crew.totalDistance !== undefined && crew.totalDistance > 0 && (
                                                <>
                                                    <span style={{ color: '#ddd' }}>•</span>
                                                    <span style={{
                                                        fontSize: '13px',
                                                        color: '#666',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}>
                                                        <span>🏃</span>
                                                        <span>{crew.totalDistance.toFixed(1)}km</span>
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '20px', color: '#ddd', flexShrink: 0 }}>›</div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 플로팅 액션 버튼 - 크루 만들기 */}
            <button
                onClick={handleCreateCrew}
                style={{
                    position: 'fixed',
                    bottom: '80px',
                    right: '20px',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    color: '#fff',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    fontWeight: '700',
                    transition: 'all 0.2s',
                    zIndex: 100
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.5)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
                }}
            >
                +
            </button>
        </div>
    );
}

export default CrewHomeTab;

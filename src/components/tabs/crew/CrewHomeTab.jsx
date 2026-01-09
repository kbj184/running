import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import LocationFilter from './LocationFilter';
import { api } from '../../../utils/api';

// CSS for hiding scrollbar
const scrollContainerStyle = `
    .crew-horizontal-scroll::-webkit-scrollbar {
        display: none;
    }
`;

// 거리 계산 함수 (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // 지구 반지름 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
}

// 거리 포맷 함수
function formatDistance(distanceKm) {
    if (distanceKm < 1) {
        return `${Math.round(distanceKm * 1000)}m`;
    }
    return `${distanceKm.toFixed(1)}km`;
}

function CrewHomeTab({ allCrews, onRefreshCrews, user }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();

    // URL에서 탭과 필터 정보 읽기
    const tabFromUrl = searchParams.get('tab') || 'neighborhood';
    const level1FromUrl = searchParams.get('level1') || null;
    const level2FromUrl = searchParams.get('level2') || null;

    const [activeTab, setActiveTab] = useState(tabFromUrl);
    const [myCrews, setMyCrews] = useState({ primaryCrew: null, secondaryCrews: [] });
    const [isLoadingMyCrews, setIsLoadingMyCrews] = useState(true);
    const [userActivityArea, setUserActivityArea] = useState(null);
    const [activeFilter, setActiveFilter] = useState({
        level1: level1FromUrl,
        level2: level2FromUrl
    });

    // URL 파라미터 변경 시 상태 동기화
    useEffect(() => {
        const newTab = searchParams.get('tab') || 'neighborhood';
        const newLevel1 = searchParams.get('level1') || null;
        const newLevel2 = searchParams.get('level2') || null;

        setActiveTab(newTab);
        setActiveFilter({ level1: newLevel1, level2: newLevel2 });
    }, [searchParams]);

    // 스크롤 위치 복원
    useEffect(() => {
        const savedScrollPosition = sessionStorage.getItem('crewHomeScrollPosition');
        if (savedScrollPosition) {
            // 약간의 지연을 주어 DOM이 완전히 렌더링된 후 스크롤
            setTimeout(() => {
                window.scrollTo(0, parseInt(savedScrollPosition, 10));
                sessionStorage.removeItem('crewHomeScrollPosition');
            }, 100);
        }
    }, []);

    // 스크롤 위치 저장 (크루 클릭 시)
    const saveScrollPosition = () => {
        sessionStorage.setItem('crewHomeScrollPosition', window.scrollY.toString());
    };

    // 사용자 활동 지역 가져오기
    useEffect(() => {
        const fetchUserActivityArea = async () => {
            if (!user || !user.accessToken) return;

            try {
                const response = await api.request(`${import.meta.env.VITE_API_URL}/user/activity-area`, {
                    method: 'GET',
                    headers: {
                        'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setUserActivityArea(data);
                }
            } catch (error) {
                console.error('활동 지역 조회 실패:', error);
            }
        };

        fetchUserActivityArea();
    }, [user]);

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
        // URL 파라미터 업데이트
        const params = new URLSearchParams(searchParams);
        params.set('tab', activeTab);

        if (filter.level1) {
            params.set('level1', filter.level1);
        } else {
            params.delete('level1');
        }

        if (filter.level2) {
            params.set('level2', filter.level2);
        } else {
            params.delete('level2');
        }

        setSearchParams(params);

        if (onRefreshCrews) {
            // 필터 변경 시 크루 목록 새로고침 (API 호출)
            onRefreshCrews(filter);
        }
    };

    const handleCrewClick = (crew) => {
        // 스크롤 위치 저장
        saveScrollPosition();
        // CrewTab의 상세 페이지로 이동 (CrewTab이 처리)
        navigate(`/crew/detail/${crew.id}`, { state: { crew } });
    };

    const handleCreateCrew = () => {
        navigate('/crew/create');
    };

    const handleTabChange = (tab) => {
        // URL 파라미터 업데이트
        const params = new URLSearchParams();
        params.set('tab', tab);

        // 지역별크루가 아니면 필터 초기화
        if (tab !== 'regional') {
            params.delete('level1');
            params.delete('level2');
        } else if (activeFilter.level1) {
            params.set('level1', activeFilter.level1);
            if (activeFilter.level2) {
                params.set('level2', activeFilter.level2);
            }
        }

        setSearchParams(params);
    };

    // 내 크루 전체 목록 (대표 + 보조)
    const allMyCrews = [
        ...(myCrews.primaryCrew ? [myCrews.primaryCrew] : []),
        ...myCrews.secondaryCrews
    ];

    // 내 크루가 있는지 확인
    const hasMyCrews = allMyCrews.length > 0;

    // 탭별 크루 필터링
    const getFilteredCrews = () => {
        if (!allCrews || allCrews.length === 0) return [];

        switch (activeTab) {
            case 'neighborhood':
                // 동네크루: 내 활동지역 admin_level_2와 크루 활동지역 admin_level_2가 같은 것
                if (!userActivityArea || !userActivityArea.adminLevel2) return [];
                return allCrews
                    .filter(crew => {
                        // 크루의 활동 지역 중 하나라도 내 활동지역의 admin_level_2와 일치하면
                        return crew.activityAreas && crew.activityAreas.some(area =>
                            area.adminLevel2 === userActivityArea.adminLevel2
                        );
                    })
                    .sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0));

            case 'popular':
                // 인기크루: 회원수 top 20
                return [...allCrews]
                    .sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0))
                    .slice(0, 20);

            case 'regional':
                // 지역별 크루: 현재 필터링된 크루 목록
                return allCrews;

            default:
                return allCrews;
        }
    };

    const filteredCrews = getFilteredCrews();

    // 크루와 사용자 간 거리 계산
    const getCrewDistance = (crew) => {
        if (!userActivityArea || !userActivityArea.latitude || !userActivityArea.longitude) {
            return null;
        }

        if (!crew.activityAreas || crew.activityAreas.length === 0) {
            return null;
        }

        // 크루의 첫 번째 활동 지역과의 거리 계산
        const crewArea = crew.activityAreas[0];
        if (!crewArea.latitude || !crewArea.longitude) {
            return null;
        }

        const distance = calculateDistance(
            userActivityArea.latitude,
            userActivityArea.longitude,
            crewArea.latitude,
            crewArea.longitude
        );

        return distance;
    };

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

            {/* 크루 탭 메뉴 */}
            <div style={{ padding: '16px 20px 0 20px' }}>
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '16px'
                }}>
                    <button
                        onClick={() => handleTabChange('neighborhood')}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '20px',
                            border: 'none',
                            backgroundColor: activeTab === 'neighborhood' ? '#1a1a1a' : '#fff',
                            color: activeTab === 'neighborhood' ? '#fff' : '#666',
                            fontWeight: '600',
                            fontSize: '14px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: activeTab === 'neighborhood' ? '0 2px 8px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.08)'
                        }}
                    >
                        동네크루
                    </button>
                    <button
                        onClick={() => handleTabChange('popular')}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '20px',
                            border: 'none',
                            backgroundColor: activeTab === 'popular' ? '#1a1a1a' : '#fff',
                            color: activeTab === 'popular' ? '#fff' : '#666',
                            fontWeight: '600',
                            fontSize: '14px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: activeTab === 'popular' ? '0 2px 8px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.08)'
                        }}
                    >
                        인기크루
                    </button>
                    <button
                        onClick={() => handleTabChange('regional')}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '20px',
                            border: 'none',
                            backgroundColor: activeTab === 'regional' ? '#1a1a1a' : '#fff',
                            color: activeTab === 'regional' ? '#fff' : '#666',
                            fontWeight: '600',
                            fontSize: '14px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: activeTab === 'regional' ? '0 2px 8px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.08)'
                        }}
                    >
                        지역별크루
                    </button>
                </div>

                {/* 지역별크루 탭일 때만 지역 필터 표시 */}
                {activeTab === 'regional' && (
                    <div style={{ marginBottom: '16px' }}>
                        <LocationFilter
                            onFilterChange={handleFilterChange}
                            activeFilter={activeFilter}
                            user={user}
                        />
                    </div>
                )}

                {/* 크루 목록 */}
                {filteredCrews.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#666', marginTop: '16px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
                        <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                            {activeTab === 'neighborhood' ? '동네에 크루가 없습니다' : '크루가 없습니다'}
                        </p>
                        <p style={{ fontSize: '14px' }}>
                            크루 만들기 버튼을 눌러 새로운 크루를 만들어보세요!
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {filteredCrews.map((crew) => {
                            let crewImage;
                            try {
                                crewImage = JSON.parse(crew.imageUrl);
                            } catch {
                                crewImage = { url: crew.imageUrl };
                            }

                            const distance = getCrewDistance(crew);
                            const crewLocation = crew.activityAreas && crew.activityAreas[0]
                                ? crew.activityAreas[0].adminLevel2 || crew.activityAreas[0].adminLevel1
                                : '';

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

                                            {/* 크루 지역 표시 */}
                                            {crewLocation && (
                                                <>
                                                    <span style={{ color: '#ddd' }}>•</span>
                                                    <span style={{
                                                        fontSize: '13px',
                                                        color: '#666',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}>
                                                        <span>📍</span>
                                                        <span>{crewLocation}</span>
                                                    </span>
                                                </>
                                            )}

                                            {/* 거리 표시 */}
                                            {distance !== null && (
                                                <>
                                                    <span style={{ color: '#ddd' }}>•</span>
                                                    <span style={{
                                                        fontSize: '13px',
                                                        color: '#666',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}>
                                                        <span>🚶</span>
                                                        <span>{formatDistance(distance)}</span>
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

import React, { useState, useEffect } from 'react';
import LocationFilter from './LocationFilter';
import CrewSubHeader from '../../layout/CrewSubHeader';


function CrewHomeTab({ allCrews, onCrewClick, onRefreshCrews, user }) {
    const [activeFilter, setActiveFilter] = useState({ level1: null, level2: null });

    // 컴포넌트 마운트 시 크루 목록 로드
    useEffect(() => {
        if (onRefreshCrews) {
            onRefreshCrews(activeFilter);
        }
    }, []); // 빈 배열로 마운트 시 한 번만 실행

    const handleFilterChange = (filter) => {
        setActiveFilter(filter);
        if (onRefreshCrews) {
            // 필터 변경 시 크루 목록 새로고침 (API 호출)
            onRefreshCrews(filter);
        }
    };

    return (
        <div>
            {/* CrewSubHeader 추가 */}
            <CrewSubHeader />

            <div style={{ padding: '8px 20px 20px 20px', backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - var(--header-height) - 60px)' }}>
                {/* 지역 필터 추가 */}
                <LocationFilter
                    onFilterChange={handleFilterChange}
                    activeFilter={activeFilter}
                    user={user}
                />

                {/* 크루 홈 섹션 헤더 */}
                <h2 style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#1a1a1a',
                    marginBottom: '16px',
                    marginTop: '24px'
                }}>
                    크루 홈
                </h2>

                {allCrews.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                                    onClick={() => onCrewClick({ ...crew, image: crewImage })}
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
        </div>
    );
}

export default CrewHomeTab;

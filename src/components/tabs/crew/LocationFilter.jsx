import React, { useState, useEffect } from 'react';

// 대한민국 주요 행정 구역 데이터 (예시)
const KOREA_ADMIN_AREAS = {
    '서울특별시': {
        districts: ['강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구']
    },
    '부산광역시': {
        districts: ['강서구', '금정구', '기장군', '남구', '동구', '동래구', '부산진구', '북구', '사상구', '사하구', '서구', '수영구', '연제구', '영도구', '중구', '해운대구']
    },
    '대구광역시': {
        districts: ['군위군', '남구', '달서구', '달성군', '동구', '북구', '서구', '수성구', '중구']
    },
    '인천광역시': {
        districts: ['강화군', '계양구', '남동구', '동구', '미추홀구', '부평구', '서구', '연수구', '옹진군', '중구']
    },
    '광주광역시': {
        districts: ['광산구', '남구', '동구', '북구', '서구']
    },
    '대전광역시': {
        districts: ['대덕구', '동구', '서구', '유성구', '중구']
    },
    '울산광역시': {
        districts: ['남구', '동구', '북구', '울주군', '중구']
    },
    '세종특별자치시': { districts: [] },
    '경기도': {
        districts: ['가평군', '고양시', '과천시', '광명시', '광주시', '구리시', '군포시', '김포시', '남양주시', '동두천시', '부천시', '성남시', '수원시', '시흥시', '안산시', '안성시', '안양시', '양주시', '양평군', '여주시', '연천군', '오산시', '용인시', '의왕시', '의정부시', '이천시', '파주시', '평택시', '포천시', '하남시', '화성시']
    },
    '강원특별자치도': {
        districts: ['강릉시', '고성군', '동해시', '삼척시', '속초시', '양구군', '양양군', '영월군', '원주시', '인제군', '정선군', '철원군', '춘천시', '태백시', '평창군', '홍천군', '화천군', '횡성군']
    },
    // 나머지 도 제외 (필요시 추가)
};

function LocationFilter({ onFilterChange, activeFilter }) {
    const [level1, setLevel1] = useState(activeFilter?.level1 || null); // 시/도
    const [level2, setLevel2] = useState(activeFilter?.level2 || null); // 시/군/구
    const [showFilters, setShowFilters] = useState(false);

    // 필터 변경 핸들러
    const handleLevel1Click = (area) => {
        if (level1 === area) {
            // 이미 선택된 지역 클릭 시 해제 (전국으로)
            setLevel1(null);
            setLevel2(null);
            onFilterChange({ level1: null, level2: null });
        } else {
            setLevel1(area);
            setLevel2(null); // 상위 지역 변경 시 하위 지역 초기화
            onFilterChange({ level1: area, level2: null });
        }
    };

    const handleLevel2Click = (district) => {
        if (level2 === district) {
            setLevel2(null);
            onFilterChange({ level1, level2: null });
        } else {
            setLevel2(district);
            onFilterChange({ level1, level2: district });
        }
    };

    const handleReset = () => {
        setLevel1(null);
        setLevel2(null);
        onFilterChange({ level1: null, level2: null });
        setShowFilters(false);
    };

    // 현재 선택된 필터 텍스트 생성
    const getFilterText = () => {
        if (!level1) return '전국';
        if (!level2) return level1;
        return `${level1} > ${level2}`;
    };

    return (
        <div className="location-filter">
            {/* 필터 헤더 (선택된 지역 표시 & 토글) */}
            <div
                onClick={() => setShowFilters(!showFilters)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    marginBottom: '10px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    border: showFilters ? '1px solid #4318FF' : '1px solid transparent'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>📍</span>
                    <span style={{ fontWeight: '600', color: level1 ? '#4318FF' : '#1a1a1a' }}>
                        {getFilterText()}
                    </span>
                </div>
                <span style={{
                    fontSize: '12px',
                    color: '#888',
                    transform: showFilters ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                }}>▼</span>
            </div>

            {/* 필터 옵션 영역 */}
            {showFilters && (
                <div style={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    padding: '16px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    marginBottom: '16px',
                    animation: 'slideDown 0.2s ease-out'
                }}>
                    <style>{`
                        @keyframes slideDown {
                            from { opacity: 0; transform: translateY(-10px); }
                            to { opacity: 1; transform: translateY(0); }
                        }
                    `}</style>

                    {/* 상단: 초기화 버튼 */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                        <button
                            onClick={handleReset}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#888',
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                        >
                            <span>↺</span> 초기화
                        </button>
                    </div>

                    {/* Level 1: 시/도 선택 */}
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>시 / 도</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {Object.keys(KOREA_ADMIN_AREAS).map(area => (
                                <button
                                    key={area}
                                    onClick={() => handleLevel1Click(area)}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '20px',
                                        border: level1 === area ? '1px solid #4318FF' : '1px solid #eee',
                                        backgroundColor: level1 === area ? '#4318FF' : '#f8f9fa',
                                        color: level1 === area ? '#fff' : '#666',
                                        fontSize: '13px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {area}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Level 2: 시/군/구 선택 (Level 1 선택 시 표시) */}
                    {level1 && KOREA_ADMIN_AREAS[level1] && KOREA_ADMIN_AREAS[level1].districts.length > 0 && (
                        <div style={{ borderTop: '1px solid #eee', paddingTop: '16px' }}>
                            <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>시 / 군 / 구</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {KOREA_ADMIN_AREAS[level1].districts.map(district => (
                                    <button
                                        key={district}
                                        onClick={() => handleLevel2Click(district)}
                                        style={{
                                            padding: '6px 12px',
                                            borderRadius: '20px',
                                            border: level2 === district ? '1px solid #4318FF' : '1px solid #eee',
                                            backgroundColor: level2 === district ? '#e0e7ff' : '#f8f9fa',
                                            color: level2 === district ? '#4318FF' : '#666',
                                            fontSize: '13px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {district}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default LocationFilter;

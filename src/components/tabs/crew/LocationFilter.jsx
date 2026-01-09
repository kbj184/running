import React, { useState, useEffect, useRef } from 'react';

// 대한민국 행정구역 모의 데이터
// 실제로는 백엔드에서 가져오거나 더 완전한 데이터셋이 필요함
const KOREA_ADMIN_DIVISIONS = [
    {
        name: '서울특별시',
        subDivisions: ['강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구']
    },
    {
        name: '경기도',
        subDivisions: ['수원시', '성남시', '의정부시', '안양시', '부천시', '광명시', '평택시', '동두천시', '안산시', '고양시', '과천시', '구리시', '남양주시', '오산시', '시흥시', '군포시', '의왕시', '하남시', '용인시', '파주시', '이천시', '안성시', '김포시', '화성시', '광주시', '양주시', '포천시', '여주시', '연천군', '가평군', '양평군']
    },
    {
        name: '부산광역시',
        subDivisions: ['중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구', '북구', '해운대구', '사하구', '금정구', '강서구', '연제구', '수영구', '사상구', '기장군']
    },
    { name: '대구광역시', subDivisions: ['중구', '동구', '서구', '남구', '북구', '수성구', '달서구', '달성군', '군위군'] },
    { name: '인천광역시', subDivisions: ['중구', '동구', '미추홀구', '연수구', '남동구', '부평구', '계양구', '서구', '강화군', '옹진군'] },
    { name: '광주광역시', subDivisions: ['동구', '서구', '남구', '북구', '광산구'] },
    { name: '대전광역시', subDivisions: ['동구', '중구', '서구', '유성구', '대덕구'] },
    { name: '울산광역시', subDivisions: ['중구', '남구', '동구', '북구', '울주군'] },
    { name: '세종특별자치시', subDivisions: ['세종시'] },
    { name: '강원특별자치도', subDivisions: ['춘천시', '원주시', '강릉시', '동해시', '태백시', '속초시', '삼척시', '홍천군', '횡성군', '영월군', '평창군', '정선군', '철원군', '화천군', '양구군', '인제군', '고성군', '양양군'] },
    { name: '충청북도', subDivisions: ['청주시', '충주시', '제천시', '보은군', '옥천군', '영동군', '증평군', '진천군', '괴산군', '음성군', '단양군'] },
    { name: '충청남도', subDivisions: ['천안시', '공주시', '보령시', '아산시', '서산시', '논산시', '계룡시', '당진시', '금산군', '부여군', '서천군', '청양군', '홍성군', '예산군', '태안군'] },
    { name: '전북특별자치도', subDivisions: ['전주시', '군산시', '익산시', '정읍시', '남원시', '김제시', '완주군', '진안군', '무주군', '장수군', '임실군', '순창군', '고창군', '부안군'] },
    { name: '전라남도', subDivisions: ['목포시', '여수시', '순천시', '나주시', '광양시', '담양군', '곡성군', '구례군', '고흥군', '보성군', '화순군', '장흥군', '강진군', '해남군', '영암군', '무안군', '함평군', '영광군', '장성군', '완도군', '진도군', '신안군'] },
    { name: '경상북도', subDivisions: ['포항시', '경주시', '김천시', '안동시', '구미시', '영주시', '영천시', '상주시', '문경시', '경산시', '의성군', '청송군', '영양군', '영덕군', '청도군', '고령군', '성주군', '칠곡군', '예천군', '봉화군', '울진군', '울릉군'] },
    { name: '경상남도', subDivisions: ['창원시', '진주시', '통영시', '사천시', '김해시', '밀양시', '거제시', '양산시', '의령군', '함안군', '창녕군', '고성군', '남해군', '하동군', '산청군', '함양군', '거창군', '합천군'] },
    { name: '제주특별자치도', subDivisions: ['제주시', '서귀포시'] }
];

function LocationFilter({ onFilterChange, activeFilter, user }) {
    const [initialized, setInitialized] = useState(false);
    const level1ScrollRef = useRef(null);
    const level2ScrollRef = useRef(null);

    // 유저 정보로 초기 필터 설정 (최초 1회만)
    useEffect(() => {
        if (!initialized && user && user.activityAreas && user.activityAreas.length > 0) {
            const userArea = user.activityAreas[0];
            const initialFilter = {
                level1: userArea.adminLevel1,
                level2: userArea.adminLevel2
            };
            // 초기 변경은 부모에게 알리기보다, UI 초기 상태만 설정하는 게 좋을 수 있으나
            // onFilterChange를 호출해야 CrewList가 필터링되므로 호출함.
            // 단, 무한 루프 방지를 위해 activeFilter와 다를 때만 호출하거나 체크 필요.
            // 여기서는 `initialized` 플래그로 1회만 실행.
            onFilterChange(initialFilter);
            setInitialized(true);
        } else if (!initialized && user) {
            // 유저 정보는 있는데 지역 정보가 없으면 그냥 초기화 완료 처리
            setInitialized(true);
        }
    }, [user, initialized, onFilterChange]);

    // 스크롤 위치 복원
    useEffect(() => {
        const savedLevel1Scroll = sessionStorage.getItem('locationFilterLevel1Scroll');
        const savedLevel2Scroll = sessionStorage.getItem('locationFilterLevel2Scroll');

        if (savedLevel1Scroll && level1ScrollRef.current) {
            setTimeout(() => {
                level1ScrollRef.current.scrollLeft = parseInt(savedLevel1Scroll, 10);
                sessionStorage.removeItem('locationFilterLevel1Scroll');
            }, 100);
        }

        if (savedLevel2Scroll && level2ScrollRef.current) {
            setTimeout(() => {
                level2ScrollRef.current.scrollLeft = parseInt(savedLevel2Scroll, 10);
                sessionStorage.removeItem('locationFilterLevel2Scroll');
            }, 100);
        }
    }, [activeFilter]);

    const handleLevel1Click = (level1) => {
        if (activeFilter.level1 === level1) return; // 이미 선택됨

        // 스크롤 위치 저장
        if (level1ScrollRef.current) {
            sessionStorage.setItem('locationFilterLevel1Scroll', level1ScrollRef.current.scrollLeft.toString());
        }

        onFilterChange({ level1: level1, level2: null });
    };

    const handleLevel2Click = (level2) => {
        // 스크롤 위치 저장
        if (level1ScrollRef.current) {
            sessionStorage.setItem('locationFilterLevel1Scroll', level1ScrollRef.current.scrollLeft.toString());
        }
        if (level2ScrollRef.current) {
            sessionStorage.setItem('locationFilterLevel2Scroll', level2ScrollRef.current.scrollLeft.toString());
        }

        onFilterChange({ ...activeFilter, level2: level2 });
    };

    const handleReset = () => {
        onFilterChange({ level1: null, level2: null });
    };

    // 현재 선택된 시/도의 하위 행정구역 목록 가져오기
    const getSubDivisions = () => {
        if (!activeFilter.level1) return [];
        const division = KOREA_ADMIN_DIVISIONS.find(d => d.name === activeFilter.level1);
        return division ? division.subDivisions : [];
    };

    return (
        <div style={{ marginBottom: '8px' }}>
            {/* Horizontal scrollable pill filters */}
            <div
                ref={level1ScrollRef}
                style={{
                    display: 'flex',
                    gap: '8px',
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    paddingBottom: '4px',
                    scrollbarWidth: 'none', // Firefox
                    msOverflowStyle: 'none', // IE/Edge
                    WebkitOverflowScrolling: 'touch'
                }}
                className="location-filter-scroll"
            >
                {/* 전국 버튼 */}
                <button
                    onClick={handleReset}
                    style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: 'none',
                        backgroundColor: !activeFilter.level1 ? '#1a1a1a' : '#f0f0f0',
                        color: !activeFilter.level1 ? '#fff' : '#666',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                    }}
                >
                    전국
                </button>

                {/* 시/도 목록 */}
                {KOREA_ADMIN_DIVISIONS.map((division) => (
                    <button
                        key={division.name}
                        onClick={() => handleLevel1Click(division.name)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            border: 'none',
                            backgroundColor: activeFilter.level1 === division.name ? '#1a1a1a' : '#f0f0f0',
                            color: activeFilter.level1 === division.name ? '#fff' : '#666',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                        }}
                    >
                        {division.name}
                    </button>
                ))}
            </div>

            {/* 시/군/구 필터 (level1이 선택되었을 때만 표시) */}
            {activeFilter.level1 && getSubDivisions().length > 0 && (
                <div
                    ref={level2ScrollRef}
                    style={{
                        display: 'flex',
                        gap: '8px',
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        paddingBottom: '4px',
                        marginTop: '8px',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        WebkitOverflowScrolling: 'touch'
                    }}
                    className="location-filter-scroll"
                >
                    {getSubDivisions().map((subDivision) => (
                        <button
                            key={subDivision}
                            onClick={() => handleLevel2Click(subDivision)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '20px',
                                border: 'none',
                                backgroundColor: activeFilter.level2 === subDivision ? '#1a1a1a' : '#f0f0f0',
                                color: activeFilter.level2 === subDivision ? '#fff' : '#666',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                whiteSpace: 'nowrap',
                                flexShrink: 0
                            }}
                        >
                            {subDivision}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default LocationFilter;

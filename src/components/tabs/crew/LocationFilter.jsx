import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../../utils/api';

function LocationFilter({ onFilterChange, activeFilter, user }) {
    const [initialized, setInitialized] = useState(false);
    const level1ScrollRef = useRef(null);
    const level2ScrollRef = useRef(null);

    // 백엔드에서 가져온 지역 데이터
    const [countries, setCountries] = useState([]);
    const [countryRegions, setCountryRegions] = useState({});
    const [regionSubRegions, setRegionSubRegions] = useState({});
    const [selectedCountry, setSelectedCountry] = useState('대한민국'); // 기본값

    // 백엔드에서 지역 데이터 가져오기
    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const response = await api.request(`${import.meta.env.VITE_API_URL}/crew/locations`, {
                    method: 'GET'
                });

                if (response.ok) {
                    const data = await response.json();
                    setCountries(data.countries || []);
                    setCountryRegions(data.countryRegions || {});
                    setRegionSubRegions(data.regionSubRegions || {});
                }
            } catch (error) {
                console.error('Failed to fetch locations:', error);
            }
        };

        fetchLocations();
    }, []); // 컴포넌트 마운트 시 1회만 실행

    // 사용자의 국가 설정
    useEffect(() => {
        if (user && user.activityAreas && user.activityAreas.length > 0 && countries.length > 0) {
            const userCountry = user.activityAreas[0].countryName;
            if (userCountry && countries.includes(userCountry)) {
                setSelectedCountry(userCountry);
            }
        }
    }, [user, countries]); // user와 countries가 변경될 때만 실행

    // 유저 정보로 초기 필터 설정 (최초 1회만)
    useEffect(() => {
        if (!initialized && user && user.activityAreas && user.activityAreas.length > 0) {
            const userArea = user.activityAreas[0];
            const initialFilter = {
                country: userArea.countryName,
                level1: userArea.adminLevel1,
                level2: userArea.adminLevel2
            };
            onFilterChange(initialFilter);
            setInitialized(true);

            if (userArea.countryName) {
                setSelectedCountry(userArea.countryName);
            }
        } else if (!initialized && user) {
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

    const handleCountryChange = (country) => {
        setSelectedCountry(country);
        onFilterChange({ country: country, level1: null, level2: null });
    };

    const handleLevel1Click = (level1) => {
        if (activeFilter.level1 === level1) return;

        if (level1ScrollRef.current) {
            sessionStorage.setItem('locationFilterLevel1Scroll', level1ScrollRef.current.scrollLeft.toString());
        }

        onFilterChange({ country: selectedCountry, level1: level1, level2: null });
    };

    const handleLevel2Click = (level2) => {
        if (level1ScrollRef.current) {
            sessionStorage.setItem('locationFilterLevel1Scroll', level1ScrollRef.current.scrollLeft.toString());
        }
        if (level2ScrollRef.current) {
            sessionStorage.setItem('locationFilterLevel2Scroll', level2ScrollRef.current.scrollLeft.toString());
        }

        onFilterChange({ country: selectedCountry, level1: activeFilter.level1, level2: level2 });
    };

    const handleReset = () => {
        onFilterChange({ country: null, level1: null, level2: null });
        setSelectedCountry('대한민국');
    };

    // 현재 선택된 국가의 지역 목록 가져오기
    const getLevel1Regions = () => {
        if (!selectedCountry || !countryRegions[selectedCountry]) return [];
        return Array.from(countryRegions[selectedCountry]);
    };

    // 현재 선택된 시/도의 하위 행정구역 목록 가져오기
    const getSubDivisions = () => {
        if (!activeFilter.level1) return [];
        if (!regionSubRegions[activeFilter.level1]) return [];
        return Array.from(regionSubRegions[activeFilter.level1]);
    };

    return (
        <div style={{ marginBottom: '8px' }}>
            {/* Horizontal scrollable pill filters */}
            {/* 국가 필터 */}
            {countries.length > 1 && ( // Only show if there's more than one country option
                <div
                    style={{
                        display: 'flex',
                        gap: '8px',
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        paddingBottom: '4px',
                        scrollbarWidth: 'none', // Firefox
                        msOverflowStyle: 'none', // IE/Edge
                        WebkitOverflowScrolling: 'touch',
                        marginBottom: '8px'
                    }}
                    className="location-filter-scroll"
                >
                    {countries.map((country) => (
                        <button
                            key={country}
                            onClick={() => handleCountryChange(country)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '20px',
                                border: 'none',
                                backgroundColor: selectedCountry === country ? '#1a1a1a' : '#f0f0f0',
                                color: selectedCountry === country ? '#fff' : '#666',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                whiteSpace: 'nowrap',
                                flexShrink: 0
                            }}
                        >
                            {country}
                        </button>
                    ))}
                </div>
            )}

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
                {getLevel1Regions().map((region) => (
                    <button
                        key={region}
                        onClick={() => handleLevel1Click(region)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            border: 'none',
                            backgroundColor: activeFilter.level1 === region ? '#1a1a1a' : '#f0f0f0',
                            color: activeFilter.level1 === region ? '#fff' : '#666',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                        }}
                    >
                        {region}
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

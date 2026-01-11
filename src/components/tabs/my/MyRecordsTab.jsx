import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { formatTime } from '../../../utils/gps';
import { formatDistance as formatDistanceUtil, formatPace } from '../../../utils/unitConverter';
import { useUnit } from '../../../contexts/UnitContext';
import { api } from '../../../utils/api';
import RecentRecords from '../../common/RecentRecords';

function MyRecordsTab({ user, onRecordClick }) {
    const { t } = useTranslation();
    const { unit } = useUnit();
    const [records, setRecords] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedPeriod, setSelectedPeriod] = useState({ type: 'month', year: new Date().getFullYear(), month: new Date().getMonth() + 1 });
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const [activeSubTab, setActiveSubTab] = useState('recent'); // recent, cumulative, monthly, weekly, daily
    const [showAllRecords, setShowAllRecords] = useState(false);
    const [displayCount, setDisplayCount] = useState(10);
    const loadMoreRef = useRef(null);

    // 각 탭별 무한 스크롤 상태
    const [cumulativeShowAll, setCumulativeShowAll] = useState(false);
    const [cumulativeDisplayCount, setCumulativeDisplayCount] = useState(10);
    const cumulativeLoadMoreRef = useRef(null);

    const [monthlyShowAll, setMonthlyShowAll] = useState(false);
    const [monthlyDisplayCount, setMonthlyDisplayCount] = useState(10);
    const monthlyLoadMoreRef = useRef(null);

    const [weeklyShowAll, setWeeklyShowAll] = useState(false);
    const [weeklyDisplayCount, setWeeklyDisplayCount] = useState(10);
    const weeklyLoadMoreRef = useRef(null);

    useEffect(() => {
        if (user && user.id) {
            loadRecords();
        }
    }, [user]);

    const handleRefresh = useCallback(() => {
        setRefreshKey(prev => prev + 1);
    }, []);

    const loadRecords = async () => {
        setLoading(true);
        try {
            const response = await api.request(`${import.meta.env.VITE_API_URL}/api/running/sessions/completed?userId=${user.id}`, {
                method: 'GET',
                headers: {
                    'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
                }
            });

            if (response.ok) {
                let sessions = await response.json();

                if (!Array.isArray(sessions)) {
                    sessions = [];
                }

                sessions = sessions.map(session => {
                    try {
                        return {
                            ...session,
                            route: session.route ? JSON.parse(session.route) : [],
                            splits: session.splits ? JSON.parse(session.splits) : [],
                            wateringSegments: session.wateringSegments ? JSON.parse(session.wateringSegments) : []
                        };
                    } catch (e) {
                        return {
                            ...session,
                            route: [],
                            splits: [],
                            wateringSegments: []
                        };
                    }
                });

                setRecords(sessions);

                // 마지막 런닝 날짜 자동 선택
                if (sessions.length > 0 && !selectedDate) {
                    const latestRecord = sessions[0];
                    const latestDate = new Date(latestRecord.timestamp);
                    setSelectedDate(latestDate);
                    setCurrentDate(latestDate);
                }
            }
        } catch (err) {
            console.error('기록 로딩 실패:', err);
        } finally {
            setLoading(false);
        }
    };

    // 무한 스크롤 핸들러
    const handleLoadMore = () => {
        setDisplayCount(prev => prev + 10);
    };

    // Intersection Observer for infinite scroll
    useEffect(() => {
        if (!showAllRecords) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && displayCount < records.length) {
                    handleLoadMore();
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => {
            if (loadMoreRef.current) {
                observer.unobserve(loadMoreRef.current);
            }
        };
    }, [showAllRecords, displayCount, records.length]);

    // Intersection Observer for cumulative tab
    useEffect(() => {
        if (!cumulativeShowAll || activeSubTab !== 'cumulative') return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && cumulativeDisplayCount < yearlyStats.length) {
                    setCumulativeDisplayCount(prev => prev + 10);
                }
            },
            { threshold: 0.1 }
        );

        if (cumulativeLoadMoreRef.current) {
            observer.observe(cumulativeLoadMoreRef.current);
        }

        return () => {
            if (cumulativeLoadMoreRef.current) {
                observer.unobserve(cumulativeLoadMoreRef.current);
            }
        };
    }, [cumulativeShowAll, cumulativeDisplayCount, yearlyStats.length, activeSubTab]);

    // Intersection Observer for monthly tab
    useEffect(() => {
        if (!monthlyShowAll || activeSubTab !== 'monthly') return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && monthlyDisplayCount < monthlyStats.length) {
                    setMonthlyDisplayCount(prev => prev + 10);
                }
            },
            { threshold: 0.1 }
        );

        if (monthlyLoadMoreRef.current) {
            observer.observe(monthlyLoadMoreRef.current);
        }

        return () => {
            if (monthlyLoadMoreRef.current) {
                observer.unobserve(monthlyLoadMoreRef.current);
            }
        };
    }, [monthlyShowAll, monthlyDisplayCount, monthlyStats.length, activeSubTab]);

    // Intersection Observer for weekly tab
    useEffect(() => {
        if (!weeklyShowAll || activeSubTab !== 'weekly') return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && weeklyDisplayCount < weeklyStats.length) {
                    setWeeklyDisplayCount(prev => prev + 10);
                }
            },
            { threshold: 0.1 }
        );

        if (weeklyLoadMoreRef.current) {
            observer.observe(weeklyLoadMoreRef.current);
        }

        return () => {
            if (weeklyLoadMoreRef.current) {
                observer.unobserve(weeklyLoadMoreRef.current);
            }
        };
    }, [weeklyShowAll, weeklyDisplayCount, weeklyStats.length, activeSubTab]);

    // 총 데이터 통계
    const totalStats = useMemo(() => {
        if (records.length === 0) return null;

        const totalDistance = records.reduce((sum, r) => sum + (r.distance || 0), 0);
        const totalDuration = records.reduce((sum, r) => sum + (r.duration || 0), 0);
        const totalCalories = records.reduce((sum, r) => sum + Math.floor((r.distance || 0) * 60), 0);
        const runningDays = new Set(records.map(r => new Date(r.timestamp).toDateString())).size;
        const avgPace = totalDistance > 0 ? (totalDuration / 60) / totalDistance : 0;

        return {
            totalDistance,
            totalDuration,
            totalCalories,
            runningDays,
            avgPace
        };
    }, [records]);

    // 선택된 기간 통계 (월 또는 년)
    const periodStats = useMemo(() => {
        if (selectedPeriod.type === 'year') {
            const yearRecords = records.filter(r => {
                const date = new Date(r.timestamp);
                return date.getFullYear() === selectedPeriod.year;
            });

            if (yearRecords.length === 0) return null;

            const totalDistance = yearRecords.reduce((sum, r) => sum + (r.distance || 0), 0);
            const totalDuration = yearRecords.reduce((sum, r) => sum + (r.duration || 0), 0);
            const totalCalories = yearRecords.reduce((sum, r) => sum + Math.floor((r.distance || 0) * 60), 0);
            const runningDays = new Set(yearRecords.map(r => new Date(r.timestamp).toDateString())).size;
            const avgPace = totalDistance > 0 ? (totalDuration / 60) / totalDistance : 0;

            return {
                totalDistance,
                totalDuration,
                totalCalories,
                runningDays,
                avgPace
            };
        } else {
            const monthRecords = records.filter(r => {
                const date = new Date(r.timestamp);
                return date.getFullYear() === selectedPeriod.year && date.getMonth() + 1 === selectedPeriod.month;
            });

            if (monthRecords.length === 0) return null;

            const totalDistance = monthRecords.reduce((sum, r) => sum + (r.distance || 0), 0);
            const totalDuration = monthRecords.reduce((sum, r) => sum + (r.duration || 0), 0);
            const totalCalories = monthRecords.reduce((sum, r) => sum + Math.floor((r.distance || 0) * 60), 0);
            const runningDays = new Set(monthRecords.map(r => new Date(r.timestamp).toDateString())).size;
            const avgPace = totalDistance > 0 ? (totalDuration / 60) / totalDistance : 0;

            return {
                totalDistance,
                totalDuration,
                totalCalories,
                runningDays,
                avgPace
            };
        }
    }, [records, selectedPeriod]);

    // 일별 통계
    const dayStats = useMemo(() => {
        if (!selectedDate) return null;

        const dayRecords = records.filter(r => {
            const recordDate = new Date(r.timestamp);
            return recordDate.toDateString() === selectedDate.toDateString();
        });

        if (dayRecords.length === 0) return null;

        const totalDistance = dayRecords.reduce((sum, r) => sum + (r.distance || 0), 0);
        const totalDuration = dayRecords.reduce((sum, r) => sum + (r.duration || 0), 0);
        const totalCalories = dayRecords.reduce((sum, r) => sum + Math.floor((r.distance || 0) * 60), 0);
        const avgPace = totalDistance > 0 ? (totalDuration / 60) / totalDistance : 0;

        return {
            totalDistance,
            totalDuration,
            totalCalories,
            runCount: dayRecords.length,
            avgPace
        };
    }, [records, selectedDate]);

    // 연도별 통계 생성 (최근 연도가 위로)
    const yearlyStats = useMemo(() => {
        if (records.length === 0) return [];

        const yearMap = new Map();

        records.forEach(r => {
            const year = new Date(r.timestamp).getFullYear();
            if (!yearMap.has(year)) {
                yearMap.set(year, []);
            }
            yearMap.get(year).push(r);
        });

        const yearlyData = Array.from(yearMap.entries()).map(([year, yearRecords]) => {
            const totalDistance = yearRecords.reduce((sum, r) => sum + (r.distance || 0), 0);
            const totalDuration = yearRecords.reduce((sum, r) => sum + (r.duration || 0), 0);
            const totalCalories = yearRecords.reduce((sum, r) => sum + Math.floor((r.distance || 0) * 60), 0);
            const runningDays = new Set(yearRecords.map(r => new Date(r.timestamp).toDateString())).size;
            const avgPace = totalDistance > 0 ? (totalDuration / 60) / totalDistance : 0;

            return {
                year,
                totalDistance,
                totalDuration,
                totalCalories,
                runningDays,
                avgPace
            };
        });

        // 최근 연도가 위로 (내림차순)
        return yearlyData.sort((a, b) => b.year - a.year);
    }, [records]);

    // 월별 통계 생성 (최근 월이 위로)
    const monthlyStats = useMemo(() => {
        if (records.length === 0) return [];

        const monthMap = new Map();

        records.forEach(r => {
            const date = new Date(r.timestamp);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const key = `${year}-${month}`;

            if (!monthMap.has(key)) {
                monthMap.set(key, { year, month, records: [] });
            }
            monthMap.get(key).records.push(r);
        });

        const monthlyData = Array.from(monthMap.values()).map(({ year, month, records: monthRecords }) => {
            const totalDistance = monthRecords.reduce((sum, r) => sum + (r.distance || 0), 0);
            const totalDuration = monthRecords.reduce((sum, r) => sum + (r.duration || 0), 0);
            const totalCalories = monthRecords.reduce((sum, r) => sum + Math.floor((r.distance || 0) * 60), 0);
            const runningDays = new Set(monthRecords.map(r => new Date(r.timestamp).toDateString())).size;
            const avgPace = totalDistance > 0 ? (totalDuration / 60) / totalDistance : 0;

            return {
                year,
                month,
                totalDistance,
                totalDuration,
                totalCalories,
                runningDays,
                avgPace
            };
        });

        // 최근 월이 위로 (내림차순)
        return monthlyData.sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.month - a.month;
        });
    }, [records]);

    // 주별 통계 생성 (최근 주가 위로)
    const weeklyStats = useMemo(() => {
        if (records.length === 0) return [];

        const weekMap = new Map();

        records.forEach(r => {
            const date = new Date(r.timestamp);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;

            // 해당 월의 첫 날
            const firstDayOfMonth = new Date(year, date.getMonth(), 1);
            const dayOfMonth = date.getDate();
            const weekOfMonth = Math.ceil((dayOfMonth + firstDayOfMonth.getDay()) / 7);

            const key = `${year}-${month}-${weekOfMonth}`;

            if (!weekMap.has(key)) {
                weekMap.set(key, { year, month, week: weekOfMonth, records: [] });
            }
            weekMap.get(key).records.push(r);
        });

        const weeklyData = Array.from(weekMap.values()).map(({ year, month, week, records: weekRecords }) => {
            const totalDistance = weekRecords.reduce((sum, r) => sum + (r.distance || 0), 0);
            const totalDuration = weekRecords.reduce((sum, r) => sum + (r.duration || 0), 0);
            const totalCalories = weekRecords.reduce((sum, r) => sum + Math.floor((r.distance || 0) * 60), 0);
            const runningDays = new Set(weekRecords.map(r => new Date(r.timestamp).toDateString())).size;
            const avgPace = totalDistance > 0 ? (totalDuration / 60) / totalDistance : 0;

            return {
                year,
                month,
                week,
                totalDistance,
                totalDuration,
                totalCalories,
                runningDays,
                avgPace
            };
        });

        // 최근 주가 위로 (내림차순)
        return weeklyData.sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            if (a.month !== b.month) return b.month - a.month;
            return b.week - a.week;
        });
    }, [records]);

    // 월 선택기 옵션 생성
    const monthOptions = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const options = [];

        // 작년 12월부터 올해 현재 월까지
        for (let month = 12; month >= 1; month--) {
            if (month === 12) {
                options.push({ type: 'month', year: currentYear - 1, month: 12, label: '12월' });
                if (currentMonth >= 1) {
                    options.push({ type: 'year', year: currentYear - 1, label: `${currentYear - 1} 년` });
                }
            }
        }

        // 올해 월들
        for (let month = 1; month <= currentMonth; month++) {
            options.push({ type: 'month', year: currentYear, month, label: `${month} 월` });
        }

        return options.reverse();
    }, []);

    // 달력 데이터
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay();

        const days = [];

        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(null);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const hasRecord = records.some(r => {
                const recordDate = new Date(r.timestamp);
                return recordDate.toDateString() === date.toDateString();
            });
            days.push({ day, hasRecord });
        }

        return days;
    }, [currentDate, records]);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
        setSelectedDate(null);
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
        setSelectedDate(null);
    };

    const handleDateClick = (dayData) => {
        if (dayData && dayData.hasRecord) {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const clickedDate = new Date(year, month, dayData.day);
            setSelectedDate(clickedDate);
        }
    };

    const formatPaceCustom = (paceInSeconds) => {
        if (!paceInSeconds || paceInSeconds === 0) return "--'--''";
        const minutes = Math.floor(paceInSeconds);
        const seconds = Math.floor((paceInSeconds - minutes) * 60);
        return `${minutes} '${String(seconds).padStart(2, '0')}''`;
    };

    if (loading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                <div>로딩 중...</div>
            </div>
        );
    }

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // 최근 기록 10개
    const recentRecords = records.slice(0, showAllRecords ? displayCount : 10);

    return (
        <div style={{ width: '100%', paddingBottom: '80px' }}>
            {/* 서브탭 네비게이션 */}
            <div style={{
                display: 'flex',
                gap: '8px',
                padding: '12px 0',
                overflowX: 'auto',
                whiteSpace: 'nowrap',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
            }}>
                {[
                    { id: 'recent', label: '최근 활동' },
                    { id: 'cumulative', label: '누적 활동' },
                    { id: 'monthly', label: '월간 활동' },
                    { id: 'weekly', label: '주간 활동' },
                    { id: 'daily', label: '일별 활동' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveSubTab(tab.id);
                            setShowAllRecords(false);
                            setDisplayCount(10);
                        }}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '20px',
                            border: 'none',
                            backgroundColor: activeSubTab === tab.id ? '#4318FF' : '#f0f0f0',
                            color: activeSubTab === tab.id ? '#fff' : '#666',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* 최근 활동 탭 */}
            {activeSubTab === 'recent' && (
                <div>
                    <RecentRecords
                        user={user}
                        onRecordClick={onRecordClick}
                        onRefresh={handleRefresh}
                        limit={showAllRecords ? displayCount : 10}
                        showAll={true}
                        hideTitle={false}
                    />
                    {/* 더보기 버튼 (처음 10개만 표시할 때) */}
                    {records.length > 10 && !showAllRecords && (
                        <button
                            onClick={() => {
                                setShowAllRecords(true);
                                setDisplayCount(20); // 더보기 클릭 시 20개로 증가
                            }}
                            style={{
                                width: '100%',
                                padding: '16px',
                                marginTop: '16px',
                                backgroundColor: '#fff',
                                border: '1px solid #e0e0e0',
                                borderRadius: '12px',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#4318FF',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            더보기
                        </button>
                    )}
                    {/* 무한 스크롤 감지용 div */}
                    {showAllRecords && displayCount < records.length && (
                        <div
                            ref={loadMoreRef}
                            style={{
                                height: '20px',
                                margin: '16px 0',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                color: '#999',
                                fontSize: '14px'
                            }}
                        >
                            로딩 중...
                        </div>
                    )}
                </div>
            )}

            {/* 누적 활동 탭 */}
            {activeSubTab === 'cumulative' && (
                <div>
                    {/* 총 누적 */}
                    {totalStats && (
                        <div style={{
                            backgroundColor: '#fff',
                            borderRadius: '16px',
                            padding: '16px',
                            margin: '12px 0',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                            border: '1px solid #f0f0f0'
                        }}>
                            <h3 style={{
                                margin: '0 0 16px 0',
                                fontSize: '16px',
                                fontWeight: '700',
                                color: '#1a1a1a'
                            }}>
                                총 누적
                            </h3>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(5, 1fr)',
                                gap: '8px'
                            }}>
                                <StatItem label="총 거리" value={formatDistanceUtil(totalStats.totalDistance, unit)} />
                                <StatItem label="총 시간" value={formatTime(totalStats.totalDuration)} />
                                <StatItem label="평균 페이스" value={formatPaceCustom(totalStats.avgPace * 60)} />
                                <StatItem label="런닝 일수" value={`${totalStats.runningDays}일`} />
                                <StatItem label="칼로리" value={`${totalStats.totalCalories.toLocaleString()}`} />
                            </div>
                        </div>
                    )}

                    {/* 연도별 누적 */}
                    {yearlyStats.slice(0, cumulativeShowAll ? cumulativeDisplayCount : 10).map((yearStat) => (
                        <div
                            key={yearStat.year}
                            style={{
                                backgroundColor: '#fff',
                                borderRadius: '16px',
                                padding: '16px',
                                margin: '12px 0',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                                border: '1px solid #f0f0f0'
                            }}
                        >
                            <h3 style={{
                                margin: '0 0 16px 0',
                                fontSize: '16px',
                                fontWeight: '700',
                                color: '#1a1a1a'
                            }}>
                                {yearStat.year}년
                            </h3>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(5, 1fr)',
                                gap: '8px'
                            }}>
                                <StatItem label="거리" value={formatDistanceUtil(yearStat.totalDistance, unit)} />
                                <StatItem label="시간" value={formatTime(yearStat.totalDuration)} />
                                <StatItem label="페이스" value={formatPaceCustom(yearStat.avgPace * 60)} />
                                <StatItem label="일수" value={`${yearStat.runningDays}일`} />
                                <StatItem label="칼로리" value={`${yearStat.totalCalories.toLocaleString()}`} />
                            </div>
                        </div>
                    ))}

                    {/* 더보기 버튼 */}
                    {yearlyStats.length > 10 && !cumulativeShowAll && (
                        <button
                            onClick={() => {
                                setCumulativeShowAll(true);
                                setCumulativeDisplayCount(20);
                            }}
                            style={{
                                width: '100%',
                                padding: '16px',
                                marginTop: '16px',
                                backgroundColor: '#fff',
                                border: '1px solid #e0e0e0',
                                borderRadius: '12px',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#4318FF',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            더보기
                        </button>
                    )}

                    {/* 무한 스크롤 감지용 div */}
                    {cumulativeShowAll && cumulativeDisplayCount < yearlyStats.length && (
                        <div
                            ref={cumulativeLoadMoreRef}
                            style={{
                                height: '20px',
                                margin: '16px 0',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                color: '#999',
                                fontSize: '14px'
                            }}
                        >
                            로딩 중...
                        </div>
                    )}
                </div>
            )}

            {/* 월간 활동 탭 */}
            {activeSubTab === 'monthly' && (
                <div>
                    {/* 월별 누적 */}
                    {monthlyStats.slice(0, monthlyShowAll ? monthlyDisplayCount : 10).map((monthStat) => (
                        <div
                            key={`${monthStat.year}-${monthStat.month}`}
                            style={{
                                backgroundColor: '#fff',
                                borderRadius: '16px',
                                padding: '16px',
                                margin: '12px 0',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                                border: '1px solid #f0f0f0'
                            }}
                        >
                            <h3 style={{
                                margin: '0 0 16px 0',
                                fontSize: '16px',
                                fontWeight: '700',
                                color: '#1a1a1a'
                            }}>
                                {monthStat.year}년 {monthStat.month}월
                            </h3>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(5, 1fr)',
                                gap: '8px'
                            }}>
                                <StatItem label="거리" value={formatDistanceUtil(monthStat.totalDistance, unit)} />
                                <StatItem label="시간" value={formatTime(monthStat.totalDuration)} />
                                <StatItem label="페이스" value={formatPaceCustom(monthStat.avgPace * 60)} />
                                <StatItem label="일수" value={`${monthStat.runningDays}일`} />
                                <StatItem label="칼로리" value={`${monthStat.totalCalories.toLocaleString()}`} />
                            </div>
                        </div>
                    ))}

                    {/* 더보기 버튼 */}
                    {monthlyStats.length > 10 && !monthlyShowAll && (
                        <button
                            onClick={() => {
                                setMonthlyShowAll(true);
                                setMonthlyDisplayCount(20);
                            }}
                            style={{
                                width: '100%',
                                padding: '16px',
                                marginTop: '16px',
                                backgroundColor: '#fff',
                                border: '1px solid #e0e0e0',
                                borderRadius: '12px',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#4318FF',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            더보기
                        </button>
                    )}

                    {/* 무한 스크롤 감지용 div */}
                    {monthlyShowAll && monthlyDisplayCount < monthlyStats.length && (
                        <div
                            ref={monthlyLoadMoreRef}
                            style={{
                                height: '20px',
                                margin: '16px 0',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                color: '#999',
                                fontSize: '14px'
                            }}
                        >
                            로딩 중...
                        </div>
                    )}
                </div>
            )}

            {/* 주간 활동 탭 */}
            {activeSubTab === 'weekly' && (
                <div>
                    {/* 주별 누적 */}
                    {weeklyStats.slice(0, weeklyShowAll ? weeklyDisplayCount : 10).map((weekStat) => (
                        <div
                            key={`${weekStat.year}-${weekStat.month}-${weekStat.week}`}
                            style={{
                                backgroundColor: '#fff',
                                borderRadius: '16px',
                                padding: '16px',
                                margin: '12px 0',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                                border: '1px solid #f0f0f0'
                            }}
                        >
                            <h3 style={{
                                margin: '0 0 16px 0',
                                fontSize: '16px',
                                fontWeight: '700',
                                color: '#1a1a1a'
                            }}>
                                {weekStat.year}년 {weekStat.month}월 {weekStat.week}째주
                            </h3>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(5, 1fr)',
                                gap: '8px'
                            }}>
                                <StatItem label="거리" value={formatDistanceUtil(weekStat.totalDistance, unit)} />
                                <StatItem label="시간" value={formatTime(weekStat.totalDuration)} />
                                <StatItem label="페이스" value={formatPaceCustom(weekStat.avgPace * 60)} />
                                <StatItem label="일수" value={`${weekStat.runningDays}일`} />
                                <StatItem label="칼로리" value={`${weekStat.totalCalories.toLocaleString()}`} />
                            </div>
                        </div>
                    ))}

                    {/* 더보기 버튼 */}
                    {weeklyStats.length > 10 && !weeklyShowAll && (
                        <button
                            onClick={() => {
                                setWeeklyShowAll(true);
                                setWeeklyDisplayCount(20);
                            }}
                            style={{
                                width: '100%',
                                padding: '16px',
                                marginTop: '16px',
                                backgroundColor: '#fff',
                                border: '1px solid #e0e0e0',
                                borderRadius: '12px',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#4318FF',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            더보기
                        </button>
                    )}

                    {/* 무한 스크롤 감지용 div */}
                    {weeklyShowAll && weeklyDisplayCount < weeklyStats.length && (
                        <div
                            ref={weeklyLoadMoreRef}
                            style={{
                                height: '20px',
                                margin: '16px 0',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                color: '#999',
                                fontSize: '14px'
                            }}
                        >
                            로딩 중...
                        </div>
                    )}
                </div>
            )}

            {/* 일별 활동 탭 */}
            {activeSubTab === 'daily' && (
                <div>
                    {/* 달력 */}
                    <div style={{
                        backgroundColor: '#fff',
                        borderRadius: '16px',
                        padding: '16px',
                        margin: '12px 0',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                        border: '1px solid #f0f0f0'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '16px'
                        }}>
                            <button onClick={handlePrevMonth} style={monthNavButton}>←</button>
                            <div style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1a' }}>
                                {currentYear}년 {currentMonth}월
                            </div>
                            <button onClick={handleNextMonth} style={monthNavButton}>→</button>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(7, 1fr)',
                            gap: '4px',
                            marginBottom: '8px'
                        }}>
                            {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                                <div key={day} style={{
                                    textAlign: 'center',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    color: '#999',
                                    padding: '8px 0'
                                }}>
                                    {day}
                                </div>
                            ))}
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(7, 1fr)',
                            gap: '4px'
                        }}>
                            {calendarDays.map((dayData, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => handleDateClick(dayData)}
                                    style={{
                                        aspectRatio: '1',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '14px',
                                        fontWeight: dayData?.hasRecord ? '700' : '400',
                                        color: dayData?.hasRecord ? '#fff' : '#666',
                                        backgroundColor: dayData?.hasRecord ? '#4318FF' : 'transparent',
                                        borderRadius: '8px',
                                        cursor: dayData?.hasRecord ? 'pointer' : 'default',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (dayData?.hasRecord) {
                                            e.currentTarget.style.transform = 'scale(1.1)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (dayData?.hasRecord) {
                                            e.currentTarget.style.transform = 'scale(1)';
                                        }
                                    }}
                                >
                                    {dayData?.day}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 일별 통계 */}
                    {dayStats && selectedDate && (
                        <div style={{
                            backgroundColor: '#fff',
                            borderRadius: '16px',
                            padding: '16px',
                            margin: '12px 0',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                            border: '1px solid #f0f0f0'
                        }}>
                            <h3 style={{
                                margin: '0 0 16px 0',
                                fontSize: '16px',
                                fontWeight: '700',
                                color: '#1a1a1a'
                            }}>
                                일별 통계 - {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일
                            </h3>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(5, 1fr)',
                                gap: '8px',
                                marginBottom: '16px'
                            }}>
                                <StatItem label="거리" value={formatDistanceUtil(dayStats.totalDistance, unit)} />
                                <StatItem label="시간" value={formatTime(dayStats.totalDuration)} />
                                <StatItem label="페이스" value={formatPaceCustom(dayStats.avgPace * 60)} />
                                <StatItem label="횟수" value={`${dayStats.runCount}회`} />
                                <StatItem label="칼로리" value={`${dayStats.totalCalories.toLocaleString()}`} />
                            </div>

                            {/* 해당 날짜의 기록 */}
                            <RecentRecords
                                user={user}
                                onRecordClick={onRecordClick}
                                onRefresh={handleRefresh}
                                selectedDate={selectedDate}
                                hideTitle={true}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function StatItem({ label, value }) {
    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#999', marginBottom: '4px' }}>{label}</div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a1a' }}>{value}</div>
        </div>
    );
}

const monthNavButton = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '1px solid #e0e0e0',
    backgroundColor: '#fff',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s'
};

export default MyRecordsTab;

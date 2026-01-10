import { useState, useEffect, useMemo } from 'react';
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
    const [selectedPeriod, setSelectedPeriod] = useState({ type: 'month', year: new Date().getFullYear(), month: new Date().getMonth() + 1 }); // 월 선택기용
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        if (user && user.id) {
            loadRecords();
        }
    }, [user]);

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
            }
        } catch (err) {
            console.error('기록 로딩 실패:', err);
        } finally {
            setLoading(false);
        }
    };

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
            // 전년도 통계
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
            // 월별 통계
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
                // 1월 1일 이후면 년도 표시
                if (currentMonth >= 1) {
                    options.push({ type: 'year', year: currentYear - 1, label: `${currentYear - 1}년` });
                }
            }
        }

        // 올해 월들
        for (let month = 1; month <= currentMonth; month++) {
            options.push({ type: 'month', year: currentYear, month, label: `${month}월` });
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
        return `${minutes}'${String(seconds).padStart(2, '0')}''`;
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

    return (
        <div style={{ width: '100%', paddingBottom: '80px' }}>
            {/* 총 통계 */}
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
                        총 통계
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

            {/* 월 선택기 */}
            <div style={{
                overflowX: 'auto',
                whiteSpace: 'nowrap',
                padding: '12px 0',
                margin: '12px 0',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
            }}>
                <div style={{ display: 'inline-flex', gap: '8px', padding: '0 16px' }}>
                    {monthOptions.map((option, idx) => (
                        <button
                            key={idx}
                            onClick={() => setSelectedPeriod(option)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '20px',
                                border: 'none',
                                backgroundColor: selectedPeriod.type === option.type &&
                                    selectedPeriod.year === option.year &&
                                    (option.type === 'year' || selectedPeriod.month === option.month)
                                    ? '#4318FF' : '#f0f0f0',
                                color: selectedPeriod.type === option.type &&
                                    selectedPeriod.year === option.year &&
                                    (option.type === 'year' || selectedPeriod.month === option.month)
                                    ? '#fff' : '#666',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 월별/년별 통계 */}
            {periodStats && (
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
                        {selectedPeriod.type === 'year'
                            ? `${selectedPeriod.year}년 통계`
                            : `${selectedPeriod.month}월 통계`}
                    </h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, 1fr)',
                        gap: '8px'
                    }}>
                        <StatItem label="거리" value={formatDistanceUtil(periodStats.totalDistance, unit)} />
                        <StatItem label="시간" value={formatTime(periodStats.totalDuration)} />
                        <StatItem label="페이스" value={formatPaceCustom(periodStats.avgPace * 60)} />
                        <StatItem label="일수" value={`${periodStats.runningDays}일`} />
                        <StatItem label="칼로리" value={`${periodStats.totalCalories.toLocaleString()}`} />
                    </div>
                </div>
            )}

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
                        onRefresh={refreshKey}
                        selectedDate={selectedDate}
                        hideTitle={true}
                    />
                </div>
            )}

            {/* 날짜 선택 안 했을 때 전체 최근 기록 */}
            {!selectedDate && (
                <RecentRecords
                    user={user}
                    onRecordClick={onRecordClick}
                    onRefresh={refreshKey}
                    hideTitle={true}
                />
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

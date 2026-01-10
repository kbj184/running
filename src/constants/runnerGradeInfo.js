// 러너 등급 정의
export const RUNNER_GRADE_INFO = {
    BEGINNER: {
        name: 'Beginner',
        nameKo: 'Beginner',
        emoji: '🥉',
        color: '#94a3b8',
        description: '5km 미만',
        minDistance: 0,
        maxDistance: 5,
        badge: null
    },
    RUNNER_5K: {
        name: '5K Runner',
        nameKo: '5K',
        emoji: '🏃',
        color: '#10b981',
        description: '10km 미만 & 1시간 이내',
        minDistance: 5,
        maxDistance: 10,
        badge: 'R'
    },
    RUNNER_10K: {
        name: '10K Runner',
        nameKo: '10K',
        emoji: '🏃‍♂️',
        color: '#3b82f6',
        description: '21km 미만 & 1시간 30분 이내',
        minDistance: 10,
        maxDistance: 21,
        badge: 'R'
    },
    HALF_MARATHONER: {
        name: 'Half Marathoner',
        nameKo: 'Half',
        emoji: '🎽',
        color: '#8b5cf6',
        description: '42km 미만 & 2시간 30분 이내',
        minDistance: 21,
        maxDistance: 42,
        badge: 'M'
    },
    FULL_MARATHONER: {
        name: 'Full Marathoner',
        nameKo: 'Full',
        emoji: '🏅',
        color: '#f59e0b',
        description: '42km 이상 & 5시간 30분 이내',
        minDistance: 42,
        maxDistance: 42.195, // 마라톤 완주 기준
        badge: 'M'
    },
    SUB3_MARATHONER: {
        name: 'Sub-3 Marathoner',
        nameKo: 'Sub3',
        emoji: '⚡',
        color: '#ef4444',
        description: '42km 이상 & 3시간 이내',
        minDistance: 42.195,
        maxDistance: 42.195,
        badge: 'M'
    },
    ELITE_MARATHONER: {
        name: 'Elite Marathoner',
        nameKo: 'Elite',
        emoji: '👑',
        color: '#dc2626',
        description: '42km 이상 & 2시간 30분 이내',
        minDistance: 42.195,
        maxDistance: 42.195,
        badge: 'M'
    },
    LEGEND_MARATHONER: {
        name: 'Legend Marathoner',
        nameKo: 'Legend',
        emoji: '🌟',
        color: '#fbbf24',
        description: '전국구 전설',
        minDistance: 42.195,
        maxDistance: 42.195,
        badge: 'M'
    }
};

// 등급 정보 가져오기
export const getGradeInfo = (gradeKey) => {
    return RUNNER_GRADE_INFO[gradeKey] || RUNNER_GRADE_INFO.BEGINNER;
};

// 등급 배지 컴포넌트용 스타일
export const getGradeBadgeStyle = (gradeKey) => {
    const info = getGradeInfo(gradeKey);
    return {
        backgroundColor: `${info.color}20`,
        color: info.color,
        border: `1px solid ${info.color}40`,
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
    };
};

// R/M 뱃지 스타일
export const getBadgeStyle = (badge, color) => {
    return {
        backgroundColor: color,
        color: '#fff',
        padding: '2px 6px',
        borderRadius: '6px',
        fontSize: '10px',
        fontWeight: '700',
        marginLeft: '2px'
    };
};

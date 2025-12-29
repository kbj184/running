// 러너 등급 정의
export const RUNNER_GRADE_INFO = {
    BEGINNER: {
        name: 'Beginner',
        nameKo: '초보자',
        emoji: '🥉',
        color: '#94a3b8',
        description: '5km 미만'
    },
    RUNNER_5K: {
        name: '5K Runner',
        nameKo: '5K 러너',
        emoji: '🏃',
        color: '#10b981',
        description: '10km 미만 & 1시간 이내'
    },
    RUNNER_10K: {
        name: '10K Runner',
        nameKo: '10K 러너',
        emoji: '🏃‍♂️',
        color: '#3b82f6',
        description: '21km 미만 & 1시간 30분 이내'
    },
    HALF_MARATHONER: {
        name: 'Half Marathoner',
        nameKo: '하프 마라토너',
        emoji: '🎽',
        color: '#8b5cf6',
        description: '42km 미만 & 2시간 30분 이내'
    },
    FULL_MARATHONER: {
        name: 'Full Marathoner',
        nameKo: '풀 마라토너',
        emoji: '🏅',
        color: '#f59e0b',
        description: '42km 이상 & 5시간 30분 이내'
    },
    SUB3_MARATHONER: {
        name: 'Sub-3 Marathoner',
        nameKo: 'Sub-3 마라토너',
        emoji: '⚡',
        color: '#ef4444',
        description: '42km 이상 & 3시간 이내'
    },
    ELITE_MARATHONER: {
        name: 'Elite Marathoner',
        nameKo: '엘리트 마라토너',
        emoji: '👑',
        color: '#dc2626',
        description: '42km 이상 & 2시간 30분 이내'
    },
    LEGEND_MARATHONER: {
        name: 'Legend Marathoner',
        nameKo: '전설의 러너',
        emoji: '🌟',
        color: '#fbbf24',
        description: '관리자 승급'
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

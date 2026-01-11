// 러너 등급 정의 (백엔드와 동기화)
export const RUNNER_GRADES = {
    BEGINNER: {
        name: '초급',
        color: '#ff8c00', // 주황색
        description: '5km 미만',
        minDistance: 0,
        maxDistance: 5
    },
    RUNNER_5K: {
        name: '5K 러너',
        color: '#10b981', // 녹색
        description: '10km 미만 및 1시간 이내',
        minDistance: 5,
        maxDistance: 10
    },
    RUNNER_10K: {
        name: '10K 러너',
        color: '#3b82f6', // 파랑색
        description: '21km 미만 및 1시간 30분 이내',
        minDistance: 10,
        maxDistance: 21
    },
    HALF_MARATHONER: {
        name: '하프 마라토너',
        color: '#ef4444', // 빨강색
        description: '42km 미만 및 2시간 30분 이내',
        minDistance: 21,
        maxDistance: 42
    },
    FULL_MARATHONER: {
        name: '풀 마라토너',
        color: '#1f2937', // 검정색
        description: '42km 이상 및 5시간 30분 이내',
        minDistance: 42,
        maxDistance: Infinity
    },
    SUB3_MARATHONER: {
        name: 'Sub-3 마라토너',
        color: '#1f2937', // 검정색
        description: '42km 이상 및 3시간 이내',
        minDistance: 42,
        maxDistance: Infinity
    },
    ELITE_MARATHONER: {
        name: '엘리트 마라토너',
        color: '#1f2937', // 검정색
        description: '42km 이상 및 2시간 30분 이내',
        minDistance: 42,
        maxDistance: Infinity
    },
    LEGEND_MARATHONER: {
        name: '전설의 러너',
        color: '#fbbf24', // 금색
        description: '관리자 승급',
        minDistance: 0,
        maxDistance: Infinity
    }
};

// 서울 중심 좌표
export const SEOUL_CENTER = { lat: 37.5665, lng: 126.9780 };

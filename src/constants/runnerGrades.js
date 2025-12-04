// 러너 등급 정의
export const RUNNER_GRADES = {
    BEGINNER: {
        name: '초급',
        color: '#10b981',
        description: '0-5km',
        minDistance: 0,
        maxDistance: 5
    },
    INTERMEDIATE: {
        name: '중급',
        color: '#3b82f6',
        description: '5-10km',
        minDistance: 5,
        maxDistance: 10
    },
    ADVANCED: {
        name: '고급',
        color: '#8b5cf6',
        description: '10-20km',
        minDistance: 10,
        maxDistance: 20
    },
    ELITE: {
        name: '엘리트',
        color: '#f59e0b',
        description: '20-30km',
        minDistance: 20,
        maxDistance: 30
    },
    PRO: {
        name: '프로',
        color: '#ef4444',
        description: '30km+',
        minDistance: 30,
        maxDistance: Infinity
    }
};

// 서울 중심 좌표
export const SEOUL_CENTER = { lat: 37.5665, lng: 126.9780 };

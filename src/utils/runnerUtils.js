import { SEOUL_CENTER } from '../constants/runnerGrades';

// 러닝 경로 생성 함수 (시작점부터 현재 위치까지)
export const generateRunningRoute = (currentPosition, distance) => {
    const route = [];
    const numPoints = Math.max(10, Math.floor(parseFloat(distance) * 2)); // 거리에 비례한 포인트 수

    // 시작 위치 (현재 위치에서 랜덤하게 떨어진 곳)
    const startLat = currentPosition.lat + (Math.random() - 0.5) * 0.02;
    const startLng = currentPosition.lng + (Math.random() - 0.5) * 0.02;

    route.push({ lat: startLat, lng: startLng });

    // 중간 포인트들 생성 (자연스러운 경로)
    for (let i = 1; i < numPoints - 1; i++) {
        const progress = i / numPoints;
        const lat = startLat + (currentPosition.lat - startLat) * progress + (Math.random() - 0.5) * 0.005;
        const lng = startLng + (currentPosition.lng - startLng) * progress + (Math.random() - 0.5) * 0.005;
        route.push({ lat, lng });
    }

    // 현재 위치
    route.push(currentPosition);

    return route;
};

// 더미 러너 데이터 생성
export const generateRunners = (count = 50) => {
    const runners = [];
    const names = ['김민수', '이지은', '박준호', '최서연', '정우진', '강하늘', '윤서아', '임태양', '송지민', '한별'];

    for (let i = 0; i < count; i++) {
        const distance = Math.random() * 35; // 0-35km
        let grade;

        if (distance < 5) grade = 'BEGINNER';
        else if (distance < 10) grade = 'INTERMEDIATE';
        else if (distance < 20) grade = 'ADVANCED';
        else if (distance < 30) grade = 'ELITE';
        else grade = 'PRO';

        const currentPosition = {
            lat: SEOUL_CENTER.lat + (Math.random() - 0.5) * 0.1,
            lng: SEOUL_CENTER.lng + (Math.random() - 0.5) * 0.1
        };

        runners.push({
            id: i + 1,
            name: `${names[i % names.length]} ${Math.floor(i / names.length) + 1}`,
            position: currentPosition,
            grade: grade,
            distance: distance.toFixed(1),
            speed: (3 + Math.random() * 7).toFixed(1), // 3-10 km/h
            duration: Math.floor(Math.random() * 180) + 10, // 10-190분
            route: generateRunningRoute(currentPosition, distance.toFixed(1)),
            calories: Math.floor(distance * 60), // 대략적인 칼로리
            pace: (60 / (3 + Math.random() * 7)).toFixed(1), // 분/km
            heartRate: Math.floor(120 + Math.random() * 60) // 120-180 bpm
        });
    }

    return runners;
};

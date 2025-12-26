// GPS 및 거리 계산 유틸리티

// 두 좌표 간의 거리 계산 (Haversine formula)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // 지구 반지름 (km)
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance; // km 단위
};

const toRad = (degrees) => {
    return degrees * (Math.PI / 180);
};

// 속도 계산 (km/h)
export const calculateSpeed = (distance, timeInSeconds) => {
    if (timeInSeconds === 0) return 0;
    const hours = timeInSeconds / 3600;
    return distance / hours; // km/h
};

// 페이스 계산 (분/km)
export const calculatePace = (distance, timeInSeconds) => {
    if (distance === 0) return 0;
    const minutes = timeInSeconds / 60;
    return minutes / distance; // 분/km
};

// 시간 포맷팅 (HH:MM:SS)
export const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// 거리 포맷팅
export const formatDistance = (km) => {
    return `${km.toFixed(2)}km`;
};

// GPS 위치 가져오기
export const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    altitude: position.coords.altitude,
                    speed: position.coords.speed, // m/s
                    timestamp: position.timestamp
                });
            },
            (error) => {
                reject(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    });
};

// GPS 위치 추적 시작
export const watchPosition = (callback, errorCallback) => {
    if (!navigator.geolocation) {
        errorCallback(new Error('Geolocation is not supported by your browser'));
        return null;
    }

    const watchId = navigator.geolocation.watchPosition(
        (position) => {
            callback({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                altitude: position.coords.altitude,
                speed: position.coords.speed, // m/s
                timestamp: position.timestamp
            });
        },
        errorCallback,
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );

    return watchId;
};

// GPS 위치 추적 중지
export const clearWatch = (watchId) => {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
    }
};

/**
 * Google Static Maps API를 사용하여 경로 썸네일 URL 생성
 * @param {Array} route - 경로 좌표 배열 [{lat, lng}, ...]
 * @param {Object} options - 옵션 {width, height, zoom}
 * @returns {string} Static Maps API URL
 */
export const generateRouteThumbnail = (route, options = {}) => {
    if (!route || route.length === 0) {
        return null;
    }

    const {
        width = 200,
        height = 160,
        maptype = 'roadmap',
        color = '0x4318FF',
        weight = 3
    } = options;

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        console.error('Google Maps API Key가 설정되지 않았습니다.');
        return null;
    }

    // 경로 포인트 샘플링 (URL 길이 제한 때문에 모든 포인트를 사용할 수 없음)
    // 최대 100개 포인트로 제한
    const maxPoints = 100;
    const step = Math.max(1, Math.floor(route.length / maxPoints));
    const sampledRoute = route.filter((_, index) => index % step === 0);

    // 경로를 path 파라미터로 변환
    const pathPoints = sampledRoute
        .map(p => `${p.lat},${p.lng}`)
        .join('|');

    // 시작점과 끝점 마커
    const startPoint = route[0];
    const endPoint = route[route.length - 1];

    // Static Maps API URL 생성
    const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap';
    const params = new URLSearchParams({
        size: `${width}x${height}`,
        maptype: maptype,
        key: apiKey,
        // 스타일: POI 숨기기, 라벨 최소화
        style: [
            'feature:poi|visibility:off',
            'feature:transit|element:labels.icon|visibility:off'
        ].join('&style=')
    });

    // 경로 path 추가
    params.append('path', `color:${color}|weight:${weight}|${pathPoints}`);

    // 시작점 마커 (초록색)
    params.append('markers', `color:green|size:small|${startPoint.lat},${startPoint.lng}`);

    // 끝점 마커 (파란색)
    params.append('markers', `color:blue|size:small|${endPoint.lat},${endPoint.lng}`);

    return `${baseUrl}?${params.toString()}`;
};

/**
 * 큰 지도 이미지 URL 생성 (결과 화면용)
 * @param {Array} route - 경로 좌표 배열
 * @returns {string} Static Maps API URL
 */
export const generateRouteMapImage = (route) => {
    return generateRouteThumbnail(route, {
        width: 640,
        height: 400,
        color: '0x4318FF',
        weight: 4
    });
};

/**
 * 작은 썸네일 이미지 URL 생성 (목록용)
 * @param {Array} route - 경로 좌표 배열
 * @returns {string} Static Maps API URL
 */
export const generateRouteThumbImage = (route) => {
    return generateRouteThumbnail(route, {
        width: 200,
        height: 160,
        color: '0x4318FF',
        weight: 3
    });
};

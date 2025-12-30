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

    // 시작점과 끝점
    const startPoint = route[0];
    const endPoint = route[route.length - 1];

    // 경로의 bounds 계산 (경로 전체가 보이도록)
    let minLat = route[0].lat;
    let maxLat = route[0].lat;
    let minLng = route[0].lng;
    let maxLng = route[0].lng;

    route.forEach(point => {
        minLat = Math.min(minLat, point.lat);
        maxLat = Math.max(maxLat, point.lat);
        minLng = Math.min(minLng, point.lng);
        maxLng = Math.max(maxLng, point.lng);
    });

    // 중심점 계산
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    // 여유 공간 추가 (10% 패딩)
    const latPadding = (maxLat - minLat) * 0.15;
    const lngPadding = (maxLng - minLng) * 0.15;

    // visible 파라미터로 경로 전체가 보이도록 설정
    const visiblePoints = [
        `${minLat - latPadding},${minLng - lngPadding}`,
        `${maxLat + latPadding},${maxLng + lngPadding}`
    ].join('|');

    // Static Maps API URL 생성
    const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap';
    const params = new URLSearchParams({
        size: `${width}x${height}`,
        maptype: maptype,
        center: `${centerLat},${centerLng}`,
        key: apiKey,
        // 모든 라벨과 텍스트 숨기기
        style: [
            'feature:all|element:labels|visibility:off',           // 모든 라벨 숨기기
            'feature:poi|visibility:off',                          // POI 숨기기
            'feature:transit|visibility:off',                      // 대중교통 숨기기
            'feature:administrative|element:labels|visibility:off', // 행정구역 라벨 숨기기
            'feature:administrative.land_parcel|visibility:off'    // 워터마크 숨기기
        ].join('&style=')
    });

    // visible 파라미터로 경로 전체가 보이도록 설정
    params.append('visible', visiblePoints);

    // 경로 path 추가
    params.append('path', `color:${color}|weight:${weight}|${pathPoints}`);

    // 시작점 마커 (빨간색)
    params.append('markers', `color:red|size:mid|${startPoint.lat},${startPoint.lng}`);

    // 끝점 마커 (골인 깃발) - 체크무늬 깃발 이모지 사용
    params.append('markers', `icon:https://maps.google.com/mapfiles/kml/paddle/go.png|${endPoint.lat},${endPoint.lng}`);

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

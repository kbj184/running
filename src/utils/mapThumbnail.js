/**
 * Google Static Maps API를 사용하여 경로 썸네일 URL 생성
 * @param {Array} route - 경로 좌표 배열 [{lat, lng}, ...]
 * @param {Object} options - 옵션 {width, height, zoom, wateringSegments}
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
        weight = 3,
        useDarkMode = false,  // 다크 모드 사용 여부 (기본값: false)
        useMapId = true,      // Map ID 사용 여부 (기본값: true)
        wateringSegments = [] // 급수 구간 정보
    } = options;

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;

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

    // 여유 공간 추가 (25% 패딩으로 증가하여 경로가 잘리지 않도록)
    const latPadding = (maxLat - minLat) * 0.25;
    const lngPadding = (maxLng - minLng) * 0.25;

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
        key: apiKey
    });

    // Map ID가 있고 useMapId 옵션이 true일 때만 추가 (클라우드 스타일 적용)
    if (mapId && useMapId) {
        params.append('map_id', mapId);
    }

    // 다크 모드 또는 일반 모드 스타일 선택
    const styles = useDarkMode ? [
        // Dark Mode 스타일
        'feature:all|element:geometry|color:0x212121',         // 아주 어두운 회색
        'feature:all|element:labels.text.stroke|visibility:off',
        'feature:all|element:labels.text.fill|visibility:off',
        'feature:all|element:labels|visibility:off',           // 모든 라벨 숨기기
        'feature:road|element:geometry|color:0x383838',        // 도로를 약간 밝게
        'feature:road|element:geometry.stroke|color:0x212121',
        'feature:water|element:geometry|color:0x000000',       // 물은 검정색
        'feature:poi|visibility:off',
        'feature:transit|visibility:off',
        'feature:transit.line|visibility:off',
        'feature:transit.station|visibility:off',
        'feature:transit.station.rail|visibility:off',
        'feature:administrative|element:labels|visibility:off',
        'feature:administrative.land_parcel|visibility:off',
        'feature:administrative.neighborhood|visibility:off'
    ] : [
        // 일반 지도 스타일 (라벨 최소화)
        'feature:poi|visibility:off',                          // POI 숨기기
        'feature:transit|visibility:off',                      // 대중교통 숨기기
        'feature:administrative.land_parcel|visibility:off',   // 워터마크 숨기기
        'feature:administrative.neighborhood|visibility:off'   // 추가 워터마크 숨기기
    ];

    // 스타일 파라미터 추가
    styles.forEach(style => {
        params.append('style', style);
    });

    // visible 파라미터로 경로 전체가 보이도록 설정
    params.append('visible', visiblePoints);

    // 경로 path 추가 - 두껋고 진한 색상
    params.append('path', `color:${color}|weight:${weight}|${pathPoints}`);

    // 시작점 마커 (빨간색)
    params.append('markers', `color:red|size:mid|${startPoint.lat},${startPoint.lng}`);

    // 끝점 마커 (파란색 원형)
    params.append('markers', `color:blue|size:mid|${endPoint.lat},${endPoint.lng}`);

    // 급수 마커 추가 (물방울 커스텀 아이콘)
    if (wateringSegments && wateringSegments.length > 0) {
        // Static Maps API는 절대 URL이 필요함
        const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:';
        const host = typeof window !== 'undefined' ? window.location.host : 'llrun.shop';
        const iconUrl = `${protocol}//${host}/water-marker.png`;

        console.log(`💧 Water marker icon URL: ${iconUrl}`);

        wateringSegments.forEach(segment => {
            if (segment.start < route.length) {
                const waterPoint = route[segment.start];
                params.append('markers', `icon:${iconUrl}|${waterPoint.lat},${waterPoint.lng}`);
            }
        });
    }

    return `${baseUrl}?${params.toString()}`;
};

/**
 * 큰 지도 이미지 URL 생성 (결과 화면용)
 * @param {Array} route - 경로 좌표 배열
 * @param {Array} wateringSegments - 급수 구간 정보
 * @returns {string} Static Maps API URL
 */
export const generateRouteMapImage = (route, wateringSegments = []) => {
    return generateRouteThumbnail(route, {
        width: 640,
        height: 400,
        color: '0x2D1B69',  // 진한 보라색
        weight: 5,
        wateringSegments
    });
};

/**
 * 작은 썸네일 이미지 URL 생성 (목록용)
 * @param {Array} route - 경로 좌표 배열
 * @returns {string} Static Maps API URL
 */
export const generateRouteThumbImage = (route) => {
    return generateRouteThumbnail(route, {
        width: 300,
        height: 240,
        color: '0x39ff14',  // 진한 형광색 (Neon Green)
        weight: 4,
        useDarkMode: true,   // 썸네일은 다크 모드 사용
        useMapId: false      // 썸네일은 Map ID 사용 안 함 (커스텀 스타일 유지)
    });
};

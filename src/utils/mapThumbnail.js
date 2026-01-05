/**
 * Google Static Maps API를 사용하여 경로 썸네일 URL 생성
 * @param {Array} route - 경로 좌표 배열 [{lat, lng, speed}, ...]
 * @param {Object} options - 옵션 {width, height, zoom, wateringSegments, useSpeedColors}
 * @returns {string} Static Maps API URL
 */

// 커스텀 마커 이미지 URL (public 폴더)
// 배포 시 자동으로 포함되며, 절대 URL로 변환됨
const getMarkerIconUrl = (filename) => {
    // 프로덕션: 배포된 도메인 사용
    if (import.meta.env.PROD) {
        return `https://llrun.shop/markers/${filename}`;
    }
    // 개발: 로컬 서버 사용
    return `https://localhost:3000/markers/${filename}`;
};

const MARKER_ICONS = {
    start: getMarkerIconUrl('start_marker.png'),
    goal: getMarkerIconUrl('goal_marker.png'),
    water: getMarkerIconUrl('water_marker.png'),
    km: getMarkerIconUrl('km_marker.png')
};

// 속도에 따른 색상 반환 (16진수 형식)
const getSpeedColorHex = (speedKmh) => {
    if (speedKmh <= 0) return "0x667eea"; // 멈춤 (보라)
    if (speedKmh < 6) return "0x10b981"; // 걷기/느린 조깅 (초록)
    if (speedKmh < 9) return "0xf59e0b"; // 중강도 (주황)
    if (speedKmh < 12) return "0xef4444"; // 고강도 (빨강)
    return "0x7c3aed"; // 초고속 (보라)
};

export const generateRouteThumbnail = (route, options = {}) => {
    console.log('🗺️ generateRouteThumbnail called');
    console.log('  - route type:', typeof route);
    console.log('  - route is Array:', Array.isArray(route));
    console.log('  - route length:', route?.length);

    if (!route || !Array.isArray(route) || route.length === 0) {
        console.error('Invalid route data:', route);
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
        wateringSegments = [], // 급수 구간 정보
        useSpeedColors = false, // 속도별 색상 사용 여부
        useMarkers = true     // 마커 표시 여부 (기본값: true)
    } = options;

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;

    if (!apiKey) {
        console.error('Google Maps API Key가 설정되지 않았습니다.');
        return null;
    }

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

    // 속도별 색상 사용 여부에 따라 경로 추가
    if (useSpeedColors && route.length >= 2) {
        // 수분 보충 구간 판별 헬퍼
        const isIndexInWatering = (idx) => {
            if (!wateringSegments || wateringSegments.length === 0) return false;

            for (const seg of wateringSegments) {
                if (typeof seg === 'object' && 'start' in seg && 'end' in seg) {
                    if (idx >= seg.start && idx <= seg.end) return true;
                }
            }
            return false;
        };

        // 속도별 세그먼트 생성
        const segments = [];
        let currentPath = [];
        let currentColor = isIndexInWatering(0) ? "0x06b6d4" : getSpeedColorHex(route[0]?.speed || 0);

        for (let i = 0; i < route.length - 1; i++) {
            const p1 = route[i];
            const p2 = route[i + 1];

            const watering = isIndexInWatering(i);
            let segColor = watering ? "0x06b6d4" : getSpeedColorHex(p1.speed || 0);

            if (currentPath.length === 0) {
                currentPath.push(p1);
                currentColor = segColor;
            }

            if (segColor !== currentColor) {
                currentPath.push(p1);
                segments.push({ path: [...currentPath], color: currentColor });
                currentPath = [p1];
                currentColor = segColor;
            }

            currentPath.push(p2);
        }

        if (currentPath.length > 0) {
            segments.push({ path: currentPath, color: currentColor });
        }

        console.log('🎨 Generated segments:', segments.length);
        console.log('  - segments is Array:', Array.isArray(segments));

        // 각 세그먼트를 path 파라미터로 추가 (샘플링 적용)
        if (Array.isArray(segments) && segments.length > 0) {
            segments.forEach((segment, idx) => {
                const maxPoints = 50; // 세그먼트당 최대 포인트
                const step = Math.max(1, Math.floor(segment.path.length / maxPoints));
                const sampledPath = segment.path.filter((_, index) => index % step === 0);

                const pathPoints = sampledPath
                    .map(p => `${p.lat},${p.lng}`)
                    .join('|');

                params.append('path', `color:${segment.color}|weight:${weight}|${pathPoints}`);
            });

            console.log(`🎨 Generated ${segments.length} speed-colored segments for static map`);
        }
    } else {
        // 단일 색상 경로
        const maxPoints = 100;
        const step = Math.max(1, Math.floor(route.length / maxPoints));
        const sampledRoute = route.filter((_, index) => index % step === 0);

        const pathPoints = sampledRoute
            .map(p => `${p.lat},${p.lng}`)
            .join('|');

        params.append('path', `color:${color}|weight:${weight}|${pathPoints}`);
    }

    // 마커 추가 (useMarkers 옵션이 true일 때만)
    if (useMarkers) {
        // useCustomMarkers 옵션에 따라 커스텀 또는 기본 마커 사용
        const useCustomMarkers = options.useCustomMarkers || false;

        if (useCustomMarkers) {
            // 커스텀 이미지 마커 (현재 사용 안 함)
            params.append('markers', `icon:${encodeURIComponent(MARKER_ICONS.start)}|scale:0.5|${startPoint.lat},${startPoint.lng}`);
            params.append('markers', `icon:${encodeURIComponent(MARKER_ICONS.goal)}|scale:0.5|${endPoint.lat},${endPoint.lng}`);

            if (wateringSegments && Array.isArray(wateringSegments) && wateringSegments.length > 0) {
                wateringSegments.forEach((segment) => {
                    if (typeof segment === 'object' && 'start' in segment && 'end' in segment) {
                        const midIndex = Math.floor((segment.start + segment.end) / 2);
                        if (midIndex < route.length) {
                            const waterPoint = route[midIndex];
                            params.append('markers', `icon:${encodeURIComponent(MARKER_ICONS.water)}|scale:0.44|${waterPoint.lat},${waterPoint.lng}`);
                        }
                    }
                });
            }
        } else {
            // 기본 마커 사용
            params.append('markers', `color:green|size:mid|label:S|${startPoint.lat},${startPoint.lng}`);
            params.append('markers', `color:red|size:mid|label:G|${endPoint.lat},${endPoint.lng}`);

            if (wateringSegments && Array.isArray(wateringSegments) && wateringSegments.length > 0) {
                wateringSegments.forEach((segment) => {
                    if (typeof segment === 'object' && 'start' in segment && 'end' in segment) {
                        const midIndex = Math.floor((segment.start + segment.end) / 2);
                        if (midIndex < route.length) {
                            const waterPoint = route[midIndex];
                            params.append('markers', `color:blue|size:mid|label:W|${waterPoint.lat},${waterPoint.lng}`);
                        }
                    }
                });
            }
        }
    }

    const finalUrl = `${baseUrl}?${params.toString()}`;

    // 디버깅: 마커 정보 출력
    console.log('🗺️ Static Map URL generated:');
    console.log('  - Start marker (S):', useMarkers ? startPoint : 'disabled');
    console.log('  - Goal marker (G):', useMarkers ? endPoint : 'disabled');
    console.log('  - Water markers (W):', useMarkers ? (wateringSegments?.length || 0) : 'disabled');
    console.log('  - URL length:', finalUrl.length);

    return finalUrl;
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
        weight: 5,
        wateringSegments,
        useSpeedColors: true,  // 속도별 색상 사용
        useMarkers: true       // S, G, W 마커 표시 (기본 마커)
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
        useMapId: false,     // 썸네일은 Map ID 사용 안 함 (커스텀 스타일 유지)
        useMarkers: true     // S, G 마커 표시 (기본 마커)
    });
};

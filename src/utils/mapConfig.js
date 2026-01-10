/**
 * Google Maps 공통 설정
 * 프로젝트 전체에서 일관된 지도 스타일을 적용하기 위한 설정 파일
 */

// POI 및 대중교통 숨김 스타일
export const hideMapFeatures = [
    {
        featureType: 'poi',
        stylers: [{ visibility: 'off' }]
    },
    {
        featureType: 'transit',
        stylers: [{ visibility: 'off' }]
    }
];

// 지도 ID (환경변수에서 가져옴)
export const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;

// 맵 ID가 있을 경우 로컬 styles를 제거하여 충돌 경고 방지
const commonStyles = MAP_ID ? {} : { styles: hideMapFeatures };

// 기본 지도 옵션 (UI 컨트롤 포함)
export const defaultMapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
    clickableIcons: false,
    ...commonStyles
};

// 러닝 화면용 지도 옵션 (모든 UI 숨김)
export const runningMapOptions = {
    disableDefaultUI: true,
    zoomControl: false,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
    clickableIcons: false,
    ...commonStyles
};

// 인터랙티브 지도 옵션 (풀스크린 포함)
export const interactiveMapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: true,
    gestureHandling: 'greedy',
    ...commonStyles
};

// 지도 라이브러리 목록
export const LIBRARIES = ['places', 'marker'];

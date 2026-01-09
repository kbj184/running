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

// 기본 지도 옵션 (UI 컨트롤 포함)
export const defaultMapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
    clickableIcons: false,
    styles: hideMapFeatures
};

// 러닝 화면용 지도 옵션 (모든 UI 숨김)
export const runningMapOptions = {
    disableDefaultUI: true,
    zoomControl: false,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
    clickableIcons: false,
    styles: hideMapFeatures
};

// 인터랙티브 지도 옵션 (풀스크린 포함)
export const interactiveMapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: true,
    gestureHandling: 'greedy',
    styles: hideMapFeatures
};

// 지도 라이브러리 목록
export const LIBRARIES = ['places', 'marker'];

// 지도 ID (환경변수에서 가져옴)
export const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;

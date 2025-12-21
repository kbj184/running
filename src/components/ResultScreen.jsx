import { GoogleMap, MarkerF, PolylineF, useJsApiLoader } from '@react-google-maps/api';
import { formatTime, formatDistance } from '../utils/gps';

const containerStyle = {
    width: '100%',
    height: '100%'
};

const mapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
    clickableIcons: false,
    styles: [
        {
            featureType: "poi",
            stylers: [{ visibility: "off" }],
        },
        {
            featureType: "transit",
            elementType: "labels.icon",
            stylers: [{ visibility: "off" }],
        },
    ],
};

// 속도에 따른 색상 (히트맵)
const getSpeedColor = (speedKmh) => {
    if (speedKmh === undefined || speedKmh === null) return "#667eea"; // 기본값
    if (speedKmh <= 0) return "#667eea";
    if (speedKmh < 6) return "#10b981"; // 걷기 (초록)
    if (speedKmh < 9) return "#f59e0b"; // 조깅 (주황)
    if (speedKmh < 12) return "#ef4444"; // 러닝 (빨강)
    return "#7c3aed"; // 스프린트 (보라)
};

function ResultScreen({ result, onSave, onDelete, mode = 'finish' }) {
    const { distance, duration, speed, pace, route, wateringSegments = [], splits = [] } = result;

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        language: 'ko'
    });

    const avgSpeed = speed || 0;
    const avgPace = pace || 0;
    const calories = Math.floor(distance * 60);

    const center = route && route.length > 0
        ? route[Math.floor(route.length / 2)]
        : { lat: 37.5665, lng: 126.9780 };

    // 지도 경로 세그먼트 생성 (속도별 색상 적용)
    const mapSegments = (() => {
        if (!route || route.length < 2) return [];

        const segments = [];
        let currentPath = [];
        let currentColor = getSpeedColor(route[0]?.speed);
        let currentIsWatering = false; // 현재 세그먼트가 급수 중인지

        // 급수 구간 판별
        const isIndexInWatering = (idx) => {
            for (const seg of wateringSegments) {
                if (idx >= seg.start && idx < seg.end) return true;
            }
            return false;
        };

        // 초기 상태 설정
        if (isIndexInWatering(0)) {
            currentColor = "#06b6d4"; // 하늘색
            currentIsWatering = true;
        }

        for (let i = 0; i < route.length - 1; i++) {
            const p1 = route[i];
            const p2 = route[i + 1];

            const watering = isIndexInWatering(i);
            // 급수 중이면 하늘색, 아니면 속도 색상, 속도 정보 없으면 기본 보라색
            let color = watering ? "#06b6d4" : getSpeedColor(p1.speed);

            if (currentPath.length === 0) {
                currentPath.push(p1);
                currentColor = color;
                currentIsWatering = watering;
            }

            if (color !== currentColor) {
                currentPath.push(p1);
                segments.push({ path: [...currentPath], color: currentColor });
                currentPath = [p1];
                currentColor = color;
                currentIsWatering = watering;
            }

            currentPath.push(p2);
        }

        if (currentPath.length > 0) {
            segments.push({ path: currentPath, color: currentColor });
        }

        return segments;
    })();

    return (
        <div className="result-screen">
            <div className="result-header">
                <div className="result-title">
                    <span className="result-icon">🎉</span>
                    <h1>{mode === 'view' ? '기록 상세' : '러닝 완료!'}</h1>
                </div>
                <button className="result-close-button" onClick={onSave}>✕</button>
            </div>

            <div className="result-main-stats">
                <div className="result-main-card">
                    <div className="result-main-label">총 거리</div>
                    <div className="result-main-value">{formatDistance(distance)}</div>
                </div>
                <div className="result-main-card">
                    <div className="result-main-label">총 시간</div>
                    <div className="result-main-value">{formatTime(duration)}</div>
                </div>
            </div>

            <div className="result-stats-grid">
                <div className="result-stat-card">
                    <div className="result-stat-icon">🏃‍♂️</div>
                    <div className="result-stat-info">
                        <div className="result-stat-label">평균 속도</div>
                        <div className="result-stat-value">{avgSpeed.toFixed(1)} km/h</div>
                    </div>
                </div>
                <div className="result-stat-card">
                    <div className="result-stat-icon">⚡</div>
                    <div className="result-stat-info">
                        <div className="result-stat-label">평균 페이스</div>
                        <div className="result-stat-value">
                            {avgPace > 0 && avgPace < 100 ? avgPace.toFixed(1) : '0.0'} min/km
                        </div>
                    </div>
                </div>
                <div className="result-stat-card">
                    <div className="result-stat-icon">🔥</div>
                    <div className="result-stat-info">
                        <div className="result-stat-label">소모 칼로리</div>
                        <div className="result-stat-value">{calories} kcal</div>
                    </div>
                </div>
                <div className="result-stat-card">
                    <div className="result-stat-icon">📍</div>
                    <div className="result-stat-info">
                        <div className="result-stat-label">경로 포인트</div>
                        <div className="result-stat-value">{route ? route.length : 0}개</div>
                    </div>
                </div>
            </div>

            {/* 1km 구간 기록 (Splits) 섹션 - 데이터가 있을 때만 표시 */}
            {splits && splits.length > 0 && (
                <div className="result-splits-section">
                    <h2 className="result-section-title">
                        <span>🚩</span>
                        <span>구간 기록</span>
                    </h2>
                    <div className="splits-table-container">
                        <table className="splits-table">
                            <thead>
                                <tr>
                                    <th>구간</th>
                                    <th>시간</th>
                                    <th>페이스</th>
                                </tr>
                            </thead>
                            <tbody>
                                {splits.map((split, idx) => (
                                    <tr key={idx}>
                                        <td>{split.km} km</td>
                                        <td>{formatTime(split.duration)}</td>
                                        <td>{split.pace.toFixed(2)} min/km</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="result-map-section">
                <h2 className="result-section-title">
                    <span>🗺️</span>
                    <span>이동 경로</span>
                </h2>
                <div className="result-map">
                    {loadError ? <div className="error">지도 로딩 실패</div> :
                        !isLoaded ? <div className="loading">로딩 중...</div> :
                            !route || route.length === 0 ? <div className="empty">경로 없음</div> : (
                                <GoogleMap
                                    mapContainerStyle={containerStyle}
                                    center={center}
                                    zoom={14}
                                    options={mapOptions}
                                >
                                    {/* 속도별 색상 적용된 경로 */}
                                    {mapSegments.map((segment, idx) => (
                                        <PolylineF
                                            key={idx}
                                            path={segment.path}
                                            options={{
                                                strokeColor: segment.color,
                                                strokeOpacity: 0.9,
                                                strokeWeight: 6,
                                            }}
                                        />
                                    ))}

                                    {/* 급수 아이콘 마커 */}
                                    {window.google && wateringSegments.map((segment, idx) => (
                                        segment.start < route.length && (
                                            <MarkerF
                                                key={`water-start-${idx}`}
                                                position={route[segment.start]}
                                                icon={{
                                                    path: window.google.maps.SymbolPath.CIRCLE,
                                                    scale: 0, fillOpacity: 0, strokeWeight: 0
                                                }}
                                                label={{ text: "💧", fontSize: "24px" }}
                                            />
                                        )
                                    ))}

                                    {window.google && (
                                        <MarkerF
                                            position={route[0]}
                                            icon={{
                                                path: window.google.maps.SymbolPath.CIRCLE,
                                                scale: 6, fillColor: "#22c55e", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 3
                                            }}
                                        />
                                    )}
                                    {window.google && (
                                        <MarkerF
                                            position={route[route.length - 1]}
                                            icon={{
                                                path: window.google.maps.SymbolPath.CIRCLE,
                                                scale: 6, fillColor: "#ef4444", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 3
                                            }}
                                        />
                                    )}
                                </GoogleMap>
                            )}
                </div>
            </div>

            <div className="result-actions" style={{ display: 'flex', gap: '12px' }}>
                <button
                    className="result-action-button delete"
                    onClick={onDelete}
                    style={{ backgroundColor: '#ef4444', flex: '0 0 auto', width: 'auto', padding: '0 24px' }}
                >
                    <span>🗑️</span><span>삭제하기</span>
                </button>
                <button
                    className="result-action-button primary"
                    onClick={onSave}
                    style={{ flex: 1 }}
                >
                    {mode === 'view' ? <><span>🏠</span><span>홈으로</span></> : <><span>💾</span><span>저장하기</span></>}
                </button>
            </div>

            <style>{`
                .result-splits-section {
                    margin-bottom: 24px;
                }
                .splits-table-container {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                .splits-table {
                    width: 100%;
                    border-collapse: collapse;
                    color: #fff;
                    font-size: 14px;
                }
                .splits-table th {
                    background: rgba(102, 126, 234, 0.2);
                    padding: 12px;
                    text-align: center;
                    font-weight: 600;
                    color: #a5b4fc;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }
                .splits-table td {
                    padding: 12px;
                    text-align: center;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }
                .splits-table tr:last-child td {
                    border-bottom: none;
                }
                .splits-table tr:hover td {
                    background: rgba(255, 255, 255, 0.05);
                }
            `}</style>
        </div>
    );
}

export default ResultScreen;

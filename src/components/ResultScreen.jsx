import { GoogleMap, MarkerF, PolylineF, useJsApiLoader } from '@react-google-maps/api';
import { formatTime, formatDistance } from '../utils/gps';
import './result-screen.css';

const containerStyle = {
    width: '100%',
    height: '100%'
};

const mapOptions = {
    disableDefaultUI: true,
    zoomControl: false,
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

const getSpeedColor = (speedKmh) => {
    if (speedKmh === undefined || speedKmh === null) return "#4318FF";
    if (speedKmh <= 0) return "#4318FF";
    if (speedKmh < 6) return "#10b981";
    if (speedKmh < 9) return "#f59e0b";
    if (speedKmh < 12) return "#ef4444";
    return "#7c3aed";
};

function ResultScreen({ result, onSave, onDelete, mode = 'finish' }) {
    const {
        distance,
        duration,
        speed,
        pace,
        route,
        wateringSegments = [],
        splits = [],
        currentElevation = 0,
        totalAscent = 0,
        totalDescent = 0
    } = result;

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

    const mapSegments = (() => {
        if (!route || route.length < 2) return [];
        const segments = [];
        let currentPath = [];
        const isIndexInWatering = (idx) => {
            for (const seg of wateringSegments) {
                if (idx >= seg.start && idx < seg.end) return true;
            }
            return false;
        };

        let currentColor = isIndexInWatering(0) ? "#06b6d4" : getSpeedColor(route[0]?.speed);

        for (let i = 0; i < route.length - 1; i++) {
            const p1 = route[i];
            const p2 = route[i + 1];
            const watering = isIndexInWatering(i);
            let color = watering ? "#06b6d4" : getSpeedColor(p1.speed);

            if (currentPath.length === 0) {
                currentPath.push(p1);
                currentColor = color;
            }

            if (color !== currentColor) {
                currentPath.push(p1);
                segments.push({ path: [...currentPath], color: currentColor });
                currentPath = [p1];
                currentColor = color;
            }
            currentPath.push(p2);
        }

        if (currentPath.length > 0) {
            segments.push({ path: currentPath, color: currentColor });
        }
        return segments;
    })();

    return (
        <div className="result-screen-container">
            <header className="result-screen-header">
                <h1>{mode === 'view' ? 'Record Detail' : 'Well Done!'}</h1>
                <button className="result-close-x" onClick={onSave}>✕</button>
            </header>

            <section className="result-summary-section">
                <div className="result-main-stats-row">
                    <div className="result-main-stat-item">
                        <div className="result-stat-label">TIME</div>
                        <div className="result-stat-value-huge">{formatTime(duration)}</div>
                    </div>
                    <div className="result-main-stat-item center">
                        <div className="result-stat-label">DISTANCE</div>
                        <div className="result-stat-value-huge">{formatDistance(distance)}</div>
                    </div>
                </div>

                <div className="result-secondary-stats-grid">
                    <div className="result-secondary-item">
                        <div className="result-secondary-label">Avg Speed</div>
                        <div className="result-secondary-value">{avgSpeed.toFixed(1)} <small>km/h</small></div>
                    </div>
                    <div className="result-secondary-item">
                        <div className="result-secondary-label">Calories</div>
                        <div className="result-secondary-value">{calories} <small>kcal</small></div>
                    </div>
                    <div className="result-secondary-item">
                        <div className="result-secondary-label">Avg Pace</div>
                        <div className="result-secondary-value">{avgPace > 0 && avgPace < 100 ? avgPace.toFixed(1) : '0.0'} <small>min/km</small></div>
                    </div>
                </div>

                {/* 고도 정보 */}
                {(totalAscent > 0 || totalDescent > 0) && (
                    <div className="result-secondary-stats-grid" style={{ marginTop: '12px' }}>
                        <div className="result-secondary-item">
                            <div className="result-secondary-label">Elevation</div>
                            <div className="result-secondary-value" style={{ color: '#667eea' }}>{currentElevation.toFixed(0)} <small>m</small></div>
                        </div>
                        <div className="result-secondary-item">
                            <div className="result-secondary-label">↗ Ascent</div>
                            <div className="result-secondary-value" style={{ color: '#22c55e' }}>{totalAscent.toFixed(0)} <small>m</small></div>
                        </div>
                        <div className="result-secondary-item">
                            <div className="result-secondary-label">↘ Descent</div>
                            <div className="result-secondary-value" style={{ color: '#ef4444' }}>{totalDescent.toFixed(0)} <small>m</small></div>
                        </div>
                    </div>
                )}
            </section>

            <section className="result-card-section">
                <div className="result-section-title-simple">
                    <span>🗺️</span> Running Path
                </div>
                <div className="result-map-card">
                    {loadError ? <div>Error mapping</div> :
                        !isLoaded ? <div>Loading...</div> :
                            !route || route.length === 0 ? <div>No path</div> : (
                                <GoogleMap
                                    mapContainerStyle={containerStyle}
                                    center={center}
                                    zoom={15}
                                    options={mapOptions}
                                >
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
                                    {window.google && (
                                        <>
                                            <MarkerF
                                                position={route[0]}
                                                icon={{
                                                    path: window.google.maps.SymbolPath.CIRCLE,
                                                    scale: 6, fillColor: "#22c55e", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 3
                                                }}
                                            />
                                            <MarkerF
                                                position={route[route.length - 1]}
                                                icon={{
                                                    path: window.google.maps.SymbolPath.CIRCLE,
                                                    scale: 6, fillColor: "#4318FF", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 3
                                                }}
                                            />
                                        </>
                                    )}
                                </GoogleMap>
                            )}
                </div>
            </section>

            {splits && splits.length > 0 && (
                <section className="result-card-section">
                    <div className="result-section-title-simple">
                        <span>🚩</span> Splits (1km)
                    </div>
                    <div className="splits-list">
                        {splits.map((split, idx) => (
                            <div className="split-row-item" key={idx}>
                                <div className="split-km-badge">{split.km} km</div>
                                <div className="split-time-value">{formatTime(split.duration)}</div>
                                <div className="split-pace-value">{split.pace.toFixed(2)} min/km</div>
                                {split.elevation !== undefined && (
                                    <div className="split-elevation-value" style={{ color: '#667eea', fontSize: '12px' }}>
                                        🗻 {split.elevation.toFixed(0)}m
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <div className="result-footer-actions">
                <button className="result-btn result-btn-delete" onClick={onDelete}>
                    <span>🗑️</span> Delete
                </button>
                <button className="result-btn result-btn-save" onClick={onSave}>
                    {mode === 'view' ? 'Back Home' : 'Save Record'}
                </button>
            </div>
        </div>
    );
}

export default ResultScreen;

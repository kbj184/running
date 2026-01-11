import React, { useEffect } from 'react';
import MapView from '../map/MapView';

function RunningTab({
    runners,
    stats,
    selectedRunner,
    isRunning,
    showLabels,
    onRunnerClick,
    onRefresh,
    onStartToggle,
    onToggleLabels,
    onClosePanel,
    onBoundsChange
}) {
    // Fetch data when component mounts
    useEffect(() => {
        onRefresh();
    }, []);
    return (
        <div className="tab-content running-tab">
            {/* Map Controls Overlay - Right Side */}
            <div className="map-controls-overlay">
                <button
                    onClick={onToggleLabels}
                    className={`map-control-icon-btn ${showLabels ? 'active' : ''}`}
                    title={showLabels ? '지명 ON' : '지명 OFF'}
                >
                    📍
                </button>
            </div>

            {/* Map */}
            <MapView
                runners={runners}
                stats={stats}
                selectedRunner={selectedRunner}
                isRunning={isRunning}
                onRunnerClick={onRunnerClick}
                onRefresh={onRefresh}
                onStartToggle={onStartToggle}
                showLabels={showLabels}
                onBoundsChange={onBoundsChange}
            />

            {/* Empty State Message */}
            {runners.length === 0 && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    color: 'white',
                    padding: '2rem',
                    borderRadius: '12px',
                    zIndex: 1000,
                    maxWidth: '300px'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏃‍♂️</div>
                    <h3 style={{ margin: '0 0 0.5rem 0' }}>아직 러닝 기록이 없습니다</h3>
                    <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>
                        첫 러닝을 시작해보세요!
                    </p>
                </div>
            )}
        </div>
    );
}

export default RunningTab;

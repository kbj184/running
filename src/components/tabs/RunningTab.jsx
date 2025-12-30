import React from 'react';
import MapView from '../map/MapView';
import RunnerDetailPanel from '../runner/RunnerDetailPanel';

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
    onClosePanel
}) {
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
            />

            {/* Runner Detail Panel */}
            <RunnerDetailPanel
                runner={selectedRunner}
                onClose={onClosePanel}
            />
        </div>
    );
}

export default RunningTab;

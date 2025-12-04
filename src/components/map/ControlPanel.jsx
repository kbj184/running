import React from 'react';

function ControlPanel({ onRefresh }) {
    return (
        <div className="control-panel">
            <button className="control-button" onClick={onRefresh}>
                <span>🔄</span>
                <span>새로고침</span>
            </button>
        </div>
    );
}

export default ControlPanel;

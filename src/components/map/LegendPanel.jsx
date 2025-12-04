import React from 'react';
import { RUNNER_GRADES } from '../../constants/runnerGrades';

function LegendPanel({ stats, show }) {
    if (!show) return null;

    return (
        <div className="legend-panel">
            <div className="legend-title">
                <span>📊</span>
                <span>러너 등급</span>
            </div>
            <div className="legend-items">
                {Object.entries(RUNNER_GRADES).map(([key, grade]) => (
                    <div key={key} className="legend-item">
                        <div
                            className="legend-color"
                            style={{ backgroundColor: grade.color }}
                        />
                        <div className="legend-info">
                            <div className="legend-label">{grade.name}</div>
                            <div className="legend-description">{grade.description}</div>
                        </div>
                        <div className="legend-count">{stats[key] || 0}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default LegendPanel;

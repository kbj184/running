import React from 'react';
import { PolylineF } from '@react-google-maps/api';
import AdvancedMarker from '../common/AdvancedMarker';
import { RUNNER_GRADES } from '../../constants/runnerGrades';

function RunnerMarkers({ map, runners, selectedRunner, onRunnerClick }) {
    return (
        <>
            {/* 선택된 러너의 경로 표시 */}
            {selectedRunner && (
                <>
                    <PolylineF
                        path={selectedRunner.route}
                        options={{
                            strokeColor: RUNNER_GRADES[selectedRunner.grade].color,
                            strokeOpacity: 0.8,
                            strokeWeight: 4,
                        }}
                    />
                    {/* 시작점 마커 */}
                    <AdvancedMarker
                        map={map}
                        position={selectedRunner.route[0]}
                    >
                        <div style={{
                            width: '10px',
                            height: '10px',
                            backgroundColor: '#22c55e',
                            borderRadius: '50%',
                            border: '2px solid white',
                            boxShadow: '0 0 4px rgba(0,0,0,0.3)'
                        }} />
                    </AdvancedMarker>
                </>
            )}

            {/* 모든 러너 마커 */}
            {runners.map(runner => {
                const gradeInfo = RUNNER_GRADES[runner.grade];
                const isSelected = selectedRunner && selectedRunner.id === runner.id;
                return (
                    <AdvancedMarker
                        key={runner.id}
                        map={map}
                        position={runner.position}
                        onClick={() => onRunnerClick(runner)}
                        zIndex={isSelected ? 10 : 1}
                    >
                        <div style={{
                            width: isSelected ? '16px' : '12px',
                            height: isSelected ? '16px' : '12px',
                            backgroundColor: gradeInfo.color,
                            borderRadius: '50%',
                            border: isSelected ? '3px solid white' : '2px solid white',
                            opacity: isSelected ? 1 : 0.8,
                            boxShadow: isSelected ? '0 0 8px rgba(0,0,0,0.4)' : '0 0 4px rgba(0,0,0,0.2)',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer'
                        }} />
                    </AdvancedMarker>
                );
            })}
        </>
    );
}

export default RunnerMarkers;

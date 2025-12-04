import React from 'react';
import { Marker, Polyline } from '@react-google-maps/api';
import { RUNNER_GRADES } from '../../constants/runnerGrades';

function RunnerMarkers({ runners, selectedRunner, onRunnerClick }) {
    return (
        <>
            {/* 선택된 러너의 경로 표시 */}
            {selectedRunner && (
                <>
                    <Polyline
                        path={selectedRunner.route}
                        options={{
                            strokeColor: RUNNER_GRADES[selectedRunner.grade].color,
                            strokeOpacity: 0.8,
                            strokeWeight: 4,
                        }}
                    />
                    {/* 시작점 마커 */}
                    <Marker
                        position={selectedRunner.route[0]}
                        icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 5,
                            fillColor: "#22c55e",
                            fillOpacity: 1,
                            strokeColor: "#ffffff",
                            strokeWeight: 2,
                        }}
                    />
                </>
            )}

            {/* 모든 러너 마커 */}
            {runners.map(runner => {
                const gradeInfo = RUNNER_GRADES[runner.grade];
                const isSelected = selectedRunner && selectedRunner.id === runner.id;
                return (
                    <Marker
                        key={runner.id}
                        position={runner.position}
                        onClick={() => onRunnerClick(runner)}
                        icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: isSelected ? 8 : 6,
                            fillColor: gradeInfo.color,
                            fillOpacity: isSelected ? 1 : 0.7,
                            strokeColor: "#ffffff",
                            strokeWeight: isSelected ? 3 : 2,
                        }}
                    />
                );
            })}
        </>
    );
}

export default RunnerMarkers;

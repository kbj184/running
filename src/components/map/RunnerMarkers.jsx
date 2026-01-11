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
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center'
                        }}>
                            {/* 마커 점 */}
                            <div style={{
                                width: isSelected ? '16px' : '12px',
                                height: isSelected ? '16px' : '12px',
                                backgroundColor: gradeInfo.color,
                                borderRadius: '50%',
                                border: isSelected ? '3px solid white' : '2px solid white',
                                opacity: isSelected ? 1 : 0.8,
                                boxShadow: isSelected ? '0 0 8px rgba(0,0,0,0.4)' : '0 0 4px rgba(0,0,0,0.2)',
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                                position: 'relative',
                                zIndex: 1
                            }} />

                            {/* 유저 정보 말풍선 - 선택된 경우만 표시 */}
                            {isSelected && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: '100%',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    marginBottom: '8px',
                                    backgroundColor: 'white',
                                    borderRadius: '12px',
                                    padding: '8px 12px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                    border: `2px solid ${gradeInfo.color}`,
                                    minWidth: '140px',
                                    transition: 'all 0.3s ease',
                                    pointerEvents: 'auto',
                                    zIndex: 10,
                                    whiteSpace: 'nowrap'
                                }}>
                                    {/* 닫기 버튼 */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRunnerClick(null);
                                        }}
                                        style={{
                                            position: 'absolute',
                                            top: '-8px',
                                            right: '-8px',
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            backgroundColor: gradeInfo.color,
                                            color: 'white',
                                            border: '2px solid white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: 'bold',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                            padding: 0,
                                            lineHeight: 1
                                        }}
                                    >
                                        ✕
                                    </button>

                                    {/* 말풍선 꼬리 */}
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '-6px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        width: 0,
                                        height: 0,
                                        borderLeft: '6px solid transparent',
                                        borderRight: '6px solid transparent',
                                        borderTop: `6px solid ${gradeInfo.color}`,
                                    }} />

                                    {/* 닉네임과 등급 */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        marginBottom: '6px'
                                    }}>
                                        <span style={{
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            color: '#1a1a1a'
                                        }}>
                                            {runner.nickname}
                                        </span>
                                        <span style={{
                                            fontSize: '9px',
                                            padding: '2px 6px',
                                            borderRadius: '8px',
                                            backgroundColor: gradeInfo.color,
                                            color: 'white',
                                            fontWeight: '600'
                                        }}>
                                            {gradeInfo.name}
                                        </span>
                                    </div>

                                    {/* 러닝 정보 */}
                                    <div style={{
                                        display: 'flex',
                                        gap: '8px',
                                        fontSize: '11px',
                                        color: '#666'
                                    }}>
                                        <span>📏 {runner.distance}km</span>
                                        <span>⚡ {runner.speed}km/h</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </AdvancedMarker>
                );
            })}
        </>
    );
}

export default RunnerMarkers;

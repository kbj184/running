import React, { useState, useMemo } from 'react';
import { api } from '../../../utils/api';
import { generateRouteMapImage } from '../../../utils/mapThumbnail';

function CourseDetailPage({ user, crewId, selectedRecord, onClose, onSuccess }) {
    const [description, setDescription] = useState('');
    const [registering, setRegistering] = useState(false);

    const getAuthHeaders = () => {
        if (!user || !user.accessToken) return {};
        return {
            'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
        };
    };

    // 정적 지도 이미지 생성 (ResultScreen과 동일한 방식)
    const mapImageUrl = useMemo(() => {
        if (selectedRecord.route) {
            try {
                const route = JSON.parse(selectedRecord.route);
                if (route && route.length > 0) {
                    const wateringSegments = selectedRecord.wateringSegments || [];
                    return generateRouteMapImage(route, wateringSegments);
                }
            } catch (e) {
                console.error('Failed to parse route:', e);
            }
        }
        return selectedRecord.thumbnail;
    }, [selectedRecord.route, selectedRecord.wateringSegments, selectedRecord.thumbnail]);

    const handleRegister = async () => {
        try {
            setRegistering(true);

            const courseData = {
                name: `러닝 코스 - ${new Date(selectedRecord.timestamp || Date.now()).toLocaleDateString()}`,
                description: description.trim() || `거리: ${selectedRecord.distance?.toFixed(2)}km, 시간: ${Math.floor(selectedRecord.duration / 60)}분`,
                distance: selectedRecord.distance,
                routeData: selectedRecord.route,
                mapThumbnailUrl: selectedRecord.thumbnail
            };

            console.log('Course data to send:', courseData);

            const response = await api.request(`${import.meta.env.VITE_API_URL}/crew/${crewId}/courses`, {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(courseData)
            });

            if (response.ok) {
                onSuccess();
            } else {
                const errorText = await response.text();
                console.error('Failed to register course:', response.status, errorText);
                alert('코스 등록에 실패했습니다.');
            }
        } catch (error) {
            console.error('Failed to register course:', error);
            alert('코스 등록 중 오류가 발생했습니다.');
        } finally {
            setRegistering(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: '#fff',
                borderRadius: '16px',
                padding: '24px',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                overflowY: 'auto'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h3 style={{
                        margin: 0,
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#333'
                    }}>
                        코스 등록
                    </h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '24px',
                            cursor: 'pointer',
                            color: '#999',
                            padding: 0,
                            lineHeight: 1
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* Static Map - ResultScreen과 동일한 스타일 */}
                <div style={{
                    width: '100%',
                    height: '400px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    backgroundColor: '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {mapImageUrl ? (
                        <img
                            src={mapImageUrl}
                            alt="러닝 경로"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                            }}
                            onError={(e) => {
                                e.target.style.display = 'none';
                                const errorDiv = document.createElement('div');
                                errorDiv.style.cssText = 'display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-size:16px;';
                                errorDiv.textContent = '지도 로딩 실패';
                                e.target.parentElement.appendChild(errorDiv);
                            }}
                        />
                    ) : (
                        <div style={{ fontSize: '40px', color: '#ccc' }}>🗺️</div>
                    )}
                </div>

                {/* Course Info */}
                <div style={{
                    padding: '16px',
                    backgroundColor: '#f8f8f8',
                    borderRadius: '12px'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px'
                    }}>
                        <div style={{ fontSize: '14px', color: '#666' }}>거리</div>
                        <div style={{ fontSize: '18px', fontWeight: '700', color: '#FF9A56' }}>
                            {selectedRecord.distance?.toFixed(2)} km
                        </div>
                    </div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{ fontSize: '14px', color: '#666' }}>시간</div>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
                            {Math.floor(selectedRecord.duration / 60)}분
                        </div>
                    </div>
                </div>

                {/* Description Input */}
                <div>
                    <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#333',
                        marginBottom: '8px'
                    }}>
                        코스 설명
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="코스에 대한 설명을 입력하세요 (선택사항)"
                        maxLength={500}
                        style={{
                            width: '100%',
                            minHeight: '120px',
                            padding: '12px',
                            fontSize: '14px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px',
                            resize: 'vertical',
                            fontFamily: 'inherit',
                            boxSizing: 'border-box'
                        }}
                    />
                    <div style={{
                        fontSize: '12px',
                        color: '#999',
                        marginTop: '4px',
                        textAlign: 'right'
                    }}>
                        {description.length} / 500
                    </div>
                </div>

                {/* Action Buttons */}
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    marginTop: '8px'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1,
                            padding: '14px',
                            backgroundColor: '#f0f0f0',
                            color: '#666',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '15px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        취소
                    </button>
                    <button
                        onClick={handleRegister}
                        disabled={registering}
                        style={{
                            flex: 1,
                            padding: '14px',
                            backgroundColor: registering ? '#ccc' : '#FF9A56',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '15px',
                            fontWeight: '600',
                            cursor: registering ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {registering ? '등록 중...' : '등록'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CourseDetailPage;

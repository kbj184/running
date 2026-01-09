import React, { useState, useEffect } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { defaultMapOptions } from '../../utils/mapConfig';


const mapContainerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '12px'
};

function EditActivityAreaModal({ isOpen, onClose, onSave, user, currentArea }) {
    const [markerPos, setMarkerPos] = useState(null);
    const [selectedAddress, setSelectedAddress] = useState('');
    const [locationData, setLocationData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (currentArea) {
            setMarkerPos({ lat: currentArea.latitude, lng: currentArea.longitude });
            setSelectedAddress(currentArea.adminLevelFull);
        }
    }, [currentArea]);

    if (!isOpen) return null;

    const handleMapClick = async (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        const newPos = { lat, lng };

        setIsLoading(true);
        try {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: newPos }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    const addressComponents = results[0].address_components;

                    let data = {
                        mainCountryCode: '',
                        mainCountryName: '',
                        adminLevel1: '',
                        adminLevel2: '',
                        adminLevel3: '',
                        adminLevelFull: results[0].formatted_address,
                        latitude: lat,
                        longitude: lng
                    };

                    addressComponents.forEach(component => {
                        if (component.types.includes('country')) {
                            data.mainCountryCode = component.short_name;
                            data.mainCountryName = component.long_name;
                        }
                        if (component.types.includes('administrative_area_level_1')) {
                            data.adminLevel1 = component.long_name;
                        }
                    });

                    // 두 번째 패스: adminLevel3 (동/읍/면) 먼저 찾기
                    addressComponents.forEach(component => {
                        if (component.types.includes('sublocality_level_2')) {
                            data.adminLevel3 = component.long_name;
                        }
                    });

                    // 세 번째 패스: adminLevel2 (시/군/구) 찾기
                    addressComponents.forEach(component => {
                        if (component.types.includes('locality')) {
                            data.adminLevel2 = component.long_name;
                        }
                        if (component.types.includes('sublocality_level_1')) {
                            if (!data.adminLevel2) {
                                data.adminLevel2 = component.long_name;
                            } else if (!data.adminLevel3) {
                                data.adminLevel3 = component.long_name;
                            }
                        }
                        if (component.types.includes('sublocality') && !data.adminLevel2 && !data.adminLevel3) {
                            data.adminLevel2 = component.long_name;
                        }
                    });

                    setMarkerPos(newPos);
                    setSelectedAddress(results[0].formatted_address);
                    setLocationData(data);
                } else {
                    alert('주소 정보를 가져올 수 없습니다.');
                }
                setIsLoading(false);
            });
        } catch (err) {
            console.error('Geocoding error:', err);
            setIsLoading(false);
        }
    };

    const handleSave = () => {
        if (!locationData) {
            alert('지도에서 위치를 선택해주세요.');
            return;
        }
        onSave(locationData);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000,
            backdropFilter: 'blur(5px)'
        }}>
            <div style={{
                width: '90%',
                maxWidth: '600px',
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                padding: '24px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                maxHeight: '90vh',
                overflow: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>📍 주 활동 지역 변경</h2>
                    <button onClick={onClose} style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '24px',
                        cursor: 'pointer',
                        color: '#666'
                    }}>✕</button>
                </div>

                <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
                    지도를 클릭하여 새로운 활동 지역을 선택하세요
                </p>

                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={markerPos || { lat: 37.5665, lng: 126.9780 }}
                    zoom={13}
                    onClick={handleMapClick}
                    options={defaultMapOptions}
                >
                    {markerPos && (
                        <Marker
                            position={markerPos}
                            icon={{
                                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="16" cy="16" r="14" fill="#00f2fe" stroke="#fff" stroke-width="2"/>
                                        <text x="16" y="21" font-size="16" text-anchor="middle" fill="#fff">📍</text>
                                    </svg>
                                `),
                                scaledSize: new window.google.maps.Size(32, 32)
                            }}
                        />
                    )}
                </GoogleMap>

                {selectedAddress && (
                    <div style={{
                        marginTop: '16px',
                        padding: '12px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#333'
                    }}>
                        <strong>선택된 지역:</strong> {selectedAddress}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1,
                            padding: '14px',
                            backgroundColor: '#f3f4f6',
                            color: '#333',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLoading || !locationData}
                        style={{
                            flex: 1,
                            padding: '14px',
                            backgroundColor: isLoading || !locationData ? '#ccc' : '#4318FF',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: isLoading || !locationData ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {isLoading ? '처리 중...' : '변경하기'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EditActivityAreaModal;

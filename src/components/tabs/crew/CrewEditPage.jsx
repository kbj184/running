import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, Autocomplete } from '@react-google-maps/api';
import AdvancedMarker from '../../common/AdvancedMarker';
import { api } from '../../../utils/api';
import { defaultMapOptions, MAP_ID } from '../../../utils/mapConfig';

const CREW_IMAGES = [
    { id: 1, emoji: '🦁', bg: 'linear-gradient(135deg, #FF6B6B 0%, #C44569 100%)' },
    { id: 2, emoji: '🐯', bg: 'linear-gradient(135deg, #FFA502 0%, #FF6348 100%)' },
    { id: 3, emoji: '🐺', bg: 'linear-gradient(135deg, #747d8c 0%, #2f3542 100%)' },
    { id: 4, emoji: '🦅', bg: 'linear-gradient(135deg, #1e90ff 0%, #3742fa 100%)' },
    { id: 5, emoji: '🦊', bg: 'linear-gradient(135deg, #e056fd 0%, #be2edd 100%)' },
    { id: 6, emoji: '🐉', bg: 'linear-gradient(135deg, #badc58 0%, #6ab04c 100%)' },
    { id: 7, emoji: '⚡', bg: 'linear-gradient(135deg, #feca57 0%, #ff9f43 100%)' },
    { id: 8, emoji: '🔥', bg: 'linear-gradient(135deg, #ff4757 0%, #ff6b81 100%)' },
    { id: 9, emoji: '🛡️', bg: 'linear-gradient(135deg, #2ed573 0%, #7bed9f 100%)' },
    { id: 10, emoji: '👑', bg: 'linear-gradient(135deg, #5352ed 0%, #70a1ff 100%)' },
];



function CrewEditPage({ crew, user, onCancel, onComplete }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedImageId, setSelectedImageId] = useState(null);
    const [uploadedImage, setUploadedImage] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [map, setMap] = useState(null);
    const [markerPos, setMarkerPos] = useState(null);
    const [selectedAddress, setSelectedAddress] = useState('');
    const [mapCenter, setMapCenter] = useState({ lat: 37.5665, lng: 126.9780 });
    const autocompleteRef = useRef(null);

    useEffect(() => {
        if (crew) {
            setName(crew.name);
            setDescription(crew.description || '');

            // 이미지 설정
            try {
                const imgData = JSON.parse(crew.imageUrl);
                if (imgData.url) {
                    setUploadedImage(imgData.url);
                } else if (imgData.emoji) {
                    const matched = CREW_IMAGES.find(ci => ci.emoji === imgData.emoji);
                    if (matched) setSelectedImageId(matched.id);
                    else setSelectedImageId(CREW_IMAGES[0].id);
                } else {
                    setSelectedImageId(CREW_IMAGES[0].id);
                }
            } catch {
                if (crew.imageUrl && crew.imageUrl.startsWith('http')) {
                    setUploadedImage(crew.imageUrl);
                } else {
                    setSelectedImageId(CREW_IMAGES[0].id);
                }
            }

            // 활동 지역 설정
            if (crew.activityAreas && crew.activityAreas.length > 0) {
                const area = crew.activityAreas[0];
                const pos = { lat: area.latitude, lng: area.longitude };
                setMarkerPos(pos);
                setMapCenter(pos);
                setSelectedAddress(area.adminLevelFull || `${area.adminLevel1} ${area.adminLevel2} ${area.adminLevel3}`);
            }
        }
    }, [crew]);

    const getLocationData = (result, providedPos = null) => {
        const addressComponents = result.address_components;
        const lat = providedPos ? (typeof providedPos.lat === 'function' ? providedPos.lat() : providedPos.lat) : result.geometry.location.lat();
        const lng = providedPos ? (typeof providedPos.lng === 'function' ? providedPos.lng() : providedPos.lng) : result.geometry.location.lng();

        let locationData = {
            countryCode: '',
            countryName: '',
            adminLevel1: '',
            adminLevel2: '',
            adminLevel3: '',
            adminLevelFull: result.formatted_address,
            latitude: lat,
            longitude: lng
        };

        addressComponents.forEach(component => {
            const types = component.types;
            const name = component.long_name;

            if (types.includes('country')) {
                locationData.countryCode = component.short_name;
                locationData.countryName = name;
            } else if (types.includes('administrative_area_level_1')) {
                locationData.adminLevel1 = name;
            } else if (types.includes('locality') || types.includes('administrative_area_level_2')) {
                if (!locationData.adminLevel2 || name.endsWith('구') || name.endsWith('시')) {
                    locationData.adminLevel2 = name;
                }
            } else if (types.includes('sublocality_level_1')) {
                if (name.endsWith('구')) {
                    locationData.adminLevel2 = name;
                }
            }
        });

        if (!locationData.adminLevel2) {
            const guComp = addressComponents.find(c => c.long_name.endsWith('구'));
            if (guComp) locationData.adminLevel2 = guComp.long_name;
        }

        return locationData;
    };

    const handleMapClick = async (e) => {
        const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };

        try {
            const geocoder = new window.google.maps.Geocoder();
            const response = await geocoder.geocode({ location: newPos });

            if (response.results && response.results.length > 0) {
                const locationData = getLocationData(response.results[0], newPos);
                setMarkerPos({ lat: locationData.latitude, lng: locationData.longitude });
                setSelectedAddress(locationData.adminLevelFull);
            }
        } catch (error) {
            console.error('Map click geocoding error:', error);
        }
    };

    const onPlaceChanged = () => {
        if (autocompleteRef.current !== null) {
            const place = autocompleteRef.current.getPlace();
            if (place.geometry && place.geometry.location) {
                const locationData = getLocationData(place);
                const newPos = { lat: locationData.latitude, lng: locationData.longitude };
                setMarkerPos(newPos);
                setSelectedAddress(locationData.adminLevelFull);
                if (map) {
                    map.panTo(newPos);
                    map.setZoom(15);
                }
            }
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setError('파일 크기는 5MB 이하여야 합니다.');
            return;
        }
        if (!file.type.startsWith('image/')) {
            setError('이미지 파일만 업로드 가능합니다.');
            return;
        }

        setIsUploading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
            formData.append('folder', 'crews');

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
                { method: 'POST', body: formData }
            );

            if (!response.ok) throw new Error('이미지 업로드 실패');

            const data = await response.json();
            setUploadedImage(data.secure_url);
            setSelectedImageId(null);
        } catch (err) {
            console.error(err);
            setError('이미지 업로드 중 오류가 발생했습니다.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('크루 이름을 입력해주세요.');
            return;
        }
        if (!markerPos) {
            setError('활동 지역을 선택해주세요.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const selectedImage = CREW_IMAGES.find(img => img.id === selectedImageId) || CREW_IMAGES[0];
            let imageUrl;
            if (uploadedImage) {
                imageUrl = JSON.stringify({ url: uploadedImage });
            } else {
                imageUrl = JSON.stringify(selectedImage);
            }

            // 지오코딩하여 상세 지역 정보 가져오기
            const geocoder = new window.google.maps.Geocoder();
            const geoResponse = await geocoder.geocode({ location: markerPos });
            const locationData = getLocationData(geoResponse.results[0], markerPos);

            const requestBody = {
                name,
                description,
                imageUrl,
                activityAreas: [locationData]
            };

            const response = await api.request(`${import.meta.env.VITE_API_URL}/crew/${crew.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
                },
                body: JSON.stringify(requestBody)
            });

            if (response.ok) {
                const updatedCrew = await response.json();
                onComplete(updatedCrew);
                alert('크루 정보가 수정되었습니다.');
            } else {
                const errorText = await response.text();
                setError(errorText || '수정 실패');
            }
        } catch (err) {
            console.error('Update error:', err);
            setError('수정 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ padding: '20px', paddingBottom: '80px', maxWidth: '800px', margin: '0 auto', backgroundColor: '#fff', minHeight: '100%' }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '800', color: '#1a1a1a' }}>크루 설정</h2>

            {error && (
                <div style={{ padding: '12px', marginBottom: '16px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '8px', fontSize: '14px' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1a1a1a' }}>크루 이름</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e0e0e0', fontSize: '16px', boxSizing: 'border-box', color: '#1a1a1a' }}
                        required
                    />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1a1a1a' }}>크루 설명</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e0e0e0', fontSize: '16px', minHeight: '80px', boxSizing: 'border-box', color: '#1a1a1a' }}
                    />
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1a1a1a' }}>활동 지역</label>
                    <p style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
                        검색하거나 지도를 클릭하여 활동 지역을 선택하세요
                    </p>

                    {/* 검색창 */}
                    <Autocomplete
                        onLoad={(autocomplete) => { autocompleteRef.current = autocomplete; }}
                        onPlaceChanged={onPlaceChanged}
                    >
                        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', background: '#f8f9fa', borderRadius: '10px', padding: '10px 14px', border: '1px solid #e0e0e0' }}>
                            <span style={{ marginRight: '10px', fontSize: '16px' }}>🔍</span>
                            <input
                                type="text"
                                placeholder="구 또는 지역명 검색 (예: 강남구, 분당구)"
                                style={{ flex: 1, background: 'none', border: 'none', fontSize: '15px', outline: 'none', color: '#1a1a1a' }}
                            />
                        </div>
                    </Autocomplete>

                    {/* 지도 */}
                    <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #e0e0e0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                        <GoogleMap
                            mapContainerStyle={{ width: '100%', height: '350px' }}
                            center={mapCenter}
                            zoom={13}
                            onClick={handleMapClick}
                            onLoad={(mapInstance) => setMap(mapInstance)}
                            options={{
                                ...defaultMapOptions,
                                mapId: MAP_ID
                            }}
                        >
                            {markerPos && (
                                <AdvancedMarker map={map} position={markerPos}>
                                    <div style={{
                                        width: '24px',
                                        height: '24px',
                                        backgroundColor: '#00f2fe',
                                        borderRadius: '50%',
                                        border: '3px solid white',
                                        boxShadow: '0 0 10px rgba(0,242,254,0.5)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '14px'
                                    }}>📍</div>
                                </AdvancedMarker>
                            )}
                        </GoogleMap>
                    </div>

                    {selectedAddress && (
                        <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '8px', fontSize: '14px', color: '#1a1a1a', border: '1px solid #bfdbfe' }}>
                            <strong>선택된 지역:</strong> {selectedAddress}
                        </div>
                    )}
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: '#1a1a1a' }}>크루 이미지</label>
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} id="edit-crew-image" disabled={isUploading} />
                    <label htmlFor="edit-crew-image" style={{ display: 'inline-block', padding: '10px 18px', backgroundColor: '#f3f4f6', borderRadius: '8px', cursor: isUploading ? 'not-allowed' : 'pointer', fontSize: '14px', marginBottom: '16px', border: '1px solid #e0e0e0', color: '#1a1a1a', fontWeight: '600' }}>
                        {isUploading ? '업로드 중...' : '📷 이미지 변경'}
                    </label>

                    {uploadedImage ? (
                        <div>
                            <div onClick={() => { setUploadedImage(null); setSelectedImageId(CREW_IMAGES[0].id); }} style={{ width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', border: '3px solid #1a1a1a', cursor: 'pointer', display: 'inline-block' }}>
                                <img src={uploadedImage} alt="Uploaded" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>클릭하여 제거</p>
                        </div>
                    ) : (
                        <>
                            <div style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>또는 기본 이미지 선택</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                                {CREW_IMAGES.map((img) => (
                                    <button
                                        key={img.id}
                                        type="button"
                                        onClick={() => setSelectedImageId(img.id)}
                                        style={{
                                            width: '100%', aspectRatio: '1', borderRadius: '12px',
                                            border: selectedImageId === img.id ? '3px solid #1a1a1a' : '2px solid #e0e0e0',
                                            background: img.bg, fontSize: '24px', cursor: 'pointer',
                                            transform: selectedImageId === img.id ? 'scale(1.05)' : 'scale(1)',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {img.emoji}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="button" onClick={onCancel} style={{ flex: 1, padding: '16px', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', color: '#1a1a1a' }}>취소</button>
                    <button type="submit" disabled={isSubmitting} style={{ flex: 2, padding: '16px', backgroundColor: isSubmitting ? '#9ca3af' : '#1a1a1a', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                        {isSubmitting ? '저장 중...' : '저장하기'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default CrewEditPage;

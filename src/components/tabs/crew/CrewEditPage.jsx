import React, { useState, useEffect } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { api } from '../../../utils/api';

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

const mapContainerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '12px'
};

function CrewEditPage({ crew, user, onCancel, onComplete }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedImageId, setSelectedImageId] = useState(null);
    const [uploadedImage, setUploadedImage] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 활동 지역 상태
    const [activityAreas, setActivityAreas] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState('');
    const [mapCenter, setMapCenter] = useState({ lat: 37.5665, lng: 126.9780 });
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);

    useEffect(() => {
        if (crew) {
            setName(crew.name);
            setDescription(crew.description || '');

            // 이미지 설정
            try {
                const imgData = JSON.parse(crew.imageUrl);
                // CREW_IMAGES에 있는 emoji와 bg가 일치하는지 확인하거나, 그냥 url/emoji/bg 직접 사용
                // 여기서는 간단히 url이 있으면 uploadedImage로, 없으면 emoji 매칭 시도 또는 기본값 사용
                if (imgData.url) {
                    setUploadedImage(imgData.url);
                } else if (imgData.emoji) {
                    // emoji로 ID 찾기 (간단매칭)
                    const matched = CREW_IMAGES.find(ci => ci.emoji === imgData.emoji);
                    if (matched) setSelectedImageId(matched.id);
                    else setSelectedImageId(CREW_IMAGES[0].id); // fallback
                } else {
                    setSelectedImageId(CREW_IMAGES[0].id);
                }
            } catch {
                // 파싱 실패 시 url로 간주
                if (crew.imageUrl && crew.imageUrl.startsWith('http')) {
                    setUploadedImage(crew.imageUrl);
                } else {
                    setSelectedImageId(CREW_IMAGES[0].id);
                }
            }

            // 활동 지역 설정
            if (crew.activityAreas && crew.activityAreas.length > 0) {
                setActivityAreas(crew.activityAreas);
                const area = crew.activityAreas[0];
                setSelectedAddress(area.adminLevelFull || `${area.adminLevel1} ${area.adminLevel2} ${area.adminLevel3}`);
                setMapCenter({ lat: area.latitude, lng: area.longitude });
            } else if (crew.activityAreaLevel1) {
                // 좌표 없이 텍스트만 있는 경우 (구버전 호환)
                setSelectedAddress(`${crew.activityAreaLevel1} ${crew.activityAreaLevel2 || ''} ${crew.activityAreaLevel3 || ''}`);
                // 좌표가 없으면 유저 위치나 기본 위치 사용됨
            }
        }
    }, [crew]);

    const handleMapClick = async (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();

        setIsLoadingLocation(true);
        setError('');

        try {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    const addressComponents = results[0].address_components;
                    let countryCode = '', countryName = '', adminLevel1 = '', adminLevel2 = '', adminLevel3 = '';

                    addressComponents.forEach(component => {
                        if (component.types.includes('country')) {
                            countryCode = component.short_name;
                            countryName = component.long_name;
                        }
                        if (component.types.includes('administrative_area_level_1')) adminLevel1 = component.long_name;
                    });

                    addressComponents.forEach(component => {
                        if (component.types.includes('sublocality_level_2')) adminLevel3 = component.long_name;
                    });

                    addressComponents.forEach(component => {
                        if (component.types.includes('locality')) adminLevel2 = component.long_name;
                        if (component.types.includes('sublocality_level_1')) {
                            if (!adminLevel2) adminLevel2 = component.long_name;
                            else if (!adminLevel3) adminLevel3 = component.long_name;
                        }
                        if (component.types.includes('sublocality') && !adminLevel2 && !adminLevel3) {
                            adminLevel2 = component.long_name;
                        }
                    });

                    const adminLevelFull = results[0].formatted_address;
                    const newArea = {
                        countryCode, countryName, adminLevel1, adminLevel2, adminLevel3, adminLevelFull,
                        latitude: lat, longitude: lng
                    };

                    setActivityAreas([newArea]); // 덮어쓰기
                    setSelectedAddress(adminLevelFull);
                } else {
                    setError('주소 정보를 가져올 수 없습니다.');
                }
                setIsLoadingLocation(false);
            });
        } catch (err) {
            console.error('Geocoding error:', err);
            setError('주소 정보를 가져오는 중 오류가 발생했습니다.');
            setIsLoadingLocation(false);
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
        if (activityAreas.length === 0) {
            setError('활동 지역을 선택해주세요.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const selectedImage = CREW_IMAGES.find(img => img.id === selectedImageId) || CREW_IMAGES[0];
            let imageUrl;
            if (uploadedImage) {
                imageUrl = uploadedImage; // URL string
                // 백엔드에서 JSON 파싱 에러나지 않도록 주의. 
                // 기존 로직: JSON.stringify({ url: ... }). 
                // 여기서 그냥 String으로 보내면 백엔드는 그대로 저장. 읽을 때 파싱 시도하다 에러나면 fallback 로직이 CrewDetailPage에 있음.
                // 안전하게 객체 형태로 저장하는게 좋음.
                imageUrl = JSON.stringify({ url: uploadedImage });
            } else {
                imageUrl = JSON.stringify(selectedImage);
            }

            const requestBody = {
                name,
                description,
                imageUrl,
                activityAreas
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
            <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '800' }}>크루 설정</h2>

            {error && (
                <div style={{ padding: '12px', marginBottom: '16px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '8px', fontSize: '14px' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>크루 이름</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e0e0e0', fontSize: '16px', boxSizing: 'border-box' }}
                        required
                    />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>크루 설명</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e0e0e0', fontSize: '16px', minHeight: '80px', boxSizing: 'border-box' }}
                    />
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>활동 지역</label>
                    <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={mapCenter}
                        zoom={13}
                        onClick={handleMapClick}
                        options={{
                            styles: [
                                { featureType: 'poi', stylers: [{ visibility: 'off' }] },
                                { featureType: 'transit', stylers: [{ visibility: 'off' }] }
                            ]
                        }}
                    >
                        {activityAreas.map((area, index) => (
                            <Marker
                                key={index}
                                position={{ lat: area.latitude, lng: area.longitude }}
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
                        ))}
                    </GoogleMap>
                    {selectedAddress && (
                        <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px', fontSize: '14px' }}>
                            <strong>선택된 지역:</strong> {selectedAddress}
                        </div>
                    )}
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600' }}>크루 이미지</label>
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} id="edit-crew-image" disabled={isUploading} />
                    <label htmlFor="edit-crew-image" style={{ display: 'inline-block', padding: '8px 16px', backgroundColor: '#f3f4f6', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', marginBottom: '16px' }}>
                        {isUploading ? '업로드 중...' : '📷 이미지 변경'}
                    </label>

                    {uploadedImage ? (
                        <div onClick={() => { setUploadedImage(null); setSelectedImageId(CREW_IMAGES[0].id); }} style={{ width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', border: '3px solid #1a1a1a', cursor: 'pointer' }}>
                            <img src={uploadedImage} alt="Uploaded" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    ) : (
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
                                        transform: selectedImageId === img.id ? 'scale(1.05)' : 'scale(1)'
                                    }}
                                >
                                    {img.emoji}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="button" onClick={onCancel} style={{ flex: 1, padding: '16px', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}>취소</button>
                    <button type="submit" disabled={isSubmitting} style={{ flex: 2, padding: '16px', backgroundColor: '#1a1a1a', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                        {isSubmitting ? '저장 중...' : '저장하기'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default CrewEditPage;

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

function CrewCreateTab({ user, onCreate }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedImageId, setSelectedImageId] = useState(CREW_IMAGES[0].id);
    const [uploadedImage, setUploadedImage] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [joinType, setJoinType] = useState('AUTO'); // 'AUTO' or 'APPROVAL'

    // 활동 지역 관련 상태
    const [activityAreas, setActivityAreas] = useState([]);
    const [mapCenter, setMapCenter] = useState({ lat: 37.5665, lng: 126.9780 }); // 서울 기본값
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);

    useEffect(() => {
        // 사용자 현재 위치 가져오기
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setMapCenter({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    console.log('위치 정보를 가져올 수 없습니다:', error);
                }
            );
        }
    }, []);

    const handleMapClick = async (event) => {
        if (activityAreas.length >= 1) {
            setError('활동 지역은 1개만 선택할 수 있습니다. 기존 지역을 삭제 후 다시 선택해주세요.');
            return;
        }

        const lat = event.latLng.lat();
        const lng = event.latLng.lng();

        setIsLoadingLocation(true);
        setError('');

        try {
            // Google Geocoding API로 주소 정보 가져오기
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    const addressComponents = results[0].address_components;

                    let countryCode = '';
                    let countryName = '';
                    let adminLevel1 = '';
                    let adminLevel2 = '';
                    let adminLevel3 = '';

                    addressComponents.forEach(component => {
                        if (component.types.includes('country')) {
                            countryCode = component.short_name;
                            countryName = component.long_name;
                        }
                        if (component.types.includes('administrative_area_level_1')) {
                            adminLevel1 = component.long_name;
                        }
                        if (component.types.includes('administrative_area_level_2') ||
                            component.types.includes('locality')) {
                            adminLevel2 = component.long_name;
                        }
                        if (component.types.includes('sublocality_level_1') ||
                            component.types.includes('sublocality')) {
                            adminLevel3 = component.long_name;
                        }
                    });

                    const adminLevelFull = results[0].formatted_address;

                    const newArea = {
                        id: Date.now(), // 임시 ID
                        countryCode,
                        countryName,
                        adminLevel1,
                        adminLevel2,
                        adminLevel3,
                        adminLevelFull,
                        latitude: lat,
                        longitude: lng
                    };

                    setActivityAreas([...activityAreas, newArea]);
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

    const removeActivityArea = (areaId) => {
        setActivityAreas(activityAreas.filter(area => area.id !== areaId));
        setError('');
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
                {
                    method: 'POST',
                    body: formData,
                }
            );

            if (!response.ok) {
                throw new Error('이미지 업로드에 실패했습니다.');
            }

            const data = await response.json();
            setUploadedImage(data.secure_url);
            setSelectedImageId(null);
        } catch (err) {
            console.error('Upload error:', err);
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
            setError('최소 1개 이상의 활동 지역을 선택해주세요.');
            return;
        }

        // 이미지 선택 확인 (업로드된 이미지 또는 기본 이미지)
        if (!uploadedImage && !selectedImageId) {
            setError('크루 이미지를 선택해주세요.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            // 이미지 URL 생성 (업로드된 이미지 우선, 없으면 기본 이미지)
            let imageUrl;
            if (uploadedImage) {
                imageUrl = uploadedImage;
            } else {
                const selectedImage = CREW_IMAGES.find(img => img.id === selectedImageId) || CREW_IMAGES[0];
                imageUrl = JSON.stringify(selectedImage);
            }

            // 활동 지역 데이터에서 임시 ID 제거
            const areasToSend = activityAreas.map(({ id, ...area }) => area);

            const response = await api.request(`${import.meta.env.VITE_API_URL}/crew`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
                },
                body: JSON.stringify({
                    name,
                    description,
                    imageUrl,
                    joinType,
                    activityAreas: areasToSend
                })
            });

            if (response.ok) {
                const crewData = await response.json();
                onCreate({
                    ...crewData,
                    image: uploadedImage ? { url: uploadedImage } : selectedImage
                });

                // 폼 초기화
                setName('');
                setDescription('');
                setUploadedImage(null);
                setSelectedImageId(CREW_IMAGES[0].id);
                setActivityAreas([]);

                alert('크루가 성공적으로 생성되었습니다!');
            } else {
                const errorText = await response.text();
                setError(errorText || '크루 생성에 실패했습니다.');
            }
        } catch (err) {
            console.error('Crew creation error:', err);
            setError('크루 생성 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '800' }}>새 크루 만들기</h2>

            {error && (
                <div style={{
                    padding: '12px',
                    marginBottom: '16px',
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    borderRadius: '8px',
                    fontSize: '14px'
                }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* 크루 이름 */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1a1a1a' }}>
                        크루 이름 *
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="멋진 크루 이름을 입력하세요"
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '10px',
                            border: '1px solid #e0e0e0',
                            fontSize: '16px',
                            boxSizing: 'border-box'
                        }}
                        required
                    />
                </div>

                {/* 크루 설명 */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1a1a1a' }}>
                        크루 설명
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="우리 크루는 어떤 곳인가요?"
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '10px',
                            border: '1px solid #e0e0e0',
                            fontSize: '16px',
                            minHeight: '80px',
                            resize: 'vertical',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                {/* 가입 방식 */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1a1a1a' }}>
                        가입 방식 *
                    </label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <label style={{
                            flex: 1,
                            padding: '16px',
                            borderRadius: '10px',
                            border: joinType === 'AUTO' ? '2px solid #1a1a1a' : '1px solid #e0e0e0',
                            backgroundColor: joinType === 'AUTO' ? '#f8f9fa' : 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}>
                            <input
                                type="radio"
                                name="joinType"
                                value="AUTO"
                                checked={joinType === 'AUTO'}
                                onChange={(e) => setJoinType(e.target.value)}
                                style={{ marginRight: '8px' }}
                            />
                            <span style={{ fontWeight: '600' }}>자동 가입</span>
                            <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0 24px' }}>
                                누구나 바로 크루에 가입할 수 있습니다
                            </p>
                        </label>

                        <label style={{
                            flex: 1,
                            padding: '16px',
                            borderRadius: '10px',
                            border: joinType === 'APPROVAL' ? '2px solid #1a1a1a' : '1px solid #e0e0e0',
                            backgroundColor: joinType === 'APPROVAL' ? '#f8f9fa' : 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}>
                            <input
                                type="radio"
                                name="joinType"
                                value="APPROVAL"
                                checked={joinType === 'APPROVAL'}
                                onChange={(e) => setJoinType(e.target.value)}
                                style={{ marginRight: '8px' }}
                            />
                            <span style={{ fontWeight: '600' }}>승인 후 가입</span>
                            <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0 24px' }}>
                                크루장이 승인한 후에 가입됩니다
                            </p>
                        </label>
                    </div>
                </div>

                {/* 크루 활동 지역 */}
                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1a1a1a' }}>
                        크루 활동 지역 *
                    </label>
                    <p style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
                        지도를 클릭하여 활동 지역을 선택하세요 (1개만 선택 가능)
                    </p>

                    {/* 지도 */}
                    <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={mapCenter}
                        zoom={13}
                        onClick={handleMapClick}
                        options={{
                            styles: [
                                {
                                    featureType: 'poi',
                                    stylers: [{ visibility: 'off' }]
                                },
                                {
                                    featureType: 'transit',
                                    stylers: [{ visibility: 'off' }]
                                }
                            ]
                        }}
                    >
                        {activityAreas.map((area) => (
                            <Marker
                                key={area.id}
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

                    {/* 선택된 지역 목록 */}
                    {activityAreas.length > 0 && (
                        <div style={{ marginTop: '16px' }}>
                            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#1a1a1a' }}>
                                선택된 지역 ({activityAreas.length}/1)
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {activityAreas.map((area) => (
                                    <div
                                        key={area.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '12px',
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: '8px',
                                            border: '1px solid #e0e0e0'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span>📍</span>
                                            <span style={{ fontSize: '14px', color: '#333' }}>
                                                {area.adminLevelFull}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeActivityArea(area.id)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#dc2626',
                                                cursor: 'pointer',
                                                fontSize: '18px',
                                                padding: '4px 8px'
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 크루 이미지 */}
                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: '#1a1a1a' }}>
                        크루 이미지
                    </label>

                    {/* 이미지 업로드 */}
                    <div style={{ marginBottom: '16px' }}>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            style={{ display: 'none' }}
                            id="crew-image-upload"
                            disabled={isUploading}
                        />
                        <label
                            htmlFor="crew-image-upload"
                            style={{
                                display: 'inline-block',
                                padding: '10px 20px',
                                backgroundColor: '#f3f4f6',
                                border: '2px dashed #d1d5db',
                                borderRadius: '10px',
                                cursor: isUploading ? 'not-allowed' : 'pointer',
                                fontWeight: '600',
                                color: '#374151',
                                transition: 'all 0.2s'
                            }}
                        >
                            {isUploading ? '업로드 중...' : '📷 내 이미지 업로드'}
                        </label>
                    </div>

                    {/* 업로드된 이미지 미리보기 */}
                    {uploadedImage && (
                        <div style={{ marginBottom: '16px' }}>
                            <div
                                onClick={() => {
                                    setUploadedImage(null);
                                    setSelectedImageId(CREW_IMAGES[0].id);
                                }}
                                style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    border: '3px solid #1a1a1a',
                                    cursor: 'pointer',
                                    position: 'relative'
                                }}
                            >
                                <img
                                    src={uploadedImage}
                                    alt="Uploaded"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                />
                            </div>
                            <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>클릭하여 제거</p>
                        </div>
                    )}

                    {/* 기본 이미지 */}
                    {!uploadedImage && (
                        <>
                            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>또는 기본 이미지 선택</div>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(5, 1fr)',
                                gap: '12px'
                            }}>
                                {CREW_IMAGES.map((img) => (
                                    <button
                                        key={img.id}
                                        type="button"
                                        onClick={() => setSelectedImageId(img.id)}
                                        style={{
                                            width: '100%',
                                            aspectRatio: '1',
                                            borderRadius: '12px',
                                            border: selectedImageId === img.id ? '3px solid #1a1a1a' : '1px solid transparent',
                                            background: img.bg,
                                            fontSize: '24px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            transition: 'transform 0.2s',
                                            transform: selectedImageId === img.id ? 'scale(1.1)' : 'scale(1)'
                                        }}
                                    >
                                        {img.emoji}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* 제출 버튼 */}
                <button
                    type="submit"
                    disabled={isSubmitting || isUploading || isLoadingLocation}
                    style={{
                        width: '100%',
                        padding: '16px',
                        backgroundColor: isSubmitting || isUploading || isLoadingLocation ? '#9ca3af' : '#1a1a1a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: '700',
                        cursor: isSubmitting || isUploading || isLoadingLocation ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <span>✨</span> {isSubmitting ? '생성 중...' : '크루 생성하기'}
                </button>
            </form>
        </div>
    );
}

export default CrewCreateTab;

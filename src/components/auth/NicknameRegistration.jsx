import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import LocationSelection from './LocationSelection';

function NicknameRegistration({ user, onComplete }) {
    const [step, setStep] = useState(1);
    const [nickname, setNickname] = useState(user?.nickname || '');
    const [selectedImage, setSelectedImage] = useState(user?.nicknameImage || user?.profileImage || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix');

    // 만약 닉네임은 있는데 지역 정보가 없는 경우, 바로 지도 단계(Step 2)로 이동
    useEffect(() => {
        if (user?.nickname && !user?.activityAreaRegistered) {
            setStep(2);
        }
    }, [user]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedImage, setUploadedImage] = useState(null);
    const [nicknameStatus, setNicknameStatus] = useState(''); // 'checking', 'available', 'unavailable'
    const [nicknameMessage, setNicknameMessage] = useState('');
    const [locationData, setLocationData] = useState(null);

    const avatarSeeds = ['Felix', 'Aneka', 'Buddy', 'Casper', 'Daisy', 'Gracie', 'Milo', 'Oliver'];
    const avatarUrls = avatarSeeds.map(seed => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`);

    // Cloudinary 설정 - 환경변수에서 가져오기
    const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    // 닉네임 유효성 검사
    const validateNicknameFormat = (value) => {
        if (!value || value.trim().length === 0) {
            return { valid: false, message: '닉네임을 입력해주세요.' };
        }
        if (value.length < 2) {
            return { valid: false, message: '닉네임은 최소 2자 이상이어야 합니다.' };
        }
        if (value.length > 10) {
            return { valid: false, message: '닉네임은 최대 10자까지 가능합니다.' };
        }
        if (!/^[가-힣a-zA-Z0-9]+$/.test(value)) {
            return { valid: false, message: '한글, 영문, 숫자만 사용 가능합니다.' };
        }
        const bannedWords = ['관리자', '운영자', 'admin', 'root', 'system'];
        const lowerValue = value.toLowerCase();
        for (const banned of bannedWords) {
            if (lowerValue.includes(banned)) {
                return { valid: false, message: '사용할 수 없는 닉네임입니다.' };
            }
        }
        return { valid: true, message: '' };
    };

    // 닉네임 중복 체크
    const checkNicknameDuplicate = async (value) => {
        try {
            setNicknameStatus('checking');
            const response = await api.request(`${import.meta.env.VITE_API_URL}/user/check-nickname?nickname=${encodeURIComponent(value)}`, {
                method: 'GET',
                headers: {
                    'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
                }
            });

            if (response.ok) {
                const isAvailable = await response.json();
                if (isAvailable) {
                    setNicknameStatus('available');
                    setNicknameMessage('사용 가능한 닉네임입니다.');
                } else {
                    setNicknameStatus('unavailable');
                    setNicknameMessage('이미 사용 중인 닉네임입니다.');
                }
            }
        } catch (err) {
            console.error('Nickname check error:', err);
            setNicknameStatus('');
            setNicknameMessage('');
        }
    };

    // 닉네임 변경 핸들러
    const handleNicknameChange = (e) => {
        const value = e.target.value;
        setNickname(value);
        setError('');
        setNicknameStatus('');
        setNicknameMessage('');

        // 형식 검증
        const validation = validateNicknameFormat(value);
        if (!validation.valid) {
            setNicknameMessage(validation.message);
            setNicknameStatus('unavailable');
            return;
        }

        // 중복 체크 (디바운스)
        const timeoutId = setTimeout(() => {
            checkNicknameDuplicate(value);
        }, 500);

        return () => clearTimeout(timeoutId);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 파일 크기 검증 (5MB 제한)
        if (file.size > 5 * 1024 * 1024) {
            setError('이미지 크기는 5MB를 초과할 수 없습니다.');
            return;
        }

        // 파일 타입 검증
        if (!file.type.startsWith('image/')) {
            setError('이미지 파일만 업로드 가능합니다.');
            return;
        }

        setIsUploading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                {
                    method: 'POST',
                    body: formData,
                }
            );

            if (!response.ok) {
                throw new Error('이미지 업로드에 실패했습니다.');
            }

            const data = await response.json();
            const imageUrl = data.secure_url;

            setUploadedImage(imageUrl);
            setSelectedImage(imageUrl);
        } catch (err) {
            console.error('Upload error:', err);
            setError('이미지 업로드 중 오류가 발생했습니다.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleNextStep = (e) => {
        e.preventDefault();
        const validation = validateNicknameFormat(nickname);
        if (!validation.valid) {
            setError(validation.message);
            return;
        }
        if (nicknameStatus !== 'available') {
            setError('사용 가능한 닉네임을 입력해주세요.');
            return;
        }
        setStep(2);
    };

    const handleCompleteRegistration = async (selectedLocation) => {
        setIsSubmitting(true);
        setError('');

        try {
            // 1. 프로필 정보 (닉네임, 이미지) 저장
            const profileResponse = await api.request(`${import.meta.env.VITE_API_URL}/user/profile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
                },
                body: JSON.stringify({
                    nickname: nickname,
                    nicknameImage: selectedImage
                })
            });

            if (!profileResponse.ok) {
                const errorText = await profileResponse.text();
                throw new Error(errorText || '프로필 등록에 실패했습니다.');
            }

            const updatedUser = await profileResponse.json();

            // 2. 활동 지역 정보 저장
            const locationResponse = await api.request(`${import.meta.env.VITE_API_URL}/user/activity-area`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
                },
                body: JSON.stringify(selectedLocation)
            });

            if (!locationResponse.ok) {
                const errorText = await locationResponse.text();
                console.warn('활동 지역 등록 실패 (하지만 프로필은 저장됨):', errorText);
            }

            // 최종 완료
            onComplete({ ...user, ...updatedUser, activityAreaRegistered: true });
        } catch (err) {
            console.error('Registration error:', err);
            setError(err.message || '네트워크 오류가 발생했습니다.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="registration-container" style={styles.container}>
            <div className="registration-card" style={styles.card}>
                {step === 1 ? (
                    <>
                        <h1 style={styles.title}>환영합니다!</h1>
                        <p style={styles.subtitle}>러닝 크루에서 사용할 닉네임과 프로필 이미지를 설정해주세요.</p>

                        <form onSubmit={handleNextStep} style={styles.form}>
                            <div style={styles.section}>
                                <label style={styles.label}>프로필 이미지 선택</label>

                                {/* 이미지 업로드 버튼 */}
                                <div style={styles.uploadSection}>
                                    <input
                                        type="file"
                                        id="image-upload"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        style={styles.fileInput}
                                    />
                                    <label htmlFor="image-upload" style={styles.uploadButton}>
                                        {isUploading ? (
                                            <>
                                                <span style={styles.uploadIcon}>⏳</span>
                                                업로드 중...
                                            </>
                                        ) : (
                                            <>
                                                <span style={styles.uploadIcon}>📷</span>
                                                내 이미지 업로드
                                            </>
                                        )}
                                    </label>
                                </div>

                                {/* 업로드된 이미지 미리보기 */}
                                {uploadedImage && (
                                    <div style={styles.uploadedImageContainer}>
                                        <img
                                            src={uploadedImage}
                                            alt="Uploaded profile"
                                            style={{
                                                ...styles.uploadedImage,
                                                border: selectedImage === uploadedImage ? '3px solid #00f2fe' : '2px solid rgba(255, 255, 255, 0.2)',
                                            }}
                                            onClick={() => setSelectedImage(uploadedImage)}
                                        />
                                        <p style={styles.uploadedLabel}>업로드한 이미지</p>
                                    </div>
                                )}

                                {/* 기본 아바타 그리드 */}
                                <p style={styles.dividerText}>또는 기본 아바타 선택</p>
                                <div style={styles.avatarGrid}>
                                    {avatarUrls.map((url, index) => (
                                        <img
                                            key={index}
                                            src={url}
                                            alt={`Avatar ${index}`}
                                            style={{
                                                ...styles.avatar,
                                                border: selectedImage === url ? '3px solid #00f2fe' : '2px solid transparent',
                                                transform: selectedImage === url ? 'scale(1.1)' : 'scale(1)',
                                            }}
                                            onClick={() => setSelectedImage(url)}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div style={styles.section}>
                                <label htmlFor="nickname" style={styles.label}>닉네임</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        id="nickname"
                                        type="text"
                                        value={nickname}
                                        onChange={handleNicknameChange}
                                        placeholder="멋진 닉네임을 입력하세요"
                                        style={{
                                            ...styles.input,
                                            borderColor: nicknameStatus === 'available' ? '#00f2fe' :
                                                nicknameStatus === 'unavailable' ? '#ff4d4d' :
                                                    'rgba(255, 255, 255, 0.1)'
                                        }}
                                        maxLength={10}
                                    />
                                    {nicknameStatus === 'checking' && (
                                        <div style={styles.statusMessage}>
                                            <span style={{ color: '#ffa500' }}>⏳ 확인 중...</span>
                                        </div>
                                    )}
                                    {nicknameStatus === 'available' && (
                                        <div style={styles.statusMessage}>
                                            <span style={{ color: '#00f2fe' }}>✓ {nicknameMessage}</span>
                                        </div>
                                    )}
                                    {nicknameStatus === 'unavailable' && nicknameMessage && (
                                        <div style={styles.statusMessage}>
                                            <span style={{ color: '#ff4d4d' }}>✗ {nicknameMessage}</span>
                                        </div>
                                    )}
                                </div>

                                {/* 제한사항 안내 */}
                                <div style={styles.guideBox}>
                                    <div style={styles.guideTitle}>📌 닉네임 규칙</div>
                                    <ul style={styles.guideList}>
                                        <li>2~10자 이내</li>
                                        <li>한글, 영문, 숫자만 사용 가능</li>
                                        <li>특수문자 및 공백 사용 불가</li>
                                        <li>중복된 닉네임 사용 불가</li>
                                    </ul>
                                </div>

                                {error && <p style={styles.error}>{error}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || isUploading}
                                style={{
                                    ...styles.button,
                                    opacity: (isSubmitting || isUploading) ? 0.7 : 1,
                                    cursor: (isSubmitting || isUploading) ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {isSubmitting ? '진행 중...' : '다음으로'}
                            </button>
                        </form>
                    </>
                ) : (
                    <LocationSelection
                        onSelect={handleCompleteRegistration}
                        onBack={() => setStep(1)}
                        isLoading={isSubmitting}
                    />
                )}
                {error && step === 2 && <p style={styles.error}>{error}</p>}
            </div>
        </div>
    );
}

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #121212 0%, #1a1a1a 100%)',
        padding: '20px',
    },
    card: {
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        borderRadius: '30px',
        padding: '30px',
        width: '100%',
        maxWidth: '450px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        textAlign: 'center',
    },
    title: {
        fontSize: '1.8rem',
        color: '#fff',
        marginBottom: '10px',
        fontWeight: '800',
        background: 'linear-gradient(to right, #00f2fe, #4facfe)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    },
    subtitle: {
        color: 'rgba(255, 255, 255, 0.6)',
        marginBottom: '20px',
        fontSize: '0.9rem',
        lineHeight: '1.5',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    section: {
        textAlign: 'left',
    },
    label: {
        display: 'block',
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: '8px',
        fontSize: '0.85rem',
        fontWeight: '600',
    },
    avatarGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '10px',
        marginBottom: '5px',
    },
    avatar: {
        width: '100%',
        aspectRatio: '1/1',
        borderRadius: '50%',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        background: 'rgba(255, 255, 255, 0.1)',
    },
    input: {
        width: '100%',
        padding: '12px 18px',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(255, 255, 255, 0.05)',
        color: '#fff',
        fontSize: '0.95rem',
        outline: 'none',
        transition: 'border-color 0.3s',
        boxSizing: 'border-box',
    },
    button: {
        padding: '15px',
        borderRadius: '12px',
        border: 'none',
        background: 'linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)',
        color: '#000',
        fontSize: '1.1rem',
        fontWeight: '700',
        marginTop: '10px',
        transition: 'transform 0.2s, box-shadow 0.2s',
        boxShadow: '0 10px 20px -5px rgba(0, 242, 254, 0.4)',
    },
    error: {
        color: '#ff4d4d',
        fontSize: '0.8rem',
        marginTop: '10px',
        textAlign: 'center',
    },
    uploadSection: {
        marginBottom: '15px',
    },
    fileInput: {
        display: 'none',
    },
    uploadButton: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        width: '100%',
        padding: '12px 15px',
        borderRadius: '12px',
        border: '2px dashed rgba(0, 242, 254, 0.5)',
        background: 'rgba(0, 242, 254, 0.1)',
        color: '#00f2fe',
        fontSize: '0.95rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    uploadIcon: {
        fontSize: '1.2rem',
    },
    uploadedImageContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        margin: '15px 0',
    },
    uploadedImage: {
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        objectFit: 'cover',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 8px 25px -5px rgba(0, 242, 254, 0.3)',
    },
    uploadedLabel: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: '0.8rem',
        marginTop: '8px',
    },
    dividerText: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: '0.8rem',
        textAlign: 'center',
        margin: '15px 0 10px 0',
    },
    statusMessage: {
        fontSize: '0.8rem',
        marginTop: '5px',
        marginLeft: '5px',
        textAlign: 'left',
    },
    guideBox: {
        marginTop: '10px',
        padding: '10px 14px',
        background: 'rgba(0, 242, 254, 0.05)',
        borderRadius: '10px',
        border: '1px solid rgba(0, 242, 254, 0.2)',
    },
    guideTitle: {
        color: '#00f2fe',
        fontSize: '0.8rem',
        fontWeight: '600',
        marginBottom: '5px',
    },
    guideList: {
        margin: 0,
        paddingLeft: '18px',
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '0.75rem',
        lineHeight: '1.6',
    }
};

export default NicknameRegistration;

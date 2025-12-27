import { useState } from 'react';
import { api } from '../../utils/api';

function NicknameRegistration({ user, onComplete }) {
    const [nickname, setNickname] = useState('');
    const [selectedImage, setSelectedImage] = useState('https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'); // Default image
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedImage, setUploadedImage] = useState(null);

    const avatarSeeds = ['Felix', 'Aneka', 'Buddy', 'Casper', 'Daisy', 'Gracie', 'Milo', 'Oliver'];
    const avatarUrls = avatarSeeds.map(seed => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`);

    // Cloudinary 설정 - 환경변수에서 가져오기
    const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!nickname.trim()) {
            setError('닉네임을 입력해주세요.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const response = await api.request(`${import.meta.env.VITE_API_URL}/user/profile`, {
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

            if (response.ok) {
                const updatedUser = await response.json();
                onComplete({ ...user, ...updatedUser });
            } else {
                const errorText = await response.text();
                console.error('Profile update failed with status:', response.status);
                console.error('Error response body:', errorText);
                setError(`프로필 등록에 실패했습니다. (Error: ${response.status})`);
            }
        } catch (err) {
            console.error('Profile update catch error:', err);
            setError('네트워크 오류가 발생했습니다. 개발자 도구 로그를 확인해 주세요.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="registration-container" style={styles.container}>
            <div className="registration-card" style={styles.card}>
                <h1 style={styles.title}>환영합니다!</h1>
                <p style={styles.subtitle}>러닝 크루에서 사용할 닉네임과 프로필 이미지를 설정해주세요.</p>

                <form onSubmit={handleSubmit} style={styles.form}>
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
                        <input
                            id="nickname"
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="멋진 닉네임을 입력하세요"
                            style={styles.input}
                            maxLength={10}
                        />
                        {error && <p style={styles.error}>{error}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                            ...styles.button,
                            opacity: isSubmitting ? 0.7 : 1,
                            cursor: isSubmitting ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {isSubmitting ? '설정 중...' : '시작하기'}
                    </button>
                </form>
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
        padding: '40px',
        width: '100%',
        maxWidth: '450px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        textAlign: 'center',
    },
    title: {
        fontSize: '2rem',
        color: '#fff',
        marginBottom: '10px',
        fontWeight: '800',
        background: 'linear-gradient(to right, #00f2fe, #4facfe)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    },
    subtitle: {
        color: 'rgba(255, 255, 255, 0.6)',
        marginBottom: '30px',
        fontSize: '0.95rem',
        lineHeight: '1.5',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '25px',
    },
    section: {
        textAlign: 'left',
    },
    label: {
        display: 'block',
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: '10px',
        fontSize: '0.9rem',
        fontWeight: '600',
    },
    avatarGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        marginBottom: '10px',
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
        padding: '15px 20px',
        borderRadius: '15px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(255, 255, 255, 0.05)',
        color: '#fff',
        fontSize: '1rem',
        outline: 'none',
        transition: 'border-color 0.3s',
        boxSizing: 'border-box',
    },
    button: {
        padding: '16px',
        borderRadius: '15px',
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
        fontSize: '0.85rem',
        marginTop: '8px',
        marginLeft: '5px',
    },
    uploadSection: {
        marginBottom: '20px',
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
        padding: '16px 20px',
        borderRadius: '15px',
        border: '2px dashed rgba(0, 242, 254, 0.5)',
        background: 'rgba(0, 242, 254, 0.1)',
        color: '#00f2fe',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    uploadIcon: {
        fontSize: '1.5rem',
    },
    uploadedImageContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: '20px',
        marginBottom: '20px',
    },
    uploadedImage: {
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        objectFit: 'cover',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 10px 30px -5px rgba(0, 242, 254, 0.3)',
    },
    uploadedLabel: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: '0.85rem',
        marginTop: '10px',
    },
    dividerText: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: '0.85rem',
        textAlign: 'center',
        margin: '20px 0 15px 0',
        position: 'relative',
    }
};

export default NicknameRegistration;

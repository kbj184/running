import { useState } from 'react';
import { api } from '../../utils/api';

function NicknameRegistration({ user, onComplete }) {
    const [nickname, setNickname] = useState('');
    const [selectedImage, setSelectedImage] = useState('https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'); // Default image
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const avatarSeeds = ['Felix', 'Aneka', 'Buddy', 'Casper', 'Daisy', 'Gracie', 'Milo', 'Oliver'];
    const avatarUrls = avatarSeeds.map(seed => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!nickname.trim()) {
            setError('닉네임을 입력해주세요.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const response = await api.request('https://localhost:8443/user/profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': user.accessToken
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
                setError('프로필 등록에 실패했습니다. 다시 시도해주세요.');
            }
        } catch (err) {
            console.error('Profile update error:', err);
            setError('네트워크 오류가 발생했습니다.');
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
    }
};

export default NicknameRegistration;

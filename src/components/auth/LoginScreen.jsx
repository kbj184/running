import React, { useState } from 'react';
import './auth.css';

const LoginScreen = ({ onLogin }) => {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        // 실제 구현에서는 여기서 서버로 요청을 보내야 합니다.
        // 현재는 데모용으로 입력된 값으로 로그인 처리합니다.
        if (username && password) {
            onLogin({
                name: username,
                id: `user_${Date.now()}`,
                email: username // 이메일 형식이 아닐 수도 있지만 데모용
            });
        }
    };

    const handleSocialLogin = (provider) => {
        // 소셜 로그인 로직 (데모)
        onLogin({
            name: `${provider} 사용자`,
            id: `${provider}_${Date.now()}`,
            provider: provider
        });
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1 className="auth-title">RUNNING CREW</h1>
                    <p className="auth-subtitle">
                        {isLoginMode ? '다시 오신 것을 환영합니다!' : '최고의 러닝 커뮤니티에 합류하세요'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="input-group">
                        <input
                            type="text"
                            placeholder="아이디 또는 이메일"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="auth-input"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <input
                            type="password"
                            placeholder="비밀번호"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="auth-input"
                            required
                        />
                    </div>

                    <button type="submit" className="auth-submit-btn">
                        {isLoginMode ? '로그인' : '회원가입'}
                    </button>
                </form>

                <div className="divider">
                    <span>간편 로그인</span>
                </div>

                <div className="social-login-buttons">
                    <button
                        className="social-btn kakao"
                        onClick={() => handleSocialLogin('Kakao')}
                    >
                        {/* 카카오 아이콘 SVG */}
                        <svg viewBox="0 0 24 24" width="20" height="20" className="social-icon">
                            <path fill="currentColor" d="M12 3C7.58 3 4 5.79 4 9.24c0 2.12 1.35 4 3.42 5.09l-.75 2.76c-.06.27.15.52.41.49l3.22-2.14c.55.08 1.12.12 1.7.12 4.42 0 8-2.79 8-6.24S16.42 3 12 3z" />
                        </svg>
                        <span>카카오로 시작하기</span>
                    </button>
                    <button
                        className="social-btn naver"
                        onClick={() => window.location.href = 'https://localhost:8443/oauth2/authorization/naver'}
                    >
                        <span className="naver-icon">N</span>
                        <span>네이버로 시작하기</span>
                    </button>
                    <button
                        className="social-btn google"
                        onClick={() => handleSocialLogin('Google')}
                    >
                        <svg viewBox="0 0 24 24" width="20" height="20" className="social-icon">
                            <path fill="#EA4335" d="M12 5.04c1.88 0 3.55.67 4.88 1.93l3.63-3.63C18.29 1.25 15.35 0 12 0 7.37 0 3.32 2.65 1.42 6.55l4.27 3.31C6.7 6.43 9.13 5.04 12 5.04z" />
                            <path fill="#34A853" d="M12 24c3.24 0 5.97-1.07 7.96-2.91l-3.92-3.05c-1.07.72-2.44 1.14-4.04 1.14-3.13 0-5.78-2.11-6.73-4.96l-4.22 3.28C3.12 21.32 7.23 24 12 24z" />
                            <path fill="#4A90E2" d="M23.49 12.27c0-.85-.08-1.68-.22-2.48H12v4.71h6.44c-.28 1.48-1.11 2.73-2.38 3.58l3.92 3.05c2.29-2.11 3.61-5.22 3.61-8.86z" />
                            <path fill="#FBBC05" d="M5.27 9.86c-.23.69-.36 1.43-.36 2.14s.13 1.45.36 2.14l-4.27 3.31C.35 15.61 0 13.85 0 12s.35-3.61 1.01-5.45l4.26 3.31z" />
                        </svg>
                        <span>Google로 시작하기</span>
                    </button>
                </div>

                <div className="auth-footer">
                    <p>
                        {isLoginMode ? '아직 계정이 없으신가요?' : '이미 계정이 있으신가요?'}
                        <button
                            className="toggle-auth-mode-btn"
                            onClick={() => setIsLoginMode(!isLoginMode)}
                        >
                            {isLoginMode ? '회원가입' : '로그인'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;

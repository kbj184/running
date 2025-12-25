import React, { useState, useEffect } from 'react';
import './auth.css';
import { api } from '../../utils/api';

const LoginScreen = ({ onLogin }) => {
    const [step, setStep] = useState(1); // 1: Email, 2: Password(Signup), 3: Terms, 4: Confirmation, 5: Password(Login)
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showSignupPrompt, setShowSignupPrompt] = useState(false);
    const [socialProvider, setSocialProvider] = useState(null);

    // Terms State
    const [agreements, setAgreements] = useState({
        service: false,
        privacy: false,
        community: false,
        marketing: false,
        age: false
    });
    const [detailView, setDetailView] = useState(null); // 'service', 'privacy', 'community', 'marketing'
    const [agreementDate, setAgreementDate] = useState(null);

    const [validations, setValidations] = useState({
        length: false,
        english: false,
        number: false,
        special: false
    });

    const [showJoinSuccessModal, setShowJoinSuccessModal] = useState(false);
    const [showJoinErrorModal, setShowJoinErrorModal] = useState(false);
    const [showLoginErrorModal, setShowLoginErrorModal] = useState(false);

    // Password validation logic
    useEffect(() => {
        setValidations({
            length: password.length >= 8,
            english: /[A-Za-z]/.test(password), // one or more English letters
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        });
    }, [password]);

    const isPasswordValid = Object.values(validations).every(Boolean) && password === confirmPassword && password.length > 0;

    // Terms Logic
    const allRequiredChecked = agreements.service && agreements.privacy && agreements.community && agreements.age;
    const isAllChecked = allRequiredChecked && agreements.marketing;

    const checkEmail = async (email) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/emailcheck?email=${email}`);
            if (response.ok) {
                const text = await response.text();
                if (!text || text === "null" || text === "false") return null;
                return JSON.parse(text);
            }
        } catch (error) {
            console.error("Email check failed:", error);
        }
        return null;
    };

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        if (email) {
            const result = await checkEmail(email);
            if (!result) {
                // Email does not exist -> Signup Prompt
                setShowSignupPrompt(true);
            } else {
                // Email exists
                const { authProvider } = result;
                if (authProvider === 'local') {
                    setStep(5);
                } else if (authProvider === 'naver' || authProvider === 'google') {
                    setSocialProvider(authProvider);
                } else {
                    // Fallback for other providers or unknown states
                    setStep(5);
                }
            }
        }
    };

    const handleSignupProceed = () => {
        setShowSignupPrompt(false);
        setStep(2);
    };

    const handleSignupCancel = () => {
        setShowSignupPrompt(false);
        // Optional: clear email or keep it? Keeping it is usually better UX.
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        if (isPasswordValid) {
            setStep(3);
        }
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        if (password) {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });

                if (response.ok) {
                    const refreshResponse = await fetch(`${import.meta.env.VITE_API_URL}/refresh/token`, {
                        method: 'POST',
                        credentials: 'include',
                    });

                    if (refreshResponse.ok) {
                        let accessToken = refreshResponse.headers.get('Authorization');
                        if (accessToken && accessToken.startsWith('Bearer ')) {
                            accessToken = accessToken.substring(7);
                        }

                        // Call my endpoint to get full user profile (including nickname)
                        const myResponse = await api.request(`${import.meta.env.VITE_API_URL}/my`, {
                            method: 'GET',
                            headers: {
                                'Authorization': `Bearer ${accessToken}`, // 헤더에 보낼 땐 붙여서
                            }
                        });

                        if (myResponse.ok) {
                            const userData = await myResponse.json();
                            onLogin({
                                ...userData,
                                email: email,
                                accessToken: accessToken,
                                type: 'login'
                            });
                        } else {
                            // Fallback if /my fails
                            onLogin({
                                email: email,
                                accessToken: accessToken,
                                type: 'login'
                            });
                        }
                    }
                } else if (response.status === 401) {
                    setShowLoginErrorModal(true);
                }
            } catch (error) {
                console.error("Login failed:", error);
            }
        }
    };

    const handleTermsSubmit = (e) => {
        e.preventDefault();
        if (allRequiredChecked) {
            setAgreementDate(new Date());
            setStep(4);
        }
    };

    const handleFinalSignup = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                setShowJoinSuccessModal(true);
            } else if (response.status === 401) {
                setShowJoinErrorModal(true);
            }
        } catch (error) {
            console.error("Signup failed:", error);
        }
    };

    const handleAllAgree = () => {
        const newValue = !isAllChecked;
        setAgreements({
            service: newValue,
            privacy: newValue,
            community: newValue,
            marketing: newValue,
            age: newValue
        });
    };

    const toggleAgreement = (key) => {
        setAgreements(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleSocialLogin = (provider) => {
        onLogin({
            name: `${provider} 사용자`,
            id: `${provider}_${Date.now()}`,
            provider: provider,
            type: 'social'
        });
    };

    const handleBack = () => {
        if (step === 5) {
            setStep(1);
            setPassword('');
        } else if (step > 1) {
            setStep(step - 1);
        }
    };

    const formatDate = (date) => {
        if (!date) return '';
        return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
    };

    const formatDateTime = (date) => {
        if (!date) return '';
        return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${date.getHours()}시 ${date.getMinutes()}분`;
    };

    // Render Step 1: Email Input
    if (step === 1) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '0.5rem' }}>
                            <img src="/logo.png" alt="Logo" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                            <h1 className="auth-title" style={{ margin: 0 }}>Let’s Link Run</h1>
                        </div>
                        <p className="auth-subtitle">
                            We don’t run fast. We run together.
                        </p>
                    </div>

                    <form onSubmit={handleEmailSubmit} className="auth-form">
                        <div className="input-group">
                            <input
                                type="email"
                                placeholder="이메일을 입력 하세요"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="auth-input"
                                required
                            />
                        </div>

                        <button type="submit" className="auth-submit-btn">
                            다음으로
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
                            <svg viewBox="0 0 24 24" width="20" height="20" className="social-icon">
                                <path fill="currentColor" d="M12 3C7.58 3 4 5.79 4 9.24c0 2.12 1.35 4 3.42 5.09l-.75 2.76c-.06.27.15.52.41.49l3.22-2.14c.55.08 1.12.12 1.7.12 4.42 0 8-2.79 8-6.24S16.42 3 12 3z" />
                            </svg>
                            <span>카카오로 시작하기</span>
                        </button>
                        <button
                            className="social-btn naver"
                            onClick={() => window.location.href = `${import.meta.env.VITE_API_URL}/oauth2/authorization/naver`}
                        >
                            <span className="naver-icon">N</span>
                            <span>네이버로 시작하기</span>
                        </button>
                        <button
                            className="social-btn google"
                            onClick={() => window.location.href = `${import.meta.env.VITE_API_URL}/oauth2/authorization/google`}
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

                    {/* Signup Prompt Modal */}
                    {showSignupPrompt && (
                        <div className="terms-modal-overlay">
                            <div className="terms-modal" style={{ height: 'auto', minHeight: 'auto', textAlign: 'center', padding: '2rem' }}>
                                <h3 style={{ marginBottom: '0.5rem' }}>가입되지 않은 이메일입니다</h3>
                                <p style={{ color: '#cbd5e1', marginBottom: '2rem' }}>회원가입을 진행하실 건가요?</p>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        onClick={handleSignupCancel}
                                        style={{ flex: 1, padding: '1rem', borderRadius: '12px', border: '1px solid #475569', background: 'transparent', color: 'white', cursor: 'pointer', fontWeight: '600' }}
                                    >
                                        취소
                                    </button>
                                    <button
                                        onClick={handleSignupProceed}
                                        style={{ flex: 1, padding: '1rem', borderRadius: '12px', border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer', fontWeight: '600' }}
                                    >
                                        가입하기
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Social Login Provider Modal */}
                    {socialProvider && (
                        <div className="terms-modal-overlay">
                            <div className="terms-modal" style={{ height: 'auto', minHeight: 'auto', textAlign: 'center', padding: '2rem' }}>
                                <h3 style={{ marginBottom: '1rem', lineHeight: '1.4' }}>
                                    {socialProvider === 'naver' ? '네이버' : 'Google'} 간편 로그인 회원입니다.
                                </h3>
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <button
                                        onClick={() => window.location.href = `${import.meta.env.VITE_API_URL}/oauth2/authorization/${socialProvider}`}
                                        style={{
                                            padding: '0.8rem 2rem',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: socialProvider === 'naver' ? '#03C75A' : '#4285F4',
                                            color: 'white',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            fontSize: '1rem'
                                        }}
                                    >
                                        확인
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Render Step 5: Login Password
    if (step === 5) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-nav-header">
                        <button className="back-btn" onClick={handleBack}>{'<'}</button>
                        <span className="nav-title">로그인</span>
                        <div style={{ width: '24px' }}></div>
                    </div>
                    <div className="auth-header">
                        <h1 className="auth-title" style={{ fontSize: '1.4rem', wordBreak: 'break-all', lineHeight: '1.4' }}>
                            {email}
                            <span style={{ display: 'block', fontSize: '1.2rem', marginTop: '0.2rem' }}>으로 로그인</span>
                        </h1>
                        <p className="auth-subtitle">
                            비밀번호를 입력해 주세요.
                        </p>
                    </div>

                    <form onSubmit={handleLoginSubmit} className="auth-form">
                        <div className="input-group">
                            <input
                                type="password"
                                placeholder="비밀번호를 입력하세요"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="auth-input"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="auth-submit-btn"
                        >
                            로그인 하기
                        </button>
                    </form>

                    {/* Login Error Modal */}
                    {showLoginErrorModal && (
                        <div className="terms-modal-overlay">
                            <div className="terms-modal" style={{ height: 'auto', minHeight: 'auto', textAlign: 'center', padding: '2rem' }}>
                                <h3 style={{ marginBottom: '1rem' }}>비밀번호가 틀렸습니다</h3>
                                <button
                                    onClick={() => setShowLoginErrorModal(false)}
                                    className="auth-submit-btn"
                                    style={{ marginTop: '1rem', width: '100%' }}
                                >
                                    확인
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Render Step 2: Password Setup
    if (step === 2) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-nav-header">
                        <button className="back-btn" onClick={handleBack}>{'<'}</button>
                        <span className="nav-title">회원가입</span>
                        <div style={{ width: '24px' }}></div>
                    </div>
                    <div className="auth-header">
                        <h1 className="auth-title" style={{ fontSize: '1.4rem', wordBreak: 'break-all', lineHeight: '1.4' }}>
                            {email}
                            <span style={{ display: 'block', fontSize: '1.2rem', marginTop: '0.2rem' }}>으로 가입하기</span>
                        </h1>
                        <p className="auth-subtitle">
                            아래 조건에 맞게 비밀번호를 설정해 주세요.
                        </p>
                    </div>

                    <form onSubmit={handlePasswordSubmit} className="auth-form">
                        <div className="input-group">
                            <input
                                type="password"
                                placeholder="비밀번호를 입력하세요"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="auth-input"
                                required
                            />
                        </div>

                        <div className="password-conditions">
                            <div className={`condition ${validations.length ? 'valid' : ''}`}>
                                <span className="check-icon">✓</span> 8자리 이상
                            </div>
                            <div className={`condition ${validations.english ? 'valid' : ''}`}>
                                <span className="check-icon">✓</span> 영문 대소문자 포함
                            </div>
                            <div className={`condition ${validations.number ? 'valid' : ''}`}>
                                <span className="check-icon">✓</span> 숫자 포함
                            </div>
                            <div className={`condition ${validations.special ? 'valid' : ''}`}>
                                <span className="check-icon">✓</span> 특수문자 포함
                            </div>
                        </div>

                        <div className="input-group">
                            <input
                                type="password"
                                placeholder="비밀번호를 재입력하세요"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="auth-input"
                                required
                            />
                        </div>
                        {password && confirmPassword && password !== confirmPassword && (
                            <p className="error-message">비밀번호가 일치하지 않습니다.</p>
                        )}

                        <button
                            type="submit"
                            className="auth-submit-btn"
                            disabled={!isPasswordValid}
                            style={{ opacity: isPasswordValid ? 1 : 0.5, cursor: isPasswordValid ? 'pointer' : 'not-allowed' }}
                        >
                            다음으로
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // Render Step 3: Terms Agreement
    if (step === 3) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-nav-header">
                        <button className="back-btn" onClick={handleBack}>{'<'}</button>
                        <span className="nav-title">회원가입</span>
                        <div style={{ width: '24px' }}></div>
                    </div>
                    <div className="auth-header">
                        <h1 className="auth-title" style={{ fontSize: '1.4rem', wordBreak: 'break-all', lineHeight: '1.4' }}>
                            {email}
                            <span style={{ display: 'block', fontSize: '1.2rem', marginTop: '0.2rem' }}>으로 가입하기</span>
                        </h1>
                        <p className="auth-subtitle" style={{ whiteSpace: 'pre-line' }}>
                            거의 다 왔어요.{'\n'}원활한 서비스 이용을 위해 동의가 필요해요.
                        </p>
                    </div>

                    <form onSubmit={handleTermsSubmit} className="auth-form">
                        <div className="terms-container">
                            <div className="term-item all-agree">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={isAllChecked}
                                        onChange={handleAllAgree}
                                    />
                                    <span className="checkmark"></span>
                                    <span className="term-text">전체 약관에 동의합니다.</span>
                                </label>
                            </div>

                            <div className="terms-divider"></div>

                            <div className="term-item">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={agreements.service}
                                        onChange={() => toggleAgreement('service')}
                                    />
                                    <span className="checkmark"></span>
                                    <span className="term-text">[필수] 서비스 이용약관</span>
                                </label>
                                <button type="button" className="term-detail-btn" onClick={() => setDetailView('service')}>{'>'}</button>
                            </div>

                            <div className="term-item">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={agreements.privacy}
                                        onChange={() => toggleAgreement('privacy')}
                                    />
                                    <span className="checkmark"></span>
                                    <span className="term-text">[필수] 개인정보 필수 수집 이용 동의서</span>
                                </label>
                                <button type="button" className="term-detail-btn" onClick={() => setDetailView('privacy')}>{'>'}</button>
                            </div>

                            <div className="term-item">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={agreements.community}
                                        onChange={() => toggleAgreement('community')}
                                    />
                                    <span className="checkmark"></span>
                                    <span className="term-text">[필수] 커뮤니티 이용약관 이용 동의서</span>
                                </label>
                                <button type="button" className="term-detail-btn" onClick={() => setDetailView('community')}>{'>'}</button>
                            </div>

                            <div className="term-item">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={agreements.marketing}
                                        onChange={() => toggleAgreement('marketing')}
                                    />
                                    <span className="checkmark"></span>
                                    <span className="term-text">[선택] 마케팅 활용 및 광고성 정보 수신</span>
                                </label>
                                <button type="button" className="term-detail-btn" onClick={() => setDetailView('marketing')}>{'>'}</button>
                            </div>

                            <div className="terms-divider dashed"></div>

                            <div className="term-item">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={agreements.age}
                                        onChange={() => toggleAgreement('age')}
                                    />
                                    <span className="checkmark"></span>
                                    <span className="term-text">[필수] 만 14세 이상입니다.</span>
                                </label>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="auth-submit-btn"
                            disabled={!allRequiredChecked}
                            style={{ opacity: allRequiredChecked ? 1 : 0.5, cursor: allRequiredChecked ? 'pointer' : 'not-allowed' }}
                        >
                            다음으로
                        </button>
                    </form>

                    {/* Terms Detail Modal Overlay */}
                    {detailView && (
                        <div className="terms-modal-overlay">
                            <div className="terms-modal">
                                <h3>이용약관 상세</h3>
                                <div className="terms-content">
                                    <p>여기에 {detailView === 'service' ? '서비스 이용약관' :
                                        detailView === 'privacy' ? '개인정보 처리방침' :
                                            detailView === 'community' ? '커뮤니티 이용 수칙' : '마케팅 정보 수신'}에 대한 상세 내용이 들어갑니다.</p>
                                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                                    <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                                </div>
                                <button className="close-terms-btn" onClick={() => setDetailView(null)}>닫기</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }
    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-nav-header">
                    <button className="back-btn" onClick={handleBack}>{'<'}</button>
                    <span className="nav-title">회원가입</span>
                    <div style={{ width: '24px' }}></div>
                </div>
                <div className="auth-header">
                    <h1 className="auth-title" style={{ fontSize: '1.4rem', wordBreak: 'break-all', lineHeight: '1.4' }}>
                        {email}
                        <span style={{ display: 'block', fontSize: '1.2rem', marginTop: '0.2rem' }}>으로 가입하기</span>
                    </h1>
                    <p className="auth-subtitle">
                        이제 마지막 단계예요.
                    </p>
                    <p className="auth-description" style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                        동의하신 내용은 아래와 같아요.
                    </p>
                </div>

                <div className="confirmation-content">
                    <div className="info-section">
                        <h3 className="info-title">계정 정보</h3>
                        <div className="info-row">
                            <span className="info-label">가입 수단</span>
                            <span className="info-value">이메일</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">이메일</span>
                            <span className="info-value">{email}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">가입일</span>
                            <span className="info-value">{formatDate(agreementDate)}</span>
                        </div>
                    </div>

                    <div className="info-section">
                        <h3 className="info-title">수신 정보</h3>
                        <div className="info-row">
                            <span className="info-label">동의 여부</span>
                            <span className="info-value">동의</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">동의 일시</span>
                            <span className="info-value">{formatDateTime(agreementDate)}</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleFinalSignup}
                    className="auth-submit-btn"
                    style={{ marginTop: '2rem' }}
                >
                    가입하기
                </button>

                {/* Join Success Modal */}
                {showJoinSuccessModal && (
                    <div className="terms-modal-overlay">
                        <div className="terms-modal" style={{ height: 'auto', minHeight: 'auto', textAlign: 'center', padding: '2rem' }}>
                            <h3 style={{ marginBottom: '1rem' }}>가입에 성공 했습니다.</h3>
                            <button
                                onClick={() => {
                                    setShowJoinSuccessModal(false);
                                    setStep(5); // Go to login
                                }}
                                className="auth-submit-btn"
                                style={{ marginTop: '1rem', width: '100%' }}
                            >
                                확인
                            </button>
                        </div>
                    </div>
                )}

                {/* Join Error Modal */}
                {showJoinErrorModal && (
                    <div className="terms-modal-overlay">
                        <div className="terms-modal" style={{ height: 'auto', minHeight: 'auto', textAlign: 'center', padding: '2rem' }}>
                            <h3 style={{ marginBottom: '1rem' }}>이미 가입된 회원입니다.</h3>
                            <button
                                onClick={() => {
                                    setShowJoinErrorModal(false);
                                    setStep(5); // Go to login
                                }}
                                className="auth-submit-btn"
                                style={{ marginTop: '1rem', width: '100%' }}
                            >
                                확인
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginScreen;

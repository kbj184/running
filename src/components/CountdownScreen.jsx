import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

function CountdownScreen({ onComplete }) {
    const { t } = useTranslation();
    const [count, setCount] = useState(3);

    useEffect(() => {
        console.log('🎬 카운트다운 시작!');

        if (count === 0) {
            console.log('🏃‍♂️ GO! 러닝 시작!');
            setTimeout(() => {
                onComplete();
            }, 500); // "GO!" 표시 후 0.5초 대기
            return;
        }

        const timer = setTimeout(() => {
            setCount(count - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [count, onComplete]);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#4318FF',
            background: 'linear-gradient(135deg, #4318FF 0%, #5B2FFF 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
        }}>
            {/* 반투명 오버레이 */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                zIndex: 1
            }} />

            {/* 카운트다운 숫자 또는 GO */}
            <div style={{
                fontSize: count > 0 ? '200px' : '140px',
                fontWeight: '900',
                color: '#ffffff',
                textShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                animation: 'pulse 0.5s ease-in-out',
                userSelect: 'none',
                zIndex: 2,
                position: 'relative'
            }}>
                {count > 0 ? count : t('running.countdown.go')}
            </div>

            {/* 준비 메시지 */}
            {count > 0 && (
                <div style={{
                    marginTop: '40px',
                    fontSize: '28px',
                    fontWeight: '700',
                    color: '#ffffff',
                    letterSpacing: '3px',
                    textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
                    zIndex: 2,
                    position: 'relative'
                }}>
                    {t('running.countdown.ready')}...
                </div>
            )}

            {/* 애니메이션 원 */}
            <div style={{
                position: 'absolute',
                width: '300px',
                height: '300px',
                borderRadius: '50%',
                border: '4px solid rgba(255, 255, 255, 0.3)',
                animation: 'expand 1s ease-out infinite',
                zIndex: 2
            }} />

            {/* CSS 애니메이션 */}
            <style>{`
                @keyframes pulse {
                    0% {
                        transform: scale(0.8);
                        opacity: 0;
                    }
                    50% {
                        transform: scale(1.1);
                    }
                    100% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }

                @keyframes expand {
                    0% {
                        transform: scale(0.8);
                        opacity: 0.8;
                    }
                    100% {
                        transform: scale(1.5);
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    );
}

export default CountdownScreen;

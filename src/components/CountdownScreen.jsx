import { useState, useEffect } from 'react';

function CountdownScreen({ onComplete }) {
    const [count, setCount] = useState(5);

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
            backgroundColor: '#0f172a',
            backgroundImage: 'url(/rudolph-background.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
        }}>
            {/* 반투명 오버레이 - 텍스트 가독성 향상 */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                backdropFilter: 'blur(2px)',
                zIndex: 1
            }} />

            {/* 카운트다운 숫자 또는 GO */}
            <div style={{
                fontSize: count > 0 ? '180px' : '120px',
                fontWeight: '900',
                color: count > 0 ? '#fbbf24' : '#22c55e',
                textShadow: count > 0
                    ? '0 0 60px rgba(251, 191, 36, 0.8), 0 0 100px rgba(239, 68, 68, 0.5)'
                    : '0 0 60px rgba(34, 197, 94, 0.8)',
                animation: 'pulse 0.5s ease-in-out',
                userSelect: 'none',
                zIndex: 2,
                position: 'relative'
            }}>
                {count > 0 ? count : 'GO!'}
            </div>

            {/* 준비 메시지 */}
            {count > 0 && (
                <div style={{
                    marginTop: '40px',
                    fontSize: '28px',
                    fontWeight: '700',
                    color: '#ffffff',
                    letterSpacing: '3px',
                    textShadow: '0 0 20px rgba(255, 255, 255, 0.8), 0 2px 4px rgba(0, 0, 0, 0.5)',
                    zIndex: 2,
                    position: 'relative'
                }}>
                    🎄 준비하세요... 🎅
                </div>
            )}

            {/* 애니메이션 원 */}
            <div style={{
                position: 'absolute',
                width: '300px',
                height: '300px',
                borderRadius: '50%',
                border: '4px solid rgba(251, 191, 36, 0.4)',
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

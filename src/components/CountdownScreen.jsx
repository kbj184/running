import { useState, useEffect } from 'react';

function CountdownScreen({ onComplete }) {
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
            backgroundColor: '#0f172a',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
        }}>
            {/* 카운트다운 숫자 또는 GO */}
            <div style={{
                fontSize: count > 0 ? '180px' : '120px',
                fontWeight: '900',
                color: count > 0 ? '#667eea' : '#22c55e',
                textShadow: '0 0 40px rgba(102, 126, 234, 0.5)',
                animation: 'pulse 0.5s ease-in-out',
                userSelect: 'none'
            }}>
                {count > 0 ? count : 'GO!'}
            </div>

            {/* 준비 메시지 */}
            {count > 0 && (
                <div style={{
                    marginTop: '40px',
                    fontSize: '24px',
                    fontWeight: '600',
                    color: 'rgba(255, 255, 255, 0.7)',
                    letterSpacing: '2px'
                }}>
                    준비하세요...
                </div>
            )}

            {/* 애니메이션 원 */}
            <div style={{
                position: 'absolute',
                width: '300px',
                height: '300px',
                borderRadius: '50%',
                border: '4px solid rgba(102, 126, 234, 0.3)',
                animation: 'expand 1s ease-out infinite'
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

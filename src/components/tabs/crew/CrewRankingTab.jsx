import React from 'react';
import CrewSubHeader from '../../layout/CrewSubHeader';

function CrewRankingTab({ allCrews }) {
    // 크루를 멤버 수로 정렬 (향후 총 거리, 평균 페이스 등으로 확장 가능)
    const rankedCrews = [...allCrews].sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0));

    return (
        <div>
            <CrewSubHeader />
            <div style={{ padding: '20px' }}>
                <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '700' }}>크루 랭킹</h2>

                {rankedCrews.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
                        <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>아직 랭킹 정보가 없습니다</p>
                        <p style={{ fontSize: '14px' }}>크루가 생성되면 랭킹이 표시됩니다!</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {rankedCrews.map((crew, index) => {
                            let crewImage;
                            try {
                                crewImage = JSON.parse(crew.imageUrl);
                            } catch {
                                crewImage = { url: crew.imageUrl };
                            }

                            const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';

                            return (
                                <div
                                    key={crew.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px',
                                        padding: '16px',
                                        backgroundColor: index < 3 ? '#f8f9fa' : '#fff',
                                        borderRadius: '12px',
                                        border: index < 3 ? '2px solid #ffd700' : '1px solid #e0e0e0',
                                        boxShadow: index < 3 ? '0 2px 8px rgba(255,215,0,0.2)' : 'none'
                                    }}
                                >
                                    <div style={{
                                        width: '40px',
                                        textAlign: 'center',
                                        fontSize: '24px',
                                        fontWeight: '800',
                                        color: index < 3 ? '#ffa500' : '#888'
                                    }}>
                                        {rankEmoji || `${index + 1}`}
                                    </div>
                                    <div
                                        style={{
                                            width: '50px',
                                            height: '50px',
                                            borderRadius: '10px',
                                            background: crewImage.bg || '#ddd',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '28px',
                                            flexShrink: 0,
                                            overflow: 'hidden'
                                        }}
                                    >
                                        {crewImage.url ? (
                                            <img src={crewImage.url} alt={crew.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            crewImage.emoji
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1a1a1a' }}>{crew.name}</h3>
                                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#666' }}>
                                            멤버 {crew.memberCount || 0}명
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default CrewRankingTab;

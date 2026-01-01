import React from 'react';

function CrewHomeTab({ allCrews, onCrewClick }) {
    return (
        <div style={{ padding: '20px' }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '700' }}>크루 목록</h2>

            {allCrews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
                    <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>아직 생성된 크루가 없습니다</p>
                    <p style={{ fontSize: '14px' }}>크루 만들기 탭에서 새로운 크루를 만들어보세요!</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {allCrews.map((crew) => {
                        let crewImage;
                        try {
                            crewImage = JSON.parse(crew.imageUrl);
                        } catch {
                            crewImage = { url: crew.imageUrl };
                        }

                        return (
                            <div
                                key={crew.id}
                                onClick={() => onCrewClick({ ...crew, image: crewImage })}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    padding: '16px',
                                    backgroundColor: '#fff',
                                    borderRadius: '12px',
                                    border: '1px solid #e0e0e0',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div
                                    style={{
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '12px',
                                        background: crewImage.bg || '#ddd',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '32px',
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
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1a1a1a' }}>{crew.name}</h3>
                                        <span style={{ fontSize: '12px', color: '#888', backgroundColor: '#f5f5f5', padding: '2px 6px', borderRadius: '4px' }}>
                                            {crew.memberCount || 0}명
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '14px', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                                        {crew.description || '설명이 없습니다.'}
                                    </p>
                                </div>
                                <div style={{ fontSize: '24px', color: '#ccc' }}>›</div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default CrewHomeTab;

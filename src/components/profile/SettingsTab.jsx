import React from 'react';

function SettingsTab({ onLogout }) {
    return (
        <div>
            <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: '700' }}>설정</h2>
            <div style={{ maxWidth: '600px' }}>
                <button
                    onClick={onLogout}
                    style={{
                        width: '100%',
                        padding: '16px',
                        backgroundColor: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    로그아웃
                </button>
            </div>
        </div>
    );
}

export default SettingsTab;

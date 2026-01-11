import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../utils/api';
import RecentRecords from '../common/RecentRecords';

function MyCourseTab({ user, onRecordClick, onChallengeRecordClick }) {
    const { t } = useTranslation();
    const [refreshKey, setRefreshKey] = useState(0);
    const [activeSubTab, setActiveSubTab] = useState('BOOKMARK'); // BOOKMARK, CREW, CHALLENGE

    const handleRefresh = useCallback(() => {
        setRefreshKey(prev => prev + 1);
    }, []);

    const subTabs = [
        { id: 'BOOKMARK', label: '즐겨찾기', icon: '⭐' },
        { id: 'CREW', label: '크루', icon: '🏆' },
        { id: 'CHALLENGE', label: '챌린지', icon: '🔄' }
    ];

    return (
        <div style={{ width: '100%', paddingBottom: '80px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px', color: '#1a1a1a' }}>
                {t('profile.tabs.courses')}
            </h2>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>
                내 코스 기록과 도전 기록을 확인하세요.
            </p>

            {/* Sub Tab Menu */}
            <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '24px',
                padding: '4px',
                backgroundColor: '#f1f5f9',
                borderRadius: '12px',
                width: 'fit-content'
            }}>
                {subTabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSubTab(tab.id)}
                        style={{
                            padding: '10px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: activeSubTab === tab.id ? '#fff' : 'transparent',
                            color: activeSubTab === tab.id ? '#4318FF' : '#64748b',
                            fontSize: '14px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: activeSubTab === tab.id ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        <span>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {activeSubTab === 'BOOKMARK' && (
                    <RecentRecords
                        user={user}
                        onRecordClick={onRecordClick}
                        onRefresh={handleRefresh}
                        hideTitle={true}
                        showAll={true}
                        fetchUrl={`${import.meta.env.VITE_API_URL}/api/running/sessions/bookmarked?userId=${user.id}`}
                    />
                )}

                {activeSubTab === 'CREW' && (
                    <RecentRecords
                        user={user}
                        onRecordClick={onRecordClick}
                        onRefresh={handleRefresh}
                        hideTitle={true}
                        showAll={true}
                        filter={(r) => r.courseType === 'CREW' || (r.courseId && !r.courseType)}
                    />
                )}

                {activeSubTab === 'CHALLENGE' && (
                    <RecentRecords
                        user={user}
                        onRecordClick={(record) => {
                            // 챌린지 탭 전용 클릭 핸들러 (비교 모달 연결)
                            if (onChallengeRecordClick) {
                                onChallengeRecordClick(record);
                            } else {
                                onRecordClick(record);
                            }
                        }}
                        onRefresh={handleRefresh}
                        hideTitle={true}
                        showAll={true}
                        filter={(r) => r.courseType === 'RETRY'}
                    />
                )}
            </div>
        </div>
    );
}

export default MyCourseTab;

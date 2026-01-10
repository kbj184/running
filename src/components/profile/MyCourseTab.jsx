import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../utils/api';
import RecentRecords from '../common/RecentRecords';

function MyCourseTab({ user, onRecordClick }) {
    const { t } = useTranslation();
    const [refreshKey, setRefreshKey] = useState(0);
    const [bookmarkedRecords, setBookmarkedRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && user.id) {
            fetchBookmarkedRecords();
        }
    }, [user, refreshKey]);

    const fetchBookmarkedRecords = async () => {
        setLoading(true);
        try {
            const response = await api.request(`${import.meta.env.VITE_API_URL}/api/running/sessions/bookmarked?userId=${user.id}`, {
                method: 'GET',
                headers: {
                    'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setBookmarkedRecords(data);
            }
        } catch (err) {
            console.error('즐겨찾기 기록 로딩 실패:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                <div>로딩 중...</div>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', paddingBottom: '80px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px', color: '#1a1a1a' }}>
                {t('profile.tabs.courses')}
            </h2>

            {bookmarkedRecords.length === 0 ? (
                <div style={{
                    padding: '60px 20px',
                    textAlign: 'center',
                    backgroundColor: '#fff',
                    borderRadius: '24px',
                    border: '1px solid #f0f0f0'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>⭐</div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1a', marginBottom: '8px' }}>
                        {t('profile.noCourses')}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                        {t('profile.addCourseInfo')}
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <RecentRecords
                        user={user}
                        onRecordClick={onRecordClick}
                        onRefresh={() => setRefreshKey(prev => prev + 1)}
                        hideTitle={true}
                        showAll={true}
                        fetchUrl={`${import.meta.env.VITE_API_URL}/api/running/sessions/bookmarked?userId=${user.id}`}
                    />
                </div>
            )}
        </div>
    );
}

export default MyCourseTab;

import { useState, useEffect } from 'react';
import { api } from '../utils/api';

/**
 * 크루 내 사용자 권한 조회 Hook
 * @param {number} crewId - 크루 ID
 * @param {object} user - 사용자 정보
 * @returns {object} 권한 정보 { role, isCaptain, isViceCaptain, isManager, isMember, loading }
 */
export const useCrewPermission = (crewId, user) => {
    const [permission, setPermission] = useState({
        role: 'none',
        isCaptain: false,
        isViceCaptain: false,
        isManager: false,
        isMember: false,
        loading: true
    });

    useEffect(() => {
        if (!crewId || !user || !user.accessToken) {
            setPermission({
                role: 'none',
                isCaptain: false,
                isViceCaptain: false,
                isManager: false,
                isMember: false,
                loading: false
            });
            return;
        }

        const fetchPermission = async () => {
            try {
                const headers = {
                    'Authorization': user.accessToken.startsWith('Bearer ')
                        ? user.accessToken
                        : `Bearer ${user.accessToken}`
                };

                const response = await api.request(
                    `${import.meta.env.VITE_API_URL}/crew/${crewId}/my-role`,
                    { headers }
                );

                if (response.ok) {
                    const data = await response.json();
                    setPermission({
                        ...data,
                        loading: false
                    });
                } else {
                    setPermission({
                        role: 'none',
                        isCaptain: false,
                        isViceCaptain: false,
                        isManager: false,
                        isMember: false,
                        loading: false
                    });
                }
            } catch (error) {
                console.error('Failed to fetch crew permission:', error);
                setPermission({
                    role: 'none',
                    isCaptain: false,
                    isViceCaptain: false,
                    isManager: false,
                    isMember: false,
                    loading: false
                });
            }
        };

        fetchPermission();
    }, [crewId, user]);

    return permission;
};

/**
 * 역할 이름 반환
 * @param {string} role - 역할 코드
 * @returns {string} 역할 이름
 */
export const getRoleName = (role) => {
    switch (role) {
        case 'captain':
            return '크루장';
        case 'vice_captain':
            return '부크루장';
        case 'member':
            return '멤버';
        default:
            return '';
    }
};

/**
 * 역할 배지 스타일 반환
 * @param {string} role - 역할 코드
 * @returns {object} 배지 스타일
 */
export const getRoleBadgeStyle = (role) => {
    const baseStyle = {
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '600',
        display: 'inline-block'
    };

    switch (role) {
        case 'captain':
            return {
                ...baseStyle,
                backgroundColor: '#FF9A56',
                color: '#fff'
            };
        case 'vice_captain':
            return {
                ...baseStyle,
                backgroundColor: '#4CAF50',
                color: '#fff'
            };
        case 'member':
            return {
                ...baseStyle,
                backgroundColor: '#e0e0e0',
                color: '#666'
            };
        default:
            return baseStyle;
    }
};

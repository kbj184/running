import React from 'react';
import { useTranslation } from 'react-i18next';
import { useUnit } from '../../contexts/UnitContext';

function UnitSwitcher() {
    const { t } = useTranslation();
    const { unit, setUnitPreference } = useUnit();

    const units = [
        { code: 'km', name: t('settings.km') },
        { code: 'miles', name: t('settings.miles') }
    ];

    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px'
        }}>
            <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#fff',
                marginBottom: '12px'
            }}>
                {t('settings.unit')}
            </div>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px'
            }}>
                {units.map((u) => (
                    <button
                        key={u.code}
                        onClick={() => setUnitPreference(u.code)}
                        style={{
                            padding: '12px',
                            borderRadius: '8px',
                            border: unit === u.code
                                ? '2px solid #2196F3'
                                : '1px solid rgba(255,255,255,0.1)',
                            background: unit === u.code
                                ? 'rgba(33, 150, 243, 0.2)'
                                : 'rgba(255, 255, 255, 0.05)',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: unit === u.code ? '600' : '400',
                            transition: 'all 0.2s'
                        }}
                    >
                        {u.name}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default UnitSwitcher;

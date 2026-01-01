import React from 'react';
import { useTranslation } from 'react-i18next';

function LanguageSwitcher() {
    const { i18n, t } = useTranslation();

    const languages = [
        { code: 'ko', name: t('settings.korean'), available: true },
        { code: 'en', name: t('settings.english'), available: true },
        { code: 'ja', name: t('settings.japanese'), available: false },
        { code: 'zh', name: t('settings.chinese'), available: false }
    ];

    const handleLanguageChange = (langCode) => {
        if (languages.find(l => l.code === langCode)?.available) {
            i18n.changeLanguage(langCode);
        }
    };

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
                {t('settings.language')}
            </div>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px'
            }}>
                {languages.map((lang) => (
                    <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        disabled={!lang.available}
                        style={{
                            padding: '12px',
                            borderRadius: '8px',
                            border: i18n.language === lang.code
                                ? '2px solid #4CAF50'
                                : '1px solid rgba(255,255,255,0.1)',
                            background: i18n.language === lang.code
                                ? 'rgba(76, 175, 80, 0.2)'
                                : 'rgba(255, 255, 255, 0.05)',
                            color: lang.available ? '#fff' : '#666',
                            cursor: lang.available ? 'pointer' : 'not-allowed',
                            fontSize: '14px',
                            fontWeight: i18n.language === lang.code ? '600' : '400',
                            transition: 'all 0.2s',
                            opacity: lang.available ? 1 : 0.5
                        }}
                    >
                        {lang.name}
                        {!lang.available && (
                            <div style={{ fontSize: '10px', marginTop: '4px', color: '#999' }}>
                                {t('settings.comingSoon')}
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default LanguageSwitcher;

import React from 'react';
import { useTranslation } from 'react-i18next';

function HomeTab() {
    const { t } = useTranslation();

    return (
        <div className="tab-content home-tab">
            <div className="welcome-section">
                <h1>{t('home.welcome')}</h1>
                <p>{t('home.subtitle')}</p>
            </div>
        </div>
    );
}

export default HomeTab;

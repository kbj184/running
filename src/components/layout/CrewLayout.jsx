import React from 'react';
import { Outlet } from 'react-router-dom';
import CrewSubHeader from './CrewSubHeader';

function CrewLayout() {
    return (
        <div style={{ marginTop: 'var(--header-height)' }}>
            <CrewSubHeader />
            <Outlet />
        </div>
    );
}

export default CrewLayout;

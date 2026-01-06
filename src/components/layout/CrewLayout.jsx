import React from 'react';
import { Outlet } from 'react-router-dom';
import CrewSubHeader from './CrewSubHeader';

function CrewLayout() {
    return (
        <div style={{ marginTop: 'calc(var(--header-height) - 56px)' }}>
            <CrewSubHeader />
            <Outlet />
        </div>
    );
}

export default CrewLayout;

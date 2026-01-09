import React from 'react';
import { Outlet } from 'react-router-dom';

function CrewLayout() {
    return (
        <div>
            <Outlet />
        </div>
    );
}

export default CrewLayout;


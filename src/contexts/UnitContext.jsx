import React, { createContext, useContext, useState, useEffect } from 'react';

const UnitContext = createContext();

export const UnitProvider = ({ children }) => {
    const [unit, setUnit] = useState(() => {
        // Load from localStorage or default to 'km'
        const savedUnit = localStorage.getItem('distanceUnit');
        return savedUnit || 'km';
    });

    const toggleUnit = () => {
        const newUnit = unit === 'km' ? 'miles' : 'km';
        setUnit(newUnit);
        localStorage.setItem('distanceUnit', newUnit);
    };

    const setUnitPreference = (newUnit) => {
        if (newUnit === 'km' || newUnit === 'miles') {
            setUnit(newUnit);
            localStorage.setItem('distanceUnit', newUnit);
        }
    };

    return (
        <UnitContext.Provider value={{ unit, toggleUnit, setUnitPreference }}>
            {children}
        </UnitContext.Provider>
    );
};

export const useUnit = () => {
    const context = useContext(UnitContext);
    if (!context) {
        throw new Error('useUnit must be used within a UnitProvider');
    }
    return context;
};

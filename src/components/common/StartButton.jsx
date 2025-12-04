import React from 'react';

function StartButton({ isRunning, onClick }) {
    return (
        <button
            className={`start-button ${isRunning ? 'running' : ''}`}
            onClick={onClick}
        >
            <div className="start-button-inner">
                <span className="start-icon">{isRunning ? '⏸️' : '▶️'}</span>
                <span className="start-text">{isRunning ? '일시정지' : '시작'}</span>
            </div>
        </button>
    );
}

export default StartButton;

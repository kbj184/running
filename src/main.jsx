import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './i18n'
import { UnitProvider } from './contexts/UnitContext'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <UnitProvider>
            <App />
        </UnitProvider>
    </React.StrictMode>,
)

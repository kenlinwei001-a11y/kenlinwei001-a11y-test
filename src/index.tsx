
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');

if (container) {
    const root = createRoot(container);
    
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );

    // Simple, clean removal of the loader
    const loader = document.getElementById('app-loader');
    if (loader) {
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => {
                if (loader.parentNode) {
                    loader.parentNode.removeChild(loader);
                }
            }, 300);
        }, 100);
    }
}

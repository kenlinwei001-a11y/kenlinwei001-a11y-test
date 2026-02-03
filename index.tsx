
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');

if (container) {
    const root = createRoot(container);
    
    // Mount the application
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );

    // CRITICAL: Remove the loading spinner once the JS executes.
    // Using a small timeout allows the React component to perform its initial paint first.
    const loader = document.getElementById('app-loader');
    if (loader) {
        setTimeout(() => {
            loader.style.opacity = '0';
            loader.style.pointerEvents = 'none'; // Ensure clicks pass through immediately
            setTimeout(() => {
                if (loader.parentNode) {
                    loader.parentNode.removeChild(loader);
                }
            }, 600); // Wait for opacity transition to finish
        }, 500);
    }
} else {
    console.error("Failed to find root element");
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { TranslationProvider } from './contexts/TranslationContext';
import { TTSProvider } from './contexts/TTSContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <TranslationProvider>
      <TTSProvider>
        <App />
      </TTSProvider>
    </TranslationProvider>
  </React.StrictMode>
);
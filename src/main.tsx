import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initPwa } from './lib/pwa';
import './index.css';

// Seed the PWA store from the early `beforeinstallprompt` bridge and register
// the service worker before React renders.
initPwa();

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

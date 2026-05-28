import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { handleGoogleRedirect } from './lib/googleAuth';

// Handle Google Redirect Callback immediately on app startup
handleGoogleRedirect();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

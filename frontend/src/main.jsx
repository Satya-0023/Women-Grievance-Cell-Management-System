import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './App.css'; // Import global app styles
import App from './App.jsx';
import './api/api.js'; // Import to set up the interceptor

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
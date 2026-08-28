import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initEarlyTheme } from './themes';

// Run early theme initialization before React renders
initEarlyTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


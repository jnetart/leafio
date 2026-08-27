import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { installDesktopGuard } from './lib/desktop-guard';
import { installPlatformChrome } from './lib/platform-chrome';
import './index.css';

installPlatformChrome();
installDesktopGuard();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>,
);

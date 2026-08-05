import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import { ToastProvider, useToast } from './context/ToastContext';

function AppContent() {
  const [token, setToken] = useState(() => localStorage.getItem('foreman_token') || null);
  const [view, setView] = useState('login');
  const [successMessage, setSuccessMessage] = useState('');
  const [invitationInfo, setInvitationInfo] = useState(null);
  const { showInfo } = useToast();

  useEffect(() => {
    // Parse invitation parameters from URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const pathname = window.location.pathname;

    const wrkspcId = urlParams.get('wrkspcid') || urlParams.get('wrkspcId') || urlParams.get('wrkspc');
    const projId = urlParams.get('projid') || urlParams.get('projId');
    const email = urlParams.get('email');

    if (pathname.includes('/join-project') || (projId && email)) {
      setInvitationInfo({
        type: 'project',
        wrkspcId: wrkspcId ? Number(wrkspcId) : null,
        projId: Number(projId),
        email,
      });
      if (!token) {
        setSuccessMessage(`You have been invited to join a project! Please sign in with ${email} to accept.`);
      }
    } else if (pathname.includes('/join') || (wrkspcId && email)) {
      setInvitationInfo({
        type: 'workspace',
        wrkspcId: Number(wrkspcId),
        email,
      });
      if (!token) {
        setSuccessMessage(`You have been invited to join a workspace! Please sign in with ${email} to accept.`);
      }
    }
  }, [token]);

  const handleLoginSuccess = (newToken) => {
    localStorage.setItem('foreman_token', newToken);
    setToken(newToken);
    setSuccessMessage('');
  };

  const handleRegisterSuccess = (msg) => {
    setSuccessMessage(msg);
    setView('login');
  };

  const handleLogout = () => {
    localStorage.removeItem('foreman_token');
    setToken(null);
    setView('login');
    setSuccessMessage('');
    setInvitationInfo(null);
    showInfo('You have logged out successfully.');
  };

  const clearInvitationInfo = () => {
    setInvitationInfo(null);
    if (window.history.pushState) {
      const cleanUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
      window.history.pushState({ path: cleanUrl }, '', cleanUrl);
    }
  };

  if (token) {
    return (
      <Dashboard
        token={token}
        onLogout={handleLogout}
        invitationInfo={invitationInfo}
        onClearInvitation={clearInvitationInfo}
      />
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-app)', minHeight: '100vh' }}>
      {view === 'login' ? (
        <Login
          onLoginSuccess={handleLoginSuccess}
          switchToRegister={() => {
            setView('register');
            setSuccessMessage('');
          }}
          successMessage={successMessage}
        />
      ) : (
        <Register
          onRegisterSuccess={handleRegisterSuccess}
          switchToLogin={() => {
            setView('login');
            setSuccessMessage('');
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}


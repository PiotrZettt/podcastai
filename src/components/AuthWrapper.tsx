import { useState, useEffect, type ReactNode } from 'react';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import type { AuthUser } from 'aws-amplify/auth';
import Login from './auth/Login';
import Register from './auth/Register';
import ForgotPassword from './auth/ForgotPassword';
import type { AuthScreen } from '../types';

interface AuthWrapperProps {
  children: ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>('login');

  useEffect(() => {
    checkAuthStatus();

    const listener = Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signedIn':
          checkAuthStatus();
          break;
        case 'signedOut':
          setAuthStatus('unauthenticated');
          setUser(null);
          break;
      }
    });

    return () => listener();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setAuthStatus('authenticated');
    } catch (err) {
      setAuthStatus('unauthenticated');
      setUser(null);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setAuthStatus('unauthenticated');
      setUser(null);
      setCurrentScreen('login');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const handleLoginSuccess = () => {
    checkAuthStatus();
  };

  const handleRegisterSuccess = () => {
    setCurrentScreen('login');
    alert('Registration successful! Please log in.');
  };

  const handleResetSuccess = () => {
    setCurrentScreen('login');
    alert('Password reset successful! Please log in.');
  };

  if (authStatus === 'loading') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ fontSize: '1.2rem', color: '#6c757d' }}>
          Loading...
        </div>
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
    return (
      <>
        {currentScreen === 'login' && (
          <Login
            onSwitchToRegister={() => setCurrentScreen('register')}
            onSwitchToForgotPassword={() => setCurrentScreen('forgotPassword')}
            onLoginSuccess={handleLoginSuccess}
          />
        )}
        {currentScreen === 'register' && (
          <Register
            onSwitchToLogin={() => setCurrentScreen('login')}
            onRegisterSuccess={handleRegisterSuccess}
          />
        )}
        {currentScreen === 'forgotPassword' && (
          <ForgotPassword
            onSwitchToLogin={() => setCurrentScreen('login')}
            onResetSuccess={handleResetSuccess}
          />
        )}
      </>
    );
  }

  return (
    <div>
      <div style={{
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #dee2e6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>PodcastAI</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>Welcome, {user?.signInDetails?.loginId || 'User'}</span>
          <button
            onClick={handleSignOut}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.9rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}

import { useState, useEffect, type ReactNode } from 'react';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import type { AuthUser } from 'aws-amplify/auth';
import { Button } from '@/components/ui/button';
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
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-xl text-muted-foreground">
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
      <header className="border-b border-border bg-card p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary m-0">PodcastAI</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-foreground">Welcome, {user?.signInDetails?.loginId || 'User'}</span>
            <Button onClick={handleSignOut} variant="destructive" size="sm">
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}

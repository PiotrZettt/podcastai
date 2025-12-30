import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import type { ReactNode } from 'react';

interface AuthWrapperProps {
  children: ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  return (
    <Authenticator>
      {({ signOut, user }) => (
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
                onClick={signOut}
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
      )}
    </Authenticator>
  );
}

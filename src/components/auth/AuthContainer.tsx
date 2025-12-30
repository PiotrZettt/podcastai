import type { ReactNode } from 'react';

interface AuthContainerProps {
  children: ReactNode;
  title: string;
}

export default function AuthContainer({ children, title }: AuthContainerProps) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f8f9fa',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        border: '1px solid #dee2e6'
      }}>
        <h1 style={{
          textAlign: 'center',
          marginBottom: '2rem',
          fontSize: '1.8rem',
          color: '#007bff'
        }}>
          {title}
        </h1>
        {children}
      </div>
    </div>
  );
}

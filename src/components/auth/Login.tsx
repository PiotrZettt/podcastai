import { useState } from 'react';
import { signIn } from 'aws-amplify/auth';
import AuthContainer from './AuthContainer';

interface LoginProps {
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword: () => void;
  onLoginSuccess: () => void;
}

export default function Login({ onSwitchToRegister, onSwitchToForgotPassword, onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!email || !password) {
        throw new Error('Please enter email and password');
      }

      const { isSignedIn, nextStep } = await signIn({
        username: email,
        password
      });

      if (isSignedIn) {
        onLoginSuccess();
      } else if (nextStep.signInStep === 'CONFIRM_SIGN_UP') {
        setError('Please verify your email before logging in');
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (err: any) {
      if (err.name === 'UserNotFoundException' || err.name === 'NotAuthorizedException') {
        setError('Invalid email or password');
      } else if (err.name === 'UserNotConfirmedException') {
        setError('Please verify your email address');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContainer title="PodcastAI">
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          style={{
            width: '100%',
            padding: '0.75rem',
            fontSize: '1rem',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            marginBottom: '1rem'
          }}
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          style={{
            width: '100%',
            padding: '0.75rem',
            fontSize: '1rem',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            marginBottom: '1rem'
          }}
        />

        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem',
          cursor: 'pointer'
        }}>
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          Remember me
        </label>

        {error && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            border: '1px solid #f5c6cb',
            borderRadius: '4px',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '0.75rem',
            fontSize: '1rem',
            backgroundColor: isLoading ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            marginBottom: '1rem'
          }}
        >
          {isLoading ? 'Logging in...' : 'Log In'}
        </button>

        <div style={{ textAlign: 'center', fontSize: '0.9rem' }}>
          <button
            type="button"
            onClick={onSwitchToForgotPassword}
            style={{
              background: 'none',
              border: 'none',
              color: '#007bff',
              cursor: 'pointer',
              textDecoration: 'underline',
              marginBottom: '1rem'
            }}
          >
            Forgot password?
          </button>
          <div>
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              style={{
                background: 'none',
                border: 'none',
                color: '#007bff',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Register
            </button>
          </div>
        </div>
      </form>
    </AuthContainer>
  );
}

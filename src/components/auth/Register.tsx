import { useState } from 'react';
import { signUp, confirmSignUp, resendSignUpCode } from 'aws-amplify/auth';
import AuthContainer from './AuthContainer';
import type { PasswordValidation } from '../../types';

interface RegisterProps {
  onSwitchToLogin: () => void;
  onRegisterSuccess: () => void;
}

export default function Register({ onSwitchToLogin, onRegisterSuccess }: RegisterProps) {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSymbol: false
  });
  const [needsConfirmation, setNeedsConfirmation] = useState<boolean>(false);
  const [confirmationCode, setConfirmationCode] = useState<string>('');

  const validatePassword = (pwd: string): PasswordValidation => {
    return {
      minLength: pwd.length >= 8,
      hasUppercase: /[A-Z]/.test(pwd),
      hasLowercase: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSymbol: /[^A-Za-z0-9]/.test(pwd)
    };
  };

  const handlePasswordChange = (pwd: string) => {
    setPassword(pwd);
    setPasswordValidation(validatePassword(pwd));
  };

  const isPasswordValid = Object.values(passwordValidation).every(v => v);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!email || !password) {
        throw new Error('Please fill in all fields');
      }

      if (!isPasswordValid) {
        throw new Error('Password does not meet requirements');
      }

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      const { isSignUpComplete, nextStep } = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email
          }
        }
      });

      if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        setNeedsConfirmation(true);
      } else if (isSignUpComplete) {
        onRegisterSuccess();
      }
    } catch (err: any) {
      if (err.name === 'UsernameExistsException') {
        setError('An account with this email already exists');
      } else if (err.name === 'InvalidPasswordException') {
        setError('Password does not meet requirements');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { isSignUpComplete } = await confirmSignUp({
        username: email,
        confirmationCode
      });

      if (isSignUpComplete) {
        onRegisterSuccess();
      }
    } catch (err: any) {
      if (err.name === 'CodeMismatchException') {
        setError('Invalid verification code');
      } else if (err.name === 'ExpiredCodeException') {
        setError('Verification code expired. Please request a new one.');
      } else {
        setError(err.message || 'Verification failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      await resendSignUpCode({ username: email });
      alert('Verification code resent to your email');
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
    }
  };

  return (
    <AuthContainer title={needsConfirmation ? 'Verify Email' : 'Register'}>
      {!needsConfirmation ? (
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
            onChange={(e) => handlePasswordChange(e.target.value)}
            placeholder="Password"
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              marginBottom: '0.5rem'
            }}
          />

          <div style={{
            fontSize: '0.85rem',
            marginBottom: '1rem',
            padding: '0.75rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            border: '1px solid #dee2e6'
          }}>
            <div style={{ marginBottom: '0.5rem', fontWeight: 'bold', color: '#6c757d' }}>
              Password requirements:
            </div>
            <div style={{ color: passwordValidation.minLength ? '#28a745' : '#dc3545' }}>
              {passwordValidation.minLength ? '✓' : '✗'} At least 8 characters
            </div>
            <div style={{ color: passwordValidation.hasUppercase ? '#28a745' : '#dc3545' }}>
              {passwordValidation.hasUppercase ? '✓' : '✗'} One uppercase letter
            </div>
            <div style={{ color: passwordValidation.hasLowercase ? '#28a745' : '#dc3545' }}>
              {passwordValidation.hasLowercase ? '✓' : '✗'} One lowercase letter
            </div>
            <div style={{ color: passwordValidation.hasNumber ? '#28a745' : '#dc3545' }}>
              {passwordValidation.hasNumber ? '✓' : '✗'} One number
            </div>
            <div style={{ color: passwordValidation.hasSymbol ? '#28a745' : '#dc3545' }}>
              {passwordValidation.hasSymbol ? '✓' : '✗'} One special character
            </div>
          </div>

          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm Password"
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
            {isLoading ? 'Registering...' : 'Register'}
          </button>

          <div style={{ textAlign: 'center', fontSize: '0.9rem' }}>
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              style={{
                background: 'none',
                border: 'none',
                color: '#007bff',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Log in
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleConfirmation}>
          <p style={{
            marginBottom: '1rem',
            textAlign: 'center',
            color: '#6c757d'
          }}>
            Please check your email for a verification code
          </p>

          <input
            type="text"
            value={confirmationCode}
            onChange={(e) => setConfirmationCode(e.target.value)}
            placeholder="Verification Code"
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
              backgroundColor: isLoading ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              marginBottom: '1rem'
            }}
          >
            {isLoading ? 'Verifying...' : 'Verify Email'}
          </button>

          <button
            type="button"
            onClick={handleResendCode}
            style={{
              background: 'none',
              border: 'none',
              color: '#007bff',
              cursor: 'pointer',
              textDecoration: 'underline',
              width: '100%',
              marginBottom: '1rem'
            }}
          >
            Resend verification code
          </button>

          <div style={{ textAlign: 'center', fontSize: '0.9rem' }}>
            <button
              type="button"
              onClick={onSwitchToLogin}
              style={{
                background: 'none',
                border: 'none',
                color: '#007bff',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Back to login
            </button>
          </div>
        </form>
      )}
    </AuthContainer>
  );
}

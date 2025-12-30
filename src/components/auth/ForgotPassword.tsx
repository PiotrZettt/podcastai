import { useState } from 'react';
import { resetPassword, confirmResetPassword } from 'aws-amplify/auth';
import AuthContainer from './AuthContainer';
import type { PasswordValidation } from '../../types';

interface ForgotPasswordProps {
  onSwitchToLogin: () => void;
  onResetSuccess: () => void;
}

export default function ForgotPassword({ onSwitchToLogin, onResetSuccess }: ForgotPasswordProps) {
  const [email, setEmail] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [step, setStep] = useState<'request' | 'confirm'>('request');
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSymbol: false
  });

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
    setNewPassword(pwd);
    setPasswordValidation(validatePassword(pwd));
  };

  const isPasswordValid = Object.values(passwordValidation).every(v => v);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!email) {
        throw new Error('Please enter your email');
      }

      await resetPassword({ username: email });
      setStep('confirm');
    } catch (err: any) {
      if (err.name === 'UserNotFoundException') {
        setError('No account found with this email');
      } else if (err.name === 'LimitExceededException') {
        setError('Too many attempts. Please try again later.');
      } else {
        setError(err.message || 'Failed to send reset code');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!code || !newPassword || !confirmPassword) {
        throw new Error('Please fill in all fields');
      }

      if (!isPasswordValid) {
        throw new Error('Password does not meet requirements');
      }

      if (newPassword !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword
      });

      onResetSuccess();
    } catch (err: any) {
      if (err.name === 'CodeMismatchException') {
        setError('Invalid verification code');
      } else if (err.name === 'ExpiredCodeException') {
        setError('Code expired. Please request a new one.');
      } else if (err.name === 'InvalidPasswordException') {
        setError('Password does not meet requirements');
      } else {
        setError(err.message || 'Failed to reset password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      await resetPassword({ username: email });
      alert('New code sent to your email');
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
    }
  };

  return (
    <AuthContainer title={step === 'request' ? 'Forgot Password' : 'Reset Password'}>
      {step === 'request' ? (
        <form onSubmit={handleRequestReset}>
          <p style={{
            marginBottom: '1rem',
            textAlign: 'center',
            color: '#6c757d'
          }}>
            Enter your email to receive a password reset code
          </p>

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
            {isLoading ? 'Sending...' : 'Send Reset Code'}
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
              Back to Login
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleConfirmReset}>
          <p style={{
            marginBottom: '1rem',
            textAlign: 'center',
            color: '#6c757d'
          }}>
            Check your email for a verification code
          </p>

          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
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

          <input
            type="password"
            value={newPassword}
            onChange={(e) => handlePasswordChange(e.target.value)}
            placeholder="New Password"
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
            placeholder="Confirm New Password"
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
            {isLoading ? 'Resetting...' : 'Reset Password'}
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
            Resend code
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
              Back to Login
            </button>
          </div>
        </form>
      )}
    </AuthContainer>
  );
}

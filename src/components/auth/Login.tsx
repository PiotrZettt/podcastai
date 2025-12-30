import { useState } from 'react';
import { signIn } from 'aws-amplify/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
        </div>

        <div>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="remember-me"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="cursor-pointer"
          />
          <Label htmlFor="remember-me" className="cursor-pointer">
            Remember me
          </Label>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Logging in...' : 'Log In'}
        </Button>

        <div className="text-center text-sm space-y-2">
          <button
            type="button"
            onClick={onSwitchToForgotPassword}
            className="text-primary hover:underline bg-transparent border-none cursor-pointer"
          >
            Forgot password?
          </button>
          <div>
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-primary hover:underline bg-transparent border-none cursor-pointer"
            >
              Register
            </button>
          </div>
        </div>
      </form>
    </AuthContainer>
  );
}

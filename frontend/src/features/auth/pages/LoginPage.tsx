import { useState, type SubmitEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Lock, Mail } from 'lucide-react';
import { login, fetchMyAccess } from '../api/auth.api';
import { extractApiErrorCode, extractApiErrorMessage } from '../../../shared/api/client';
import { useAuthStore } from '../../../shared/stores/auth.store';
import { AuthSplitLayout } from '../../../shared/components/AuthSplitLayout';
import { IconField } from '../../../shared/components/IconField';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';
import { Checkbox } from '../../../components/ui/checkbox';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);
  const setAccess = useAuthStore((state) => state.setAccess);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [totpCode, setTotpCode] = useState('');
  const [needsTotp, setNeedsTotp] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: async ({ accessToken, user }) => {
      setAuth({ accessToken, user });
      const access = await fetchMyAccess();
      setAccess(access);
      const redirectTo = (location.state as { from?: Location })?.from?.pathname ?? '/dashboard';
      navigate(redirectTo, { replace: true });
    },
    onError: (error) => {
      if (extractApiErrorCode(error) === 'TWO_FACTOR_REQUIRED') {
        setNeedsTotp(true);
        setErrorMessage('Enter the 6-digit code from your authenticator app.');
        return;
      }
      setErrorMessage(extractApiErrorMessage(error, 'Login failed.'));
    },
  });

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    mutation.mutate({ email, password, totpCode: needsTotp ? totpCode : undefined, rememberMe });
  }

  return (
    <AuthSplitLayout>
      <h2 className="text-xl font-semibold text-foreground">Sign in to your account</h2>
      <p className="mt-1.5 mb-6 text-sm text-muted-foreground">Enter your credentials to access the dashboard.</p>

      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <IconField
          id="email"
          label="Email address"
          icon={<Mail />}
          type="email"
          placeholder="you@company.com"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={needsTotp}
        />
        <IconField
          id="password"
          label="Password"
          icon={<Lock />}
          isPassword
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={needsTotp}
        />

        {needsTotp && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="totp">Authenticator code</Label>
            <Input
              id="totp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              autoFocus
            />
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 font-normal">
            <Checkbox checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked === true)} />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-primary hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-5 text-sm">
        New to Innova Tech Biz?{' '}
        <Link to="/register" className="text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </AuthSplitLayout>
  );
}

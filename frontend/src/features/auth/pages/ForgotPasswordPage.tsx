import { useEffect, useState, type SubmitEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Mail } from 'lucide-react';
import { forgotPassword, verifyResetCode } from '../api/auth.api';
import { extractApiErrorCode, extractApiErrorMessage } from '../../../shared/api/client';
import { AuthSplitLayout } from '../../../shared/components/AuthSplitLayout';
import { IconField } from '../../../shared/components/IconField';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';

const RESEND_COOLDOWN_SECONDS = 60;

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const requestCodeMutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: (data) => {
      setStep('code');
      setCode('');
      setDevOtpCode(data.devOtpCode ?? null);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    },
    onError: (error) => setErrorMessage(extractApiErrorMessage(error, 'Something went wrong.')),
  });

  const verifyCodeMutation = useMutation({
    mutationFn: verifyResetCode,
    onSuccess: (data) => {
      navigate('/reset-password', { state: { resetSessionToken: data.resetSessionToken } });
    },
    onError: (error) => {
      const code = extractApiErrorCode(error);
      if (code === 'RESET_CODE_LOCKED') {
        setErrorMessage('Too many incorrect attempts. Request a new code to try again.');
        return;
      }
      setErrorMessage(extractApiErrorMessage(error, 'That code is invalid or has expired.'));
    },
  });

  function handleEmailSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    requestCodeMutation.mutate(email);
  }

  function handleCodeSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    verifyCodeMutation.mutate({ email, code });
  }

  function handleResend() {
    setErrorMessage(null);
    requestCodeMutation.mutate(email);
  }

  return (
    <AuthSplitLayout>
      {step === 'email' ? (
        <>
          <h2 className="text-xl font-semibold text-foreground">Forgot password</h2>
          <p className="mt-1.5 mb-6 text-sm text-muted-foreground">
            We'll email you a 6-digit code if that account exists.
          </p>

          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
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
            />
            <Button type="submit" className="w-full" disabled={requestCodeMutation.isPending}>
              {requestCodeMutation.isPending ? 'Sending…' : 'Send code'}
            </Button>
          </form>
        </>
      ) : (
        <>
          <h2 className="text-xl font-semibold text-foreground">Enter your code</h2>
          <p className="mt-1.5 mb-6 text-sm text-muted-foreground">
            If an account with that email exists, we sent a 6-digit code to {email}.
            {devOtpCode && (
              <>
                <br />
                Dev mode — no email provider configured yet. Code: <strong>{devOtpCode}</strong>
              </>
            )}
          </p>

          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleCodeSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="code">6-digit code</Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full" disabled={verifyCodeMutation.isPending || code.length !== 6}>
              {verifyCodeMutation.isPending ? 'Verifying…' : 'Verify code'}
            </Button>
          </form>

          <p className="mt-4 text-sm text-muted-foreground">
            Didn't get it?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || requestCodeMutation.isPending}
              className="text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
            >
              {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend code'}
            </button>
          </p>
        </>
      )}

      <p className="mt-5 text-sm">
        <Link to="/login" className="text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthSplitLayout>
  );
}

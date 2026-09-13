import { useState, type SubmitEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Lock } from 'lucide-react';
import { resetPassword } from '../api/auth.api';
import { extractApiErrorMessage } from '../../../shared/api/client';
import { AuthSplitLayout } from '../../../shared/components/AuthSplitLayout';
import { IconField } from '../../../shared/components/IconField';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';

export function ResetPasswordPage() {
  const location = useLocation();
  const resetSessionToken = (location.state as { resetSessionToken?: string } | null)?.resetSessionToken;

  const [newPassword, setNewPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: resetPassword,
    onError: (error) => setErrorMessage(extractApiErrorMessage(error, 'Could not reset password.')),
  });

  if (!resetSessionToken) {
    return <Navigate to="/forgot-password" replace />;
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    mutation.mutate({ resetSessionToken: resetSessionToken!, newPassword });
  }

  return (
    <AuthSplitLayout>
      <h2 className="text-xl font-semibold text-foreground">Reset password</h2>
      <p className="mt-1.5 mb-6 text-sm text-muted-foreground">Choose a new password for your account.</p>

      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            {errorMessage}{' '}
            <Link to="/forgot-password" className="underline">
              Request a new code
            </Link>
            .
          </AlertDescription>
        </Alert>
      )}
      {mutation.isSuccess && (
        <Alert className="mb-4 border-primary/30 bg-primary/5">
          <AlertDescription>Password reset. You can now sign in with your new password.</AlertDescription>
        </Alert>
      )}

      {!mutation.isSuccess && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <IconField
            id="newPassword"
            label="New password"
            icon={<Lock />}
            isPassword
            autoComplete="new-password"
            minLength={10}
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? 'Resetting…' : 'Reset password'}
          </Button>
        </form>
      )}

      <p className="mt-5 text-sm">
        <Link to="/login" className="text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthSplitLayout>
  );
}

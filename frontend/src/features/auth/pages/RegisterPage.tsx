import { useState, type SubmitEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Lock, Mail, User } from 'lucide-react';
import { register, fetchMyAccess } from '../api/auth.api';
import { extractApiErrorMessage } from '../../../shared/api/client';
import { useAuthStore } from '../../../shared/stores/auth.store';
import { AuthSplitLayout } from '../../../shared/components/AuthSplitLayout';
import { IconField } from '../../../shared/components/IconField';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';

export function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const setAccess = useAuthStore((state) => state.setAccess);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: register,
    onSuccess: async ({ accessToken, user }) => {
      setAuth({ accessToken, user });
      const access = await fetchMyAccess();
      setAccess(access);
      navigate('/dashboard', { replace: true });
    },
    onError: (error) => setErrorMessage(extractApiErrorMessage(error, 'Registration failed.')),
  });

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    setErrorMessage(null);
    mutation.mutate({ firstName, lastName, email, password });
  }

  return (
    <AuthSplitLayout>
      <h2 className="text-xl font-semibold text-foreground">Create your account</h2>
      <p className="mt-1.5 mb-6 text-sm text-muted-foreground">Join Innova Tech Biz and get started in minutes.</p>

      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <IconField
          id="firstName"
          label="First name"
          icon={<User />}
          placeholder="Jane"
          required
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <IconField
          id="lastName"
          label="Last name"
          icon={<User />}
          placeholder="Doe"
          required
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
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
        <IconField
          id="password"
          label="Password"
          icon={<Lock />}
          isPassword
          autoComplete="new-password"
          minLength={10}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <IconField
          id="confirmPassword"
          label="Confirm password"
          icon={<Lock />}
          isPassword
          autoComplete="new-password"
          minLength={10}
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-5 text-sm">
        Already have an account?{' '}
        <Link to="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthSplitLayout>
  );
}

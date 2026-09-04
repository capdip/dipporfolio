import { useState } from 'react';
import { useAuth } from '../../context/Providers';
import { ApiError } from '../../lib/api';
import { FormField, InlineBanner, TextInput } from './ui';

export default function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to sign in. Please try again.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="glass-panel w-full max-w-md rounded-2xl p-8">
        <div className="mb-6 text-center">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Admin sign in</h1>
          <p className="mt-1 text-sm text-muted">Sign in to manage your portfolio content.</p>
        </div>
        {error ? <InlineBanner tone="error" message={error} onDismiss={() => setError(null)} /> : null}
        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4" noValidate>
          <FormField label="Email" htmlFor="login-email" required>
            <TextInput
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </FormField>
          <FormField label="Password" htmlFor="login-password" required>
            <TextInput
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </FormField>
          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:opacity-50 dark:text-slate-900"
          >
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

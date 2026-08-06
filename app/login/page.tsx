'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError('Wrong stop. Try again.');
      return;
    }
    router.push('/bus');
    router.refresh();
  }

  async function handleForgotPassword() {
    if (!email) {
      setError('Type your email first, then tap "Forgot password?"');
      return;
    }
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setError('Could not send reset email. Try again.');
    } else {
      setResetSent(true);
    }
  }

  return (
    <main className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-night-950">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div
          className="absolute inset-0 animate-rain"
          style={{
            backgroundImage:
              'repeating-linear-gradient(100deg, transparent 0 18px, rgba(255,180,84,0.08) 18px 19px)',
          }}
        />
      </div>
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-amber-glow/10 blur-3xl" />

      <form onSubmit={handleLogin} className="glass-panel relative z-10 w-full max-w-sm rounded-2xl p-8 shadow-2xl">
        <p className="mb-1 text-xs uppercase tracking-[0.3em] text-amber-glow/70">Bus 250</p>
        <h1 className="mb-6 text-2xl font-medium text-[#f5ead6]">
          Some journeys don&apos;t need a destination.
        </h1>

        <label className="mb-1 block text-xs text-[#f5ead6]/60">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-lg border border-amber-glow/20 bg-night-900/70 px-3 py-2 text-sm outline-none focus:border-amber-glow/60"
        />

        <label className="mb-1 block text-xs text-[#f5ead6]/60">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-6 w-full rounded-lg border border-amber-glow/20 bg-night-900/70 px-3 py-2 text-sm outline-none focus:border-amber-glow/60"
        />

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
        {resetSent && <p className="mb-4 text-sm text-amber-glow">Check your email for a reset link.</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-amber-glow/90 py-2 text-sm font-medium text-night-950 transition hover:bg-amber-glow disabled:opacity-50"
        >
          {loading ? 'Boarding…' : 'Board the bus'}
        </button>

        <button
          type="button"
          onClick={handleForgotPassword}
          className="mt-3 w-full text-center text-xs text-[#f5ead6]/40 hover:text-amber-glow"
        >
          Forgot password?
        </button>
      </form>
    </main>
  );
}

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError('Could not update password. Try the reset link again.');
      return;
    }
    setDone(true);
    setTimeout(() => router.push('/login'), 2000);
  }

  return (
    <main className="flex h-screen w-screen items-center justify-center bg-night-950">
      <form onSubmit={handleReset} className="glass-panel w-full max-w-sm rounded-2xl p-8 shadow-2xl">
        <h1 className="mb-6 text-xl font-medium text-[#f5ead6]">Set a new password</h1>
        {done ? (
          <p className="text-amber-glow">Password updated. Redirecting to login…</p>
        ) : (
          <>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              className="mb-4 w-full rounded-lg border border-amber-glow/20 bg-night-900/70 px-3 py-2 text-sm outline-none focus:border-amber-glow/60"
            />
            {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
            <button type="submit" className="w-full rounded-lg bg-amber-glow/90 py-2 text-sm font-medium text-night-950 hover:bg-amber-glow">
              Update password
            </button>
          </>
        )}
      </form>
    </main>
  );
}

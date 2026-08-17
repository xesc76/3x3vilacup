'use client';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import logo from '@/public/logo.jpg';
import { createClient } from '@/lib/supabase/client';
import { TOURNAMENT } from '@/lib/constants';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const { error } = await createClient().auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'Email o contrasenya incorrectes.'
          : error.message
      );
      setBusy(false);
      return;
    }

    router.replace(searchParams.get('next') || '/admin');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="panel w-full max-w-sm p-6">
      <Image
        src={logo}
        alt=""
        width={56}
        height={56}
        className="rounded-sm"
        priority
      />
      <h1 className="mt-4 text-2xl text-violet-950">Accés organització</h1>
      <div className="mt-2 h-1 w-12 bg-acid-400" />
      <p className="mt-3 text-sm text-violet-500">
        {TOURNAMENT.name} · {TOURNAMENT.edition}
      </p>

      <div className="mt-5 space-y-3">
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Contrasenya
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-sm bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </p>
      )}

      <button type="submit" disabled={busy} className="btn-primary mt-5 w-full py-3">
        {busy ? 'Entrant…' : 'Entrar'}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-violet-50 px-4">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

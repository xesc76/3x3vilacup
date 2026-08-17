'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await createClient().auth.signOut();
        router.replace('/admin/login');
        router.refresh();
      }}
      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-300 ring-1 ring-white/20 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
    >
      {busy ? 'Sortint…' : 'Sortir'}
    </button>
  );
}

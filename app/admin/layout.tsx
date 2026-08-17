import Image from 'next/image';
import Link from 'next/link';
import logo from '@/public/logo.jpg';
import { createClient } from '@/lib/supabase/server';
import { AdminNav } from '@/components/admin/AdminNav';
import { LogoutButton } from '@/components/admin/LogoutButton';

export const revalidate = 0;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // El middleware ja redirigeix, però /admin/login es renderitza dins d'aquest
  // layout i allà encara no hi ha usuari.
  if (!user) return <>{children}</>;

  const { data: adminRow } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  return (
    <div className="flex min-h-screen flex-col bg-violet-50">
      <header className="sticky top-0 z-40 bg-violet-950 text-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/admin" className="flex items-center gap-2.5">
            <Image src={logo} alt="" width={30} height={30} className="rounded-sm" />
            <span className="font-display text-base uppercase tracking-wide">
              Panell d’organització
            </span>
          </Link>
          <LogoutButton />
        </div>
        <AdminNav />
        <div className="brand-rule" />
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
        {adminRow ? (
          children
        ) : (
          <div className="panel border-amber-300 bg-amber-50 p-5">
            <h1 className="text-lg font-bold text-amber-900">
              El teu usuari encara no té permisos d’escriptura
            </h1>
            <p className="mt-2 text-sm text-amber-900">
              Has iniciat sessió com a <strong>{user.email}</strong>, però
              aquest usuari no és a la taula <code>admins</code>, així que les
              polítiques RLS de Supabase li bloquejaran qualsevol canvi.
            </p>
            <p className="mt-3 text-sm text-amber-900">
              Ves a <strong>Supabase → SQL Editor</strong> i executa:
            </p>
            <pre className="mt-2 overflow-x-auto rounded-sm bg-violet-950 p-3 text-xs text-violet-50">
              {`insert into public.admins (user_id)\nselect id from auth.users where email = '${user.email}';`}
            </pre>
            <p className="mt-3 text-sm text-amber-900">
              Després recarrega aquesta pàgina.
            </p>
          </div>
        )}
      </main>

      <footer className="border-t border-violet-100 bg-white px-4 py-4 text-center text-xs text-violet-400">
        <Link href="/" className="hover:text-violet-600">
          ← Tornar al web públic
        </Link>
      </footer>
    </div>
  );
}

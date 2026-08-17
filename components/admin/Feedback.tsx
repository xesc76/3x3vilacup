'use client';

/**
 * Missatge d'error uniforme per a tots els formularis de l'admin.
 * L'error més habitual serà una RLS que bloqueja l'escriptura, així que
 * hi afegim una pista concreta quan Supabase retorna aquest cas.
 */
export function ErrorNote({ error }: { error: string | null }) {
  if (!error) return null;

  const isRls =
    error.includes('row-level security') || error.includes('violates policy');

  return (
    <p className="mt-3 rounded-sm bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
      {error}
      {isRls && (
        <span className="mt-1 block text-xs">
          Sembla un bloqueig de permisos: comprova que el teu usuari sigui a la
          taula <code>admins</code> de Supabase.
        </span>
      )}
    </p>
  );
}

export function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="panel p-4">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-violet-500">
        {title}
      </h2>
      {children}
    </section>
  );
}

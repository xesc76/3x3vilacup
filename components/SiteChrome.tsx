import Link from 'next/link';
import { TOURNAMENT } from '@/lib/constants';

const NAV = [
  { href: '/', label: 'Inici' },
  { href: '/horaris', label: 'Horaris' },
  { href: '/classificacio', label: 'Classificació' },
  { href: '/pistes', label: 'Pistes' },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-800 text-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500 text-sm font-black">
            V
          </span>
          <span className="text-base font-black leading-none tracking-tight">
            {TOURNAMENT.name}
          </span>
        </Link>
        <span className="hidden text-xs text-slate-400 sm:block">
          {TOURNAMENT.edition}
        </span>
      </div>
      <nav className="no-scrollbar mx-auto flex max-w-3xl gap-1 overflow-x-auto px-2 pb-2">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-3xl px-4 py-8 text-sm text-slate-500">
        <p className="font-semibold text-slate-700">
          {TOURNAMENT.name} · {TOURNAMENT.edition}
        </p>
        <p className="mt-1">{TOURNAMENT.dateLabel}</p>
        <p>
          {TOURNAMENT.venue}, {TOURNAMENT.city}
        </p>
        <Link
          href="/admin"
          className="mt-4 inline-block text-xs text-slate-400 hover:text-slate-600"
        >
          Accés organització
        </Link>
      </div>
    </footer>
  );
}

export function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        <div className="mt-5">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}

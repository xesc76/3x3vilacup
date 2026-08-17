'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/admin', label: 'Marcadors' },
  { href: '/admin/partits', label: 'Partits' },
  { href: '/admin/equips', label: 'Equips' },
  { href: '/admin/pistes', label: 'Pistes' },
  { href: '/admin/sponsors', label: 'Sponsors' },
  { href: '/admin/qr', label: 'QR' },
  { href: '/admin/config', label: 'Configuració' },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="no-scrollbar mx-auto flex max-w-4xl gap-1 overflow-x-auto px-2 pb-2">
      {ITEMS.map((item) => {
        const active =
          item.href === '/admin'
            ? pathname === '/admin' || pathname.startsWith('/admin/partit/')
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 rounded-sm px-3 py-1.5 font-display text-sm uppercase tracking-wide transition ${
              active
                ? 'bg-acid-400 text-violet-950'
                : 'text-violet-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

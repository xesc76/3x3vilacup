'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/horaris', label: 'Horaris' },
  { href: '/classificacio', label: 'Classificació' },
  { href: '/quadre', label: 'Quadre' },
  { href: '/el-meu-equip', label: 'El meu equip' },
  { href: '/comunicats', label: 'Comunicats' },
  { href: '/triples', label: 'Triples' },
  { href: '/pistes', label: 'Pistes' },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="no-scrollbar flex gap-6 overflow-x-auto">
      {NAV.map((item) => {
        const active =
          pathname === item.href ||
          (item.href === '/pistes' && pathname.startsWith('/pista/'));

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`shrink-0 border-b-2 pb-2 pt-1 font-display text-[15px] uppercase tracking-wider transition ${
              active
                ? 'border-acid-400 text-white'
                : 'border-transparent text-violet-300 hover:text-white'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

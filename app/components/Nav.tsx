'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/experience', label: 'Experience' },
  { href: '/profile', label: 'Profile' },
  { href: '/applications', label: 'Applications' },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="max-w-3xl mx-auto px-4 flex items-center gap-6 h-12">
        {links.map(({ href, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`text-sm ${
                active
                  ? 'text-gray-900 font-medium'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

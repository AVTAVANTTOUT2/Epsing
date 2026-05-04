'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Vote, Trophy, LineChart, User } from 'lucide-react';

const tabs = [
  { href: '/vote', icon: Vote, label: 'Vote' },
  { href: '/classement', icon: Trophy, label: 'Classement' },
  { href: '/stats', icon: LineChart, label: 'Stats' },
  { href: '/profil', icon: User, label: 'Profil' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 flex-col bg-sidebar border-r border-sidebar-border p-6 h-screen sticky top-0">
      <div className="mb-8">
        <h1 className="text-[32px] font-black text-primary leading-none">Epsing</h1>
      </div>

      <nav className="flex-1 space-y-2">
        {tabs.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={2} />
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

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

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 md:hidden bg-background/95 backdrop-blur-sm border-t border-border z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
      aria-label="Navigation principale"
    >
      <div className="flex items-center justify-around h-14">
        {tabs.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center flex-1 h-full relative transition-colors"
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                strokeWidth={2}
              />
              <span
                className={`text-[10px] mt-0.5 ${
                  isActive ? 'text-primary font-medium' : 'text-muted-foreground'
                }`}
              >
                {label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 w-5 h-0.5 bg-primary rounded-t-sm" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

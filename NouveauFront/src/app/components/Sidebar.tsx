import { Vote, Trophy, LineChart, User } from 'lucide-react';

type SidebarProps = {
  activeTab: 'vote' | 'classement' | 'stats' | 'profil';
  onTabChange: (tab: 'vote' | 'classement' | 'stats' | 'profil') => void;
};

const tabs = [
  { id: 'vote' as const, icon: Vote, label: 'Vote' },
  { id: 'classement' as const, icon: Trophy, label: 'Classement' },
  { id: 'stats' as const, icon: LineChart, label: 'Stats' },
  { id: 'profil' as const, icon: User, label: 'Profil' }
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="hidden md:flex w-64 flex-col bg-sidebar border-r border-sidebar-border p-6 h-screen sticky top-0">
      <div className="mb-8">
        <h1 className="text-[32px] font-black text-primary leading-none">Epsing</h1>
      </div>

      <nav className="flex-1 space-y-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={2} />
              <span className="font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

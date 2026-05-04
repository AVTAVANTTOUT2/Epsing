import { Vote, Trophy, LineChart, User } from 'lucide-react';

type BottomNavProps = {
  activeTab: 'vote' | 'classement' | 'stats' | 'profil';
  onTabChange: (tab: 'vote' | 'classement' | 'stats' | 'profil') => void;
};

const tabs = [
  { id: 'vote' as const, icon: Vote, label: 'Vote' },
  { id: 'classement' as const, icon: Trophy, label: 'Classement' },
  { id: 'stats' as const, icon: LineChart, label: 'Stats' },
  { id: 'profil' as const, icon: User, label: 'Profil' }
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-background/95 backdrop-blur-sm border-t border-border" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}>
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center justify-center flex-1 h-full relative transition-colors"
            >
              <Icon
                className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                strokeWidth={2}
              />
              <span className={`text-[10px] mt-0.5 ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 w-5 h-0.5 bg-primary rounded-t-sm" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

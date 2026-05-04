import { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { VotePage } from './components/VotePage';
import { ClassementPage } from './components/ClassementPage';
import { StatsPage } from './components/StatsPage';
import { ProfilPage } from './components/ProfilPage';
import { BottomNav } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';

type Page = 'login' | 'register' | 'vote' | 'classement' | 'stats' | 'profil';
type AppTab = 'vote' | 'classement' | 'stats' | 'profil';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [activeTab, setActiveTab] = useState<AppTab>('vote');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.add('dark');
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setCurrentPage('vote');
    setActiveTab('vote');
  };

  const handleRegister = () => {
    setIsAuthenticated(true);
    setCurrentPage('vote');
    setActiveTab('vote');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentPage('login');
  };

  const handleTabChange = (tab: AppTab) => {
    setActiveTab(tab);
    setCurrentPage(tab);
  };

  if (!isAuthenticated) {
    if (currentPage === 'register') {
      return (
        <RegisterPage
          onRegister={handleRegister}
          onSwitchToLogin={() => setCurrentPage('login')}
        />
      );
    }

    return (
      <LoginPage
        onLogin={handleLogin}
        onSwitchToRegister={() => setCurrentPage('register')}
      />
    );
  }

  return (
    <div className="size-full flex bg-background">
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />

      <main className="flex-1 flex flex-col overflow-hidden">
        {currentPage === 'vote' && <VotePage />}
        {currentPage === 'classement' && <ClassementPage />}
        {currentPage === 'stats' && <StatsPage />}
        {currentPage === 'profil' && <ProfilPage onLogout={handleLogout} />}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
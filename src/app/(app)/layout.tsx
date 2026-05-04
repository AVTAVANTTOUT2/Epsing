import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { Sidebar } from '@/components/Sidebar';
import { BottomNav } from '@/components/BottomNav';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="flex h-full min-h-svh bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-y-auto pb-[calc(env(safe-area-inset-bottom,0px)+3.5rem)] md:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

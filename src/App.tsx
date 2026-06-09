import { useEffect, useState } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { WorkerProfile } from './components/WorkerProfile';
import { DesignManagement } from './components/DesignManagement';
import { WeeklyReport } from './components/WeeklyReport';
import { Notes } from './components/Notes';
import { seedIfEmpty } from './db';
import { Moon, Sun } from 'lucide-react';

type View = 
  | { type: 'home' }
  | { type: 'worker'; id: number }
  | { type: 'designs' }
  | { type: 'reports' }
  | { type: 'notes' };

export default function App() {
  const [view, setView] = useState<View>({ type: 'home' });
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    seedIfEmpty();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* Theme Toggle - Floating */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-card border shadow-xl flex items-center justify-center hover:scale-105 transition-transform print:hidden"
        aria-label="Toggle theme"
      >
        {darkMode ? <Sun className="h-6 w-6 text-amber-500" /> : <Moon className="h-6 w-6 text-slate-700" />}
      </button>

      {view.type === 'home' && (
        <HomeScreen
          onOpenWorker={(id) => setView({ type: 'worker', id })}
          onOpenDesigns={() => setView({ type: 'designs' })}
          onOpenReports={() => setView({ type: 'reports' })}
          onOpenNotes={() => setView({ type: 'notes' })}
        />
      )}

      {view.type === 'worker' && (
        <WorkerProfile
          workerId={view.id}
          onBack={() => setView({ type: 'home' })}
        />
      )}

      {view.type === 'designs' && (
        <DesignManagement onBack={() => setView({ type: 'home' })} />
      )}

      {view.type === 'reports' && (
        <WeeklyReport onBack={() => setView({ type: 'home' })} />
      )}

      {view.type === 'notes' && (
        <Notes onBack={() => setView({ type: 'home' })} />
      )}
    </div>
  );
}

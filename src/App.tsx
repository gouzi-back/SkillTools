import './index.css';
import { useAppStore } from './store/appStore';
import { useSkillScanner } from './hooks/useSkillScanner';
import { useEffect, useMemo } from 'react';
import { AppLayout } from './components/layout';
import { Dashboard } from './components/Dashboard';
import { WelcomeScreen } from './components/WelcomeScreen';
import { Settings } from './components/Settings';
import { Editor } from './components/Editor';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * Main App Component
 */
function App() {
  const currentView = useAppStore((s) => s.currentView) || 'dashboard';
  const preferences = useAppStore((s) => s.preferences);
  const error = useAppStore((s) => s.error);
  const setError = useAppStore((s) => s.setError);
  const hasCompletedOnboarding = !!preferences.hasCompletedOnboarding;

  const { scanAllLibraries } = useSkillScanner();

  // Scan libraries on mount, when libraries change, OR when returning to dashboard
  useEffect(() => {
    const libraries = preferences.libraries || [];
    if (libraries.length > 0 && (currentView === 'dashboard' || currentView === 'welcome')) {
      scanAllLibraries();
    }
  }, [preferences.libraries, currentView, scanAllLibraries]);

  // Apply theme based on preference
  useEffect(() => {
    const theme = preferences.theme || 'system';

    const applyTheme = (isDark: boolean) => {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(isDark ? 'dark' : 'light');
    };

    if (theme === 'system') {
      // Check system preference
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);

      // Listen for changes
      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      applyTheme(theme === 'dark');
    }
  }, [preferences.theme]);

  // Determine which screen to show
  const screen = useMemo(() => {
    if (!hasCompletedOnboarding) return <WelcomeScreen />;

    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'editor': return <Editor />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  }, [hasCompletedOnboarding, currentView]);

  return (
    <AppLayout>
      <div className="relative flex-1 flex flex-col overflow-hidden">
        {/* Global Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-red-500 text-white px-6 py-3 flex items-center justify-between gap-4 z-[100] shadow-lg"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">⚠️</span>
                <span className="font-semibold">{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                title="关闭"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        {screen}
      </div>
    </AppLayout>
  );
}

export default App;

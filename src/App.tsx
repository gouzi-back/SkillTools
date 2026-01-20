import './index.css';
import { useAppStore } from './store/appStore';
import { useSkillScanner } from './hooks/useSkillScanner';
import { useEffect, useMemo } from 'react';
import { AppLayout } from './components/layout';
import { Dashboard } from './components/Dashboard';
import { WelcomeScreen } from './components/WelcomeScreen';
import { Settings } from './components/Settings';
import { Editor } from './components/Editor';

/**
 * Main App Component
 */
function App() {
  const currentView = useAppStore((s) => s.currentView) || 'welcome';
  const preferences = useAppStore((s) => s.preferences) || {};
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
      {screen}
    </AppLayout>
  );
}

export default App;

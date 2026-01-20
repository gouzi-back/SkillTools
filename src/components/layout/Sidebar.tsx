import { motion } from 'framer-motion';
import {
    LayoutGrid,
    PenTool,
    Settings,
    FolderSync,
    Sparkles,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';

type View = 'dashboard' | 'editor' | 'settings' | 'welcome';

interface NavItem {
    id: View;
    icon: React.ElementType;
    label: string;
}

const navItems: NavItem[] = [
    { id: 'dashboard', icon: LayoutGrid, label: '技能库' },
    { id: 'editor', icon: PenTool, label: '编辑器' },
    { id: 'settings', icon: Settings, label: '设置' },
];

/**
 * Sidebar - Main navigation component
 */
export function Sidebar() {
    const currentView = useAppStore((s) => s.currentView);
    const setCurrentView = useAppStore((s) => s.setCurrentView);
    const skillCount = useAppStore((s) => s.skills.length);

    return (
        <aside className="w-[72px] h-full bg-surface/50 backdrop-blur-xl border-r border-border/50 flex flex-col items-center py-6">
            {/* Logo */}
            <motion.div
                className="mb-8 p-3 rounded-xl bg-gradient-to-br from-accent/20 to-purple-600/20"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <Sparkles className="w-6 h-6 text-accent" />
            </motion.div>

            {/* Navigation Items */}
            <nav className="flex-1 flex flex-col gap-2">
                {navItems.map((item) => {
                    const isActive = currentView === item.id;
                    const Icon = item.icon;

                    return (
                        <motion.button
                            key={item.id}
                            onClick={() => setCurrentView(item.id)}
                            className={`
                relative w-12 h-12 rounded-xl flex items-center justify-center
                transition-colors duration-200
                ${isActive ? 'bg-accent/20 text-accent' : 'text-muted hover:text-white hover:bg-white/5'}
              `}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            title={item.label}
                        >
                            {/* Active indicator */}
                            {isActive && (
                                <motion.div
                                    layoutId="activeIndicator"
                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent rounded-r-full"
                                    style={{ boxShadow: '0 0 10px rgba(139, 92, 246, 0.6)' }}
                                />
                            )}
                            <Icon className="w-5 h-5" />
                        </motion.button>
                    );
                })}
            </nav>

            {/* Skill count badge */}
            <div className="mt-auto flex flex-col items-center gap-1 text-muted">
                <FolderSync className="w-4 h-4" />
                <span className="text-xs font-medium">{skillCount}</span>
            </div>
        </aside>
    );
}

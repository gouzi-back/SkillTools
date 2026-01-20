import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, AlertCircle } from 'lucide-react';
import { useAppStore, useFilteredSkills } from '../store/appStore';
import { SkillCard, CreateSkillModal } from './skills';
import { useState } from 'react';

/**
 * Dashboard - Main skills grid view
 */
export function Dashboard() {
    const searchQuery = useAppStore((s) => s.searchQuery);
    const setSearchQuery = useAppStore((s) => s.setSearchQuery);
    const isLoading = useAppStore((s) => s.isLoading);
    const error = useAppStore((s) => s.error);
    const skills = useFilteredSkills();

    const setSelectedSkill = useAppStore((s) => s.setSelectedSkill);
    const setCurrentView = useAppStore((s) => s.setCurrentView);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const handleOpenSkill = (id: string) => {
        if (!id) return;
        setSelectedSkill(id);
        setCurrentView('editor');
    };

    // Grouping logic with defensive checks
    const formats = Array.from(new Set(skills.map(s => s.format || 'generic'))).sort();

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <header className="px-8 py-6 border-b border-border/30">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">技能库</h1>
                        <p className="text-muted mt-1">管理本地skills</p>
                    </div>
                    <motion.button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-xl font-medium transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Plus className="w-4 h-4" />
                        新建技能
                    </motion.button>
                </div>

                {/* Search and filters */}
                <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                        <input
                            type="text"
                            placeholder="模糊搜索名称或描述..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-surface/50 border border-border/50 rounded-xl text-foreground placeholder-muted focus:outline-none focus:border-accent/50 transition-colors"
                        />
                    </div>
                    {isLoading && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded-lg">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full"
                            />
                            <span className="text-xs text-accent font-medium">扫描中...</span>
                        </div>
                    )}
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2"
                    >
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span className="flex-1">{error}</span>
                        <button
                            onClick={() => useAppStore.getState().setError(null)}
                            className="p-1 hover:bg-red-500/20 rounded-md"
                        >
                            <Plus className="w-4 h-4 rotate-45" />
                        </button>
                    </motion.div>
                )}
            </header>

            {/* Skills Grid */}
            <div className="flex-1 overflow-y-auto p-8">
                {skills.length === 0 ? (
                    <EmptyState isSearching={!!searchQuery} />
                ) : (
                    <div className="space-y-12 pb-12">
                        {formats.map(format => {
                            const groupSkills = skills.filter(s => (s.format || 'generic') === format);
                            if (groupSkills.length === 0) return null;

                            return (
                                <section key={format} className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <h2 className="text-sm font-bold tracking-wider text-accent uppercase flex items-center gap-2">
                                            {format}
                                            <span className="px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-[10px] lowercase font-medium">
                                                {groupSkills.length} {groupSkills.length === 1 ? 'skill' : 'skills'}
                                            </span>
                                        </h2>
                                        <div className="flex-1 h-px bg-gradient-to-r from-accent/20 to-transparent opacity-50" />
                                    </div>

                                    <motion.div
                                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                                        initial="hidden"
                                        animate="visible"
                                        variants={{
                                            hidden: { opacity: 0 },
                                            visible: {
                                                opacity: 1,
                                                transition: { staggerChildren: 0.05 },
                                            },
                                        }}
                                    >
                                        <AnimatePresence mode="popLayout">
                                            {groupSkills.map((skill) => (
                                                <SkillCard
                                                    key={skill.id}
                                                    skill={skill}
                                                    onClick={() => handleOpenSkill(skill.id)}
                                                />
                                            ))}
                                        </AnimatePresence>
                                    </motion.div>
                                </section>
                            );
                        })}
                    </div>
                )}
            </div>
            {/* Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <CreateSkillModal
                        isOpen={isCreateModalOpen}
                        onClose={() => setIsCreateModalOpen(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

/**
 * Empty state when no skills are loaded
 */
function EmptyState({ isSearching }: { isSearching: boolean }) {
    const setCurrentView = useAppStore((s) => s.setCurrentView);
    const setSearchQuery = useAppStore((s) => s.setSearchQuery);

    return (
        <motion.div
            className="flex flex-col items-center justify-center h-full text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">
                <Search className="w-10 h-10 text-accent/50" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
                {isSearching ? '没有找到匹配的技能' : '暂无技能'}
            </h3>
            <p className="text-muted mb-6 max-w-md">
                {isSearching
                    ? '请尝试换个关键词，或者检查拼写是否正确。'
                    : '还没有导入任何技能。前往设置添加技能库路径，或者创建一个新技能。'}
            </p>
            <motion.button
                onClick={() => isSearching ? setSearchQuery('') : setCurrentView('settings')}
                className="px-6 py-3 bg-accent hover:bg-accent/90 text-white rounded-xl font-medium transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                {isSearching ? '清除搜索' : '添加技能库'}
            </motion.button>
        </motion.div>
    );
}

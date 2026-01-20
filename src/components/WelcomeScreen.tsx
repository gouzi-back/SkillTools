import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, FolderOpen, ChevronRight, Zap } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import type { SkillLibrary, SkillFormat } from '../types';

/**
 * WelcomeScreen - First-time setup wizard
 */
export function WelcomeScreen() {
    const [libraryPath, setLibraryPath] = useState('');
    const [libraryName, setLibraryName] = useState('');
    const [libraryFormat, setLibraryFormat] = useState<SkillFormat>('antigravity');

    const addLibrary = useAppStore((s) => s.addLibrary);
    const completeOnboarding = useAppStore((s) => s.completeOnboarding);

    const handleAddLibrary = async () => {
        if (!libraryPath || !libraryName) return;

        const library: SkillLibrary = {
            id: crypto.randomUUID(),
            name: libraryName,
            path: libraryPath,
            format: libraryFormat,
            isActive: true,
        };

        addLibrary(library);
        completeOnboarding();
    };

    const handleSelectFolder = async () => {
        try {
            // Dynamic import of Tauri dialog
            const { open } = await import('@tauri-apps/plugin-dialog');
            const selected = await open({
                directory: true,
                multiple: false,
                title: '选择技能库文件夹',
            });

            if (selected && typeof selected === 'string') {
                setLibraryPath(selected);
                // Auto-fill name from folder
                const folderName = selected.split(/[/\\]/).pop() || 'My Skills';
                setLibraryName(folderName);
            }
        } catch (e) {
            console.error('Failed to open folder dialog:', e);
        }
    };

    return (
        <div className="flex-1 flex items-center justify-center p-8">
            <motion.div
                className="max-w-lg w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {/* Logo and title */}
                <div className="text-center mb-12">
                    <motion.div
                        className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-accent/20 to-purple-600/20 mb-6"
                        animate={{
                            boxShadow: [
                                '0 0 20px rgba(139, 92, 246, 0.2)',
                                '0 0 40px rgba(139, 92, 246, 0.4)',
                                '0 0 20px rgba(139, 92, 246, 0.2)',
                            ],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <Sparkles className="w-12 h-12 text-accent" />
                    </motion.div>
                    <h1 className="text-3xl font-bold text-white mb-3">
                        欢迎使用 <span className="text-gradient">本地skills可视化工具</span>
                    </h1>
                    <p className="text-muted">
                        统一管理你的 AI 技能，跨平台无缝转换
                    </p>
                </div>

                {/* Setup card */}
                <div className="glass-card p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-accent/10">
                            <FolderOpen className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-white">添加你的第一个技能库</h2>
                            <p className="text-sm text-muted">选择包含技能文件的文件夹</p>
                        </div>
                    </div>

                    {/* Folder selection */}
                    <div className="space-y-4 mb-6">
                        <button
                            onClick={handleSelectFolder}
                            className="w-full flex items-center justify-between px-4 py-3 bg-surface/50 border border-border/50 rounded-xl text-left hover:border-accent/50 transition-colors group"
                        >
                            <span className={libraryPath ? 'text-white' : 'text-muted'}>
                                {libraryPath || '点击选择文件夹...'}
                            </span>
                            <ChevronRight className="w-4 h-4 text-muted group-hover:text-accent transition-colors" />
                        </button>

                        {libraryPath && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="space-y-4"
                            >
                                <input
                                    type="text"
                                    placeholder="技能库名称"
                                    value={libraryName}
                                    onChange={(e) => setLibraryName(e.target.value)}
                                    className="w-full px-4 py-3 bg-surface/50 border border-border/50 rounded-xl text-white placeholder-muted focus:outline-none focus:border-accent/50 transition-colors"
                                />

                                <div className="flex gap-2">
                                    {(['antigravity', 'cursor', 'claude'] as SkillFormat[]).map((format) => (
                                        <button
                                            key={format}
                                            onClick={() => setLibraryFormat(format)}
                                            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${libraryFormat === format
                                                ? 'bg-accent text-white'
                                                : 'bg-surface/50 text-muted hover:text-white'
                                                }`}
                                        >
                                            {format}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={completeOnboarding}
                            className="flex-1 px-4 py-3 text-muted hover:text-white transition-colors"
                        >
                            稍后设置
                        </button>
                        <motion.button
                            onClick={handleAddLibrary}
                            disabled={!libraryPath || !libraryName}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-accent hover:bg-accent/90 disabled:bg-muted/20 disabled:text-muted text-white rounded-xl font-medium transition-colors"
                            whileHover={{ scale: libraryPath && libraryName ? 1.02 : 1 }}
                            whileTap={{ scale: libraryPath && libraryName ? 0.98 : 1 }}
                        >
                            <Zap className="w-4 h-4" />
                            开始使用
                        </motion.button>
                    </div>
                </div>

                {/* Feature hints */}
                <div className="flex justify-center gap-8 mt-8 text-sm text-muted">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-400" />
                        Antigravity
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                        Cursor
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-400" />
                        Claude
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

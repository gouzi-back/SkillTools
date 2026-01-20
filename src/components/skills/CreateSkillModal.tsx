import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Zap, ChevronRight, FolderPlus, FolderOpen } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { createNewSkill } from '../../adapters/fs';
import type { SkillLibrary, SkillFormat } from '../../types';

/**
 * CreateSkillModal - Guided creation of a new skill
 * Now supports creating a new library group on the fly.
 */
export function CreateSkillModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const libraries = useAppStore(s => s.preferences.libraries) || [];
    const addLibrary = useAppStore(s => s.addLibrary);
    const addSkill = useAppStore(s => s.addSkill);
    const setCurrentView = useAppStore(s => s.setCurrentView);
    const setSelectedSkill = useAppStore(s => s.setSelectedSkill);

    // Flow states
    const [step, setStep] = useState<'select_group' | 'new_group' | 'skill_name'>('select_group');

    // Skill data
    const [skillName, setSkillName] = useState('');
    const [selectedLibId, setSelectedLibId] = useState('');

    // New Group data
    const [newLibPath, setNewLibPath] = useState('');
    const [newLibName, setNewLibName] = useState('');
    const [newLibFormat, setNewLibFormat] = useState<SkillFormat>('antigravity');

    const handleSelectFolder = async () => {
        try {
            const { open } = await import('@tauri-apps/plugin-dialog');
            const selected = await open({
                directory: true,
                multiple: false,
                title: '选择新技能库文件夹',
            });

            if (selected && typeof selected === 'string') {
                setNewLibPath(selected);
                const folderName = selected.split(/[/\\]/).pop() || 'New Group';
                setNewLibName(folderName);
            }
        } catch (e) {
            console.error('Failed to open folder dialog:', e);
        }
    };

    const handleCreateGroup = () => {
        if (!newLibPath || !newLibName) return;

        const library: SkillLibrary = {
            id: crypto.randomUUID(),
            name: newLibName,
            path: newLibPath,
            format: newLibFormat,
            isActive: true,
        };

        addLibrary(library);
        setSelectedLibId(library.id);
        setStep('skill_name');
    };

    const handleCreateSkill = async () => {
        const lib = (libraries as SkillLibrary[]).find(l => l.id === selectedLibId);
        if (!lib || !skillName) return;

        try {
            const skill = await createNewSkill(lib.path, skillName);
            if (skill) {
                addSkill(skill);
                setSelectedSkill(skill.id);
                setCurrentView('editor');
                onClose();
            }
        } catch (err) {
            console.error('Failed to create skill:', err);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            />

            <motion.div
                className="relative w-full max-w-md bg-surface border border-border/50 rounded-2xl shadow-2xl overflow-hidden"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
                <div className="px-6 py-4 border-b border-border/30 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-accent" />
                        新建SKILL 技能
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-muted hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    <AnimatePresence mode="wait">
                        {step === 'select_group' && (
                            <motion.div
                                key="select-group"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted">选择目标技能库 (分组)</label>
                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                        {(libraries as SkillLibrary[]).map(lib => (
                                            <button
                                                key={lib.id}
                                                onClick={() => setSelectedLibId(lib.id)}
                                                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${selectedLibId === lib.id
                                                    ? 'bg-accent/10 border-accent text-white'
                                                    : 'bg-surface/50 border-border/50 text-muted hover:border-border'
                                                    }`}
                                            >
                                                <div className={`w-3 h-3 rounded-full ${lib.format === 'antigravity' ? 'bg-purple-500' :
                                                    lib.format === 'cursor' ? 'bg-blue-500' : 'bg-orange-500'
                                                    }`} />
                                                <div className="flex-1 text-left">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{lib.name}</span>
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${lib.format === 'antigravity' ? 'bg-purple-500/20 text-purple-400' :
                                                            lib.format === 'cursor' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'
                                                            }`}>
                                                            {lib.format}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs opacity-60 truncate">{lib.path}</div>
                                                </div>
                                                {selectedLibId === lib.id && <Zap className="w-4 h-4 text-accent" />}
                                            </button>
                                        ))}

                                        {/* New Group Button */}
                                        <button
                                            onClick={() => setStep('new_group')}
                                            className="w-full flex items-center gap-4 p-4 rounded-xl border border-dashed border-border/50 text-muted hover:text-white hover:border-accent/50 hover:bg-accent/5 transition-all"
                                        >
                                            <div className="p-2 rounded-lg bg-white/5">
                                                <FolderPlus className="w-4 h-4" />
                                            </div>
                                            <span className="font-medium text-sm">创建新分组 (新增目录)</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="flex gap-3 mt-4">
                                    <button
                                        disabled={!selectedLibId}
                                        onClick={() => setStep('skill_name')}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-accent hover:bg-accent/90 disabled:bg-muted/20 disabled:text-muted text-white rounded-xl font-medium transition-colors"
                                    >
                                        下一步
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 'new_group' && (
                            <motion.div
                                key="new-group"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted mb-2 block">选择目录</label>
                                        <button
                                            onClick={handleSelectFolder}
                                            className="w-full flex items-center justify-between px-4 py-3 bg-surface/50 border border-border/50 rounded-xl text-left hover:border-accent/50 transition-colors group"
                                        >
                                            <span className={`text-sm truncate ${newLibPath ? 'text-white' : 'text-muted'}`}>
                                                {newLibPath || '点击选择新目录...'}
                                            </span>
                                            <FolderOpen className="w-4 h-4 text-muted group-hover:text-accent" />
                                        </button>
                                    </div>

                                    {newLibPath && (
                                        <>
                                            <div>
                                                <label className="text-sm font-medium text-muted mb-2 block">分组名称</label>
                                                <input
                                                    type="text"
                                                    value={newLibName}
                                                    onChange={(e) => setNewLibName(e.target.value)}
                                                    className="w-full px-4 py-3 bg-surface border border-border/50 rounded-xl text-white placeholder-muted focus:outline-none focus:border-accent transition-colors"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-muted mb-2 block">技能格式 (IDE)</label>
                                                <div className="flex gap-2">
                                                    {(['antigravity', 'cursor', 'claude'] as SkillFormat[]).map((format) => (
                                                        <button
                                                            key={format}
                                                            onClick={() => setNewLibFormat(format)}
                                                            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${newLibFormat === format
                                                                ? 'bg-accent text-white'
                                                                : 'bg-surface/50 text-muted hover:text-white border border-transparent'
                                                                }`}
                                                        >
                                                            {format}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => setStep('select_group')}
                                        className="flex-1 py-3 text-muted hover:text-white transition-colors"
                                    >
                                        取消
                                    </button>
                                    <button
                                        disabled={!newLibPath || !newLibName}
                                        onClick={handleCreateGroup}
                                        className="flex-[2] py-3 bg-accent hover:bg-accent/90 disabled:bg-muted/20 disabled:text-muted text-white rounded-xl font-medium transition-colors"
                                    >
                                        确定并继续
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 'skill_name' && (
                            <motion.div
                                key="skill-name"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted">技能名称</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="例如：文件转换辅助..."
                                        value={skillName}
                                        onChange={(e) => setSkillName(e.target.value)}
                                        className="w-full px-4 py-3 bg-surface border border-border/50 rounded-xl text-white placeholder-muted focus:outline-none focus:border-accent transition-colors"
                                    />
                                </div>

                                <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl">
                                    <div className="text-xs text-muted mb-2">将创建以下标准目录结构：</div>
                                    <div className="font-mono text-[10px] text-accent/80 space-y-1">
                                        <div>📂 {skillName || 'my-skill'}/</div>
                                        <div className="pl-4">├── 📄 SKILL.md</div>
                                        <div className="pl-4">├── 📂 scripts/</div>
                                        <div className="pl-4">├── 📂 examples/</div>
                                        <div className="pl-4">└── 📂 resources/</div>
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-4">
                                    <button
                                        onClick={() => setStep('select_group')}
                                        className="flex-1 py-3 text-muted hover:text-white transition-colors"
                                    >
                                        返回
                                    </button>
                                    <button
                                        disabled={!skillName}
                                        onClick={handleCreateSkill}
                                        className="flex-[2] py-3 bg-accent hover:bg-accent/90 disabled:bg-muted/20 disabled:text-muted text-white rounded-xl font-medium transition-colors"
                                    >
                                        创建并编辑
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}

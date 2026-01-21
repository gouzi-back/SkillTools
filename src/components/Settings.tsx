import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderPlus, Trash2, RefreshCw, Info, Edit2, X, Check, Plus, Keyboard, Type } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import type { SkillLibrary, SkillFormat } from '../types';
import { PRESET_FORMATS } from '../types/skill';

// Dynamic color generator for custom formats
function getFormatColor(format: string): { bg: string; text: string; bgButton: string } {
    const presetColors: Record<string, { bg: string; text: string; bgButton: string }> = {
        antigravity: { bg: 'bg-purple-500', text: 'text-purple-400', bgButton: 'bg-purple-500' },
        cursor: { bg: 'bg-blue-500', text: 'text-blue-400', bgButton: 'bg-blue-500' },
        claude: { bg: 'bg-orange-500', text: 'text-orange-400', bgButton: 'bg-orange-500' },
    };

    if (presetColors[format]) return presetColors[format];

    // Generate a consistent color based on string hash for custom formats
    let hash = 0;
    for (let i = 0; i < format.length; i++) {
        hash = format.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    // Return a teal/green/cyan color for custom formats
    return {
        bg: `bg-[hsl(${hue},60%,50%)]`,
        text: `text-[hsl(${hue},70%,60%)]`,
        bgButton: `bg-[hsl(${hue},60%,50%)]`
    };
}

/**
 * Settings - Configuration panel with custom format support
 */
export function Settings() {
    const preferences = useAppStore((s) => s.preferences);
    const libraries = preferences.libraries || [];
    const addLibrary = useAppStore((s) => s.addLibrary);
    const removeLibrary = useAppStore((s) => s.removeLibrary);
    const setPreferences = useAppStore((s) => s.setPreferences);

    // State for add library modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [newLibPath, setNewLibPath] = useState('');
    const [newLibName, setNewLibName] = useState('');
    const [newLibFormat, setNewLibFormat] = useState<string>('antigravity');
    const [customFormat, setCustomFormat] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [isManualInput, setIsManualInput] = useState(false);

    // Get all unique formats from existing libraries for suggestions
    const existingFormats = Array.from(new Set(libraries.map(lib => lib.format)));
    const allFormats = Array.from(new Set([...PRESET_FORMATS, ...existingFormats]));

    const handleSelectFolder = async () => {
        try {
            const { open } = await import('@tauri-apps/plugin-dialog');
            const selected = await open({
                directory: true,
                multiple: false,
                title: '选择技能库文件夹',
            });

            if (selected && typeof selected === 'string') {
                const folderName = selected.split(/[/\\]/).pop() || 'My Skills';
                setNewLibPath(selected);
                setNewLibName(folderName);

                // Auto-detect format from folder name
                const lowerName = folderName.toLowerCase();
                if (lowerName.includes('cursor')) {
                    setNewLibFormat('cursor');
                } else if (lowerName.includes('claude')) {
                    setNewLibFormat('claude');
                } else {
                    setNewLibFormat('antigravity');
                }

                setIsManualInput(false);
                setShowAddModal(true);
            }
        } catch (e) {
            console.error('Failed to open folder dialog:', e);
        }
    };

    const handleOpenManualInput = () => {
        setNewLibPath('');
        setNewLibName('');
        setNewLibFormat('antigravity');
        setIsManualInput(true);
        setShowAddModal(true);
    };

    const handleManualPathChange = (path: string) => {
        setNewLibPath(path);
        // Auto-extract folder name from path
        const folderName = path.split(/[/\\]/).filter(Boolean).pop() || '';
        if (folderName && !newLibName) {
            setNewLibName(folderName);
        }
        // Auto-detect format
        const lowerName = folderName.toLowerCase();
        if (lowerName.includes('cursor')) {
            setNewLibFormat('cursor');
        } else if (lowerName.includes('claude')) {
            setNewLibFormat('claude');
        }
    };

    const handleAddCustomFormat = () => {
        if (customFormat.trim()) {
            setNewLibFormat(customFormat.trim().toLowerCase());
            setCustomFormat('');
            setShowCustomInput(false);
        }
    };

    const handleConfirmAdd = () => {
        if (!newLibPath || !newLibName) return;

        const library: SkillLibrary = {
            id: crypto.randomUUID(),
            name: newLibName,
            path: newLibPath,
            format: newLibFormat as SkillFormat,
            isActive: true,
        };
        addLibrary(library);
        setShowAddModal(false);
        setNewLibPath('');
        setNewLibName('');
        setNewLibFormat('antigravity');
        setShowCustomInput(false);
    };

    const handleUpdateLibraryFormat = (libId: string, newFormat: SkillFormat) => {
        const updatedLibraries = libraries.map(lib =>
            lib.id === libId ? { ...lib, format: newFormat } : lib
        );
        setPreferences({ libraries: updatedLibraries });
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <header className="px-8 py-6 border-b border-border/30">
                <h1 className="text-2xl font-bold text-foreground">设置</h1>
                <p className="text-muted mt-1">管理技能库路径和应用配置</p>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
                {/* Libraries section */}
                <section className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-foreground">技能库</h2>
                        <div className="flex items-center gap-2">
                            <motion.button
                                onClick={handleSelectFolder}
                                className="flex items-center gap-2 px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg transition-colors"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                title="选择文件夹"
                            >
                                <FolderPlus className="w-4 h-4" />
                                选择文件夹
                            </motion.button>
                            <motion.button
                                onClick={handleOpenManualInput}
                                className="flex items-center gap-2 px-4 py-2 bg-surface/50 hover:bg-surface text-muted hover:text-foreground border border-border/50 rounded-lg transition-colors"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                title="手动输入路径（支持隐藏文件夹）"
                            >
                                <Type className="w-4 h-4" />
                                手动输入
                            </motion.button>
                        </div>
                    </div>

                    {libraries.length === 0 ? (
                        <div className="glass-card p-6 text-center">
                            <Info className="w-8 h-8 text-muted mx-auto mb-3" />
                            <p className="text-muted">还没有添加任何技能库路径</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {libraries.map((lib) => (
                                <LibraryItem
                                    key={lib.id}
                                    library={lib}
                                    allFormats={allFormats}
                                    onRemove={() => removeLibrary(lib.id)}
                                    onUpdateFormat={(format) => handleUpdateLibraryFormat(lib.id, format)}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* Theme section */}
                <section className="mb-8">
                    <h2 className="text-lg font-semibold text-foreground mb-4">主题</h2>
                    <div className="glass-card p-4">
                        <div className="flex gap-3">
                            {[
                                { key: 'light', label: '浅色', icon: '☀️' },
                                { key: 'dark', label: '深色', icon: '🌙' },
                                { key: 'system', label: '跟随系统', icon: '💻' },
                            ].map((option) => (
                                <button
                                    key={option.key}
                                    onClick={() => setPreferences({ theme: option.key as 'light' | 'dark' | 'system' })}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all ${preferences.theme === option.key
                                        ? 'bg-accent text-white font-medium'
                                        : 'bg-surface/50 text-muted hover:text-foreground border border-border/50 hover:border-accent/50'
                                        }`}
                                >
                                    <span>{option.icon}</span>
                                    <span>{option.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* About section */}
                <section>
                    <h2 className="text-lg font-semibold text-foreground mb-4">关于</h2>
                    <div className="glass-card p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-purple-600/20 flex items-center justify-center">
                                <span className="text-2xl">✨</span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">本地skills可视化工具</h3>
                                <p className="text-sm text-muted">版本 1.0.0</p>
                            </div>
                        </div>
                        <p className="text-sm text-muted mt-4">
                            一个本地skills可视化工具，支持 Antigravity、Cursor、Claude 等多种格式的技能文件管理。
                        </p>
                    </div>
                </section>
            </div>

            {/* Add Library Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-surface border border-border/50 rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                <FolderPlus className="w-5 h-5 text-accent" />
                                添加技能库
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-muted mb-1.5 block">路径</label>
                                    {isManualInput ? (
                                        <>
                                            <input
                                                type="text"
                                                value={newLibPath}
                                                onChange={(e) => handleManualPathChange(e.target.value)}
                                                placeholder="例如: /Users/yourname/.agent/skills"
                                                className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-lg text-foreground placeholder-muted focus:outline-none focus:border-accent transition-colors font-mono text-sm"
                                                autoFocus
                                            />
                                            <p className="text-xs text-muted mt-1.5">
                                                💡 支持以 <code className="bg-white/10 px-1 rounded">.</code> 开头的隐藏文件夹
                                            </p>
                                        </>
                                    ) : (
                                        <div className="text-sm text-foreground/70 bg-background/50 p-3 rounded-lg border border-border/50 truncate">
                                            {newLibPath}
                                        </div>
                                    )}
                                </div>

                                {/* Tip for showing hidden files */}
                                {!isManualInput && (
                                    <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                        <Keyboard className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                        <div className="text-xs text-blue-300">
                                            <strong>提示：</strong>在文件选择对话框中按 <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono">⌘ Cmd</kbd> + <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono">⇧ Shift</kbd> + <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono">.</kbd> 可以显示隐藏文件夹（如 <code>.agent</code>）
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="text-sm text-muted mb-1.5 block">名称</label>
                                    <input
                                        type="text"
                                        value={newLibName}
                                        onChange={(e) => setNewLibName(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-lg text-foreground placeholder-muted focus:outline-none focus:border-accent transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-muted mb-1.5 block">格式标签</label>

                                    {/* Preset formats */}
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {allFormats.map((format) => {
                                            const colors = getFormatColor(format);
                                            const isSelected = newLibFormat === format;
                                            return (
                                                <button
                                                    key={format}
                                                    onClick={() => setNewLibFormat(format)}
                                                    className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all ${isSelected
                                                        ? `${colors.bgButton} text-white`
                                                        : 'bg-surface/50 text-muted hover:text-foreground border border-border/50'
                                                        }`}
                                                >
                                                    {format}
                                                </button>
                                            );
                                        })}

                                        {/* Add custom button */}
                                        {!showCustomInput && (
                                            <button
                                                onClick={() => setShowCustomInput(true)}
                                                className="px-3 py-2 rounded-lg text-sm font-medium border border-dashed border-border/50 text-muted hover:text-white hover:border-accent transition-all flex items-center gap-1"
                                            >
                                                <Plus size={14} />
                                                自定义
                                            </button>
                                        )}
                                    </div>

                                    {/* Custom format input */}
                                    {showCustomInput && (
                                        <div className="flex gap-2 mt-2">
                                            <input
                                                type="text"
                                                placeholder="输入自定义格式名称..."
                                                value={customFormat}
                                                onChange={(e) => setCustomFormat(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomFormat()}
                                                className="flex-1 px-3 py-2 bg-background border border-border/50 rounded-lg text-foreground text-sm placeholder-muted focus:outline-none focus:border-accent"
                                                autoFocus
                                            />
                                            <button
                                                onClick={handleAddCustomFormat}
                                                disabled={!customFormat.trim()}
                                                className="px-3 py-2 bg-accent text-white rounded-lg text-sm disabled:opacity-50"
                                            >
                                                <Check size={16} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowCustomInput(false);
                                                    setCustomFormat('');
                                                }}
                                                className="px-3 py-2 bg-surface text-muted rounded-lg text-sm hover:text-white"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    )}

                                    {/* Current selection display */}
                                    <div className="mt-3 text-xs text-muted">
                                        当前选择: <span className="text-foreground font-medium">{newLibFormat}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-border/50 text-muted hover:text-foreground transition-colors"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleConfirmAdd}
                                    disabled={!newLibName}
                                    className="flex-1 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <Check size={16} />
                                    确认添加
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/**
 * Library item row with editable format
 */
function LibraryItem({
    library,
    allFormats,
    onRemove,
    onUpdateFormat,
}: {
    library: SkillLibrary;
    allFormats: string[];
    onRemove: () => void;
    onUpdateFormat: (format: SkillFormat) => void;
}) {
    const [isEditingFormat, setIsEditingFormat] = useState(false);
    const [customInput, setCustomInput] = useState('');
    const [showCustom, setShowCustom] = useState(false);

    const colors = getFormatColor(library.format);

    const handleCustomSubmit = () => {
        if (customInput.trim()) {
            onUpdateFormat(customInput.trim().toLowerCase() as SkillFormat);
            setCustomInput('');
            setShowCustom(false);
            setIsEditingFormat(false);
        }
    };

    return (
        <motion.div
            className="glass-card p-4 flex items-center gap-4 group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
        >
            <div className={`w-2 h-10 rounded-full ${colors.bg}`} />
            <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground truncate">{library.name}</h3>
                <p className="text-sm text-muted truncate">{library.path}</p>
            </div>

            {/* Format Badge - Clickable to edit */}
            <div className="relative">
                {isEditingFormat ? (
                    <div className="flex flex-col gap-2 absolute right-0 top-0 z-10 bg-surface border border-border/50 rounded-xl p-3 shadow-2xl min-w-[200px]">
                        <div className="flex flex-wrap gap-1">
                            {allFormats.map((format) => {
                                const fColors = getFormatColor(format);
                                return (
                                    <button
                                        key={format}
                                        onClick={() => {
                                            onUpdateFormat(format as SkillFormat);
                                            setIsEditingFormat(false);
                                        }}
                                        className={`px-2 py-1 text-[11px] rounded font-medium capitalize transition-all ${library.format === format
                                            ? fColors.bgButton + ' text-white'
                                            : 'text-muted hover:text-foreground hover:bg-white/10'
                                            }`}
                                    >
                                        {format}
                                    </button>
                                );
                            })}
                        </div>

                        {showCustom ? (
                            <div className="flex gap-1">
                                <input
                                    type="text"
                                    placeholder="自定义..."
                                    value={customInput}
                                    onChange={(e) => setCustomInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
                                    className="flex-1 px-2 py-1 bg-background border border-border/50 rounded text-xs text-foreground"
                                    autoFocus
                                />
                                <button onClick={handleCustomSubmit} className="p-1 bg-accent rounded">
                                    <Check size={12} className="text-white" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowCustom(true)}
                                className="text-[10px] text-muted hover:text-accent flex items-center gap-1"
                            >
                                <Plus size={10} /> 添加自定义
                            </button>
                        )}

                        <button
                            onClick={() => {
                                setIsEditingFormat(false);
                                setShowCustom(false);
                            }}
                            className="absolute -top-2 -right-2 p-1 bg-surface border border-border/50 rounded-full hover:bg-white/10"
                        >
                            <X size={10} className="text-muted" />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsEditingFormat(true)}
                        className={`px-2 py-1 text-xs rounded-full bg-white/5 ${colors.text} capitalize flex items-center gap-1.5 hover:bg-white/10 transition-colors`}
                    >
                        {library.format}
                        <Edit2 size={10} className="opacity-0 group-hover:opacity-100" />
                    </button>
                )}
            </div>

            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="刷新"
                >
                    <RefreshCw className="w-4 h-4 text-muted" />
                </button>
                <button
                    onClick={onRemove}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                    title="删除"
                >
                    <Trash2 className="w-4 h-4 text-red-400" />
                </button>
            </div>
        </motion.div>
    );
}

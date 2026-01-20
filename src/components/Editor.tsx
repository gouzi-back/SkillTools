import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import { deleteSkill, getSkillFolderContents, type SkillFolderItem } from '../adapters/fs';
import { Save, FileCode, Eye, PenTool, Layout, Check, AlertCircle, Sparkles, X, Trash2, FolderOpen, File, ChevronRight, ChevronDown, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import { Highlight, themes } from 'prism-react-renderer';
import { readFile, writeFile } from '@tauri-apps/plugin-fs';

// Stable reference for plugins
const REMARK_PLUGINS = [remarkGfm, remarkFrontmatter];

// File extension to language mapping for syntax highlighting
const EXT_TO_LANGUAGE: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'jsx',
    'ts': 'typescript',
    'tsx': 'tsx',
    'java': 'java',
    'py': 'python',
    'sql': 'sql',
    'json': 'json',
    'xml': 'markup',
    'html': 'markup',
    'css': 'css',
    'scss': 'scss',
    'yaml': 'yaml',
    'yml': 'yaml',
    'md': 'markdown',
    'sh': 'bash',
    'bash': 'bash',
    'rs': 'rust',
    'go': 'go',
    'rb': 'ruby',
    'php': 'php',
    'c': 'c',
    'cpp': 'cpp',
    'cs': 'csharp',
    'swift': 'swift',
    'kt': 'kotlin',
};

function getLanguageFromPath(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase() || '';
    return EXT_TO_LANGUAGE[ext] || 'text';
}

function isMarkdownFile(path: string): boolean {
    return path.toLowerCase().endsWith('.md');
}

/**
 * MarkdownPreview - Isolated component for MD reactivity
 */
function MarkdownPreview({ content }: { content: string }) {
    return (
        <article className="prose prose-invert prose-purple !max-w-none 
            prose-headings:font-bold prose-h1:text-4xl prose-h1:border-b prose-h1:border-border/50 prose-h1:pb-4
            prose-p:text-white/70 prose-p:leading-relaxed
            prose-table:border prose-table:border-border/50 prose-th:bg-white/5 prose-td:border-border/30">
            <ReactMarkdown remarkPlugins={REMARK_PLUGINS}>
                {content}
            </ReactMarkdown>
        </article>
    );
}

/**
 * CodePreview - Syntax highlighted code viewer
 */
function CodePreview({ content, language }: { content: string; language: string }) {
    return (
        <Highlight theme={themes.nightOwl} code={content} language={language as any}>
            {({ style, tokens, getLineProps, getTokenProps }) => (
                <pre style={{ ...style, background: 'transparent', padding: '2rem', margin: 0, overflow: 'auto' }} className="text-sm leading-relaxed">
                    {tokens.map((line, i) => (
                        <div key={i} {...getLineProps({ line })} className="flex">
                            <span className="select-none text-muted/40 w-12 text-right pr-4 text-xs">{i + 1}</span>
                            <span>
                                {line.map((token, key) => (
                                    <span key={key} {...getTokenProps({ token })} />
                                ))}
                            </span>
                        </div>
                    ))}
                </pre>
            )}
        </Highlight>
    );
}

/**
 * FileTreeItem - Renders a single item in the skill's file tree
 */
function FileTreeItem({
    item,
    depth = 0,
    selectedPath,
    onSelectFile
}: {
    item: SkillFolderItem;
    depth?: number;
    selectedPath: string | null;
    onSelectFile: (path: string) => void;
}) {
    const [isOpen, setIsOpen] = useState(true);
    const isSelected = selectedPath === item.path;
    const isSkillMd = item.name.toUpperCase() === 'SKILL.MD';

    const handleClick = () => {
        if (item.isDirectory) {
            setIsOpen(!isOpen);
        } else {
            onSelectFile(item.path);
        }
    };

    return (
        <div>
            <div
                className={`flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-accent/20 text-accent' :
                    isSkillMd ? 'text-accent/80 hover:bg-accent/10' :
                        'hover:bg-white/5 text-white/70'
                    }`}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
                onClick={handleClick}
            >
                {item.isDirectory ? (
                    <>
                        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        <FolderOpen size={14} className="text-amber-400" />
                    </>
                ) : (
                    <>
                        <span className="w-[14px]" />
                        <File size={14} className={isSelected || isSkillMd ? 'text-accent' : 'text-muted'} />
                    </>
                )}
                <span className={`text-xs font-medium truncate ${isSkillMd ? 'font-bold' : ''}`}>{item.name}</span>
                {item.children && item.children.length > 0 && (
                    <span className="text-[10px] text-muted ml-auto">{item.children.length}</span>
                )}
            </div>
            {item.isDirectory && isOpen && item.children && (
                <div>
                    {item.children.map((child) => (
                        <FileTreeItem
                            key={child.path}
                            item={child}
                            depth={depth + 1}
                            selectedPath={selectedPath}
                            onSelectFile={onSelectFile}
                        />
                    ))}
                    {item.children.length === 0 && (
                        <div className="text-[10px] text-muted italic py-1" style={{ paddingLeft: `${(depth + 1) * 12 + 24}px` }}>
                            (空)
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * Editor - Advanced Skill Editor with Multi-file Support
 */
export function Editor() {
    const selectedSkillId = useAppStore((s) => s.selectedSkillId);
    const skills = useAppStore((s) => s.skills);
    const updateSkill = useAppStore((s) => s.updateSkill);
    const removeSkill = useAppStore((s) => s.removeSkill);
    const setCurrentView = useAppStore((s) => s.setCurrentView);
    const setSelectedSkill = useAppStore((s) => s.setSelectedSkill);

    const skill = useMemo(() => skills.find(s => s.id === selectedSkillId), [skills, selectedSkillId]);

    // State
    const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
    const [fileContent, setFileContent] = useState('');
    const [originalContent, setOriginalContent] = useState('');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [lastError, setLastError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('split');
    const [folderContents, setFolderContents] = useState<SkillFolderItem[]>([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLoadingFile, setIsLoadingFile] = useState(false);

    // Derived
    const isMarkdown = currentFilePath ? isMarkdownFile(currentFilePath) : true;
    const language = currentFilePath ? getLanguageFromPath(currentFilePath) : 'markdown';
    const currentFileName = currentFilePath ? currentFilePath.split(/[/\\]/).pop() : 'SKILL.md';

    // Initialize when skill changes - load SKILL.md by default
    useEffect(() => {
        if (skill) {
            setCurrentFilePath(skill.sourcePath);
            setFileContent(skill.content || '');
            setOriginalContent(skill.content || '');
            setHasUnsavedChanges(false);
            setSaveStatus('idle');
            setLastError(null);
            setShowDeleteConfirm(false);

            // Load folder structure
            getSkillFolderContents(skill.sourcePath).then(setFolderContents);
        }
    }, [skill?.id]);

    // Load file content when selecting a different file
    const handleSelectFile = useCallback(async (path: string) => {
        if (path === currentFilePath) return;

        // Warn if unsaved changes
        if (hasUnsavedChanges) {
            const confirm = window.confirm('当前文件有未保存的修改，确定要切换吗？');
            if (!confirm) return;
        }

        setIsLoadingFile(true);
        try {
            const bytes = await readFile(path);
            const content = new TextDecoder().decode(bytes);
            setCurrentFilePath(path);
            setFileContent(content);
            setOriginalContent(content);
            setHasUnsavedChanges(false);
            setSaveStatus('idle');
        } catch (err) {
            console.error('Failed to load file:', err);
            setLastError('无法加载文件');
            setSaveStatus('error');
        } finally {
            setIsLoadingFile(false);
        }
    }, [currentFilePath, hasUnsavedChanges]);

    const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setFileContent(newValue);
        setHasUnsavedChanges(newValue !== originalContent);
        if (saveStatus !== 'idle') setSaveStatus('idle');
    }, [originalContent, saveStatus]);

    const handleSave = async () => {
        if (!currentFilePath || isSaving) return;

        setIsSaving(true);
        setSaveStatus('idle');
        setLastError(null);

        try {
            const contentBytes = new TextEncoder().encode(fileContent);
            await writeFile(currentFilePath, contentBytes);

            setOriginalContent(fileContent);
            setHasUnsavedChanges(false);
            setSaveStatus('success');

            // If saving SKILL.md, also update the skill metadata in store
            if (skill && currentFilePath === skill.sourcePath) {
                const { parseSkillMetadata } = await import('../adapters/fs');
                const { title, description } = parseSkillMetadata(fileContent);
                updateSkill(skill.id, {
                    content: fileContent,
                    title,
                    description,
                    lastModified: Date.now()
                });
            }

            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (err: any) {
            console.error('Save failed:', err);
            setLastError(err?.toString() || '保存失败：请检查权限');
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!skill || isDeleting) return;

        setIsDeleting(true);
        try {
            const success = await deleteSkill(skill.sourcePath);
            if (success) {
                removeSkill(skill.id);
                setSelectedSkill(null);
                setCurrentView('dashboard');
            } else {
                setLastError('删除失败：请检查文件权限');
                setSaveStatus('error');
            }
        } catch (err: any) {
            setLastError(err?.toString() || '删除失败');
            setSaveStatus('error');
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    if (!skill) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-muted gap-4">
                <div className="p-4 rounded-2xl bg-surface/50 border border-border/50">
                    <FileCode className="w-12 h-12 opacity-20" />
                </div>
                <p className="text-sm font-medium">请先选择一个技能进行编辑</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background overflow-hidden relative">
            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-surface border border-border/50 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                            <Trash2 className="w-5 h-5 text-red-400" />
                            确认删除技能
                        </h3>
                        <p className="text-sm text-muted mb-4">
                            将删除 <strong className="text-white">{skill.title}</strong> 及其所有关联文件。此操作无法撤销！
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-2.5 rounded-xl border border-border/50 text-muted hover:text-white transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                {isDeleting ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Trash2 size={16} />
                                )}
                                {isDeleting ? '删除中...' : '确认删除'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Toast */}
            {saveStatus === 'error' && (
                <div className="absolute top-20 right-6 z-40 animate-in fade-in slide-in-from-right-4">
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center gap-4 backdrop-blur-md shadow-2xl">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <div className="flex flex-col">
                            <span className="text-xs font-bold uppercase tracking-wider">操作失败</span>
                            <span className="text-[11px] opacity-80 max-w-[300px] mt-0.5 line-clamp-2">{lastError}</span>
                        </div>
                        <button onClick={() => setSaveStatus('idle')} className="p-1 hover:bg-white/10 rounded-lg">
                            <X size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <div className="h-14 border-b border-border/30 flex items-center justify-between px-4 bg-surface/40 backdrop-blur-xl sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setCurrentView('dashboard')}
                        className="p-2 rounded-lg hover:bg-white/5 text-muted hover:text-white transition-colors"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div className="w-px h-6 bg-border/30" />
                    <div className="p-2 rounded-xl bg-accent/10 border border-accent/20">
                        <FileCode className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="font-bold text-white text-sm">{skill.title}</h2>
                            <span className="text-muted text-xs">/ {currentFileName}</span>
                            {hasUnsavedChanges && (
                                <span className="flex items-center gap-1 text-[9px] font-black uppercase text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                                    <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
                                    未保存
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* View Mode Switcher */}
                    <div className="flex items-center bg-surface/80 border border-border/50 rounded-lg p-0.5">
                        {[
                            { id: 'edit', icon: PenTool, label: '编辑' },
                            { id: 'split', icon: Layout, label: '分屏' },
                            { id: 'preview', icon: Eye, label: '预览' }
                        ].map((mode) => (
                            <button
                                key={mode.id}
                                onClick={() => setViewMode(mode.id as any)}
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === mode.id
                                    ? 'bg-accent text-white'
                                    : 'text-muted hover:text-white'
                                    }`}
                            >
                                <mode.icon size={12} />
                                <span className="hidden lg:inline">{mode.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="w-px h-5 bg-border/30" />

                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                        title="删除技能"
                    >
                        <Trash2 size={16} />
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={!hasUnsavedChanges && saveStatus !== 'error'}
                        className={`
                            flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-xs transition-all
                            ${saveStatus === 'success' ? 'bg-emerald-500 text-white' :
                                saveStatus === 'error' ? 'bg-red-500 text-white' :
                                    (hasUnsavedChanges ? 'bg-accent text-white' : 'bg-surface border border-border/50 text-muted opacity-50 cursor-not-allowed')
                            }
                        `}
                    >
                        {isSaving ? (
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : saveStatus === 'success' ? (
                            <Check size={14} />
                        ) : (
                            <Save size={14} />
                        )}
                        {saveStatus === 'success' ? '已保存' : (isSaving ? '...' : '保存')}
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar: File Tree */}
                <aside className="w-56 bg-surface/20 border-r border-border/30 flex flex-col overflow-hidden">
                    <div className="p-3 border-b border-border/20">
                        <h3 className="text-[10px] font-black text-white/40 uppercase tracking-wider flex items-center gap-2">
                            <FolderOpen size={10} />
                            文件结构
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-1.5 custom-scrollbar">
                        {isLoadingFile && (
                            <div className="p-4 text-center">
                                <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
                            </div>
                        )}
                        {folderContents.map((item) => (
                            <FileTreeItem
                                key={item.path}
                                item={item}
                                selectedPath={currentFilePath}
                                onSelectFile={handleSelectFile}
                            />
                        ))}
                    </div>
                </aside>

                {/* Center: Editor/Preview */}
                <main className="flex-1 flex overflow-hidden">
                    {/* Editor Pane */}
                    {(viewMode === 'edit' || viewMode === 'split') && (
                        <div className={`flex-1 flex flex-col overflow-hidden ${viewMode === 'split' ? 'border-r border-border/20' : ''}`}>
                            <textarea
                                className="flex-1 w-full h-full bg-background/30 p-6 resize-none focus:outline-none font-mono text-[13px] leading-relaxed text-white/80 selection:bg-accent/40 custom-scrollbar"
                                value={fileContent}
                                onChange={handleContentChange}
                                placeholder="// 开始编辑..."
                                spellCheck="false"
                            />
                        </div>
                    )}

                    {/* Preview Pane */}
                    {(viewMode === 'preview' || viewMode === 'split') && (
                        <div className="flex-1 overflow-y-auto bg-surface/5 custom-scrollbar">
                            {isMarkdown ? (
                                <div className="max-w-4xl mx-auto p-10">
                                    <MarkdownPreview content={fileContent} />
                                </div>
                            ) : (
                                <CodePreview content={fileContent} language={language} />
                            )}
                        </div>
                    )}
                </main>

                {/* Right Sidebar: Metadata */}
                <aside className="w-64 bg-surface/30 border-l border-border/30 p-5 flex flex-col gap-6 hidden xl:flex overflow-y-auto">
                    <section className="space-y-3">
                        <header className="text-[10px] font-black text-white/40 uppercase tracking-wider">
                            当前文件
                        </header>
                        <div className="bg-background/50 p-3 rounded-lg border border-border/50">
                            <div className="text-xs font-medium text-white mb-1">{currentFileName}</div>
                            <div className="text-[10px] text-muted uppercase">{language}</div>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <header className="text-[10px] font-black text-white/40 uppercase tracking-wider">
                            技能格式
                        </header>
                        <div className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase ${skill.format === 'antigravity' ? 'bg-purple-500/20 text-purple-400' :
                            skill.format === 'cursor' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'
                            }`}>
                            {skill.format}
                        </div>
                    </section>

                    <div className="mt-auto">
                        <div className="bg-accent/5 p-4 rounded-xl border border-accent/10">
                            <h4 className="text-[10px] font-black text-accent uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Sparkles size={10} />
                                提示
                            </h4>
                            <p className="text-[10px] text-white/50 leading-relaxed">
                                点击左侧文件树可切换编辑不同文件。支持 Java、Python、SQL、JSON 等多种语法高亮。
                            </p>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}

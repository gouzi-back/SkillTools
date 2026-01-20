import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileCode, MoreVertical, ExternalLink, Trash2 } from 'lucide-react';
import type { Skill } from '../../types';
import { deleteSkill } from '../../adapters/fs';
import { useAppStore } from '../../store/appStore';

interface SkillCardProps {
    skill: Skill;
    onClick?: () => void;
}

/**
 * Format badge colors
 */
const formatColors: Record<string, { bg: string; text: string; border: string }> = {
    antigravity: {
        bg: 'bg-purple-500/10',
        text: 'text-purple-400',
        border: 'border-purple-500/30',
    },
    cursor: {
        bg: 'bg-blue-500/10',
        text: 'text-blue-400',
        border: 'border-blue-500/30',
    },
    claude: {
        bg: 'bg-orange-500/10',
        text: 'text-orange-400',
        border: 'border-orange-500/30',
    },
    generic: {
        bg: 'bg-gray-500/10',
        text: 'text-gray-400',
        border: 'border-gray-500/30',
    },
};

/**
 * SkillCard - Displays a single skill in the grid with delete menu
 */
export function SkillCard({ skill, onClick }: SkillCardProps) {
    const colors = formatColors[skill.format] || formatColors.generic;
    const removeSkill = useAppStore((s) => s.removeSkill);

    const [showMenu, setShowMenu] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleMenuClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMenu(!showMenu);
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMenu(false);
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDeleting(true);
        try {
            const success = await deleteSkill(skill.sourcePath);
            if (success) {
                removeSkill(skill.id);
            }
        } catch (err) {
            console.error('Delete failed:', err);
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleCancelDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowDeleteConfirm(false);
    };

    // Close menu when clicking outside
    const handleCardClick = () => {
        if (showMenu) {
            setShowMenu(false);
        } else if (!showDeleteConfirm) {
            onClick?.();
        }
    };

    return (
        <>
            <motion.div
                className="glass-card glow-border p-5 cursor-pointer group relative"
                onClick={handleCardClick}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${colors.bg} ${colors.border} border`}>
                            <FileCode className={`w-5 h-5 ${colors.text}`} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
                                {skill.title}
                            </h3>
                            <span className={`text-xs ${colors.text} capitalize`}>
                                {skill.format}
                            </span>
                        </div>
                    </div>

                    {/* More Options Button */}
                    <div className="relative">
                        <button
                            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-accent/5 transition-all"
                            onClick={handleMenuClick}
                        >
                            <MoreVertical className="w-4 h-4 text-muted" />
                        </button>

                        {/* Dropdown Menu */}
                        <AnimatePresence>
                            {showMenu && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                    className="absolute right-0 top-full mt-1 z-50 min-w-[120px] bg-surface border border-border/50 rounded-xl shadow-2xl overflow-hidden"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button
                                        onClick={handleDeleteClick}
                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                        删除技能
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted line-clamp-2 mb-4">
                    {skill.description || '暂无描述'}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {skill.tags.slice(0, 3).map((tag) => (
                        <span
                            key={tag}
                            className="px-2 py-0.5 text-xs rounded-full bg-white/5 text-muted border border-border/50"
                        >
                            {tag}
                        </span>
                    ))}
                    {skill.tags.length > 3 && (
                        <span className="px-2 py-0.5 text-xs text-muted">
                            +{skill.tags.length - 3}
                        </span>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-muted pt-3 border-t border-border/30">
                    <span className="truncate max-w-[70%]" title={skill.sourcePath}>
                        {skill.sourcePath.split(/[/\\]/).pop()}
                    </span>
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </motion.div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={handleCancelDelete}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-surface border border-border/50 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                                <Trash2 className="w-5 h-5 text-red-400" />
                                确认删除技能
                            </h3>
                            <p className="text-sm text-muted mb-4">
                                将删除 <strong className="text-foreground">{skill.title}</strong> 及其所有关联文件（包括 scripts/、examples/、resources/ 文件夹）。
                                <br />
                                <span className="text-red-400 font-medium">此操作无法撤销！</span>
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleCancelDelete}
                                    className="flex-1 py-2.5 rounded-xl border border-border/50 text-muted hover:text-foreground transition-colors"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
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
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

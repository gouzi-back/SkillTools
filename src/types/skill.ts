/**
 * Skill Format Types - Common AI tool ecosystems (can be extended with custom strings)
 */
export type SkillFormat = 'antigravity' | 'cursor' | 'claude' | 'generic' | (string & {});

/** Predefined format presets for quick selection */
export const PRESET_FORMATS = ['antigravity', 'cursor', 'claude'] as const;

/**
 * Universal Skill Model
 * Internal representation that can be converted to any target format
 */
export interface Skill {
    /** Unique identifier (generated from file path hash) */
    id: string;
    /** Display title from frontmatter or filename */
    title: string;
    /** Short description from frontmatter */
    description: string;
    /** The actual skill content/instructions */
    content: string;
    /** Tags for filtering and categorization */
    tags: string[];
    /** Absolute path to the source file on disk */
    sourcePath: string;
    /** Which format this skill originates from */
    format: SkillFormat;
    /** Last modified timestamp (ms since epoch) */
    lastModified: number;
    /** Format-specific metadata */
    metadata?: Record<string, unknown>;
}

/**
 * Skill Library - A watched directory containing skills
 */
export interface SkillLibrary {
    /** Unique identifier */
    id: string;
    /** User-friendly name for this library */
    name: string;
    /** Absolute path to the directory */
    path: string;
    /** Which format to expect in this library */
    format: SkillFormat;
    /** Whether this library is currently being watched */
    isActive: boolean;
}

/**
 * User preferences stored persistently
 */
export interface UserPreferences {
    /** List of skill libraries to watch */
    libraries: SkillLibrary[];
    /** UI theme: dark, light, or follow system preference */
    theme: 'dark' | 'light' | 'system';
    /** Whether to show welcome screen */
    hasCompletedOnboarding: boolean;
}

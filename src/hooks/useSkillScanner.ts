import { useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import { join } from '@tauri-apps/api/path';
import { readSkillFile } from '../adapters/fs';
import type { SkillFormat } from '../types';

export function useSkillScanner() {
    const {
        preferences,
        addSkill,
        setLoading,
        setError,
        setSkills,
    } = useAppStore();

    // Updated to accept library format as parameter
    const scanDirectory = useCallback(async (dirPath: string, libraryFormat: SkillFormat, depth = 0): Promise<void> => {
        if (depth > 5) return; // Prevent infinite recursion

        try {
            // Use customReadDir to bypass Tauri checks
            const entries = await import('../adapters/fs').then(m => m.customReadDir(dirPath));

            // Look for SKILL.md first (Antigravity/Standard format)
            const skillFile = entries.find(e => e.isFile && e.name.toUpperCase() === 'SKILL.MD');

            if (skillFile) {
                const fullPath = await join(dirPath, skillFile.name);
                const skill = await readSkillFile(fullPath, libraryFormat);
                if (skill) {
                    addSkill(skill);
                }
                return;
            }

            // If no SKILL.md, look for other patterns or keep searching subdirectories
            for (const entry of entries) {
                const fullPath = await join(dirPath, entry.name);

                if (entry.isDirectory) {
                    // Don't recurse into common hidden/build folders
                    if (entry.name.startsWith('.') && entry.name !== '.agent') continue;
                    if (['node_modules', 'dist', 'target', 'bin'].includes(entry.name)) continue;

                    await scanDirectory(fullPath, libraryFormat, depth + 1);
                } else if (entry.isFile) {
                    // Support standalone skill files (like .cursorrules)
                    const lowerName = entry.name.toLowerCase();
                    if (lowerName === '.cursorrules') {
                        // .cursorrules always has cursor format regardless of library
                        const skill = await readSkillFile(fullPath, 'cursor');
                        if (skill) addSkill(skill);
                    }
                }
            }
        } catch (err) {
            console.error(`Error scanning directory ${dirPath}`, err);
        }
    }, [addSkill]);

    const scanAllLibraries = useCallback(async () => {
        setLoading(true);
        setError(null);
        setSkills([]); // Clear existing skills before rescan

        try {
            // Iterate libraries and pass format to scanner
            for (const lib of preferences.libraries) {
                if (!lib.isActive) continue;
                await scanDirectory(lib.path, lib.format);
            }
        } catch (err) {
            console.error('Scanning error:', err);
            setError(err instanceof Error ? err.message : 'Unknown scanning error');
        } finally {
            setLoading(false);
        }
    }, [preferences.libraries, setLoading, setError, setSkills, scanDirectory]);

    return {
        scanAllLibraries
    };
}

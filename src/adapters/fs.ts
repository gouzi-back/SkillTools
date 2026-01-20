import { readFile, writeFile, mkdir } from '@tauri-apps/plugin-fs';
import { join, basename } from '@tauri-apps/api/path';
import type { Skill, SkillFormat } from '../types';

/**
 * Read a skill file from disk
 * @param path - The path to the skill file
 * @param format - The format/ecosystem inherited from the parent library
 */
export async function readSkillFile(path: string, format: SkillFormat = 'antigravity'): Promise<Skill | null> {
  try {
    const contentBytes = await readFile(path);
    const content = new TextDecoder().decode(contentBytes);
    const filename = await basename(path);

    // Default metadata
    let title = filename.replace(/\.[^/.]+$/, "");
    let description = "";

    // Parse YAML Frontmatter
    const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
    const match = content.match(frontmatterRegex);

    if (match) {
      const yaml = match[1];
      // Simple parser for name/description in YAML
      const nameMatch = yaml.match(/^name:\s*(.+)$/m);
      const descMatch = yaml.match(/^description:\s*(.+)$/m);

      if (nameMatch) title = nameMatch[1].trim();
      if (descMatch) description = descMatch[1].trim();
    } else {
      // Fallback if no frontmatter
      const headerMatch = content.match(/^#\s+(.+)$/m);
      if (headerMatch) title = headerMatch[1].trim();

      const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('#'));
      if (lines.length > 0) description = lines[0];
    }

    // Clean up title (remove quotes if any)
    title = title.replace(/^["'](.*)["']$/, '$1');
    description = description.replace(/^["'](.*)["']$/, '$1');

    if (description.length > 120) {
      description = description.substring(0, 117) + '...';
    }

    const id = await generateId(path);

    // Use the format passed from the library, with special case for .cursorrules files
    const effectiveFormat: SkillFormat = filename.toLowerCase() === '.cursorrules' ? 'cursor' : format;

    return {
      id,
      title,
      description: description || '暂无描述',
      content,
      tags: [],
      sourcePath: path,
      format: effectiveFormat,
      lastModified: Date.now(),
    };
  } catch (err) {
    console.error(`Failed to read skill file: ${path}`, err);
    return null;
  }
}

/**
 * Write a skill file to disk
 */
export async function writeSkillFile(skill: Skill): Promise<void> {
  try {
    const contentBytes = new TextEncoder().encode(skill.content);
    await writeFile(skill.sourcePath, contentBytes);
  } catch (err) {
    console.error(`Failed to write skill file: ${skill.sourcePath}`, err);
    throw err;
  }
}

/**
 * Parse skill metadata from content string
 * Returns the extracted title and description from YAML frontmatter or fallback sources
 */
export function parseSkillMetadata(content: string): { title: string; description: string } {
  let title = 'Untitled Skill';
  let description = '';

  // Parse YAML Frontmatter
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
  const match = content.match(frontmatterRegex);

  if (match) {
    const yaml = match[1];
    const nameMatch = yaml.match(/^name:\s*(.+)$/m);
    const descMatch = yaml.match(/^description:\s*(.+)$/m);

    if (nameMatch) title = nameMatch[1].trim().replace(/^["'](.*)["']$/, '$1');
    if (descMatch) description = descMatch[1].trim().replace(/^["'](.*)["']$/, '$1');
  } else {
    // Fallback: use first heading as title
    const headerMatch = content.match(/^#\s+(.+)$/m);
    if (headerMatch) title = headerMatch[1].trim();

    // Fallback: use first non-heading paragraph as description
    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('#'));
    if (lines.length > 0) description = lines[0];
  }

  if (description.length > 120) {
    description = description.substring(0, 117) + '...';
  }

  return { title, description: description || '暂无描述' };
}

/**
 * Create a new skill directory structure and file
 */
export async function createNewSkill(libraryPath: string, name: string): Promise<Skill | null> {
  try {
    const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const skillDir = await join(libraryPath, safeName);

    // Create directory structure
    await mkdir(skillDir, { recursive: true });
    await mkdir(await join(skillDir, 'scripts'), { recursive: true });
    await mkdir(await join(skillDir, 'examples'), { recursive: true });
    await mkdir(await join(skillDir, 'resources'), { recursive: true });

    const skillFilePath = await join(skillDir, 'SKILL.md');
    const initialContent = `---
name: "${name}"
description: "在这里输入技能描述"
---

# ${name}

## 概述
这是一个新创建的技能。

## 使用方法
在这里描述如何使用此技能。
`;

    const contentBytes = new TextEncoder().encode(initialContent);
    await writeFile(skillFilePath, contentBytes);

    return readSkillFile(skillFilePath);
  } catch (err) {
    console.error('Failed to create new skill:', err);
    return null;
  }
}

/**
 * Delete an entire skill directory
 */
export async function deleteSkill(skillPath: string): Promise<boolean> {
  try {
    const { remove } = await import('@tauri-apps/plugin-fs');
    const { dirname } = await import('@tauri-apps/api/path');

    // Get the parent directory of the skill file (the skill folder)
    const skillDir = await dirname(skillPath);

    // Remove the entire directory recursively
    await remove(skillDir, { recursive: true });

    return true;
  } catch (err) {
    console.error('Failed to delete skill:', err);
    return false;
  }
}

export interface SkillFolderItem {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: SkillFolderItem[];
}

/**
 * Get the folder structure of a skill
 */
export async function getSkillFolderContents(skillPath: string): Promise<SkillFolderItem[]> {
  try {
    const { readDir } = await import('@tauri-apps/plugin-fs');
    const { dirname } = await import('@tauri-apps/api/path');

    const skillDir = await dirname(skillPath);
    const entries = await readDir(skillDir);

    const items: SkillFolderItem[] = [];

    for (const entry of entries) {
      const fullPath = await join(skillDir, entry.name);
      const item: SkillFolderItem = {
        name: entry.name,
        path: fullPath,
        isDirectory: entry.isDirectory || false,
      };

      // Recursively get children for directories
      if (entry.isDirectory) {
        try {
          const subEntries = await readDir(fullPath);
          item.children = [];
          for (const subEntry of subEntries) {
            const subPath = await join(fullPath, subEntry.name);
            item.children.push({
              name: subEntry.name,
              path: subPath,
              isDirectory: subEntry.isDirectory || false,
            });
          }
        } catch {
          // Empty folder or no access
          item.children = [];
        }
      }

      items.push(item);
    }

    // Sort: directories first, then files
    return items.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
  } catch (err) {
    console.error('Failed to get skill folder contents:', err);
    return [];
  }
}

// Helper to generate a stable ID
async function generateId(path: string): Promise<string> {
  let hash = 0;
  for (let i = 0; i < path.length; i++) {
    const char = path.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

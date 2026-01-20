import { join, basename } from '@tauri-apps/api/path';
import { invoke } from '@tauri-apps/api/core';
import type { Skill, SkillFormat } from '../types';

// Custom fs functions that bypass Tauri's scope restrictions
export async function customMkdir(path: string): Promise<void> {
  await invoke('create_directory', { path });
}

export async function customWriteFile(path: string, content: string): Promise<void> {
  await invoke('write_file_content', { path, content });
}

export async function customReadFile(path: string): Promise<string> {
  return await invoke<string>('read_file_content', { path });
}

export async function customRemove(path: string, recursive: boolean): Promise<void> {
  await invoke('remove_path', { path, recursive });
}

export async function customReadDir(path: string): Promise<Array<{ name: string; isDirectory: boolean; isFile: boolean }>> {
  const entries = await invoke<Array<[string, boolean]>>('read_directory', { path });
  return entries.map(([name, isDirectory]) => ({
    name,
    isDirectory,
    isFile: !isDirectory
  }));
}

/**
 * Read a skill file from disk
 * @param path - The path to the skill file
 * @param format - The format/ecosystem inherited from the parent library
 */
export async function readSkillFile(path: string, format: SkillFormat = 'antigravity'): Promise<Skill | null> {
  try {
    const content = await customReadFile(path);
    // contentBytes decode is no longer needed since customReadFile returns string
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
    // Write directly using custom Rust command
    await customWriteFile(skill.sourcePath, skill.content);
  } catch (err) {
    console.error(`Failed to write skill file with custom fs: ${skill.sourcePath}`, err);
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
  console.log('--- Starting CreateNewSkill ---');
  console.log('Target Library Path:', libraryPath);
  console.log('Requested Name:', name);

  try {
    // Softer sanitization: remove common forbidden characters but keep letters, numbers, and CJK characters
    const safeName = name.trim().replace(/[<>:"/\\|?*]/g, '-');
    const skillDir = await join(libraryPath, safeName);
    console.log('Resolved Skill Directory Path:', skillDir);

    // Create directory structure using custom Rust command (bypasses scope)
    console.log('Attempting to create directory:', skillDir);
    await customMkdir(skillDir);

    console.log('Creating subdirectories: scripts, examples, resources');
    await customMkdir(await join(skillDir, 'scripts'));
    await customMkdir(await join(skillDir, 'examples'));
    await customMkdir(await join(skillDir, 'resources'));

    const skillFilePath = await join(skillDir, 'SKILL.md');
    console.log('Initial metadata file path:', skillFilePath);

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

    // Write file using custom Rust command (bypasses scope)
    await customWriteFile(skillFilePath, initialContent);
    console.log('SKILL.md written successfully');

    const skill = await readSkillFile(skillFilePath);
    if (!skill) {
      console.error('Skill was created but readSkillFile returned null');
    }
    return skill;
  } catch (err: any) {
    console.error('!!! CRITICAL: createNewSkill failed !!!');
    console.error('Error stack:', err?.stack);
    console.error('Error message:', err?.message || err?.toString());
    throw err; // Throwing so the UI can catch and display the real reason
  }
}

/**
 * Delete an entire skill directory
 */
export async function deleteSkill(skillPath: string): Promise<boolean> {
  try {
    const { dirname } = await import('@tauri-apps/api/path');

    // Get the parent directory of the skill file (the skill folder)
    const skillDir = await dirname(skillPath);

    // Remove the entire directory recursively using custom command
    await customRemove(skillDir, true);

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
    const { dirname } = await import('@tauri-apps/api/path');

    const skillDir = await dirname(skillPath);
    // Use custom command to read directory
    const entries = await customReadDir(skillDir);

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
          const subEntries = await customReadDir(fullPath);
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

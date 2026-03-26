import { writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { SKILLS_DIR, ensureClaudeDir } from './config.js';

export function installSkillFile(skillName: string, filename: string, content: string): void {
  ensureClaudeDir();
  const skillDir = join(SKILLS_DIR, skillName);
  if (!existsSync(skillDir)) {
    mkdirSync(skillDir, { recursive: true });
  }
  writeFileSync(join(skillDir, filename), content, 'utf-8');
}

export function getInstalledSkills(): string[] {
  ensureClaudeDir();
  if (!existsSync(SKILLS_DIR)) return [];
  return readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

export function skillDirPath(skillName: string): string {
  return join(SKILLS_DIR, skillName);
}

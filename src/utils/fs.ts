import { writeFileSync, mkdirSync, existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { CLAUDE_DIR, SKILLS_DIR, ensureClaudeDir } from './config.js';

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

// ~/.claude/CLAUDE.md에 skill 참조(@경로)가 없으면 추가
export function registerSkillInClaudeMd(skillName: string): void {
  ensureClaudeDir();
  const claudeMdPath = join(CLAUDE_DIR, 'CLAUDE.md');
  const skillPath = `~/.claude/skills/${skillName}/SKILL.md`;
  const reference = `@${skillPath}`;

  let content = '';
  if (existsSync(claudeMdPath)) {
    content = readFileSync(claudeMdPath, 'utf-8');
  }

  if (content.includes(reference)) return;

  const separator = content.length > 0 && !content.endsWith('\n') ? '\n' : '';
  writeFileSync(claudeMdPath, `${content}${separator}${reference}\n`, 'utf-8');
}

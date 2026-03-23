import { readFileSync } from 'fs';
import { join } from 'path';
import { installSkillFile, skillDirPath } from '../../utils/fs.js';

export const SKILL_NAME = 'readme-generator';
export const SKILL_LABEL = 'README 자동 생성';

// tsup은 단일 파일로 번들링 → __dirname = dist/
const SKILL_MD = readFileSync(join(__dirname, 'skills', SKILL_NAME, 'SKILL.md'), 'utf-8');

export function install(): void {
  installSkillFile(SKILL_NAME, 'SKILL.md', SKILL_MD);
}

export function getInstallPath(): string {
  return skillDirPath(SKILL_NAME);
}

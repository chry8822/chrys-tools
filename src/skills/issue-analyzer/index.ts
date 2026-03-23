import { readFileSync } from 'fs';
import { join } from 'path';
import { installSkillFile, skillDirPath, registerSkillInClaudeMd } from '../../utils/fs.js';
import { setSkillConfig } from '../../utils/config.js';

export const SKILL_NAME = 'issue-analyzer';
export const SKILL_LABEL = 'Jira 이슈 분석';

// tsup은 단일 파일로 번들링 → __dirname = dist/
const SKILL_MD = readFileSync(join(__dirname, 'skills', SKILL_NAME, 'SKILL.md'), 'utf-8');

export interface JiraInputConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
  projectKey: string;
}

export function install(jira: JiraInputConfig): void {
  installSkillFile(SKILL_NAME, 'SKILL.md', SKILL_MD);
  registerSkillInClaudeMd(SKILL_NAME);
  setSkillConfig(SKILL_NAME, {
    jira: {
      baseUrl: jira.baseUrl,
      email: jira.email,
      apiToken: jira.apiToken,
      projectKey: jira.projectKey,
    },
  });
}

export function getInstallPath(): string {
  return skillDirPath(SKILL_NAME);
}

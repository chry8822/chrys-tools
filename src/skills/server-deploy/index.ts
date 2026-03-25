import { readFileSync } from 'fs';
import { join } from 'path';
import { installSkillFile, skillDirPath, registerSkillInClaudeMd } from '../../utils/fs.js';
import { setSkillConfig } from '../../utils/config.js';

export const SKILL_NAME = 'server-deploy';
export const SKILL_LABEL = '서버 배포 (QA/CI)';

const SKILL_MD = readFileSync(join(__dirname, 'skills', SKILL_NAME, 'SKILL.md'), 'utf-8');

export interface ServerConfig {
  host: string;
  user: string;
  password?: string;
  basePath: string;
}

export interface DeployConfig {
  servers: {
    [serverName: string]: ServerConfig;
  };
}

export function install(deployConfig: DeployConfig): void {
  installSkillFile(SKILL_NAME, 'SKILL.md', SKILL_MD);
  registerSkillInClaudeMd(SKILL_NAME);
  setSkillConfig(SKILL_NAME, deployConfig as unknown as import('../../utils/config.js').SkillConfig);
}

export function getInstallPath(): string {
  return skillDirPath(SKILL_NAME);
}

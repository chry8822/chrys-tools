import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
  projectKey: string;
}

export interface SkillConfig {
  jira?: JiraConfig;
}

export interface Config {
  version: string;
  skills: {
    [skillName: string]: SkillConfig;
  };
}

export const CLAUDE_DIR = join(homedir(), '.claude');
export const CONFIG_PATH = join(CLAUDE_DIR, 'config.json');
export const SKILLS_DIR = join(CLAUDE_DIR, 'skills');

export function ensureClaudeDir(): void {
  if (!existsSync(CLAUDE_DIR)) {
    mkdirSync(CLAUDE_DIR, { recursive: true });
  }
  if (!existsSync(SKILLS_DIR)) {
    mkdirSync(SKILLS_DIR, { recursive: true });
  }
}

export function readConfig(): Config {
  if (!existsSync(CONFIG_PATH)) {
    return { version: '1.0.0', skills: {} };
  }
  const raw = readFileSync(CONFIG_PATH, 'utf-8');
  return JSON.parse(raw) as Config;
}

export function writeConfig(config: Config): void {
  ensureClaudeDir();
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

export function getSkillConfig(skillName: string): SkillConfig | undefined {
  const config = readConfig();
  return config.skills[skillName];
}

export function setSkillConfig(skillName: string, skillConfig: SkillConfig): void {
  const config = readConfig();
  config.skills[skillName] = skillConfig;
  writeConfig(config);
}

export function isSkillInstalled(skillName: string): boolean {
  return existsSync(join(SKILLS_DIR, skillName));
}

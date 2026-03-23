import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { CLAUDE_DIR, ensureClaudeDir } from './config.js';

const SETTINGS_PATH = join(CLAUDE_DIR, 'settings.json');

interface Settings {
  permissions?: {
    allow?: string[];
    deny?: string[];
  };
  [key: string]: unknown;
}

// issue-analyzer skill 실행에 필요한 권한 목록
const ISSUE_ANALYZER_PERMISSIONS = [
  // Bash 권한
  'Bash(git log*)',
  'Bash(git blame*)',
  'Bash(git diff*)',
  'Bash(git grep*)',
  'Bash(npm test*)',
  'Bash(npm run test*)',
  'Bash(pytest*)',
  'Bash(go test*)',
  // Atlassian MCP 권한 (claude.ai 연동)
  'mcp__claude_ai_Atlassian__getJiraIssue',
  'mcp__claude_ai_Atlassian__getAccessibleAtlassianResources',
  'mcp__claude_ai_Atlassian__searchJiraIssuesUsingJql',
  'mcp__claude_ai_Atlassian__getConfluencePage',
  'mcp__claude_ai_Atlassian__searchConfluenceUsingCql',
  'mcp__claude_ai_Atlassian__searchAtlassian',
  'mcp__claude_ai_Atlassian__addCommentToJiraIssue',
  'mcp__claude_ai_Atlassian__transitionJiraIssue',
  // mcp-atlassian-jira (install 시 자동 설정되는 MCP)
  'mcp__mcp-atlassian-jira__*',
];

function readSettings(): Settings {
  if (!existsSync(SETTINGS_PATH)) return {};
  try {
    return JSON.parse(readFileSync(SETTINGS_PATH, 'utf-8')) as Settings;
  } catch {
    return {};
  }
}

function writeSettings(settings: Settings): void {
  ensureClaudeDir();
  writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf-8');
}

export function registerIssueAnalyzerPermissions(): string[] {
  const settings = readSettings();

  if (!settings.permissions) settings.permissions = {};
  if (!settings.permissions.allow) settings.permissions.allow = [];

  const existing = new Set(settings.permissions.allow);
  const added: string[] = [];

  for (const perm of ISSUE_ANALYZER_PERMISSIONS) {
    if (!existing.has(perm)) {
      settings.permissions.allow.push(perm);
      added.push(perm);
    }
  }

  if (added.length > 0) {
    writeSettings(settings);
  }

  return added;
}

// baseUrl에서 site name 추출: https://company.atlassian.net → company
function extractSiteName(baseUrl: string): string {
  try {
    const hostname = new URL(baseUrl).hostname; // company.atlassian.net
    return hostname.replace('.atlassian.net', '');
  } catch {
    return baseUrl;
  }
}

export function registerAtlassianMcp(jira: {
  baseUrl: string;
  email: string;
  apiToken: string;
}): void {
  const settings = readSettings();
  const siteName = extractSiteName(jira.baseUrl);

  if (!settings.mcpServers) settings.mcpServers = {};

  (settings.mcpServers as Record<string, unknown>)['mcp-atlassian-jira'] = {
    command: 'npx',
    args: ['-y', '@aashari/mcp-server-atlassian-jira'],
    env: {
      ATLASSIAN_SITE_NAME: siteName,
      ATLASSIAN_USER_EMAIL: jira.email,
      ATLASSIAN_API_TOKEN: jira.apiToken,
    },
  };

  writeSettings(settings);
}

import { execSync } from 'child_process';
import { intro, outro, log, note } from '@clack/prompts';
import { getInstalledSkills } from '../utils/fs.js';
import { install as installReadme } from '../skills/readme-generator/index.js';
import { install as installIssueAnalyzer } from '../skills/issue-analyzer/index.js';
import { install as installDeploy } from '../skills/server-deploy/index.js';
import { install as installPresent } from '../skills/present-generator/index.js';
import { getSkillConfig } from '../utils/config.js';

export async function updateCommand(): Promise<void> {
  intro('chrys-tools 업데이트');

  // 1. npm으로 최신 버전 설치
  log.step('최신 버전으로 업데이트 중...');
  try {
    execSync('npm install -g chrys-tools@latest', { stdio: 'pipe' });
    log.success('CLI 업데이트 완료');
  } catch {
    log.error('CLI 업데이트 실패. 수동으로 실행하세요: npm install -g chrys-tools@latest');
    return;
  }

  // 2. 현재 설치된 skill 파일만 교체 (설정은 유지)
  const installed = getInstalledSkills();

  if (installed.length === 0) {
    outro('업데이트 완료. (설치된 skill 없음)');
    return;
  }

  log.step('skill 파일 업데이트 중...');

  const updated: string[] = [];

  if (installed.includes('readme-generator')) {
    installReadme();
    updated.push('README 자동 생성');
  }

  if (installed.includes('issue-analyzer')) {
    const existingConfig = getSkillConfig('issue-analyzer') as any;
    if (existingConfig?.jira) {
      installIssueAnalyzer(existingConfig.jira);
    } else {
      installIssueAnalyzer({ baseUrl: '', email: '', apiToken: '', projectKey: '' });
    }
    updated.push('Jira 이슈 분석');
  }

  if (installed.includes('server-deploy')) {
    const existingConfig = getSkillConfig('server-deploy') as any;
    installDeploy({ servers: existingConfig?.servers ?? {} });
    updated.push('서버 배포 (QA/CI)');
  }

  if (installed.includes('present-generator')) {
    installPresent();
    updated.push('발표용 HTML 생성');
  }

  note(updated.map((s) => `✅ ${s}`).join('\n'), '업데이트된 skills');

  outro('업데이트 완료! 설정은 그대로 유지됩니다.');
}

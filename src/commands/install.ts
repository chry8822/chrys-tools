import { intro, outro, multiselect, text, password, note, log } from '@clack/prompts';
import { handleCancel, isSkipped } from '../utils/prompt.js';
import {
  install as installReadme,
  SKILL_LABEL as README_LABEL,
  getInstallPath as getReadmePath,
} from '../skills/readme-generator/index.js';
import {
  install as installIssueAnalyzer,
  SKILL_LABEL as ISSUE_LABEL,
  getInstallPath as getIssuePath,
} from '../skills/issue-analyzer/index.js';
import {
  install as installDeploy,
  SKILL_LABEL as DEPLOY_LABEL,
  getInstallPath as getDeployPath,
  type ServerConfig,
} from '../skills/server-deploy/index.js';
import {
  install as installPresent,
  SKILL_LABEL as PRESENT_LABEL,
  getInstallPath as getPresentPath,
} from '../skills/present-generator/index.js';
import { registerIssueAnalyzerPermissions, registerAtlassianMcp } from '../utils/settings.js';
import { getSkillConfig } from '../utils/config.js';

interface InstallResult {
  label: string;
  installed: boolean;
  path?: string;
  reason?: string;
}

export async function installCommand(): Promise<void> {
  // 1. 인트로 메시지
  intro('chrys-tools installer — Claude Code용 Skills 설치 도구');

  // 2. 설치할 skill 다중 선택
  const selected = await multiselect({
    message: '설치할 기능을 선택하세요 (스페이스로 선택/해제, 엔터로 확인)',
    options: [
      {
        value: 'readme-generator',
        label: 'README 자동 생성',
        hint: 'README.md 자동 생성',
      },
      {
        value: 'issue-analyzer',
        label: 'Jira 이슈 분석',
        hint: 'Jira 티켓 + 코드베이스 연결 분석',
      },
      {
        value: 'server-deploy',
        label: '서버 배포 (QA/CI)',
        hint: 'SSH로 QA/CI 서버에 자동 배포',
      },
      {
        value: 'present-generator',
        label: '발표용 HTML 생성',
        hint: '프로젝트 소개/발표용 HTML 페이지 자동 생성',
      },
    ],
    required: false,
  });

  handleCancel(selected);

  if (!Array.isArray(selected) || selected.length === 0) {
    outro('선택된 기능이 없습니다. 설치를 종료합니다.');
    return;
  }

  const results: InstallResult[] = [];

  // README 자동 생성 — 별도 설정 없이 설치
  if (selected.includes('readme-generator')) {
    installReadme();
    results.push({
      label: README_LABEL,
      installed: true,
      path: getReadmePath(),
    });
  }

  // 3. Jira 이슈 분석 — Jira 설정 필요
  if (selected.includes('issue-analyzer')) {
    log.step('Jira 이슈 분석 설정');
    log.info('이 기능은 Jira API 연동이 필요합니다.');
    log.info('건너뛰려면 아무것도 입력하지 않고 엔터를 누르세요.');

    const existingJira = (getSkillConfig('issue-analyzer') as any)?.jira;
    if (existingJira) log.info('기존 설정이 있습니다. 엔터를 누르면 기존 값을 유지합니다.');

    const baseUrl = await text({
      message: 'Jira Base URL',
      placeholder: 'https://company.atlassian.net',
      defaultValue: existingJira?.baseUrl ?? '',
    });
    handleCancel(baseUrl);

    const email = await text({
      message: 'Atlassian 계정 이메일',
      placeholder: 'you@company.com',
      defaultValue: existingJira?.email ?? '',
    });
    handleCancel(email);

    const apiToken = await password({
      message: existingJira?.apiToken ? 'Jira API Token (엔터 = 기존 값 유지)' : 'Jira API Token (Atlassian 계정 → 보안 → API 토큰)',
      mask: '*',
    });
    handleCancel(apiToken);
    const finalApiToken = isSkipped(apiToken as string) && existingJira?.apiToken
      ? existingJira.apiToken
      : (apiToken as string);

    const projectKey = await text({
      message: 'Jira Project Key',
      placeholder: 'ABEH',
      defaultValue: existingJira?.projectKey ?? '',
    });
    handleCancel(projectKey);

    // 기존 값도 없고 새로 입력도 없으면 건너뜀
    const skipped =
      (isSkipped(baseUrl) && !existingJira?.baseUrl) ||
      (isSkipped(email) && !existingJira?.email) ||
      (!finalApiToken) ||
      (isSkipped(projectKey) && !existingJira?.projectKey);

    if (skipped) {
      note(
        '건너뛴 항목이 있어 Jira 이슈 분석 기능은 설치되지 않습니다.\n나중에 npx chrys-tools add jira 로 추가할 수 있습니다.',
        '⏭️  Jira 이슈 분석 건너뜀'
      );
      results.push({
        label: ISSUE_LABEL,
        installed: false,
        reason: 'chrys-tools add jira로 추가 가능',
      });
    } else {
      const jiraConfig = {
        baseUrl: isSkipped(baseUrl) ? existingJira.baseUrl : (baseUrl as string).trim(),
        email: isSkipped(email) ? existingJira.email : (email as string).trim(),
        apiToken: finalApiToken.trim(),
        projectKey: isSkipped(projectKey) ? existingJira.projectKey : (projectKey as string).trim(),
      };
      installIssueAnalyzer(jiraConfig);
      registerIssueAnalyzerPermissions();
      registerAtlassianMcp(jiraConfig);
      results.push({
        label: ISSUE_LABEL,
        installed: true,
        path: getIssuePath(),
      });
    }
  }

  // 발표용 HTML 생성 — 별도 설정 없이 설치
  if (selected.includes('present-generator')) {
    installPresent();
    results.push({
      label: PRESENT_LABEL,
      installed: true,
      path: getPresentPath(),
    });
  }

  // 서버 배포 — QA/CI SSH 설정
  if (selected.includes('server-deploy')) {
    log.step('서버 배포 설정');
    log.info('배포할 서버 정보를 입력하세요.');
    log.info('건너뛰려면 아무것도 입력하지 않고 엔터를 누르세요.');

    const existingDeploy = (getSkillConfig('server-deploy') as any)?.servers ?? {};
    if (Object.keys(existingDeploy).length > 0) log.info('기존 설정이 있습니다. 엔터를 누르면 기존 값을 유지합니다.');

    const servers: Record<string, ServerConfig> = {};

    for (const serverType of ['qa', 'ci']) {
      log.step(`${serverType.toUpperCase()} 서버`);

      const cur = existingDeploy[serverType] as ServerConfig | undefined;

      const host = await text({ message: '호스트 (IP 또는 도메인)', placeholder: '192.168.1.100', defaultValue: cur?.host ?? '' });
      handleCancel(host);
      if (isSkipped(host) && !cur?.host) { log.warn(`${serverType.toUpperCase()} 서버 건너뜀`); continue; }

      const user = await text({ message: 'SSH 사용자명', placeholder: 'ubuntu', defaultValue: cur?.user ?? 'ubuntu' });
      handleCancel(user);

      const pwd = serverType === 'qa'
        ? await password({ message: cur?.password ? '비밀번호 (엔터 = 기존 값 유지)' : '비밀번호 (SSH 키 인증이면 엔터)', mask: '*' })
        : { value: '' };
      handleCancel(pwd);

      const basePath = await text({ message: '베이스 경로', placeholder: '/app/front', defaultValue: cur?.basePath ?? '/app/front' });
      handleCancel(basePath);

      const serverEntry: ServerConfig = {
        host: isSkipped(host) ? cur!.host : (host as string).trim(),
        user: isSkipped(user) ? (cur?.user ?? 'ubuntu') : (user as string).trim(),
        basePath: isSkipped(basePath) ? (cur?.basePath ?? '/app/front') : (basePath as string).trim(),
      };
      const pwdStr = typeof pwd === 'string' ? pwd : (pwd as { value?: string }).value ?? '';
      if (pwdStr.trim()) serverEntry.password = pwdStr.trim();
      else if (cur?.password) serverEntry.password = cur.password;

      servers[serverType] = serverEntry;
    }

    installDeploy({ servers: Object.keys(servers).length > 0 ? servers : {} });
    registerIssueAnalyzerPermissions();
    results.push({
      label: DEPLOY_LABEL,
      installed: true,
      path: getDeployPath(),
    });
  }

  // 4. 설치 결과 요약
  const summaryLines = results.map((r) =>
    r.installed
      ? `✅ ${r.label.padEnd(20)} → ${r.path}`
      : `⏭️  ${r.label.padEnd(20)} → 건너뜀 (${r.reason})`
  );
  note(summaryLines.join('\n'), '설치 결과');

  // 5. 사용 예시 출력
  const usageLines: string[] = [];
  if (results.some((r) => r.label === README_LABEL && r.installed)) {
    usageLines.push('"이 프로젝트 README 만들어줘"');
    usageLines.push('"리드미 생성해줘"');
  }
  if (results.some((r) => r.label === ISSUE_LABEL && r.installed)) {
    usageLines.push('"PROJ-1234 분석해줘"');
    usageLines.push('"이 이슈 어디서 난 거야"');
  }
  if (results.some((r) => r.label === PRESENT_LABEL && r.installed)) {
    usageLines.push('"발표 자료 만들어줘"');
    usageLines.push('"프로젝트 소개 HTML 만들어줘"');
  }

  if (usageLines.length > 0) {
    note(usageLines.join('\n'), '이제 claude를 켜고 말해보세요');
  }


  outro('설치 완료! 어느 프로젝트에서든 claude를 켜고 사용하세요.');
}

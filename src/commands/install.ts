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
} from '../skills/server-deploy/index.js';
import {
  install as installPresent,
  SKILL_LABEL as PRESENT_LABEL,
  getInstallPath as getPresentPath,
} from '../skills/present-generator/index.js';
import { registerIssueAnalyzerPermissions, registerAtlassianMcp } from '../utils/settings.js';

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
  const selected = await multiselect<string, string>({
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

    const baseUrl = await text({
      message: 'Jira Base URL을 입력하세요',
      placeholder: 'https://hmcnetworks.atlassian.net',
      defaultValue: 'https://hmcnetworks.atlassian.net',
    });
    handleCancel(baseUrl);

    const email = await text({
      message: 'Atlassian 계정 이메일을 입력하세요',
      placeholder: 'you@company.com',
    });
    handleCancel(email);

    const apiToken = await password({
      message: 'Jira API Token을 입력하세요 (Atlassian 계정 → 보안 → API 토큰)',
      mask: '*',
    });
    handleCancel(apiToken);

    const projectKey = await text({
      message: 'Jira Project Key를 입력하세요',
      placeholder: 'ABEH',
      defaultValue: 'ABEH',
    });
    handleCancel(projectKey);

    // 하나라도 건너뛰면 설치 제외
    const skipped =
      isSkipped(baseUrl) || isSkipped(email) || isSkipped(apiToken as string) || isSkipped(projectKey);

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
        baseUrl: (baseUrl as string).trim(),
        email: (email as string).trim(),
        apiToken: (apiToken as string).trim(),
        projectKey: (projectKey as string).trim(),
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

    const servers: Record<string, object> = {};

    for (const serverType of ['qa', 'ci']) {
      log.step(`${serverType.toUpperCase()} 서버`);

      const host = await text({ message: `호스트 (IP 또는 도메인)`, placeholder: '192.168.1.100' });
      handleCancel(host);
      if (isSkipped(host)) { log.warn(`${serverType.toUpperCase()} 서버 건너뜀`); continue; }

      const user = await text({ message: 'SSH 사용자명', placeholder: 'ubuntu', defaultValue: 'ubuntu' });
      handleCancel(user);

      const pwd = serverType === 'qa'
        ? await password({ message: '비밀번호 (SSH 키 인증이면 엔터)', mask: '*' })
        : { value: '' };
      handleCancel(pwd);

      const projectPath = await text({ message: '서버의 프로젝트 경로', placeholder: '/var/www/my-app' });
      handleCancel(projectPath);
      if (isSkipped(projectPath)) { log.warn(`${serverType.toUpperCase()} 서버 건너뜀`); continue; }

      const branch = await text({ message: '배포 브랜치', placeholder: serverType === 'qa' ? 'develop' : 'main', defaultValue: serverType === 'qa' ? 'develop' : 'main' });
      handleCancel(branch);

      const serverEntry: Record<string, string> = {
        host: (host as string).trim(),
        user: (user as string).trim(),
        projectPath: (projectPath as string).trim(),
        branch: (branch as string).trim(),
      };
      const pwdStr = typeof pwd === 'string' ? pwd : (pwd as { value?: string }).value ?? '';
      if (pwdStr.trim()) serverEntry.password = pwdStr.trim();

      servers[serverType] = serverEntry;
    }

    // 서버 입력 여부와 관계없이 SKILL.md는 항상 설치
    installDeploy({ servers: Object.keys(servers).length > 0 ? servers : {} });
    registerIssueAnalyzerPermissions();
    if (Object.keys(servers).length > 0) {
      results.push({ label: DEPLOY_LABEL, installed: true, path: getDeployPath() });
    } else {
      results.push({ label: DEPLOY_LABEL, installed: true, path: getDeployPath(), reason: '서버 설정 필요: npx chrys-tools config deploy' });
    }
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

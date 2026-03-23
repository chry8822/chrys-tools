import { intro, outro, text, password, note, log } from '@clack/prompts';
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
import { registerIssueAnalyzerPermissions, registerAtlassianMcp } from '../utils/settings.js';
import { existsSync } from 'fs';

export async function addCommand(skillArg: string): Promise<void> {
  const skill = skillArg.toLowerCase();

  if (skill === 'readme' || skill === 'readme-generator') {
    intro(`${README_LABEL} 추가`);

    const targetPath = getReadmePath();
    if (existsSync(targetPath)) {
      log.warn('이미 설치되어 있습니다: ' + targetPath);
    }

    installReadme();
    note(`✅ ${README_LABEL} → ${targetPath}`, '설치 완료');
    note('"이 프로젝트 README 만들어줘"\n"리드미 생성해줘"', '사용 예시');
    outro('완료!');
    return;
  }

  if (skill === 'jira' || skill === 'issue-analyzer') {
    intro(`${ISSUE_LABEL} 추가`);
    log.info('Jira API 연동 설정이 필요합니다.');
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

    const skipped =
      isSkipped(baseUrl) || isSkipped(email) || isSkipped(apiToken as string) || isSkipped(projectKey);

    if (skipped) {
      note(
        '건너뛴 항목이 있어 설치를 중단합니다.\n다시 실행하려면: npx chrys-tools add jira',
        '설치 취소'
      );
      outro('설치가 취소되었습니다.');
      return;
    }

    const jiraConfig = {
      baseUrl: (baseUrl as string).trim(),
      email: (email as string).trim(),
      apiToken: (apiToken as string).trim(),
      projectKey: (projectKey as string).trim(),
    };
    installIssueAnalyzer(jiraConfig);
    registerIssueAnalyzerPermissions();
    registerAtlassianMcp(jiraConfig);

    const targetPath = getIssuePath();
    note(`✅ ${ISSUE_LABEL} → ${targetPath}`, '설치 완료');
    note('"PROJ-1234 분석해줘"\n"이 이슈 어디서 난 거야"', '사용 예시');
    outro('완료!');
    return;
  }

  console.error(`알 수 없는 skill: "${skillArg}"`);
  console.error('사용 가능한 skill: jira, readme');
  process.exit(1);
}

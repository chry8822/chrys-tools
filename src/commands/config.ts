import { intro, outro, text, password, note, log } from '@clack/prompts';
import { handleCancel, isSkipped } from '../utils/prompt.js';
import { setSkillConfig, getSkillConfig } from '../utils/config.js';
import { registerAtlassianMcp } from '../utils/settings.js';
import { SKILL_NAME as ISSUE_SKILL } from '../skills/issue-analyzer/index.js';

export async function configCommand(skillArg: string): Promise<void> {
  const skill = skillArg.toLowerCase();

  if (skill === 'jira' || skill === 'issue-analyzer') {
    intro('Jira 이슈 분석 — 설정 변경');

    const existing = getSkillConfig(ISSUE_SKILL);
    if (existing?.jira) {
      log.info(`현재 설정:`);
      log.info(`  Base URL   : ${existing.jira.baseUrl}`);
      log.info(`  Email      : ${existing.jira.email ?? '(미설정)'}`);
      log.info(`  Project Key: ${existing.jira.projectKey}`);
      log.info(`  API Token  : (저장됨)`);
    }

    log.info('새 값을 입력하세요. 엔터를 누르면 기존 값을 유지합니다.');

    const baseUrl = await text({
      message: 'Jira Base URL',
      placeholder: existing?.jira?.baseUrl ?? 'https://your-company.atlassian.net',
    });
    handleCancel(baseUrl);

    const email = await text({
      message: 'Atlassian 계정 이메일',
      placeholder: existing?.jira?.email ?? 'you@company.com',
    });
    handleCancel(email);

    const apiToken = await password({
      message: 'Jira API Token (변경하지 않으려면 엔터)',
      mask: '*',
    });
    handleCancel(apiToken);

    const projectKey = await text({
      message: 'Jira Project Key',
      placeholder: existing?.jira?.projectKey ?? 'PROJ',
    });
    handleCancel(projectKey);

    const newBaseUrl = isSkipped(baseUrl)
      ? existing?.jira?.baseUrl ?? ''
      : (baseUrl as string).trim();

    const newEmail = isSkipped(email)
      ? existing?.jira?.email ?? ''
      : (email as string).trim();

    const newApiToken = isSkipped(apiToken as string)
      ? existing?.jira?.apiToken ?? ''
      : (apiToken as string).trim();

    const newProjectKey = isSkipped(projectKey)
      ? existing?.jira?.projectKey ?? ''
      : (projectKey as string).trim();

    if (!newBaseUrl || !newEmail || !newApiToken || !newProjectKey) {
      note('필수 항목이 비어 있습니다. 설정이 저장되지 않았습니다.', '저장 실패');
      outro('취소되었습니다.');
      return;
    }

    setSkillConfig(ISSUE_SKILL, {
      jira: {
        baseUrl: newBaseUrl,
        email: newEmail,
        apiToken: newApiToken,
        projectKey: newProjectKey,
      },
    });

    registerAtlassianMcp({ baseUrl: newBaseUrl, email: newEmail, apiToken: newApiToken });

    note(
      `Base URL   : ${newBaseUrl}\nEmail      : ${newEmail}\nProject Key: ${newProjectKey}\nAPI Token  : (저장됨)`,
      '설정 저장 완료'
    );
    outro('완료!');
    return;
  }

  console.error(`설정 가능한 skill: jira`);
  process.exit(1);
}

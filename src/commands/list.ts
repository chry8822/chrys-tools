import { note, log } from '@clack/prompts';
import { getInstalledSkills } from '../utils/fs.js';
import { getSkillConfig, SKILLS_DIR } from '../utils/config.js';
import { SKILL_NAME as README_SKILL, SKILL_LABEL as README_LABEL } from '../skills/readme-generator/index.js';
import { SKILL_NAME as ISSUE_SKILL, SKILL_LABEL as ISSUE_LABEL } from '../skills/issue-analyzer/index.js';

const SKILL_LABEL_MAP: Record<string, string> = {
  [README_SKILL]: README_LABEL,
  [ISSUE_SKILL]: ISSUE_LABEL,
};

export async function listCommand(): Promise<void> {
  const installed = getInstalledSkills();

  if (installed.length === 0) {
    log.info('설치된 skill이 없습니다.');
    log.info('설치하려면: npx chrys-tools install');
    return;
  }

  const lines = installed.map((name) => {
    const label = SKILL_LABEL_MAP[name] ?? name;
    const config = getSkillConfig(name);
    let detail = '';

    if (name === ISSUE_SKILL && config?.jira) {
      detail = ` (${config.jira.baseUrl}, ${config.jira.projectKey})`;
    }

    return `✅ ${label}${detail}`;
  });

  note(lines.join('\n') + `\n\n설치 경로: ${SKILLS_DIR}`, '설치된 Skills');
}

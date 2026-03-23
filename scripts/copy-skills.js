// dist/ 에 SKILL.md 파일 복사 (tsup은 .md 파일을 번들에 포함하지 않으므로 별도 복사)
const { cpSync, mkdirSync } = require('fs');
const { join } = require('path');

const skills = ['readme-generator', 'issue-analyzer'];

for (const skill of skills) {
  const dest = join(__dirname, '..', 'dist', 'skills', skill);
  mkdirSync(dest, { recursive: true });
  cpSync(
    join(__dirname, '..', 'src', 'skills', skill, 'SKILL.md'),
    join(dest, 'SKILL.md')
  );
  console.log(`Copied: dist/skills/${skill}/SKILL.md`);
}

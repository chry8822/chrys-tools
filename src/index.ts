import { installCommand } from './commands/install.js';
import { addCommand } from './commands/add.js';
import { configCommand } from './commands/config.js';
import { listCommand } from './commands/list.js';

const args = process.argv.slice(2);
const command = args[0];
const subArg = args[1];

async function main(): Promise<void> {
  switch (command) {
    case 'install':
      await installCommand();
      break;

    case 'add':
      if (!subArg) {
        console.error('Usage: chrys-tools add <skill>');
        console.error('Available: jira, readme');
        process.exit(1);
      }
      await addCommand(subArg);
      break;

    case 'config':
      if (!subArg) {
        console.error('Usage: chrys-tools config <skill>');
        console.error('Available: jira');
        process.exit(1);
      }
      await configCommand(subArg);
      break;

    case 'list':
      await listCommand();
      break;

    default:
      console.log('chrys-tools — Claude Code Skills 설치 도구');
      console.log('');
      console.log('Commands:');
      console.log('  chrys-tools install          최초 설치 (대화형 선택)');
      console.log('  chrys-tools add <skill>      특정 skill 추가');
      console.log('  chrys-tools config <skill>   설치된 skill 설정 변경');
      console.log('  chrys-tools list             설치된 skill 목록 확인');
      console.log('');
      console.log('Available skills: jira, readme');
      break;
  }
}

main().catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});

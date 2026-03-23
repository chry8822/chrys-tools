import { cancel, isCancel } from '@clack/prompts';

export function handleCancel(value: unknown): void {
  if (isCancel(value)) {
    cancel('설치가 취소되었습니다.');
    process.exit(0);
  }
}

export function isSkipped(value: unknown): boolean {
  return typeof value === 'string' && value.trim() === '';
}

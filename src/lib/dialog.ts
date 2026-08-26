import { confirm, open } from '@tauri-apps/plugin-dialog';

export async function pickFolder(): Promise<string | null> {
  const result = await open({ directory: true, multiple: false });
  return typeof result === 'string' ? result : null;
}

export async function pickImageFiles(): Promise<string[]> {
  const result = await open({
    multiple: true,
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'] }],
  });
  if (Array.isArray(result)) {
    return result.filter((path): path is string => typeof path === 'string');
  }
  return typeof result === 'string' ? [result] : [];
}

export async function pickMarkdownFile(): Promise<string | null> {
  const result = await open({
    multiple: false,
    filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }],
  });
  return typeof result === 'string' ? result : null;
}

export async function confirmTrash(
  name: string,
  labels: {
    title: string;
    message: string;
    cancel: string;
    confirm: string;
  },
): Promise<boolean> {
  const message = labels.message.replace('{name}', name);
  return confirm(message, {
    title: labels.title,
    kind: 'warning',
    cancelLabel: labels.cancel,
    okLabel: labels.confirm,
  });
}

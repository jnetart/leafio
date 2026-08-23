import { invoke } from '@tauri-apps/api/core';
import { revealItemInDir } from '@tauri-apps/plugin-opener';

export async function openInFileManager(path: string): Promise<void> {
  await revealItemInDir(path);
}

export async function openInTerminal(path: string): Promise<void> {
  await invoke('open_in_terminal', { path });
}

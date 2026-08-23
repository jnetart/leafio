import type { FileEntry } from './fs';

export type TreeFocusTarget =
  | { type: 'file'; file: FileEntry }
  | { type: 'folder'; path: string }
  | { type: 'root'; path: string };

export interface AppMenuState {
  canEditText: boolean;
  canDuplicateFile: boolean;
  canNewFolder: boolean;
  canExport: boolean;
  canCloseDocument: boolean;
  canFind: boolean;
  canViewDocument: boolean;
}

export function deriveAppMenuState(input: {
  textFocus: boolean;
  treeFocus: TreeFocusTarget | null;
  activeFile: FileEntry | null;
  hasWorkspace: boolean;
  settingsOpen: boolean;
  welcomeScreen: boolean;
}): AppMenuState {
  const { textFocus, treeFocus, activeFile, hasWorkspace, settingsOpen, welcomeScreen } = input;
  const onFile = treeFocus?.type === 'file';
  const onFolder = treeFocus?.type === 'folder' || treeFocus?.type === 'root';
  const hasDocument = activeFile != null && !settingsOpen && !welcomeScreen;

  return {
    canEditText: textFocus,
    canDuplicateFile: onFile || (textFocus && activeFile != null),
    canNewFolder: onFolder,
    canExport: hasDocument,
    canCloseDocument: hasDocument,
    canFind: hasWorkspace && !settingsOpen,
    canViewDocument: hasDocument,
  };
}

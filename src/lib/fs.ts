import { invoke } from '@tauri-apps/api/core';
import type { ParsedSearchQuery } from './searchQuery';
import { storageFileName } from './workspace';

export interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
}

export interface SearchResult {
  name: string;
  path: string;
  snippet: string;
}

export const listWorkspace = (path: string): Promise<FileEntry[]> =>
  invoke('list_workspace', { path });

export const listMarkdownFiles = (path: string): Promise<FileEntry[]> =>
  invoke('list_markdown_files', { path });

export const searchWorkspace = (
  path: string,
  query: ParsedSearchQuery,
): Promise<SearchResult[]> =>
  invoke('search_workspace', {
    path,
    terms: query.terms,
    tags: query.tags,
    paths: query.paths,
  });

export const readFile = (path: string): Promise<string> =>
  invoke('read_file', { path });

export const writeFile = (path: string, content: string): Promise<void> =>
  invoke('write_file', { path, content });

export const getRecentFiles = (): Promise<string[]> =>
  invoke('get_recent_files');

export const addRecentFile = (path: string): Promise<void> =>
  invoke('add_recent_file', { path });

export const removeRecentFile = (path: string): Promise<void> =>
  invoke('remove_recent_file', { path });

export const replaceRecentFile = (oldPath: string, newPath: string): Promise<void> =>
  invoke('replace_recent_file', { oldPath, newPath });

export const suggestMarkdownFilename = (dir: string): Promise<string> =>
  invoke('suggest_markdown_filename', { dir });

export const createMarkdownFile = (dir: string, name: string): Promise<string> =>
  invoke('create_markdown_file', { dir, name });

export const suggestSubdirectoryName = (parent: string): Promise<string> =>
  invoke('suggest_subdirectory_name', { parent });

export const createSubdirectory = (parent: string, name: string): Promise<string> =>
  invoke('create_subdirectory', { parent, name: name.trim() });

export const defaultNewFileDir = (): Promise<string> =>
  invoke('default_new_file_dir');

export const defaultLeafioWorkspaceDir = (): Promise<string> =>
  invoke('default_leafio_workspace_dir');

export const getUserHomeDir = (): Promise<string> => invoke('user_home_dir');

export const renameFile = (path: string, newName: string): Promise<string> =>
  invoke('rename_file', { path, newName: storageFileName(newName) });

export const renameDirectory = (path: string, newName: string): Promise<string> =>
  invoke('rename_directory', { path, newName: newName.trim() });

export const moveToTrash = (path: string): Promise<void> =>
  invoke('move_to_trash', { path });

export const copyFile = (path: string): Promise<string> =>
  invoke('copy_file', { path });

export const moveFile = (path: string, destDir: string): Promise<string> =>
  invoke('move_file', { path, destDir });

export const setWorkspaceWatchers = (paths: string[]): Promise<void> =>
  invoke('set_workspace_watchers', { paths });

/** How many recent files the welcome screen lists. The store keeps more. */
export const WELCOME_RECENT_LIMIT = 5;

export function welcomeRecentFiles(paths: string[]): string[] {
  return paths.slice(0, WELCOME_RECENT_LIMIT);
}

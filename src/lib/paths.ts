export function dirname(path: string): string {
  const normalized = path.replace(/\\/g, '/');
  const index = normalized.lastIndexOf('/');
  return index >= 0 ? normalized.slice(0, index) : normalized;
}

export function basename(path: string): string {
  const normalized = path.replace(/\\/g, '/');
  const index = normalized.lastIndexOf('/');
  return index >= 0 ? normalized.slice(index + 1) : normalized;
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/');
}

function normalizeHome(homeDir: string): string {
  return normalizePath(homeDir).replace(/\/$/, '');
}

/** Display path with ~/ prefix when under the user's home directory. */
export function formatDisplayPath(path: string, homeDir?: string | null): string {
  if (!path) {
    return path;
  }
  const normalizedPath = normalizePath(path);
  if (!homeDir) {
    return normalizedPath;
  }

  const home = normalizeHome(homeDir);
  const pathLower = normalizedPath.toLowerCase();
  const homeLower = home.toLowerCase();

  if (pathLower === homeLower) {
    return '~';
  }

  const prefix = `${homeLower}/`;
  if (pathLower.startsWith(prefix)) {
    const suffix = normalizedPath.slice(home.length).replace(/^\//, '');
    return suffix ? `~/${suffix}` : '~';
  }

  return normalizedPath;
}

/** Replace a path prefix, preserving any suffix after the old prefix. */
export function replacePathPrefix(path: string, oldPrefix: string, newPrefix: string): string {
  const normalizedPath = normalizePath(path);
  const normalizedOld = normalizePath(oldPrefix);
  const normalizedNew = normalizePath(newPrefix);
  if (normalizedPath === normalizedOld) {
    return normalizedNew;
  }
  const prefix = `${normalizedOld}/`;
  if (normalizedPath.startsWith(prefix)) {
    return `${normalizedNew}${normalizedPath.slice(normalizedOld.length)}`;
  }
  return normalizedPath;
}

/** Resolve ~/… display paths back to absolute paths for file operations. */
export function expandUserPath(path: string, homeDir?: string | null): string {
  if (!path || !homeDir) {
    return path;
  }

  const trimmed = path.trim();
  if (trimmed === '~') {
    return normalizeHome(homeDir);
  }

  if (trimmed.startsWith('~/') || trimmed.startsWith('~\\')) {
    const rest = trimmed.slice(2).replace(/\\/g, '/');
    return `${normalizeHome(homeDir)}/${rest}`;
  }

  return path;
}

import { useEffect, useState } from 'react';
import { getUserHomeDir } from '../lib/fs';

export function useUserHomeDir(): string | null {
  const [homeDir, setHomeDir] = useState<string | null>(null);

  useEffect(() => {
    getUserHomeDir()
      .then(setHomeDir)
      .catch(() => setHomeDir(null));
  }, []);

  return homeDir;
}

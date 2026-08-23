import { load } from '@tauri-apps/plugin-store';
import {
  DEFAULT_PREFERENCES,
  type AppPreferences,
} from './preferences';

const STORE_PATH = 'preferences.json';

export async function loadPreferences(): Promise<AppPreferences> {
  try {
    const store = await load(STORE_PATH, { autoSave: false });
    const stored = await store.get<AppPreferences>('app');
    if (!stored) {
      return DEFAULT_PREFERENCES;
    }
    return { ...DEFAULT_PREFERENCES, ...stored };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function savePreferences(preferences: AppPreferences): Promise<void> {
  const store = await load(STORE_PATH, { autoSave: true });
  await store.set('app', preferences);
  await store.save();
}

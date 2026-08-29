import { load } from '@tauri-apps/plugin-store';
import {
  DEFAULT_PREFERENCES,
  resolveAutoSaveInterval,
  resolveAutoUpdateEnabled,
  resolveDefaultExportFormat,
  resolveIncludeFrontmatter,
  resolveSpellCheck,
  type AppPreferences,
} from './preferences';

const STORE_PATH = 'preferences.json';

export async function loadPreferences(): Promise<AppPreferences> {
  try {
    const store = await load(STORE_PATH, { autoSave: false });
    const stored = await store.get<
      Partial<AppPreferences> & { updateCheckInterval?: unknown }
    >('app');
    if (!stored) {
      return DEFAULT_PREFERENCES;
    }
    const { updateCheckInterval, autoUpdateEnabled, ...rest } = stored;
    return {
      ...DEFAULT_PREFERENCES,
      ...rest,
      autoUpdateEnabled: resolveAutoUpdateEnabled({ autoUpdateEnabled, updateCheckInterval }),
      autoSaveInterval: resolveAutoSaveInterval(stored.autoSaveInterval),
      spellCheck: resolveSpellCheck(stored.spellCheck),
      defaultExportFormat: resolveDefaultExportFormat(stored.defaultExportFormat),
      includeFrontmatter: resolveIncludeFrontmatter(stored.includeFrontmatter),
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function savePreferences(preferences: AppPreferences): Promise<void> {
  const store = await load(STORE_PATH, { autoSave: true });
  await store.set('app', preferences);
  await store.save();
}

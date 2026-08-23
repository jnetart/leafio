import type { MessageKey } from './i18n';
import {
  IconAppearance,
  IconEditor,
  IconExportNav,
  IconGeneral,
} from '../components/icons';

export type SettingsSection = 'general' | 'appearance' | 'editor' | 'export';

export const SETTINGS_SECTIONS: Array<{
  id: SettingsSection;
  labelKey: MessageKey;
  icon: typeof IconGeneral;
}> = [
  { id: 'general', labelKey: 'settings.nav.general', icon: IconGeneral },
  { id: 'appearance', labelKey: 'settings.nav.appearance', icon: IconAppearance },
  { id: 'editor', labelKey: 'settings.nav.editor', icon: IconEditor },
  { id: 'export', labelKey: 'settings.nav.export', icon: IconExportNav },
];

import { createTranslator, type MessageKey } from './i18n';
import { SETTINGS_SECTIONS, type SettingsSection } from './settings-sections';

export type SettingsSearchKind = 'section' | 'setting';

export interface SettingsSearchHit {
  id: string;
  section: SettingsSection;
  titleKey: MessageKey;
  kind: SettingsSearchKind;
}

interface SettingsSearchEntry {
  id: string;
  section: SettingsSection;
  titleKey: MessageKey;
  kind: SettingsSearchKind;
  searchKeys: MessageKey[];
}

const SETTING_ENTRIES: SettingsSearchEntry[] = [
  {
    id: 'language',
    section: 'general',
    titleKey: 'settings.language.title',
    kind: 'setting',
    searchKeys: [
      'settings.nav.general',
      'settings.group.startup',
      'settings.language.title',
      'settings.language.desc',
      'language.system',
      'language.zh',
      'language.en',
    ],
  },
  {
    id: 'launch',
    section: 'general',
    titleKey: 'settings.launch.title',
    kind: 'setting',
    searchKeys: [
      'settings.nav.general',
      'settings.group.startup',
      'settings.launch.title',
      'settings.launch.desc',
      'settings.launch.welcome',
      'settings.launch.last',
    ],
  },
  {
    id: 'theme',
    section: 'appearance',
    titleKey: 'settings.theme.title',
    kind: 'setting',
    searchKeys: [
      'settings.nav.appearance',
      'settings.group.theme',
      'settings.theme.title',
      'settings.theme.desc',
      'theme.system',
      'theme.light',
      'theme.dark',
    ],
  },
  {
    id: 'width',
    section: 'appearance',
    titleKey: 'settings.width.title',
    kind: 'setting',
    searchKeys: [
      'settings.nav.appearance',
      'settings.group.layout',
      'settings.width.title',
      'settings.width.desc',
      'settings.width.centered',
      'settings.width.wide',
    ],
  },
  {
    id: 'font',
    section: 'appearance',
    titleKey: 'settings.font.title',
    kind: 'setting',
    searchKeys: [
      'settings.nav.appearance',
      'settings.group.typography',
      'settings.font.title',
      'settings.font.desc',
      'settings.font.sans',
      'settings.font.serif',
      'settings.font.mono',
    ],
  },
  {
    id: 'fontSize',
    section: 'appearance',
    titleKey: 'settings.fontSize.title',
    kind: 'setting',
    searchKeys: [
      'settings.nav.appearance',
      'settings.group.typography',
      'settings.fontSize.title',
      'settings.fontSize.desc',
      'settings.fontSize.compact',
      'settings.fontSize.medium',
      'settings.fontSize.large',
      'settings.fontSize.xlarge',
    ],
  },
  {
    id: 'autosave',
    section: 'editor',
    titleKey: 'settings.autosave.title',
    kind: 'setting',
    searchKeys: [
      'settings.nav.editor',
      'settings.group.save',
      'settings.autosave.title',
      'settings.autosave.desc',
      'settings.autosave.2s',
      'settings.autosave.5s',
      'settings.autosave.off',
    ],
  },
  {
    id: 'tab',
    section: 'editor',
    titleKey: 'settings.tab.title',
    kind: 'setting',
    searchKeys: [
      'settings.nav.editor',
      'settings.group.editing',
      'settings.tab.title',
      'settings.tab.desc',
      'settings.tab.2',
      'settings.tab.4',
    ],
  },
  {
    id: 'spell',
    section: 'editor',
    titleKey: 'settings.spell.title',
    kind: 'setting',
    searchKeys: [
      'settings.nav.editor',
      'settings.group.editing',
      'settings.spell.title',
      'settings.spell.desc',
      'settings.spell.on',
      'settings.spell.off',
    ],
  },
  {
    id: 'images-compress',
    section: 'editor',
    titleKey: 'settings.images.compress.title',
    kind: 'setting',
    searchKeys: [
      'settings.nav.editor',
      'settings.group.images',
      'settings.images.compress.title',
      'settings.images.compress.desc',
    ],
  },
  {
    id: 'format',
    section: 'export',
    titleKey: 'settings.format.title',
    kind: 'setting',
    searchKeys: [
      'settings.nav.export',
      'settings.group.export',
      'settings.format.title',
      'settings.format.desc',
    ],
  },
  {
    id: 'frontmatter',
    section: 'export',
    titleKey: 'settings.frontmatter.title',
    kind: 'setting',
    searchKeys: [
      'settings.nav.export',
      'settings.group.export',
      'settings.frontmatter.title',
      'settings.frontmatter.desc',
      'settings.frontmatter.yes',
      'settings.frontmatter.no',
    ],
  },
  {
    id: 'updateCheck',
    section: 'updates',
    titleKey: 'settings.updateCheck.title',
    kind: 'setting',
    searchKeys: [
      'settings.nav.updates',
      'settings.group.updates',
      'settings.updateCheck.title',
      'settings.updateCheck.desc',
    ],
  },
  {
    id: 'version',
    section: 'updates',
    titleKey: 'settings.version.title',
    kind: 'setting',
    searchKeys: [
      'settings.nav.updates',
      'settings.group.updates',
      'settings.version.title',
      'settings.version.desc',
    ],
  },
  {
    id: 'updateAction',
    section: 'updates',
    titleKey: 'settings.updateAction.title',
    kind: 'setting',
    searchKeys: [
      'settings.nav.updates',
      'settings.group.updates',
      'settings.updateAction.title',
      'settings.updateAction.desc',
      'settings.updateAction.check',
    ],
  },
];

const SECTION_ENTRIES: SettingsSearchEntry[] = SETTINGS_SECTIONS.map((item) => ({
  id: `section-${item.id}`,
  section: item.id,
  titleKey: item.labelKey,
  kind: 'section',
  searchKeys: [item.labelKey],
}));

const SEARCH_ENTRIES: SettingsSearchEntry[] = [...SECTION_ENTRIES, ...SETTING_ENTRIES];

const zh = createTranslator('zh-CN');
const en = createTranslator('en');

function entryMatches(entry: SettingsSearchEntry, query: string): boolean {
  return entry.searchKeys.some((key) => {
    return zh(key).toLowerCase().includes(query) || en(key).toLowerCase().includes(query);
  });
}

export function settingDomId(id: string): string {
  return `setting-${id}`;
}

export function searchSettings(query: string): SettingsSearchHit[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return [];
  }

  return SEARCH_ENTRIES.filter((entry) => entryMatches(entry, needle)).map((entry) => ({
    id: entry.id,
    section: entry.section,
    titleKey: entry.titleKey,
    kind: entry.kind,
  }));
}

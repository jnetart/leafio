import { useState, type ReactNode } from 'react';
import type { createTranslator } from '../lib/i18n';
import type { SettingsSection } from '../lib/settings-sections';
import { SETTINGS_SECTIONS } from '../lib/settings-sections';
import type { EditorWidthMode, LanguageMode, LaunchBehavior, ThemeMode } from '../lib/preferences';

interface SettingsViewProps {
  section: SettingsSection;
  editorWidthMode: EditorWidthMode;
  theme: ThemeMode;
  language: LanguageMode;
  launchBehavior: LaunchBehavior;
  t: ReturnType<typeof createTranslator>;
  onEditorWidthModeChange: (mode: EditorWidthMode) => void;
  onThemeChange: (theme: ThemeMode) => void;
  onLanguageChange: (language: LanguageMode) => void;
  onLaunchBehaviorChange: (behavior: LaunchBehavior) => void;
}

export function SettingsView({
  section,
  editorWidthMode,
  theme,
  language,
  launchBehavior,
  t,
  onEditorWidthModeChange,
  onThemeChange,
  onLanguageChange,
  onLaunchBehaviorChange,
}: SettingsViewProps) {
  const [autoSaveInterval, setAutoSaveInterval] = useState('2');
  const [tabWidth, setTabWidth] = useState('2');
  const [spellCheck, setSpellCheck] = useState('off');
  const [defaultExportFormat, setDefaultExportFormat] = useState('html');
  const [includeFrontmatter, setIncludeFrontmatter] = useState('yes');

  const activeNav = SETTINGS_SECTIONS.find((item) => item.id === section) ?? SETTINGS_SECTIONS[0];

  return (
    <div className="settings-content flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <header className="settings-header">
        <h1 className="settings-title">{t(activeNav.labelKey)}</h1>
      </header>

      <div className="settings-body flex-1 overflow-auto">
        <div className="settings-body-inner">
          {section === 'general' ? (
            <SettingsGroup label={t('settings.group.startup')}>
              <SettingRow title={t('settings.language.title')} description={t('settings.language.desc')}>
                <SegmentedControl
                  options={[
                    { value: 'system', label: t('language.system') },
                    { value: 'zh-CN', label: t('language.zh') },
                    { value: 'en', label: t('language.en') },
                  ]}
                  value={language}
                  onChange={(value) => onLanguageChange(value as LanguageMode)}
                />
              </SettingRow>
              <SettingRow title={t('settings.launch.title')} description={t('settings.launch.desc')}>
                <SegmentedControl
                  options={[
                    { value: 'welcome', label: t('settings.launch.welcome') },
                    { value: 'last', label: t('settings.launch.last') },
                  ]}
                  value={launchBehavior}
                  onChange={(value) => onLaunchBehaviorChange(value as LaunchBehavior)}
                />
              </SettingRow>
            </SettingsGroup>
          ) : null}

          {section === 'appearance' ? (
            <>
              <SettingsGroup label={t('settings.group.theme')}>
                <SettingRow title={t('settings.theme.title')} description={t('settings.theme.desc')}>
                  <SegmentedControl
                    options={[
                      { value: 'system', label: t('theme.system') },
                      { value: 'light', label: t('theme.light') },
                      { value: 'dark', label: t('theme.dark') },
                    ]}
                    value={theme}
                    onChange={(value) => onThemeChange(value as ThemeMode)}
                  />
                </SettingRow>
              </SettingsGroup>

              <SettingsGroup label={t('settings.group.layout')}>
                <SettingRow title={t('settings.width.title')} description={t('settings.width.desc')}>
                  <SegmentedControl
                    options={[
                      { value: 'centered', label: t('settings.width.centered') },
                      { value: 'wide', label: t('settings.width.wide') },
                    ]}
                    value={editorWidthMode}
                    onChange={(value) => onEditorWidthModeChange(value as EditorWidthMode)}
                  />
                </SettingRow>
              </SettingsGroup>
            </>
          ) : null}

          {section === 'editor' ? (
            <>
              <SettingsGroup label={t('settings.group.save')}>
                <SettingRow title={t('settings.autosave.title')} description={t('settings.autosave.desc')}>
                  <SegmentedControl
                    options={[
                      { value: '2', label: t('settings.autosave.2s') },
                      { value: '5', label: t('settings.autosave.5s') },
                      { value: 'off', label: t('settings.autosave.off') },
                    ]}
                    value={autoSaveInterval}
                    onChange={setAutoSaveInterval}
                  />
                </SettingRow>
              </SettingsGroup>

              <SettingsGroup label={t('settings.group.editing')}>
                <SettingRow title={t('settings.tab.title')} description={t('settings.tab.desc')}>
                  <SegmentedControl
                    options={[
                      { value: '2', label: t('settings.tab.2') },
                      { value: '4', label: t('settings.tab.4') },
                    ]}
                    value={tabWidth}
                    onChange={setTabWidth}
                  />
                </SettingRow>
                <SettingRow title={t('settings.spell.title')} description={t('settings.spell.desc')}>
                  <SegmentedControl
                    options={[
                      { value: 'on', label: t('settings.spell.on') },
                      { value: 'off', label: t('settings.spell.off') },
                    ]}
                    value={spellCheck}
                    onChange={setSpellCheck}
                  />
                </SettingRow>
              </SettingsGroup>
            </>
          ) : null}

          {section === 'export' ? (
            <SettingsGroup label={t('settings.group.export')}>
              <SettingRow title={t('settings.format.title')} description={t('settings.format.desc')}>
                <SegmentedControl
                  options={[
                    { value: 'html', label: 'HTML' },
                    { value: 'markdown', label: 'Markdown' },
                  ]}
                  value={defaultExportFormat}
                  onChange={setDefaultExportFormat}
                />
              </SettingRow>
              <SettingRow
                title={t('settings.frontmatter.title')}
                description={t('settings.frontmatter.desc')}
              >
                <SegmentedControl
                  options={[
                    { value: 'yes', label: t('settings.frontmatter.yes') },
                    { value: 'no', label: t('settings.frontmatter.no') },
                  ]}
                  value={includeFrontmatter}
                  onChange={setIncludeFrontmatter}
                />
              </SettingRow>
            </SettingsGroup>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SettingsGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="settings-group">
      <div className="settings-group-label">{label}</div>
      <div className="settings-group-card">{children}</div>
    </section>
  );
}

function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="settings-row">
      <div className="settings-row-text">
        <div className="settings-row-title">{title}</div>
        <div className="settings-row-desc">{description}</div>
      </div>
      <div className="settings-row-control">{children}</div>
    </div>
  );
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="segmented-control">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`segmented-control-btn ${
            value === option.value ? 'segmented-control-btn--active' : ''
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

import { type ReactNode, useEffect } from 'react';
import type { createTranslator } from '../lib/i18n';
import type { SettingsSection } from '../lib/settings-sections';
import { SETTINGS_SECTIONS } from '../lib/settings-sections';
import { settingDomId } from '../lib/settings-search';
import type {
  AutoSaveInterval,
  EditorFontFamily,
  EditorFontSize,
  EditorTabWidth,
  EditorWidthMode,
  ExportFormat,
  LanguageMode,
  LaunchBehavior,
  ThemeMode,
} from '../lib/preferences';
import type { UpdateStatus } from '../hooks/useAppUpdate';

interface SettingsViewProps {
  section: SettingsSection;
  revealId?: string | null;
  revealEpoch?: number;
  editorWidthMode: EditorWidthMode;
  editorFontFamily: EditorFontFamily;
  editorFontSize: EditorFontSize;
  editorTabWidth: EditorTabWidth;
  compressImages: boolean;
  autoSaveInterval: AutoSaveInterval;
  spellCheck: boolean;
  defaultExportFormat: ExportFormat;
  includeFrontmatter: boolean;
  theme: ThemeMode;
  language: LanguageMode;
  launchBehavior: LaunchBehavior;
  autoUpdateEnabled: boolean;
  appVersion: string;
  updateStatus: UpdateStatus;
  availableVersion: string | null;
  updateError: string | null;
  downloadRatio: number | null;
  t: ReturnType<typeof createTranslator>;
  onEditorWidthModeChange: (mode: EditorWidthMode) => void;
  onEditorFontFamilyChange: (family: EditorFontFamily) => void;
  onEditorFontSizeChange: (size: EditorFontSize) => void;
  onEditorTabWidthChange: (width: EditorTabWidth) => void;
  onCompressImagesChange: (enabled: boolean) => void;
  onAutoSaveIntervalChange: (interval: AutoSaveInterval) => void;
  onSpellCheckChange: (enabled: boolean) => void;
  onDefaultExportFormatChange: (format: ExportFormat) => void;
  onIncludeFrontmatterChange: (include: boolean) => void;
  onThemeChange: (theme: ThemeMode) => void;
  onLanguageChange: (language: LanguageMode) => void;
  onLaunchBehaviorChange: (behavior: LaunchBehavior) => void;
  onAutoUpdateEnabledChange: (enabled: boolean) => void;
  onCheckForUpdates: () => void;
  onInstallUpdate: () => void;
}

export function SettingsView({
  section,
  revealId = null,
  revealEpoch = 0,
  editorWidthMode,
  editorFontFamily,
  editorFontSize,
  editorTabWidth,
  compressImages,
  autoSaveInterval,
  spellCheck,
  defaultExportFormat,
  includeFrontmatter,
  theme,
  language,
  launchBehavior,
  autoUpdateEnabled,
  appVersion,
  updateStatus,
  availableVersion,
  updateError,
  downloadRatio,
  t,
  onEditorWidthModeChange,
  onEditorFontFamilyChange,
  onEditorFontSizeChange,
  onEditorTabWidthChange,
  onCompressImagesChange,
  onAutoSaveIntervalChange,
  onSpellCheckChange,
  onDefaultExportFormatChange,
  onIncludeFrontmatterChange,
  onThemeChange,
  onLanguageChange,
  onLaunchBehaviorChange,
  onAutoUpdateEnabledChange,
  onCheckForUpdates,
  onInstallUpdate,
}: SettingsViewProps) {
  const activeNav = SETTINGS_SECTIONS.find((item) => item.id === section) ?? SETTINGS_SECTIONS[0];

  useEffect(() => {
    if (!revealId) {
      return;
    }
    const el = document.getElementById(settingDomId(revealId));
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [revealId, revealEpoch, section]);

  return (
    <div className="settings-content flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <header className="settings-header">
        <h1 className="settings-title">{t(activeNav.labelKey)}</h1>
      </header>

      <div className="settings-body scroll-pane flex-1 overflow-auto">
        <div className="settings-body-inner">
          {section === 'general' ? (
            <>
              <SettingsGroup label={t('settings.group.startup')}>
                <SettingRow
                  settingId="language"
                  revealed={revealId === 'language'}
                  title={t('settings.language.title')}
                  description={t('settings.language.desc')}
                >
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
                <SettingRow
                  settingId="launch"
                  revealed={revealId === 'launch'}
                  title={t('settings.launch.title')}
                  description={t('settings.launch.desc')}
                >
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
            </>
          ) : null}

          {section === 'appearance' ? (
            <>
              <SettingsGroup label={t('settings.group.theme')}>
                <SettingRow
                  settingId="theme"
                  revealed={revealId === 'theme'}
                  title={t('settings.theme.title')}
                  description={t('settings.theme.desc')}
                >
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
                <SettingRow
                  settingId="width"
                  revealed={revealId === 'width'}
                  title={t('settings.width.title')}
                  description={t('settings.width.desc')}
                >
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

              <SettingsGroup label={t('settings.group.typography')}>
                <SettingRow
                  settingId="font"
                  revealed={revealId === 'font'}
                  title={t('settings.font.title')}
                  description={t('settings.font.desc')}
                >
                  <SegmentedControl
                    options={[
                      { value: 'sans', label: t('settings.font.sans') },
                      { value: 'serif', label: t('settings.font.serif') },
                      { value: 'mono', label: t('settings.font.mono') },
                    ]}
                    value={editorFontFamily}
                    onChange={(value) => onEditorFontFamilyChange(value as EditorFontFamily)}
                  />
                </SettingRow>
                <SettingRow
                  settingId="fontSize"
                  revealed={revealId === 'fontSize'}
                  title={t('settings.fontSize.title')}
                  description={t('settings.fontSize.desc')}
                >
                  <SegmentedControl
                    options={[
                      { value: 'compact', label: t('settings.fontSize.compact') },
                      { value: 'medium', label: t('settings.fontSize.medium') },
                      { value: 'large', label: t('settings.fontSize.large') },
                      { value: 'xlarge', label: t('settings.fontSize.xlarge') },
                    ]}
                    value={editorFontSize}
                    onChange={(value) => onEditorFontSizeChange(value as EditorFontSize)}
                  />
                </SettingRow>
              </SettingsGroup>
            </>
          ) : null}

          {section === 'editor' ? (
            <>
              <SettingsGroup label={t('settings.group.save')}>
                <SettingRow
                  settingId="autosave"
                  revealed={revealId === 'autosave'}
                  title={t('settings.autosave.title')}
                  description={t('settings.autosave.desc')}
                >
                  <SegmentedControl
                    options={[
                      { value: '2', label: t('settings.autosave.2s') },
                      { value: '5', label: t('settings.autosave.5s') },
                      { value: 'off', label: t('settings.autosave.off') },
                    ]}
                    value={autoSaveInterval === 0 ? 'off' : String(autoSaveInterval)}
                    onChange={(value) =>
                      onAutoSaveIntervalChange(value === 'off' ? 0 : (Number(value) as AutoSaveInterval))
                    }
                  />
                </SettingRow>
              </SettingsGroup>

              <SettingsGroup label={t('settings.group.editing')}>
                <SettingRow
                  settingId="tab"
                  revealed={revealId === 'tab'}
                  title={t('settings.tab.title')}
                  description={t('settings.tab.desc')}
                >
                  <SegmentedControl
                    options={[
                      { value: '2', label: t('settings.tab.2') },
                      { value: '4', label: t('settings.tab.4') },
                    ]}
                    value={String(editorTabWidth)}
                    onChange={(value) => onEditorTabWidthChange(Number(value) as EditorTabWidth)}
                  />
                </SettingRow>
                <SettingRow
                  settingId="spell"
                  revealed={revealId === 'spell'}
                  title={t('settings.spell.title')}
                  description={t('settings.spell.desc')}
                >
                  <SegmentedControl
                    options={[
                      { value: 'on', label: t('settings.spell.on') },
                      { value: 'off', label: t('settings.spell.off') },
                    ]}
                    value={spellCheck ? 'on' : 'off'}
                    onChange={(value) => onSpellCheckChange(value === 'on')}
                  />
                </SettingRow>
              </SettingsGroup>

              <SettingsGroup label={t('settings.group.images')}>
                <SettingRow
                  settingId="images-compress"
                  revealed={revealId === 'images-compress'}
                  title={t('settings.images.compress.title')}
                  description={t('settings.images.compress.desc')}
                >
                  <Switch
                    checked={compressImages}
                    label={t('settings.images.compress.title')}
                    onChange={onCompressImagesChange}
                  />
                </SettingRow>
              </SettingsGroup>
            </>
          ) : null}

          {section === 'export' ? (
            <SettingsGroup label={t('settings.group.export')}>
              <SettingRow
                settingId="format"
                revealed={revealId === 'format'}
                title={t('settings.format.title')}
                description={t('settings.format.desc')}
              >
                <SegmentedControl
                  options={[
                    { value: 'html', label: 'HTML' },
                    { value: 'markdown', label: 'Markdown' },
                  ]}
                  value={defaultExportFormat}
                  onChange={(value) => onDefaultExportFormatChange(value as ExportFormat)}
                />
              </SettingRow>
              <SettingRow
                settingId="frontmatter"
                revealed={revealId === 'frontmatter'}
                title={t('settings.frontmatter.title')}
                description={t('settings.frontmatter.desc')}
              >
                <SegmentedControl
                  options={[
                    { value: 'yes', label: t('settings.frontmatter.yes') },
                    { value: 'no', label: t('settings.frontmatter.no') },
                  ]}
                  value={includeFrontmatter ? 'yes' : 'no'}
                  onChange={(value) => onIncludeFrontmatterChange(value === 'yes')}
                />
              </SettingRow>
            </SettingsGroup>
          ) : null}

          {section === 'updates' ? (
            <SettingsGroup label={t('settings.group.updates')}>
              <SettingRow
                settingId="updateCheck"
                revealed={revealId === 'updateCheck'}
                title={t('settings.updateCheck.title')}
                description={t('settings.updateCheck.desc')}
              >
                <Switch
                  checked={autoUpdateEnabled}
                  label={t('settings.updateCheck.title')}
                  onChange={onAutoUpdateEnabledChange}
                />
              </SettingRow>
              <SettingRow
                settingId="version"
                revealed={revealId === 'version'}
                title={t('settings.version.title')}
                description={t('settings.version.desc')}
              >
                <span className="settings-version-badge">v{appVersion}</span>
              </SettingRow>
              <SettingRow
                settingId="updateAction"
                revealed={revealId === 'updateAction'}
                title={t('settings.updateAction.title')}
                description={
                  updateStatus === 'error' && updateError
                    ? updateError
                    : t('settings.updateAction.desc')
                }
              >
                <UpdateActionControl
                  status={updateStatus}
                  availableVersion={availableVersion}
                  downloadRatio={downloadRatio}
                  t={t}
                  onCheck={onCheckForUpdates}
                  onInstall={onInstallUpdate}
                />
              </SettingRow>
            </SettingsGroup>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function UpdateActionControl({
  status,
  availableVersion,
  downloadRatio,
  t,
  onCheck,
  onInstall,
}: {
  status: UpdateStatus;
  availableVersion: string | null;
  downloadRatio: number | null;
  t: ReturnType<typeof createTranslator>;
  onCheck: () => void;
  onInstall: () => void;
}) {
  if (status === 'downloading') {
    const pct = downloadRatio == null ? null : `${Math.round(downloadRatio * 100)}%`;
    return (
      <div className="settings-update-actions">
        <span className="settings-update-status">
          {t('settings.updateAction.downloading')}
          {pct ? ` ${pct}` : ''}
        </span>
      </div>
    );
  }

  if (status === 'available' && availableVersion) {
    return (
      <div className="settings-update-actions">
        <span className="settings-update-status">
          {t('settings.updateAction.available').replace('{version}', availableVersion)}
        </span>
        <button type="button" className="settings-action-btn" onClick={onInstall}>
          {t('settings.updateAction.install')}
        </button>
      </div>
    );
  }

  const busy = status === 'checking';

  return (
    <div className="settings-update-actions">
      {status === 'up-to-date' || status === 'error' ? (
        <span className="settings-update-status">
          {status === 'up-to-date'
            ? t('settings.updateAction.upToDate')
            : t('settings.updateAction.error')}
        </span>
      ) : null}
      <button
        type="button"
        className="settings-action-btn"
        onClick={onCheck}
        disabled={busy}
      >
        {busy ? t('settings.updateAction.checking') : t('settings.updateAction.check')}
      </button>
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
  settingId,
  revealed = false,
  title,
  description,
  children,
}: {
  settingId: string;
  revealed?: boolean;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div
      id={settingDomId(settingId)}
      className={`settings-row${revealed ? ' settings-row--reveal' : ''}`}
    >
      <div className="settings-row-text">
        <div className="settings-row-title">{title}</div>
        <div className="settings-row-desc">{description}</div>
      </div>
      <div className="settings-row-control">{children}</div>
    </div>
  );
}

function Switch({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`settings-switch ${checked ? 'settings-switch--on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="settings-switch-thumb" />
    </button>
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

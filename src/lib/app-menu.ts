import { Menu, MenuItem, PredefinedMenuItem, Submenu } from '@tauri-apps/api/menu';
import { getCurrentWindow } from '@tauri-apps/api/window';
import type { AppMenuState } from './app-menu-state';
import { SELECT_TAB_DIGITS, type SelectTabDigit } from './editor-tabs';
import type { createTranslator, MessageKey } from './i18n';

export type SelectTabAction = `select-tab-${SelectTabDigit}`;

export type AppMenuAction =
  | 'settings'
  | 'new-document'
  | 'open-folder'
  | 'open-file'
  | 'new-folder'
  | 'duplicate'
  | 'export'
  | 'close-document'
  | 'find'
  | 'undo'
  | 'redo'
  | 'cut'
  | 'copy'
  | 'paste'
  | 'select-all'
  | 'toggle-sidebar'
  | 'toggle-inspector'
  | 'view-edit'
  | 'view-source'
  | 'view-preview'
  | SelectTabAction;

function selectTabAction(digit: SelectTabDigit): SelectTabAction {
  return `select-tab-${digit}`;
}

function selectTabMenuId(digit: SelectTabDigit): string {
  return `menu-select-tab-${digit}`;
}

export function selectTabDigitFromAction(action: AppMenuAction): SelectTabDigit | null {
  if (!action.startsWith('select-tab-')) {
    return null;
  }
  const digit = Number(action.slice('select-tab-'.length));
  return SELECT_TAB_DIGITS.includes(digit as SelectTabDigit) ? (digit as SelectTabDigit) : null;
}

export const MENU_ITEM_IDS = {
  settings: 'menu-settings',
  newDocument: 'menu-new-document',
  openFolder: 'menu-open-folder',
  openFile: 'menu-open-file',
  newFolder: 'menu-new-folder',
  duplicate: 'menu-duplicate',
  export: 'menu-export',
  closeDocument: 'menu-close',
  find: 'menu-find',
  undo: 'menu-undo',
  redo: 'menu-redo',
  cut: 'menu-cut',
  copy: 'menu-copy',
  paste: 'menu-paste',
  selectAll: 'menu-select-all',
  toggleSidebar: 'menu-toggle-sidebar',
  toggleInspector: 'menu-toggle-inspector',
  viewEdit: 'menu-view-edit',
  viewSource: 'menu-view-source',
  viewPreview: 'menu-view-preview',
  quit: 'menu-quit',
  ...Object.fromEntries(SELECT_TAB_DIGITS.map((digit) => [`selectTab${digit}`, selectTabMenuId(digit)])),
} as const;

const SUBMENU_IDS = {
  file: 'menu-submenu-file',
  edit: 'menu-submenu-edit',
  view: 'menu-submenu-view',
  window: 'menu-submenu-window',
} as const;

const PREDEFINED_LABEL_KEYS: Record<string, MessageKey> = {};

const isMac = navigator.userAgent.includes('Mac');

type ManagedMenuItem = MenuItem | PredefinedMenuItem;

export interface AppMenuHandle {
  menu: Menu;
  items: Record<string, ManagedMenuItem>;
  submenus: Record<string, Submenu>;
}

function actionHandler(onAction: (action: AppMenuAction) => void, action: AppMenuAction) {
  return () => onAction(action);
}

async function customItem(
  id: string,
  text: string,
  onAction: (action: AppMenuAction) => void,
  action: AppMenuAction,
  accelerator?: string,
  enabled = true,
) {
  return MenuItem.new({
    id,
    text,
    accelerator,
    enabled,
    action: actionHandler(onAction, action),
  });
}

async function localizedPredefined(
  labelKey: MessageKey,
  text: string,
  item: 'Services' | 'Hide' | 'HideOthers' | 'Quit' | 'Minimize' | 'Maximize' | 'Fullscreen' | 'CloseWindow',
) {
  const predefined = await PredefinedMenuItem.new({ text, item });
  PREDEFINED_LABEL_KEYS[predefined.id] = labelKey;
  return predefined;
}

async function localizedAbout(text: string) {
  const predefined = await PredefinedMenuItem.new({
    text,
    item: { About: { name: 'Leafio', version: '0.8.71' } },
  });
  PREDEFINED_LABEL_KEYS[predefined.id] = 'menu.about';
  return predefined;
}

function trackPredefined(
  items: Record<string, ManagedMenuItem>,
  predefined: PredefinedMenuItem,
) {
  items[predefined.id] = predefined;
  return predefined;
}

const ITEM_LABEL_KEYS: Partial<Record<string, MessageKey>> = {
  [MENU_ITEM_IDS.settings]: 'menu.settings',
  [MENU_ITEM_IDS.newDocument]: 'menu.newDocument',
  [MENU_ITEM_IDS.openFolder]: 'menu.openFolder',
  [MENU_ITEM_IDS.openFile]: 'menu.openFile',
  [MENU_ITEM_IDS.newFolder]: 'menu.newFolder',
  [MENU_ITEM_IDS.duplicate]: 'menu.duplicate',
  [MENU_ITEM_IDS.export]: 'menu.export',
  [MENU_ITEM_IDS.closeDocument]: 'menu.closeDocument',
  [MENU_ITEM_IDS.find]: 'menu.find',
  [MENU_ITEM_IDS.undo]: 'menu.undo',
  [MENU_ITEM_IDS.redo]: 'menu.redo',
  [MENU_ITEM_IDS.cut]: 'menu.cut',
  [MENU_ITEM_IDS.copy]: 'menu.copy',
  [MENU_ITEM_IDS.paste]: 'menu.paste',
  [MENU_ITEM_IDS.selectAll]: 'menu.selectAll',
  [MENU_ITEM_IDS.toggleSidebar]: 'menu.toggleSidebar',
  [MENU_ITEM_IDS.toggleInspector]: 'menu.toggleInspector',
  [MENU_ITEM_IDS.viewEdit]: 'menu.viewEdit',
  [MENU_ITEM_IDS.viewSource]: 'menu.viewSource',
  [MENU_ITEM_IDS.viewPreview]: 'menu.viewPreview',
  [MENU_ITEM_IDS.quit]: 'menu.quit',
};

const SUBMENU_LABEL_KEYS: Record<string, MessageKey> = {
  [SUBMENU_IDS.file]: 'menu.file',
  [SUBMENU_IDS.edit]: 'menu.edit',
  [SUBMENU_IDS.view]: 'menu.view',
  [SUBMENU_IDS.window]: 'menu.window',
};

export async function buildAppMenu(
  t: ReturnType<typeof createTranslator>,
  onAction: (action: AppMenuAction) => void,
): Promise<AppMenuHandle> {
  for (const key of Object.keys(PREDEFINED_LABEL_KEYS)) {
    delete PREDEFINED_LABEL_KEYS[key];
  }

  const items: Record<string, ManagedMenuItem> = {};

  const settingsItem = await customItem(
    MENU_ITEM_IDS.settings,
    t('menu.settings'),
    onAction,
    'settings',
    'CmdOrCtrl+,',
  );
  items[MENU_ITEM_IDS.settings] = settingsItem;

  const appSubmenu = isMac
    ? await Submenu.new({
        text: 'Leafio',
        items: [
          trackPredefined(
            items,
            await localizedAbout(t('menu.about')),
          ),
          { item: 'Separator' },
          settingsItem,
          { item: 'Separator' },
          trackPredefined(
            items,
            await localizedPredefined('menu.services', t('menu.services'), 'Services'),
          ),
          { item: 'Separator' },
          trackPredefined(
            items,
            await localizedPredefined('menu.hide', t('menu.hide'), 'Hide'),
          ),
          trackPredefined(
            items,
            await localizedPredefined('menu.hideOthers', t('menu.hideOthers'), 'HideOthers'),
          ),
          { item: 'Separator' },
          trackPredefined(
            items,
            await localizedPredefined('menu.quit', t('menu.quit'), 'Quit'),
          ),
        ],
      })
    : null;

  const fileItemDefs: Array<MenuItem | { item: 'Separator' }> = [
    await customItem(
      MENU_ITEM_IDS.newDocument,
      t('menu.newDocument'),
      onAction,
      'new-document',
      'CmdOrCtrl+N',
    ),
    await customItem(
      MENU_ITEM_IDS.openFolder,
      t('menu.openFolder'),
      onAction,
      'open-folder',
      'CmdOrCtrl+Shift+O',
    ),
    await customItem(
      MENU_ITEM_IDS.openFile,
      t('menu.openFile'),
      onAction,
      'open-file',
      'CmdOrCtrl+O',
    ),
    { item: 'Separator' as const },
    await customItem(MENU_ITEM_IDS.newFolder, t('menu.newFolder'), onAction, 'new-folder'),
    await customItem(
      MENU_ITEM_IDS.duplicate,
      t('menu.duplicate'),
      onAction,
      'duplicate',
      'CmdOrCtrl+D',
    ),
    { item: 'Separator' as const },
    await customItem(
      MENU_ITEM_IDS.export,
      t('menu.export'),
      onAction,
      'export',
      'CmdOrCtrl+Shift+E',
    ),
    await customItem(
      MENU_ITEM_IDS.closeDocument,
      t('menu.closeDocument'),
      onAction,
      'close-document',
      'CmdOrCtrl+W',
    ),
  ];

  for (const entry of fileItemDefs) {
    if (entry instanceof MenuItem) {
      items[entry.id] = entry;
    }
  }

  if (!isMac) {
    fileItemDefs.push(
      { item: 'Separator' as const },
      await MenuItem.new({
        id: MENU_ITEM_IDS.quit,
        text: t('menu.quit'),
        accelerator: 'Alt+F4',
        action: () => void getCurrentWindow().close(),
      }),
    );
    items[MENU_ITEM_IDS.quit] = fileItemDefs[fileItemDefs.length - 1] as MenuItem;
  }

  const fileSubmenu = await Submenu.new({
    id: SUBMENU_IDS.file,
    text: t('menu.file'),
    items: fileItemDefs,
  });

  const editItemDefs = [
    await customItem(MENU_ITEM_IDS.undo, t('menu.undo'), onAction, 'undo', 'CmdOrCtrl+Z', false),
    await customItem(MENU_ITEM_IDS.redo, t('menu.redo'), onAction, 'redo', 'CmdOrCtrl+Shift+Z', false),
    { item: 'Separator' as const },
    await customItem(MENU_ITEM_IDS.cut, t('menu.cut'), onAction, 'cut', 'CmdOrCtrl+X', false),
    await customItem(MENU_ITEM_IDS.copy, t('menu.copy'), onAction, 'copy', 'CmdOrCtrl+C', false),
    await customItem(MENU_ITEM_IDS.paste, t('menu.paste'), onAction, 'paste', 'CmdOrCtrl+V', false),
    { item: 'Separator' as const },
    await customItem(
      MENU_ITEM_IDS.selectAll,
      t('menu.selectAll'),
      onAction,
      'select-all',
      'CmdOrCtrl+A',
      false,
    ),
    { item: 'Separator' as const },
    await customItem(MENU_ITEM_IDS.find, t('menu.find'), onAction, 'find', 'CmdOrCtrl+F'),
  ];

  for (const entry of editItemDefs) {
    if (entry instanceof MenuItem) {
      items[entry.id] = entry;
    }
  }

  const editSubmenu = await Submenu.new({
    id: SUBMENU_IDS.edit,
    text: t('menu.edit'),
    items: editItemDefs,
  });

  const viewItemDefs = [
    await customItem(
      MENU_ITEM_IDS.toggleSidebar,
      t('menu.toggleSidebar'),
      onAction,
      'toggle-sidebar',
      'CmdOrCtrl+\\',
    ),
    await customItem(
      MENU_ITEM_IDS.toggleInspector,
      t('menu.toggleInspector'),
      onAction,
      'toggle-inspector',
      'CmdOrCtrl+Shift+I',
    ),
    { item: 'Separator' as const },
    await customItem(MENU_ITEM_IDS.viewEdit, t('menu.viewEdit'), onAction, 'view-edit'),
    await customItem(MENU_ITEM_IDS.viewSource, t('menu.viewSource'), onAction, 'view-source'),
    await customItem(MENU_ITEM_IDS.viewPreview, t('menu.viewPreview'), onAction, 'view-preview'),
    { item: 'Separator' as const },
    ...(await Promise.all(
      SELECT_TAB_DIGITS.map((digit) =>
        customItem(
          selectTabMenuId(digit),
          t('menu.selectTab').replace('{n}', String(digit)),
          onAction,
          selectTabAction(digit),
          `CmdOrCtrl+${digit}`,
          false,
        ),
      ),
    )),
  ];

  for (const entry of viewItemDefs) {
    if (entry instanceof MenuItem) {
      items[entry.id] = entry;
    }
  }

  const viewSubmenu = await Submenu.new({
    id: SUBMENU_IDS.view,
    text: t('menu.view'),
    items: viewItemDefs,
  });

  const windowItemDefs = [
    trackPredefined(
      items,
      await localizedPredefined('menu.minimize', t('menu.minimize'), 'Minimize'),
    ),
    trackPredefined(
      items,
      await localizedPredefined('menu.maximize', t('menu.maximize'), 'Maximize'),
    ),
    trackPredefined(
      items,
      await localizedPredefined('menu.fullscreen', t('menu.fullscreen'), 'Fullscreen'),
    ),
    { item: 'Separator' as const },
    trackPredefined(
      items,
      await localizedPredefined('menu.closeWindow', t('menu.closeWindow'), 'CloseWindow'),
    ),
  ];

  const windowSubmenu = await Submenu.new({
    id: SUBMENU_IDS.window,
    text: t('menu.window'),
    items: windowItemDefs,
  });

  if (isMac) {
    await windowSubmenu.setAsWindowsMenuForNSApp();
  }

  const submenus: Record<string, Submenu> = {
    [SUBMENU_IDS.file]: fileSubmenu,
    [SUBMENU_IDS.edit]: editSubmenu,
    [SUBMENU_IDS.view]: viewSubmenu,
    [SUBMENU_IDS.window]: windowSubmenu,
  };

  const menuItems = isMac
    ? [appSubmenu!, fileSubmenu, editSubmenu, viewSubmenu, windowSubmenu]
    : [fileSubmenu, editSubmenu, viewSubmenu];

  const menu = await Menu.new({ items: menuItems });
  await (isMac ? menu.setAsAppMenu() : menu.setAsWindowMenu());

  return { menu, items, submenus };
}

function enabledForItem(id: string, state: AppMenuState): boolean {
  switch (id) {
    case MENU_ITEM_IDS.duplicate:
      return state.canDuplicateFile;
    case MENU_ITEM_IDS.newFolder:
      return state.canNewFolder;
    case MENU_ITEM_IDS.export:
      return state.canExport;
    case MENU_ITEM_IDS.closeDocument:
      return state.canCloseDocument;
    case MENU_ITEM_IDS.find:
      return state.canFind;
    case MENU_ITEM_IDS.undo:
    case MENU_ITEM_IDS.redo:
    case MENU_ITEM_IDS.cut:
    case MENU_ITEM_IDS.copy:
    case MENU_ITEM_IDS.paste:
    case MENU_ITEM_IDS.selectAll:
      return state.canEditText;
    case MENU_ITEM_IDS.viewEdit:
    case MENU_ITEM_IDS.viewSource:
    case MENU_ITEM_IDS.viewPreview:
      return state.canViewDocument;
    default:
      if (id.startsWith('menu-select-tab-')) {
        const digit = Number(id.slice('menu-select-tab-'.length));
        return Number.isFinite(digit) && state.tabCount >= digit;
      }
      return true;
  }
}

export async function updateAppMenu(
  handle: AppMenuHandle,
  t: ReturnType<typeof createTranslator>,
  state: AppMenuState,
): Promise<void> {
  for (const [submenuId, labelKey] of Object.entries(SUBMENU_LABEL_KEYS)) {
    const submenu = handle.submenus[submenuId];
    if (submenu) {
      await submenu.setText(t(labelKey));
    }
  }

  for (const [id, item] of Object.entries(handle.items)) {
    const labelKey = ITEM_LABEL_KEYS[id] ?? PREDEFINED_LABEL_KEYS[id];
    if (labelKey) {
      await item.setText(t(labelKey));
    } else if (id.startsWith('menu-select-tab-')) {
      const digit = id.slice('menu-select-tab-'.length);
      await item.setText(t('menu.selectTab').replace('{n}', digit));
    }
    if (item instanceof MenuItem) {
      await item.setEnabled(enabledForItem(id, state));
    }
  }
}

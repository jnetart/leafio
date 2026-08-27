import type { KeyboardEvent } from 'react';
import { displayFileName } from '../lib/workspace';
import type { EditorTab } from '../lib/editor-tabs';
import { isMac } from '../lib/platform';
import { useWindowDrag } from '../hooks/useWindowDrag';
import { IconClose } from './icons';

interface EditorTabBarProps {
  tabs: EditorTab[];
  activePath: string | null;
  insetForTrafficLights?: boolean;
  labels: {
    list: string;
    close: string;
  };
  onSelect: (path: string) => void;
  onClose: (path: string) => void;
}

export function EditorTabBar({
  tabs,
  activePath,
  insetForTrafficLights = false,
  labels,
  onSelect,
  onClose,
}: EditorTabBarProps) {
  const onMouseDown = useWindowDrag();
  const shortcutMod = isMac ? '⌘' : 'Ctrl+';

  const onTabListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = tabs.findIndex((tab) => tab.path === activePath);
    if (currentIndex < 0) {
      return;
    }
    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (currentIndex + tabs.length - 1) % tabs.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = tabs.length - 1;
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      onClose(tabs[currentIndex].path);
      return;
    }
    if (nextIndex === null) {
      return;
    }
    event.preventDefault();
    onSelect(tabs[nextIndex].path);
  };

  return (
    <header
      className={`editor-tabbar shrink-0${insetForTrafficLights ? ' editor-tabbar--inset' : ''}`}
    >
      <div className="titlebar-drag-layer" data-tauri-drag-region onMouseDown={onMouseDown} />
      <div className="editor-tabbar-inner">
        <div
          className="editor-tabbar-list"
          role="tablist"
          aria-label={labels.list}
          onKeyDown={onTabListKeyDown}
        >
          {tabs.map((tab, index) => {
            const selected = tab.path === activePath;
            const title = displayFileName(tab.name);
            const shortcut = index < 9 ? `${shortcutMod}${index + 1}` : null;
            return (
              <div
                key={tab.path}
                className={`editor-tab${selected ? ' editor-tab--active' : ''}${
                  tab.dirty ? ' editor-tab--dirty' : ''
                }`}
              >
                <span className="editor-tab-curve editor-tab-curve--start" aria-hidden="true" />
                <span className="editor-tab-curve editor-tab-curve--end" aria-hidden="true" />
                <button
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-keyshortcuts={shortcut ? `${isMac ? 'Meta' : 'Control'}+${index + 1}` : undefined}
                  tabIndex={selected ? 0 : -1}
                  className="editor-tab-button"
                  title={shortcut ? `${title} (${shortcut})` : title}
                  onClick={() => onSelect(tab.path)}
                  onAuxClick={(event) => {
                    if (event.button === 1) {
                      event.preventDefault();
                      onClose(tab.path);
                    }
                  }}
                >
                  <span className="editor-tab-title">{title}</span>
                </button>
                <button
                  type="button"
                  className="editor-tab-close"
                  data-no-drag
                  aria-label={`${labels.close} ${title}`}
                  title={labels.close}
                  onClick={(event) => {
                    event.stopPropagation();
                    onClose(tab.path);
                  }}
                >
                  {tab.dirty ? <span className="editor-tab-dirty" aria-hidden="true" /> : null}
                  <IconClose className="editor-tab-close-icon h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
        <div
          className="editor-tabbar-rest"
          data-tauri-drag-region
          onMouseDown={onMouseDown}
        />
      </div>
    </header>
  );
}

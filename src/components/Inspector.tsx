import { useState } from 'react';
import { useHorizontalResize } from '../hooks/useHorizontalResize';
import { useWindowDrag } from '../hooks/useWindowDrag';
import { IconOutline, IconPanelRight } from './icons';

export interface HeadingItem {
  id: string;
  level: number;
  text: string;
}

interface InspectorProps {
  headings: HeadingItem[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onHeadingClick?: (index: number) => void;
}

const MIN_WIDTH = 168;
const MAX_WIDTH = 360;
const DEFAULT_WIDTH = 200;

const LEVEL_LABELS = ['H1', 'H2', 'H3', 'H4'] as const;

export function Inspector({
  headings,
  open,
  onOpenChange,
  onHeadingClick,
}: InspectorProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(true);
  const collapsed = open === undefined ? internalCollapsed : !open;
  const setCollapsed = (value: boolean) => {
    if (onOpenChange) {
      onOpenChange(!value);
    } else {
      setInternalCollapsed(value);
    }
  };
  const onMouseDown = useWindowDrag();
  const { width, setWidth, resizing, onResizeStart } = useHorizontalResize({
    initialWidth: DEFAULT_WIDTH,
    minWidth: MIN_WIDTH,
    maxWidth: MAX_WIDTH,
    edge: 'left',
  });

  if (collapsed) {
    return (
      <div className="outline-panel outline-panel--collapsed">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="outline-collapse-btn"
          aria-label="展开大纲"
          title="展开大纲"
        >
          <IconPanelRight className="h-3.5 w-3.5" />
        </button>
        {headings.length > 0 ? (
          <div className="outline-collapsed-rail" aria-hidden="true">
            {headings.slice(0, 12).map((heading) => (
              <span
                key={heading.id}
                className={`outline-collapsed-dot outline-collapsed-dot--level-${heading.level}`}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <aside className="outline-panel" style={{ width }}>
      <div
        className={`outline-resize-handle ${resizing ? 'outline-resize-handle--active' : ''}`}
        onMouseDown={onResizeStart}
        onDoubleClick={() => setWidth(DEFAULT_WIDTH)}
        aria-hidden="true"
      />

      <header className="outline-header" data-tauri-drag-region onMouseDown={onMouseDown}>
        <div className="outline-header-title">
          <IconOutline className="h-3.5 w-3.5 shrink-0 opacity-60" />
          <span>大纲</span>
          {headings.length > 0 ? (
            <span className="outline-header-count">{headings.length}</span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="outline-collapse-btn [-webkit-app-region:no-drag]"
          aria-label="收起大纲"
          title="收起大纲"
        >
          <IconPanelRight className="h-3.5 w-3.5" />
        </button>
      </header>

      <nav className="outline-tree" aria-label="文档大纲">
        {headings.length === 0 ? (
          <div className="outline-empty">
            <div className="outline-empty-icon" aria-hidden="true">
              <IconOutline className="h-5 w-5" />
            </div>
            <p className="outline-empty-title">暂无标题</p>
            <p className="outline-empty-hint">使用 # 创建标题后，结构将显示在这里</p>
          </div>
        ) : (
          <ul className="outline-list">
            {headings.map((heading, index) => (
              <li key={heading.id} className={`outline-item-wrap outline-item-wrap--level-${heading.level}`}>
                <button
                  type="button"
                  className="outline-item"
                  onClick={() => onHeadingClick?.(index)}
                  title={heading.text}
                >
                  <span className="outline-item-marker" aria-hidden="true">
                    {LEVEL_LABELS[heading.level - 1] ?? `H${heading.level}`}
                  </span>
                  <span className="outline-item-text">{heading.text}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </aside>
  );
}

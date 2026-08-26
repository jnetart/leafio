import { useEffect, useMemo, useRef, useState } from 'react';
import { useHorizontalResize } from '../hooks/useHorizontalResize';
import { useWindowDrag } from '../hooks/useWindowDrag';
import {
  collapsedRailWindow,
  headingHasChildren,
  isOutlineHeadingHidden,
  visibleOutlineHeadingIndex,
  type HeadingItem,
} from '../lib/headings';
import { scrollChildIntoNearestView } from '../lib/scroll-into-view';
import { IconChevronDown, IconChevronRight, IconOutline, IconPanelRight } from './icons';

export type { HeadingItem };

interface InspectorProps {
  headings: HeadingItem[];
  open?: boolean;
  documentKey?: string;
  activeIndex?: number;
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
  documentKey,
  activeIndex = -1,
  onOpenChange,
  onHeadingClick,
}: InspectorProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(true);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set());
  const treeRef = useRef<HTMLElement>(null);
  const itemRefs = useRef(new Map<string, HTMLLIElement>());
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

  const documentKeyRef = useRef(documentKey);
  useEffect(() => {
    const switchedFile = documentKeyRef.current !== documentKey;
    documentKeyRef.current = documentKey;
    const liveIds = new Set(headings.map((heading) => heading.id));
    setCollapsedIds((prev) => {
      if (switchedFile) {
        return new Set();
      }
      let changed = false;
      const next = new Set<string>();
      for (const id of prev) {
        if (liveIds.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [documentKey, headings]);

  const visibleActiveIndex = useMemo(
    () => visibleOutlineHeadingIndex(headings, activeIndex, collapsedIds),
    [headings, activeIndex, collapsedIds],
  );
  const currentHeadingId = headings[visibleActiveIndex]?.id;

  useEffect(() => {
    if (collapsed || !currentHeadingId) {
      return;
    }
    const tree = treeRef.current;
    const item = itemRefs.current.get(currentHeadingId);
    if (tree && item) {
      scrollChildIntoNearestView(tree, item);
    }
  }, [collapsed, currentHeadingId, collapsedIds]);

  const toggleSubtree = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const canFold = useMemo(
    () => headings.some((_, index) => headingHasChildren(headings, index)),
    [headings],
  );

  if (collapsed) {
    const railWindow = collapsedRailWindow(headings.length, activeIndex);
    const railItems = headings.slice(railWindow.start, railWindow.end);

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
        {railItems.length > 0 ? (
          <div className="outline-collapsed-rail" aria-hidden="true">
            {railItems.map((heading, offset) => {
              const index = railWindow.start + offset;
              const current = index === activeIndex;
              return (
                <span
                  key={heading.id}
                  className={`outline-collapsed-dot outline-collapsed-dot--level-${heading.level}${
                    current ? ' outline-collapsed-dot--current' : ''
                  }`}
                />
              );
            })}
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

      <nav ref={treeRef} className="outline-tree" aria-label="文档大纲">
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
            {headings.map((heading, index) => {
              const hasChildren = headingHasChildren(headings, index);
              const subtreeCollapsed = collapsedIds.has(heading.id);
              const hidden = isOutlineHeadingHidden(headings, index, collapsedIds);
              const isCurrent = index === visibleActiveIndex;
              const isCurrentPath = isCurrent && index !== activeIndex;
              const wrapClass = [
                'outline-item-wrap',
                `outline-item-wrap--level-${heading.level}`,
                subtreeCollapsed ? 'outline-item-wrap--folded' : '',
                isCurrent ? 'outline-item-wrap--current' : '',
                isCurrentPath ? 'outline-item-wrap--current-path' : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <li
                  key={heading.id}
                  ref={(node) => {
                    if (node) {
                      itemRefs.current.set(heading.id, node);
                    } else {
                      itemRefs.current.delete(heading.id);
                    }
                  }}
                  hidden={hidden}
                  className={wrapClass}
                >
                  <div className="outline-item-row">
                    {canFold ? (
                      hasChildren ? (
                        <button
                          type="button"
                          className="outline-toggle"
                          aria-expanded={!subtreeCollapsed}
                          aria-label={subtreeCollapsed ? '展开子标题' : '折叠子标题'}
                          title={subtreeCollapsed ? '展开子标题' : '折叠子标题'}
                          onClick={() => toggleSubtree(heading.id)}
                        >
                          {subtreeCollapsed ? (
                            <IconChevronRight className="h-3 w-3" />
                          ) : (
                            <IconChevronDown className="h-3 w-3" />
                          )}
                        </button>
                      ) : (
                        <span className="outline-toggle outline-toggle--spacer" aria-hidden="true" />
                      )
                    ) : null}
                    <button
                      type="button"
                      className="outline-item"
                      aria-current={isCurrent ? 'location' : undefined}
                      onClick={() => onHeadingClick?.(index)}
                      title={heading.text}
                    >
                      <span className="outline-item-marker" aria-hidden="true">
                        {LEVEL_LABELS[heading.level - 1] ?? `H${heading.level}`}
                      </span>
                      <span className="outline-item-text">{heading.text}</span>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </nav>
    </aside>
  );
}

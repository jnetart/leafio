import { NodeViewWrapper } from '@tiptap/react';
import type { ReactNodeViewProps } from '@tiptap/react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { useMemo, useRef, useState } from 'react';
import { getImageBlockStorage } from '../editor/insertImage';
import { resolveImageSrc } from '../lib/image-assets';
import { openInFileManager } from '../lib/shell';
import { useI18n } from '../hooks/useI18n';
import { usePreferences } from '../hooks/usePreferences';
import { ImageLightbox } from './ImageLightbox';

const MIN_WIDTH = 80;
const CLICK_SLOP = 4;

function localDisplaySrc(absPath: string): string | null {
  try {
    return convertFileSrc(absPath);
  } catch {
    return null;
  }
}

export function ImageBlockView({ node, editor, selected, updateAttributes }: ReactNodeViewProps) {
  const src = String(node.attrs.src ?? '');
  const alt = String(node.attrs.alt ?? '');
  const width = node.attrs.width as number | null;
  const notePath = String(getImageBlockStorage(editor)?.notePath ?? '');
  const { language } = usePreferences();
  const { t } = useI18n(language);
  const [failed, setFailed] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const dragRef = useRef({ active: false, moved: false, startX: 0, startWidth: 0, edge: 'right' as 'left' | 'right' });

  const resolved = useMemo(() => resolveImageSrc(src, notePath), [src, notePath]);

  const href = useMemo(() => {
    if (resolved.kind === 'remote') {
      return resolved.href;
    }
    if (resolved.kind === 'local') {
      return localDisplaySrc(resolved.absPath);
    }
    return null;
  }, [resolved]);

  const widthStyle =
    typeof width === 'number' && width > 0
      ? { width: `${width}px`, maxWidth: '100%' as const }
      : { maxWidth: '100%' as const };

  const missing = failed || !href || resolved.kind === 'empty';
  const editable = editor.isEditable;
  const showChrome = selected && editable && !missing;

  const maxWidth = () => {
    const column = editor.view.dom.closest('.leafio-editor');
    return Math.max(MIN_WIDTH, column?.clientWidth ?? editor.view.dom.clientWidth);
  };

  const onResizePointerDown = (edge: 'left' | 'right') => (event: React.PointerEvent) => {
    if (!editable) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const img = (event.currentTarget.parentElement?.querySelector('img') ?? null) as HTMLImageElement | null;
    const startWidth = width && width > 0 ? width : (img?.getBoundingClientRect().width ?? MIN_WIDTH);
    dragRef.current = {
      active: true,
      moved: false,
      startX: event.clientX,
      startWidth,
      edge,
    };
    event.currentTarget.setPointerCapture(event.pointerId);

    const onMove = (moveEvent: PointerEvent) => {
      if (!dragRef.current.active) {
        return;
      }
      const delta = moveEvent.clientX - dragRef.current.startX;
      if (Math.abs(delta) > CLICK_SLOP) {
        dragRef.current.moved = true;
      }
      const signed = dragRef.current.edge === 'right' ? delta : -delta;
      const next = Math.round(
        Math.min(maxWidth(), Math.max(MIN_WIDTH, dragRef.current.startWidth + signed)),
      );
      updateAttributes({ width: next });
    };
    const onUp = () => {
      dragRef.current.active = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const clearWidth = () => updateAttributes({ width: null });

  return (
    <NodeViewWrapper className={`leafio-image-block${selected ? ' leafio-image-block--selected' : ''}`}>
      {missing ? (
        <div className="leafio-image-missing" contentEditable={false}>
          <div>{src || '—'}</div>
          <div>{t('image.missing')}</div>
          {resolved.kind === 'local' ? (
            <button
              type="button"
              className="leafio-image-reveal"
              onClick={() => void openInFileManager(resolved.absPath)}
            >
              {t('image.reveal')}
            </button>
          ) : null}
        </div>
      ) : (
        <div className="leafio-image-frame" style={widthStyle}>
          {showChrome ? (
            <button
              type="button"
              className="leafio-image-handle leafio-image-handle--left"
              aria-label={t('image.resetWidth')}
              onPointerDown={onResizePointerDown('left')}
              onDoubleClick={clearWidth}
            />
          ) : null}
          <img
            src={href}
            alt={alt}
            draggable={false}
            onError={() => setFailed(true)}
            onClick={() => {
              if (dragRef.current.moved) {
                dragRef.current.moved = false;
                return;
              }
              setLightbox(true);
            }}
          />
          {showChrome ? (
            <button
              type="button"
              className="leafio-image-handle leafio-image-handle--right"
              aria-label={t('image.resetWidth')}
              onPointerDown={onResizePointerDown('right')}
              onDoubleClick={clearWidth}
            />
          ) : null}
        </div>
      )}
      {showChrome ? (
        <div className="leafio-image-caption" contentEditable={false}>
          <input
            type="text"
            value={alt}
            placeholder={t('image.alt.placeholder')}
            onChange={(event) => updateAttributes({ alt: event.target.value })}
          />
          {width ? (
            <button type="button" onClick={clearWidth}>
              {t('image.resetWidth')}
            </button>
          ) : null}
        </div>
      ) : null}
      {lightbox && href ? <ImageLightbox src={href} alt={alt} onClose={() => setLightbox(false)} /> : null}
    </NodeViewWrapper>
  );
}

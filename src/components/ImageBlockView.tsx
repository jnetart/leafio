import { NodeViewWrapper } from '@tiptap/react';
import type { ReactNodeViewProps } from '@tiptap/react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { useMemo, useState } from 'react';
import { resolveImageSrc } from '../lib/image-assets';

function localDisplaySrc(absPath: string): string | null {
  try {
    return convertFileSrc(absPath);
  } catch {
    return null;
  }
}

export function ImageBlockView({ node, editor, selected }: ReactNodeViewProps) {
  const src = String(node.attrs.src ?? '');
  const alt = String(node.attrs.alt ?? '');
  const width = node.attrs.width as number | null;
  const notePath = String(editor.storage.imageBlock?.notePath ?? '');
  const [failed, setFailed] = useState(false);

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

  return (
    <NodeViewWrapper className={`leafio-image-block${selected ? ' leafio-image-block--selected' : ''}`}>
      {missing ? (
        <div className="leafio-image-missing">
          <div>{src || '（空）'}</div>
          <div>文件不存在</div>
        </div>
      ) : (
        <img
          src={href}
          alt={alt}
          style={widthStyle}
          draggable={false}
          onError={() => setFailed(true)}
        />
      )}
    </NodeViewWrapper>
  );
}

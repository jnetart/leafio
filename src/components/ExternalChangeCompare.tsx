import { useMemo } from 'react';
import { alignMarkdownDiff } from '../lib/line-diff';

interface ExternalChangeCompareProps {
  localContent: string;
  diskContent: string;
  localLabel: string;
  diskLabel: string;
}

export function ExternalChangeCompare({
  localContent,
  diskContent,
  localLabel,
  diskLabel,
}: ExternalChangeCompareProps) {
  const rows = useMemo(
    () => alignMarkdownDiff(localContent, diskContent),
    [localContent, diskContent],
  );

  return (
    <div className="revision-compare">
      <div className="revision-compare-head" aria-hidden="true">
        <div className="revision-compare-head-cell is-local">{localLabel}</div>
        <div className="revision-compare-head-cell is-disk">{diskLabel}</div>
      </div>
      <div className="revision-compare-body" role="table" aria-label={`${localLabel} / ${diskLabel}`}>
        {rows.map((row, index) => (
          <div className="revision-compare-row" role="row" key={`${row.kind}-${index}`}>
            <CompareCell
              side="local"
              kind={row.kind}
              lineNo={row.localNo}
              text={row.local}
            />
            <CompareCell
              side="disk"
              kind={row.kind}
              lineNo={row.diskNo}
              text={row.disk}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function CompareCell({
  side,
  kind,
  lineNo,
  text,
}: {
  side: 'local' | 'disk';
  kind: 'same' | 'local' | 'disk' | 'changed';
  lineNo: number | null;
  text: string | null;
}) {
  const filled = text !== null;
  const marked =
    filled &&
    (kind === 'changed' || kind === side);
  const className = [
    'revision-compare-cell',
    `is-${side}`,
    marked ? 'is-marked' : '',
    filled ? '' : 'is-empty',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className} role="cell">
      <span className="revision-compare-gutter">{lineNo ?? ''}</span>
      <span className="revision-compare-text">{text ?? ''}</span>
    </div>
  );
}

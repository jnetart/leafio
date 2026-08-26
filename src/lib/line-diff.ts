export type DiffKind = 'same' | 'local' | 'disk' | 'changed';

export interface DiffRow {
  kind: DiffKind;
  local: string | null;
  disk: string | null;
  localNo: number | null;
  diskNo: number | null;
}

const DP_CELL_LIMIT = 1_000_000;

export function splitLines(text: string): string[] {
  return text.split('\n');
}

export function countChangedRows(rows: DiffRow[]): number {
  return rows.reduce((count, row) => (row.kind === 'same' ? count : count + 1), 0);
}

export function alignMarkdownDiff(localText: string, diskText: string): DiffRow[] {
  const local = splitLines(localText);
  const disk = splitLines(diskText);
  const rows =
    local.length * disk.length > DP_CELL_LIMIT
      ? coarseAlign(local, disk)
      : lcsAlign(local, disk);
  return mergeChanged(rows);
}

function coarseAlign(local: string[], disk: string[]): DiffRow[] {
  const rows: DiffRow[] = [];
  const length = Math.max(local.length, disk.length);
  for (let index = 0; index < length; index += 1) {
    const localLine = index < local.length ? local[index] : null;
    const diskLine = index < disk.length ? disk[index] : null;
    const localNo = localLine === null ? null : index + 1;
    const diskNo = diskLine === null ? null : index + 1;
    if (localLine !== null && diskLine !== null && localLine === diskLine) {
      rows.push({ kind: 'same', local: localLine, disk: diskLine, localNo, diskNo });
    } else if (localLine !== null && diskLine !== null) {
      rows.push({ kind: 'changed', local: localLine, disk: diskLine, localNo, diskNo });
    } else if (localLine !== null) {
      rows.push({ kind: 'local', local: localLine, disk: null, localNo, diskNo: null });
    } else {
      rows.push({ kind: 'disk', local: null, disk: diskLine, localNo: null, diskNo });
    }
  }
  return rows;
}

function lcsAlign(local: string[], disk: string[]): DiffRow[] {
  const n = local.length;
  const m = disk.length;
  const dp: Uint32Array[] = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));

  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[i][j] =
        local[i] === disk[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const rows: DiffRow[] = [];
  let i = 0;
  let j = 0;
  let localNo = 1;
  let diskNo = 1;

  while (i < n && j < m) {
    if (local[i] === disk[j]) {
      rows.push({
        kind: 'same',
        local: local[i],
        disk: disk[j],
        localNo,
        diskNo,
      });
      i += 1;
      j += 1;
      localNo += 1;
      diskNo += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      rows.push({
        kind: 'local',
        local: local[i],
        disk: null,
        localNo,
        diskNo: null,
      });
      i += 1;
      localNo += 1;
    } else {
      rows.push({
        kind: 'disk',
        local: null,
        disk: disk[j],
        localNo: null,
        diskNo,
      });
      j += 1;
      diskNo += 1;
    }
  }

  while (i < n) {
    rows.push({
      kind: 'local',
      local: local[i],
      disk: null,
      localNo,
      diskNo: null,
    });
    i += 1;
    localNo += 1;
  }

  while (j < m) {
    rows.push({
      kind: 'disk',
      local: null,
      disk: disk[j],
      localNo: null,
      diskNo,
    });
    j += 1;
    diskNo += 1;
  }

  return rows;
}

function mergeChanged(rows: DiffRow[]): DiffRow[] {
  const merged: DiffRow[] = [];
  let index = 0;

  while (index < rows.length) {
    const row = rows[index];
    if (row.kind !== 'local') {
      merged.push(row);
      index += 1;
      continue;
    }

    const locals: DiffRow[] = [];
    while (index < rows.length && rows[index].kind === 'local') {
      locals.push(rows[index]);
      index += 1;
    }
    const disks: DiffRow[] = [];
    while (index < rows.length && rows[index].kind === 'disk') {
      disks.push(rows[index]);
      index += 1;
    }

    const paired = Math.min(locals.length, disks.length);
    for (let pairIndex = 0; pairIndex < paired; pairIndex += 1) {
      merged.push({
        kind: 'changed',
        local: locals[pairIndex].local,
        disk: disks[pairIndex].disk,
        localNo: locals[pairIndex].localNo,
        diskNo: disks[pairIndex].diskNo,
      });
    }
    merged.push(...locals.slice(paired), ...disks.slice(paired));
  }

  return merged;
}

import {
  assetsDirForNote,
  noteStem,
  rewriteAssetPrefix,
} from './image-assets';
import {
  copyDir,
  movePath,
  moveToTrash,
  pathExists,
  readFile,
  renameDirectory,
  writeFile,
} from './fs';

export function assetPair(notePath: string): { assetsDir: string; stem: string } {
  return {
    stem: noteStem(notePath),
    assetsDir: assetsDirForNote(notePath),
  };
}

async function rewriteNoteIfStemChanged(notePath: string, oldStem: string, newStem: string): Promise<void> {
  if (oldStem === newStem) {
    return;
  }
  const markdown = await readFile(notePath);
  const next = rewriteAssetPrefix(markdown, oldStem, newStem);
  if (next !== markdown) {
    await writeFile(notePath, next);
  }
}

export async function syncAssetsOnRename(oldPath: string, newPath: string): Promise<void> {
  const { assetsDir, stem: oldStem } = assetPair(oldPath);
  if (!(await pathExists(assetsDir))) {
    return;
  }
  const newStem = noteStem(newPath);
  await renameDirectory(assetsDir, `${newStem}.assets`);
  await rewriteNoteIfStemChanged(newPath, oldStem, newStem);
}

export async function syncAssetsOnCopy(oldPath: string, newPath: string): Promise<void> {
  const { assetsDir, stem: oldStem } = assetPair(oldPath);
  if (!(await pathExists(assetsDir))) {
    return;
  }
  await copyDir(assetsDir, assetsDirForNote(newPath));
  await rewriteNoteIfStemChanged(newPath, oldStem, noteStem(newPath));
}

export async function syncAssetsOnMove(oldPath: string, newPath: string): Promise<void> {
  const { assetsDir, stem: oldStem } = assetPair(oldPath);
  if (!(await pathExists(assetsDir))) {
    return;
  }
  await movePath(assetsDir, assetsDirForNote(newPath));
  await rewriteNoteIfStemChanged(newPath, oldStem, noteStem(newPath));
}

export async function syncAssetsOnDelete(notePath: string): Promise<void> {
  const { assetsDir } = assetPair(notePath);
  if (await pathExists(assetsDir)) {
    await moveToTrash(assetsDir);
  }
}

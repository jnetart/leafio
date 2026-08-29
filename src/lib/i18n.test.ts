import { describe, expect, it } from 'vitest';
import { createTranslator } from './i18n';

describe('duplicate vs copy labels', () => {
  it('does not use clipboard Copy wording for Duplicate', () => {
    const zh = createTranslator('zh-CN');
    const en = createTranslator('en');
    expect(zh('context.copy')).toBe('复制副本');
    expect(en('context.copy')).toBe('Duplicate');
    expect(zh('context.copy')).toBe(zh('menu.duplicate'));
    expect(en('context.copy')).toBe(en('menu.duplicate'));
    expect(zh('context.copy')).not.toBe(zh('menu.copy'));
    expect(en('context.copy')).not.toBe(en('menu.copy'));
  });
});

describe('OS file-manager labels', () => {
  it('uses Finder wording on macOS', () => {
    const zh = createTranslator('zh-CN', 'mac');
    const en = createTranslator('en', 'mac');
    expect(zh('context.openInFileManager')).toBe('在访达中显示');
    expect(en('context.openInFileManager')).toBe('Reveal in Finder');
    expect(zh('image.reveal')).toBe('在访达中显示');
    expect(en('image.reveal')).toBe('Reveal in Finder');
  });

  it('uses Open file location wording on Windows', () => {
    const zh = createTranslator('zh-CN', 'windows');
    const en = createTranslator('en', 'windows');
    expect(zh('context.openInFileManager')).toBe('打开文件位置');
    expect(en('context.openInFileManager')).toBe('Open file location');
    expect(zh('image.reveal')).toBe('打开文件位置');
    expect(en('image.reveal')).toBe('Open file location');
  });

  it('uses Open Containing Folder wording on Linux', () => {
    const zh = createTranslator('zh-CN', 'linux');
    const en = createTranslator('en', 'linux');
    expect(zh('context.openInFileManager')).toBe('打开所在的文件夹');
    expect(en('context.openInFileManager')).toBe('Open Containing Folder');
    expect(zh('image.reveal')).toBe('打开所在的文件夹');
    expect(en('image.reveal')).toBe('Open Containing Folder');
  });
});

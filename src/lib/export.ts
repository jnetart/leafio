import { writeFile } from './fs';

export async function exportFile(
  path: string,
  format: 'markdown' | 'html',
  content: string,
) {
  const target =
    format === 'markdown'
      ? path.replace(/\.(html|md)$/i, '.md')
      : path.replace(/\.md$/i, '.html');
  await writeFile(target, content);
}

export function documentToHtml(title: string, bodyHtml: string) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", sans-serif; font-size: 14px; max-width: 720px; margin: 2rem auto; line-height: 1.6; color: #1d1d1f; }
    h1, h2, h3, h4 { font-weight: 600; }
    pre { background: rgba(0,0,0,0.04); padding: 0.625rem 0.75rem; border-radius: 6px; overflow-x: auto; font-size: 13px; line-height: 1.5; }
    code { font-family: "SF Mono", "JetBrains Mono", ui-monospace, monospace; font-size: 13px; }
    :not(pre) > code { padding: 0.125rem 0.3rem; border-radius: 4px; background: rgba(0,0,0,0.06); }
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

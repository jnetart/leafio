<h1>
  <img src="docs/assets/img/logo.png" width="28" height="28" alt="" valign="middle">
  Leafio
</h1>

[English](README.md) · **中文**

在本地 Markdown 文件中自由写作。

打开任意文件夹，像写富文本一样写标题、列表、表格、代码。磁盘上留下的始终是标准 `.md`——没有库、没有账号、没有专有格式。

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/screenshots/editor-dark.png">
  <img src="docs/assets/screenshots/editor-light.png" alt="Leafio 主界面：左侧文件树，中间为正在编辑的 Markdown 文档" width="920">
</picture>

## 下载

macOS、Windows、Linux 安装包在 [Releases](https://github.com/jnetart/leafio/releases/latest)。

| 系统 | 安装包 |
| --- | --- |
| macOS 12+ | `.dmg` · Apple Silicon / Intel |
| Windows 10+ | 安装程序 · x64 / ARM64 |
| Linux | `.AppImage` · x64 / ARM64（Release 另有 `.deb` / `.rpm`） |

macOS 若提示无法打开，在访达里右键该应用，选择「打开」。

## 写作

输入 `/` 插入或转换块。选中文字会出现格式条。编辑、源码、预览随时切换。

工作区搜索文件名和正文，也可用 `tag:会议`、`path:notes` 收窄结果。图片写进笔记旁的本地目录，导出是标准 Markdown 或自包含 HTML。

更细的界面与快捷键见 [`docs/features`](docs/features/index.html) 与 [`docs/guide`](docs/guide/index.html)。

## 从源码运行

需要 **Node.js 22** 和稳定版 **Rust** 工具链。

```bash
npm install
npm run dev
```

只跑前端：`npm run dev:web`。测试：`npm test`。打包：`npm run build`。

桌面壳是 Tauri 2，编辑器是 TipTap。文件读写走本机文件系统，核心编辑不依赖网络。

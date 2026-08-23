interface ExportSheetProps {
  open: boolean;
  defaultPath: string;
  onClose: () => void;
  onExport: (format: 'markdown' | 'html', targetPath: string) => void;
}

export function ExportSheet({ open, defaultPath, onClose, onExport }: ExportSheetProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-20 flex items-start justify-center bg-black/20 pt-16">
      <form
        className="w-[360px] rounded-[10px] border border-[var(--separator)] bg-white/95 p-5 shadow-2xl backdrop-blur-xl"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const format = String(form.get('format')) as 'markdown' | 'html';
          const path = String(form.get('path'));
          onExport(format, path);
          onClose();
        }}
      >
        <h3 className="mb-4 text-[15px] font-semibold">导出文档</h3>

        <label className="mb-4 block text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
          格式
          <div className="mt-2 flex gap-2">
            <label className="rounded-full bg-[rgba(91,140,111,0.14)] px-3 py-1 text-xs font-medium text-[#3B6B4E]">
              <input type="radio" name="format" value="markdown" defaultChecked className="sr-only" />
              Markdown
            </label>
            <label className="rounded-full bg-black/5 px-3 py-1 text-xs">
              <input type="radio" name="format" value="html" className="sr-only" />
              HTML
            </label>
          </div>
        </label>

        <label className="mb-4 block text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
          保存位置
          <input
            name="path"
            defaultValue={defaultPath}
            className="mt-2 w-full rounded-md bg-black/5 px-3 py-2 text-[13px] text-[var(--text)]"
          />
        </label>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-black/5 px-4 py-2 text-[13px]"
          >
            取消
          </button>
          <button
            type="submit"
            className="rounded-md bg-leaf-accent px-4 py-2 text-[13px] font-medium text-white hover:bg-leaf-accent-hover"
          >
            导出
          </button>
        </div>
      </form>
    </div>
  );
}

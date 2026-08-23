export type IconProps = {
  className?: string;
};

export function IconPanelRight({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect
        x="2.5"
        y="2.5"
        width="11"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path d="M10.25 2.5v11" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function IconOutline({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3.5 4.5h9M3.5 8h6.5M3.5 11.5h8"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <circle cx="12.5" cy="8" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function IconPanelLeft({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect
        x="2.5"
        y="2.5"
        width="11"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path d="M5.75 2.5v11" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function IconSidebar({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2.5 3.5h11M2.5 8h11M2.5 12.5h11"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconPlus({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconSearch({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="4.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.2 10.2L13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function IconExport({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M9.5 2.5h3.5v3.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 9 12.5 3.5M12.5 3.5H9.5M12.5 3.5V6.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 6.5v6a1 1 0 0 0 1 1h7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconEdit({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M10.2 2.8l2.9 2.9-7.4 7.4H2.8v-3.1L10.2 2.8Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M8.8 4.2l2.9 2.9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function IconSource({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M5.5 5.5 3 8l2.5 2.5M10.5 5.5 13 8l-2.5 2.5M9 3.5 7 12.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconPreview({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M1.5 8s2.2-4 6.5-4 6.5 4 6.5 4-2.2 4-6.5 4-6.5-4-6.5-4Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function IconFile({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M4.5 2.5h4.6L12.5 5.9v7.6a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M8.5 2.5V6h3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Markdown file icon — Microsoft VS Code Codicons (CC BY 4.0).
 * @see https://github.com/microsoft/vscode-codicons
 */
export function IconMarkdownFile({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M6.345 5h2.1v6.533H6.993l.055-5.31-1.774 5.31H4.072l-1.805-5.31c.04.644.06 5.31.06 5.31H1V5h2.156s1.528 4.493 1.577 4.807L6.345 5zm6.71 3.617v-3.5H11.11v3.5H9.166l2.917 2.916L15 8.617h-1.945z" />
    </svg>
  );
}

type IconTreeFolderProps = IconProps & {
  open?: boolean;
};

/**
 * Folder icons — Microsoft VS Code Codicons (CC BY 4.0).
 * @see https://github.com/microsoft/vscode-codicons
 */
export function IconTreeFolder({ className = 'h-4 w-4', open = false }: IconTreeFolderProps) {
  if (open) {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M1.5 14h11l.48-.37 2.63-7-.48-.63H14V3.5l-.5-.5H7.71l-.86-.85L6.5 2h-5l-.5.5v11l.5.5zM2 3h4.29l.86.85.35.15H13v2H8.5l-.35.15-.86.85H3.5l-.47.34-1 3.08L2 3zm10.13 10H2.19l1.67-5H7.5l.35-.15.86-.85h5.79l-2.37 6z" />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M14.5 3H7.71l-.85-.85L6.51 2h-5l-.5.5v11l.5.5h13l.5-.5v-10L14.5 3zm-.51 8.49V13h-12V7h4.49l.35-.15.86-.86H14v1.5l-.01 4zm0-6.49h-6.5l-.35.15-.86.86H2v-3h4.29l.85.85.36.15H14l-.01.99z" />
    </svg>
  );
}

export function IconSettings({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M6.6 2.2h2.8l.4 1.6a3.6 3.6 0 0 1 1.4.8l1.6-.5 1.4 2.4-1.2 1.2c.05.25.08.5.08.8s-.03.55-.08.8l1.2 1.2-1.4 2.4-1.6-.5a3.6 3.6 0 0 1-1.4.8l-.4 1.6H6.6l-.4-1.6a3.6 3.6 0 0 1-1.4-.8l-1.6.5L1.8 10.1l1.2-1.2a3.4 3.4 0 0 1 0-1.6L1.8 5.9l1.4-2.4 1.6.5c.4-.35.88-.62 1.4-.8l.4-1.6Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="8" r="1.8" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function IconGeneral({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2.5" y="3" width="11" height="2.5" rx="0.8" stroke="currentColor" strokeWidth="1.2" />
      <rect x="2.5" y="6.75" width="11" height="2.5" rx="0.8" stroke="currentColor" strokeWidth="1.2" />
      <rect x="2.5" y="10.5" width="7" height="2.5" rx="0.8" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function IconAppearance({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconEditor({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M5.5 5.5 3 8l2.5 2.5M10.5 5.5 13 8l-2.5 2.5M9 3.5 7 12.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconBold({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M5.25 2.75h3.35c1.72 0 3.15 1.43 3.15 3.15 0 1.02-.5 1.93-1.27 2.5.95.55 1.52 1.58 1.52 2.72 0 1.72-1.43 3.15-3.15 3.15H5.25V2.75Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
      <path d="M7.25 6.75h1.1c.72 0 1.3-.58 1.3-1.3s-.58-1.3-1.3-1.3h-1.1v2.6Z" fill="currentColor" />
      <path d="M7.25 9.75h1.45c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5H7.25v3Z" fill="currentColor" />
    </svg>
  );
}

export function IconItalic({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M9.25 2.75h-4M6.75 13.25h4" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
      <path d="M7.25 2.75 6.25 13.25" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
    </svg>
  );
}

export function IconStrikethrough({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 8h8" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
      <path
        d="M6.2 4.8c.5-.7 1.2-1.05 2.3-1.05 1.55 0 2.5.85 2.5 2.05 0 .65-.25 1.15-.75 1.5M6.4 11.2c.55.75 1.35 1.1 2.6 1.1 1.45 0 2.5-.7 2.5-2.05"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconHighlight({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3.5 12.5h4.2l5.3-5.3a1.5 1.5 0 0 0-2.12-2.12L5.58 10.38 3.5 12.5Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path
        d="M9.25 4.25 11.75 6.75"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path
        d="M2.75 13.25h3.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

export function IconCode({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M5.5 5.5 3 8l2.5 2.5M10.5 5.5 13 8l-2.5 2.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconLink({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M6.2 9.8a2.2 2.2 0 0 0 3.1 0l1.5-1.5a2.2 2.2 0 1 0-3.1-3.1L6.7 5.7"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path
        d="M9.8 6.2a2.2 2.2 0 0 0-3.1 0L5.2 7.7a2.2 2.2 0 1 0 3.1 3.1l1.5-1.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconUnlink({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M6.2 9.8a2.2 2.2 0 0 0 3.1 0l1.5-1.5M9.8 6.2a2.2 2.2 0 0 0-3.1 0L5.2 7.7"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path d="M3 13 13 3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

export function IconHeading({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3.5 3.5v9M12.5 3.5v9" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
      <path d="M3.5 8h9" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
    </svg>
  );
}

export function IconQuote({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M4.5 5.5h2.5v3.5H3.8c0-1.2.5-2.2 1.4-2.9M10 5.5h2.5v3.5H9.3c0-1.2.5-2.2 1.4-2.9"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconBulletList({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="3.5" cy="4.5" r="1" fill="currentColor" />
      <circle cx="3.5" cy="8" r="1" fill="currentColor" />
      <circle cx="3.5" cy="11.5" r="1" fill="currentColor" />
      <path d="M6.5 4.5h6M6.5 8h6M6.5 11.5h5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

export function IconOrderedList({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2.8 4.1h1.1M2.8 8h1.4M2.8 11.9h1.1" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M6.5 4.5h6M6.5 8h6M6.5 11.5h5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

export function IconTaskList({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2.75" y="3.75" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path d="M3.8 6.1 4.7 6.9 6.2 5.4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.5 6h4.75" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <rect x="2.75" y="10.75" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8.5 13h4.25" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

export function IconTable({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2.5" y="3.5" width="11" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2.5 6.5h11M2.5 9.5h11M6.5 3.5v9M10.5 3.5v9" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}

export function IconCodeBlock({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2.5" y="3" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M5.5 6.5 4 8l1.5 1.5M10.5 6.5 12 8l-1.5 1.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconDivider({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2.5 8h11" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
    </svg>
  );
}

export function IconChevronDown({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="m4.5 6.5 3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconChevronRight({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="m6.5 4.5 3.5 3.5-3.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconLayers({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 2.5 13.25 5.25 8 8 2.75 5.25 8 2.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M2.75 7.25 8 10 13.25 7.25"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.75 9.75 8 12.5 13.25 9.75"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Workspace stack (IconLayers) with centered plus — matches tree layers icon + add affordance */
export function IconAddWorkspace({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 2.5 13.25 5.25 8 8 2.75 5.25 8 2.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M2.75 7.25 8 10 13.25 7.25"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8 11.25v2.75M6.25 13h3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function IconLeaf({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <g transform="translate(0 -0.5) rotate(-24 8 8)">
        <path
          d="M8 2.25C5.25 2.25 3.5 5.25 4 8c.45 2.5 2.25 4.75 4 5.5 1.75-.75 3.55-3 4-5.5.5-2.75-1.25-5.75-4-5.75Z"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinejoin="round"
        />
        <path d="M8 3.75V11.25" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M8 6l2.25 1.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
        <path d="M8 8.25L5.5 9.25" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
        <path
          d="M8 11.25 6.85 13.75"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

export function IconFolder({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2.5 5.5h3.2l1.3 1.5h6.5a1 1 0 0 1 1 1v4.5a1 1 0 0 1-1 1h-10a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconExportNav({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M9.5 2.5h3.5v3.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 9 12.5 3.5M3.5 6.5v6a1 1 0 0 0 1 1h7"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

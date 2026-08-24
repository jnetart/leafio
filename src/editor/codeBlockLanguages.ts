export interface CodeBlockLanguage {
  id: string | null;
  label: string;
  keywords?: string;
}

/** Popular languages first, then the rest — ids match common Markdown fence labels. */
export const CODE_BLOCK_LANGUAGES: CodeBlockLanguage[] = [
  { id: null, label: 'Plain text', keywords: 'text plain none auto' },
  { id: 'javascript', label: 'JavaScript', keywords: 'js node' },
  { id: 'typescript', label: 'TypeScript', keywords: 'ts' },
  { id: 'python', label: 'Python', keywords: 'py' },
  { id: 'rust', label: 'Rust', keywords: 'rs' },
  { id: 'go', label: 'Go', keywords: 'golang' },
  { id: 'java', label: 'Java' },
  { id: 'css', label: 'CSS' },
  { id: 'html', label: 'HTML', keywords: 'xml markup' },
  { id: 'json', label: 'JSON' },
  { id: 'yaml', label: 'YAML', keywords: 'yml' },
  { id: 'bash', label: 'Bash', keywords: 'sh shell zsh' },
  { id: 'sql', label: 'SQL' },
  { id: 'markdown', label: 'Markdown', keywords: 'md' },
  { id: 'cpp', label: 'C++', keywords: 'c++ cxx' },
  { id: 'c', label: 'C' },
  { id: 'csharp', label: 'C#', keywords: 'cs dotnet' },
  { id: 'ruby', label: 'Ruby', keywords: 'rb' },
  { id: 'swift', label: 'Swift' },
  { id: 'kotlin', label: 'Kotlin', keywords: 'kt' },
  { id: 'php', label: 'PHP' },
  { id: 'r', label: 'R' },
  { id: 'lua', label: 'Lua' },
  { id: 'wasm', label: 'WebAssembly', keywords: 'wat' },
  { id: 'graphql', label: 'GraphQL', keywords: 'gql' },
  { id: 'scss', label: 'SCSS', keywords: 'sass' },
  { id: 'less', label: 'Less' },
  { id: 'diff', label: 'Diff', keywords: 'patch' },
  { id: 'ini', label: 'INI', keywords: 'toml conf config' },
  { id: 'makefile', label: 'Makefile', keywords: 'make mk' },
  { id: 'perl', label: 'Perl', keywords: 'pl' },
  { id: 'objectivec', label: 'Objective-C', keywords: 'objc' },
  { id: 'arduino', label: 'Arduino' },
  { id: 'vbnet', label: 'Visual Basic', keywords: 'vb vbnet' },
];

export function resolveCodeBlockLanguageId(language: string | null | undefined): string | null {
  if (!language) {
    return null;
  }
  const normalized = language.toLowerCase();
  const direct = CODE_BLOCK_LANGUAGES.find(({ id }) => id?.toLowerCase() === normalized);
  if (direct?.id) {
    return direct.id;
  }
  const byKeyword = CODE_BLOCK_LANGUAGES.find(({ keywords }) =>
    keywords?.split(/\s+/).some((keyword) => keyword === normalized),
  );
  return byKeyword?.id ?? language;
}

export function getCodeBlockLanguageLabel(language: string | null | undefined): string {
  if (!language) {
    return CODE_BLOCK_LANGUAGES[0].label;
  }
  const resolved = resolveCodeBlockLanguageId(language);
  const match = CODE_BLOCK_LANGUAGES.find(({ id }) => id === resolved);
  return match?.label ?? language;
}

export function isSameCodeBlockLanguage(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  return resolveCodeBlockLanguageId(a) === resolveCodeBlockLanguageId(b);
}

export function filterCodeBlockLanguages(query: string): CodeBlockLanguage[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return CODE_BLOCK_LANGUAGES;
  }
  return CODE_BLOCK_LANGUAGES.filter(({ id, label, keywords }) => {
    const haystack = [id, label, keywords].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(trimmed);
  });
}

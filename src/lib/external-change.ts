export type ExternalChangeAction = 'ignore' | 'sync' | 'reload' | 'prompt';

export function classifyExternalChange(input: {
  diskContent: string;
  baseline: string;
  editorContent: string;
  dirty: boolean;
}): ExternalChangeAction {
  if (input.diskContent === input.baseline) {
    return 'ignore';
  }
  if (input.diskContent === input.editorContent) {
    return 'sync';
  }
  if (!input.dirty) {
    return 'reload';
  }
  return 'prompt';
}

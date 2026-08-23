export const LEAFIO_MENU_EDIT_EVENT = 'leafio-menu-edit';

export type LeafioMenuEditAction =
  | 'undo'
  | 'redo'
  | 'cut'
  | 'copy'
  | 'paste'
  | 'select-all';

export function dispatchMenuEditAction(action: LeafioMenuEditAction) {
  window.dispatchEvent(new CustomEvent(LEAFIO_MENU_EDIT_EVENT, { detail: { action } }));
}

export function isTextEditingSurfaceFocused(): boolean {
  const active = document.activeElement;
  if (!active) {
    return false;
  }
  return Boolean(active.closest('.leafio-editor, .source-editor'));
}

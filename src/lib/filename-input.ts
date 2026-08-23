import type { InputHTMLAttributes, MouseEvent } from 'react';

/** Props that disable OS text substitutions for filename / folder name fields. */
export const filenameInputProps: Pick<
  InputHTMLAttributes<HTMLInputElement>,
  'autoCapitalize' | 'autoCorrect' | 'spellCheck' | 'autoComplete'
> = {
  autoCapitalize: 'off',
  autoCorrect: 'off',
  spellCheck: false,
  autoComplete: 'off',
};

export function preventContextMenuSelection(event: MouseEvent): void {
  if (event.button === 2) {
    event.preventDefault();
  }
}

export function clearTextSelection(): void {
  window.getSelection()?.removeAllRanges();
}

export function attachLightboxDismiss(target: EventTarget, onClose: () => void): () => void {
  const onKeyDown = (event: Event) => {
    if ((event as KeyboardEvent).key !== 'Escape') {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    onClose();
  };

  const onPointerDown = (event: Event) => {
    if ((event as PointerEvent).button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    onClose();
  };

  target.addEventListener('keydown', onKeyDown, true);
  target.addEventListener('pointerdown', onPointerDown, true);
  return () => {
    target.removeEventListener('keydown', onKeyDown, true);
    target.removeEventListener('pointerdown', onPointerDown, true);
  };
}

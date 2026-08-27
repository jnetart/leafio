import { describe, expect, it, vi } from 'vitest';
import { attachLightboxDismiss } from '../src/lib/image-lightbox';

function dispatch(
  target: EventTarget,
  type: string,
  extra: Record<string, unknown>,
): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, extra);
  target.dispatchEvent(event);
  return event;
}

describe('attachLightboxDismiss', () => {
  it('closes on Escape and consumes the key event', () => {
    const target = new EventTarget();
    const onClose = vi.fn();
    const detach = attachLightboxDismiss(target, onClose);

    const event = new Event('keydown', { bubbles: true, cancelable: true });
    Object.assign(event, { key: 'Escape' });
    const stop = vi.spyOn(event, 'stopPropagation');
    target.dispatchEvent(event);

    expect(onClose).toHaveBeenCalledOnce();
    expect(event.defaultPrevented).toBe(true);
    expect(stop).toHaveBeenCalledOnce();
    detach();
  });

  it('closes on primary pointerdown and consumes the pointer event', () => {
    const target = new EventTarget();
    const onClose = vi.fn();
    const detach = attachLightboxDismiss(target, onClose);

    const event = new Event('pointerdown', { bubbles: true, cancelable: true });
    Object.assign(event, { button: 0 });
    const stop = vi.spyOn(event, 'stopPropagation');
    target.dispatchEvent(event);

    expect(onClose).toHaveBeenCalledOnce();
    expect(event.defaultPrevented).toBe(true);
    expect(stop).toHaveBeenCalledOnce();
    detach();
  });

  it('ignores non-dismiss keys and non-primary buttons', () => {
    const target = new EventTarget();
    const onClose = vi.fn();
    const detach = attachLightboxDismiss(target, onClose);

    dispatch(target, 'keydown', { key: 'Enter' });
    dispatch(target, 'pointerdown', { button: 2 });

    expect(onClose).not.toHaveBeenCalled();
    detach();
  });
});

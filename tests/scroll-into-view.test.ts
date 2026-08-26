import { describe, expect, it } from 'vitest';
import { scrollChildIntoNearestView, verticalScrollDelta } from '../src/lib/scroll-into-view';

describe('verticalScrollDelta', () => {
  const container = { top: 100, bottom: 300 };

  it('returns 0 when the item is fully visible', () => {
    expect(verticalScrollDelta(container, { top: 140, bottom: 180 })).toBe(0);
  });

  it('scrolls down when the item sits below the visible area', () => {
    expect(verticalScrollDelta(container, { top: 280, bottom: 320 })).toBe(20);
  });

  it('scrolls up when the item sits above the visible area', () => {
    expect(verticalScrollDelta(container, { top: 60, bottom: 100 })).toBe(-40);
  });
});

describe('scrollChildIntoNearestView', () => {
  it('moves only the menu scroller by the computed delta', () => {
    const container = {
      getBoundingClientRect: () => ({ top: 100, bottom: 300 }),
      scrollTop: 40,
    } as HTMLElement;
    const item = {
      getBoundingClientRect: () => ({ top: 280, bottom: 320 }),
    } as HTMLElement;

    scrollChildIntoNearestView(container, item);

    expect(container.scrollTop).toBe(60);
  });
});

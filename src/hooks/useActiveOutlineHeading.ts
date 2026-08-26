import { useCallback, useEffect, useRef, useState } from 'react';
import {
  headingIndexAtReadingLine,
  OUTLINE_HEADING_SELECTOR,
  type HeadingItem,
} from '../lib/headings';
import type { ViewMode } from '../lib/view-mode';

const READING_LINE_OFFSET = 28;
const PIN_MS = 700;

function collectHeadingTops(container: HTMLElement): number[] {
  return Array.from(container.querySelectorAll(OUTLINE_HEADING_SELECTOR), (node) =>
    node.getBoundingClientRect().top,
  );
}

export function useActiveOutlineHeading(
  headings: HeadingItem[],
  view: ViewMode,
  documentKey = '',
) {
  const [activeIndex, setActiveIndexState] = useState(-1);
  const pinUntilRef = useRef(0);
  const frameRef = useRef(0);
  const headingCountRef = useRef(headings.length);
  headingCountRef.current = headings.length;

  const setActiveIndex = useCallback((index: number) => {
    pinUntilRef.current = performance.now() + PIN_MS;
    setActiveIndexState(index);
  }, []);

  useEffect(() => {
    pinUntilRef.current = 0;
    setActiveIndexState(headingCountRef.current === 0 ? -1 : 0);
  }, [documentKey]);

  useEffect(() => {
    setActiveIndexState((current) => {
      if (headings.length === 0) {
        return -1;
      }
      if (current < 0) {
        return 0;
      }
      if (current >= headings.length) {
        return headings.length - 1;
      }
      return current;
    });
  }, [headings.length]);

  useEffect(() => {
    if (view === 'source' || headings.length === 0) {
      return;
    }

    const update = () => {
      if (performance.now() < pinUntilRef.current) {
        return;
      }
      const container = document.querySelector('.editor-scroll');
      if (!(container instanceof HTMLElement)) {
        return;
      }
      const tops = collectHeadingTops(container);
      if (tops.length === 0) {
        return;
      }
      const readingY = container.getBoundingClientRect().top + READING_LINE_OFFSET;
      const next = headingIndexAtReadingLine(tops, readingY);
      setActiveIndexState((current) => (current === next ? current : next));
    };

    const schedule = () => {
      if (frameRef.current) {
        return;
      }
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = 0;
        update();
      });
    };

    const container = document.querySelector('.editor-scroll');
    container?.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    const observer = new MutationObserver(schedule);
    if (container) {
      observer.observe(container, { childList: true, subtree: true, characterData: true });
    }

    schedule();

    return () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = 0;
      }
      container?.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      observer.disconnect();
    };
  }, [headings, view]);

  return { activeIndex, setActiveIndex };
}

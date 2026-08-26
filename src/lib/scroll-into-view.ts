interface VerticalBox {
  top: number;
  bottom: number;
}

export function verticalScrollDelta(container: VerticalBox, item: VerticalBox): number {
  if (item.bottom > container.bottom) {
    return item.bottom - container.bottom;
  }
  if (item.top < container.top) {
    return item.top - container.top;
  }
  return 0;
}

export function scrollChildIntoNearestView(container: HTMLElement, item: HTMLElement): void {
  const delta = verticalScrollDelta(container.getBoundingClientRect(), item.getBoundingClientRect());
  if (delta !== 0) {
    container.scrollTop += delta;
  }
}

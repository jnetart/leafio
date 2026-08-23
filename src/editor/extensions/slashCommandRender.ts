import { ReactRenderer } from '@tiptap/react';
import type { SuggestionProps } from '@tiptap/suggestion';
import {
  SlashCommandList,
  type SlashCommandListHandle,
  type SlashCommandListProps,
} from '../../components/SlashCommandList';
import type { EditorBlockAction } from '../blockActions';

type SlashSuggestionProps = SuggestionProps<EditorBlockAction, EditorBlockAction>;

function getSuggestionRect(props: SlashSuggestionProps): DOMRect {
  const decorated = props.clientRect?.();
  if (decorated) {
    return decorated;
  }

  const { view } = props.editor;
  const coords = view.coordsAtPos(props.range.from);
  const width = Math.max(1, coords.right - coords.left);
  const height = Math.max(1, coords.bottom - coords.top);
  return new DOMRect(coords.left, coords.top, width, height);
}

function positionContainer(container: HTMLElement, props: SlashSuggestionProps) {
  const rect = getSuggestionRect(props);
  const maxLeft = Math.max(8, window.innerWidth - container.offsetWidth - 8);
  const maxTop = Math.max(8, window.innerHeight - container.offsetHeight - 8);
  container.style.left = `${Math.min(rect.left, maxLeft)}px`;
  container.style.top = `${Math.min(rect.bottom + 8, maxTop)}px`;
}

function buildListProps(props: SlashSuggestionProps): SlashCommandListProps {
  return {
    editor: props.editor,
    query: props.query,
    command: (item: EditorBlockAction) => props.command(item),
  };
}

export function createSlashCommandRender() {
  return () => {
    let component: ReactRenderer<SlashCommandListHandle, SlashCommandListProps> | null = null;
    let container: HTMLDivElement | null = null;

    const mount = (props: SlashSuggestionProps) => {
      if (!container) {
        container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.zIndex = '10000';
        document.body.appendChild(container);
      }

      if (!component) {
        component = new ReactRenderer(SlashCommandList, {
          props: buildListProps(props),
          editor: props.editor,
        });
        container.appendChild(component.element);
      } else {
        component.updateProps(buildListProps(props));
      }

      window.requestAnimationFrame(() => {
        if (container) {
          positionContainer(container, props);
        }
      });
    };

    return {
      onStart: mount,

      onUpdate: mount,

      onKeyDown: (props: { event: KeyboardEvent }) => {
        if (props.event.key === 'Escape') {
          return true;
        }
        return component?.ref?.onKeyDown(props.event) ?? false;
      },

      onExit: () => {
        component?.destroy();
        container?.remove();
        component = null;
        container = null;
      },
    };
  };
}

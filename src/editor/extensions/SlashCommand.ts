import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { filterBlockActions, type EditorBlockAction } from '../blockActions';
import { createSlashCommandRender } from './slashCommandRender';

export type SlashItem = EditorBlockAction;

export const SlashCommandExtension = Extension.create({
  name: 'slashCommand',

  addProseMirrorPlugins() {
    return [
      Suggestion<EditorBlockAction, EditorBlockAction>({
        editor: this.editor,
        char: '/',
        allowSpaces: false,
        allowedPrefixes: null,
        startOfLine: false,
        items: ({ query }) => filterBlockActions(query),
        render: createSlashCommandRender(),
        command: ({ editor, range, props }) => {
          props.run(editor, range);
        },
      }),
    ];
  },
});

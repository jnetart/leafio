import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';

const backgroundColorAttribute = {
  backgroundColor: {
    default: null as string | null,
    parseHTML: (element: HTMLElement) => element.style.backgroundColor || null,
    renderHTML: (attributes: { backgroundColor?: string | null }) => {
      if (!attributes.backgroundColor) {
        return {};
      }
      return { style: `background-color: ${attributes.backgroundColor}` };
    },
  },
};

export const TableCellWithBackground = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      ...backgroundColorAttribute,
    };
  },
});

export const TableHeaderWithBackground = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      ...backgroundColorAttribute,
    };
  },
});

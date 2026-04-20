import { EditorState } from '@codemirror/state';
import { DecorationSet } from '@codemirror/view';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { Table } from '@lezer/markdown';
import { buildBlockDecorationsForTest } from './block-widgets';
import { DlBlockWidget } from './dl-block-widget';
import type { BlockRenderService } from '../services/block-render.service';

/**
 * The ViewPlugin integrates with a running EditorView, but the decoration
 * builder is also exported directly (`buildBlockDecorationsForTest`) so these
 * tests can assert the emission logic without spinning up a full view.
 */

function stubBlockRender(): BlockRenderService {
  return {
    mount: async () => {},
    unmount: () => {},
  } as unknown as BlockRenderService;
}

function mkState(doc: string, cursor: number): EditorState {
  return EditorState.create({
    doc,
    selection: { anchor: cursor },
    extensions: [markdown({ base: markdownLanguage, extensions: [Table] })],
  });
}

interface WidgetInfo { from: number; to: number; source: string; }

function widgetInfos(decos: DecorationSet): WidgetInfo[] {
  const out: WidgetInfo[] = [];
  decos.between(0, Number.MAX_SAFE_INTEGER, (from, to, d) => {
    const w = (d.spec as { widget?: unknown }).widget;
    if (w instanceof DlBlockWidget) {
      out.push({ from, to, source: w.source });
    }
  });
  return out;
}

describe('blockWidgets decoration builder', () => {
  let blockRender: BlockRenderService;

  beforeEach(() => {
    blockRender = stubBlockRender();
  });

  describe('fenced code', () => {
    const doc = 'before\n\n```ts\nconst x = 1;\n```\n\nafter\n';

    it('emits a widget when the caret is outside the block', () => {
      const state = mkState(doc, 0);
      const infos = widgetInfos(buildBlockDecorationsForTest(state, blockRender));
      expect(infos.length).toBe(1);
      expect(infos[0].source).toContain('```ts');
      expect(infos[0].source).toContain('const x = 1;');
    });

    it('omits the widget when the caret is inside the block', () => {
      const cursor = doc.indexOf('const');
      const state = mkState(doc, cursor);
      const infos = widgetInfos(buildBlockDecorationsForTest(state, blockRender));
      expect(infos.length).toBe(0);
    });

    it('omits the widget when the caret sits on the opening fence line', () => {
      const cursor = doc.indexOf('```ts') + 2;
      const state = mkState(doc, cursor);
      const infos = widgetInfos(buildBlockDecorationsForTest(state, blockRender));
      expect(infos.length).toBe(0);
    });
  });

  describe('GFM tables', () => {
    const doc = 'intro\n\n| a | b |\n| - | - |\n| 1 | 2 |\n\nafter';

    it('emits a widget for a table when the caret is outside', () => {
      const state = mkState(doc, 0);
      const infos = widgetInfos(buildBlockDecorationsForTest(state, blockRender));
      expect(infos.length).toBe(1);
      expect(infos[0].source).toContain('| a | b |');
    });

    it('omits the widget when the caret is inside the table', () => {
      const cursor = doc.indexOf('| 1');
      const state = mkState(doc, cursor);
      const infos = widgetInfos(buildBlockDecorationsForTest(state, blockRender));
      expect(infos.length).toBe(0);
    });
  });

  describe('block images', () => {
    it('emits a widget for an image-only paragraph', () => {
      const doc = 'paragraph\n\n![alt](image.png)\n\nmore';
      const state = mkState(doc, 0);
      const infos = widgetInfos(buildBlockDecorationsForTest(state, blockRender));
      expect(infos.length).toBe(1);
      expect(infos[0].source).toBe('![alt](image.png)');
    });

    it('does not emit a widget for an inline image in prose', () => {
      const doc = 'see ![pic](p.png) right here';
      const state = mkState(doc, 0);
      const infos = widgetInfos(buildBlockDecorationsForTest(state, blockRender));
      expect(infos.length).toBe(0);
    });
  });

  describe('math blocks (skipped per spec §2.2)', () => {
    it('emits no widget for $$…$$ block source', () => {
      const doc = '$$\nx^2 + y^2 = z^2\n$$';
      const state = mkState(doc, 0);
      const infos = widgetInfos(buildBlockDecorationsForTest(state, blockRender));
      expect(infos.length).toBe(0);
    });
  });

  describe('multiple blocks', () => {
    it('emits one widget per block in document order', () => {
      const doc = '```\none\n```\n\n```\ntwo\n```\n';
      // Put the cursor on the blank separator line so it's outside both blocks.
      const cursor = doc.indexOf('\n\n') + 1;
      const state = mkState(doc, cursor);
      const infos = widgetInfos(buildBlockDecorationsForTest(state, blockRender));
      expect(infos.length).toBe(2);
      expect(infos[0].from).toBeLessThan(infos[1].from);
      expect(infos[0].source).toContain('one');
      expect(infos[1].source).toContain('two');
    });

    it('reveals only the block containing the caret', () => {
      const doc = '```\none\n```\n\n```\ntwo\n```\n';
      const cursor = doc.indexOf('two');
      const state = mkState(doc, cursor);
      const infos = widgetInfos(buildBlockDecorationsForTest(state, blockRender));
      expect(infos.length).toBe(1);
      expect(infos[0].source).toContain('one');
    });
  });

  describe('viewport range scoping', () => {
    it('builds decorations only within the provided range', () => {
      const doc = '```\nfirst\n```\n\nprose\n\n```\nsecond\n```';
      // Put the cursor on the "prose" line so neither block is revealed.
      const cursor = doc.indexOf('prose');
      const state = mkState(doc, cursor);
      // Range covers only the first block.
      const rangeTo = doc.indexOf('prose');
      const infos = widgetInfos(
        buildBlockDecorationsForTest(state, blockRender, { from: 0, to: rangeTo }),
      );
      expect(infos.length).toBe(1);
      expect(infos[0].source).toContain('first');
    });
  });
});

import { EditorState, Extension, Range, StateField } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import type { SyntaxNode, SyntaxNodeRef } from '@lezer/common';
import { DlBlockWidget } from './dl-block-widget';
import { BlockRenderService } from '../services/block-render.service';

/**
 * Phase 4 — block-widget StateField.
 *
 * Walks `syntaxTree(state)` and emits `Decoration.replace({ widget, block: true })`
 * for each `FencedCode`, `Table`, and block-level `Image` whose range does not
 * contain the caret's line.
 *
 * Has to live in a StateField (not a ViewPlugin): CodeMirror forbids block-level
 * Replace decorations in view plugins. See the "Block decorations may not be
 * specified via plugins" runtime error.
 *
 * Math blocks (`$$…$$`) are not a native Lezer node in the default markdown
 * parser, so they're naturally skipped here; raw source stays visible in
 * edit mode per §2.2 of editor-design.md.
 */

/**
 * Caret "inside" a block is line-granular: the caret is inside iff its line
 * falls within the block's line range. This avoids the Phase 3 inline
 * convention where position==from counts as inside — for blocks that would
 * collapse the widget the moment the caret sits anywhere on the opening line
 * from outside, producing a flicker on simple cursor-home presses.
 */
function caretOnBlockLine(state: EditorState, from: number, to: number): boolean {
  const caret = state.selection.main.head;
  const blockFromLine = state.doc.lineAt(from).number;
  const blockToLine = state.doc.lineAt(to).number;
  const caretLine = state.doc.lineAt(caret).number;
  return caretLine >= blockFromLine && caretLine <= blockToLine;
}

/**
 * True when a `Paragraph` node is a single-image block (possibly with
 * whitespace-only siblings). Block images are rendered as widgets so they
 * sit in the flow the same way they do in view mode.
 */
function isBlockImageParagraph(paragraph: SyntaxNode, state: EditorState): boolean {
  let sawImage = false;
  for (let c = paragraph.firstChild; c; c = c.nextSibling) {
    if (c.name === 'Image') {
      sawImage = true;
      continue;
    }
    const slice = state.doc.sliceString(c.from, c.to);
    if (slice.trim().length > 0) { return false; }
  }
  return sawImage;
}

function pushBlock(
  widgets: Range<Decoration>[],
  state: EditorState,
  rawFrom: number,
  rawTo: number,
  blockRender: BlockRenderService,
): void {
  if (caretOnBlockLine(state, rawFrom, rawTo)) { return; }
  // `Decoration.replace({ block: true })` requires ranges aligned to line
  // boundaries. Lezer's FencedCode/Table ranges are already aligned in
  // practice, but clamp defensively so a parser quirk can't produce a throw.
  const fromLine = state.doc.lineAt(rawFrom).from;
  const toLine = state.doc.lineAt(rawTo).to;
  if (toLine <= fromLine) { return; }
  const source = state.doc.sliceString(fromLine, toLine);
  const widget = new DlBlockWidget(source, blockRender);
  widgets.push(Decoration.replace({ widget, block: true }).range(fromLine, toLine));
}

function buildBlockDecorations(
  state: EditorState,
  ranges: readonly { from: number; to: number }[],
  blockRender: BlockRenderService,
): DecorationSet {
  const widgets: Range<Decoration>[] = [];
  const tree = syntaxTree(state);

  for (const r of ranges) {
    tree.iterate({
      from: r.from,
      to: r.to,
      enter: (ref: SyntaxNodeRef): boolean | void => {
        switch (ref.name) {
          case 'FencedCode':
          case 'Table': {
            pushBlock(widgets, state, ref.from, ref.to, blockRender);
            return false;
          }
          case 'Paragraph': {
            if (isBlockImageParagraph(ref.node, state)) {
              pushBlock(widgets, state, ref.from, ref.to, blockRender);
            }
            return false;
          }
          default:
            return undefined;
        }
      },
    });
  }

  return Decoration.set(widgets, true);
}

/**
 * Factory returning the block-widget StateField as a CodeMirror extension.
 * The service is closed over so the field can create `DlBlockWidget`s that
 * share the same mount lifecycle owner.
 */
export function blockWidgets(blockRender: BlockRenderService): Extension {
  const field = StateField.define<DecorationSet>({
    create: (state) =>
      buildBlockDecorations(state, [{ from: 0, to: state.doc.length }], blockRender),
    update: (deco, tr) => {
      if (tr.docChanged || tr.selection) {
        return buildBlockDecorations(
          tr.state,
          [{ from: 0, to: tr.state.doc.length }],
          blockRender,
        );
      }
      return deco;
    },
    provide: (f) => [
      EditorView.decorations.from(f),
      // Contribute to atomicRanges so arrow keys step over a widget's entire
      // hidden body instead of landing inside the replaced range. The Phase 3
      // inline field contributes separately; CM6 unions the facet values.
      EditorView.atomicRanges.of((view) => view.state.field(f)),
    ],
  });
  return field;
}

/** Exposed for tests: build the decoration set over an explicit range without a View. */
export function buildBlockDecorationsForTest(
  state: EditorState,
  blockRender: BlockRenderService,
  range: { from: number; to: number } = { from: 0, to: state.doc.length },
): DecorationSet {
  return buildBlockDecorations(state, [range], blockRender);
}

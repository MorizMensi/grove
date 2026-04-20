import {
  EditorState,
  Extension,
  Range,
  StateField,
} from '@codemirror/state';
import { Decoration, DecorationSet, EditorView } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import type { SyntaxNode, SyntaxNodeRef } from '@lezer/common';

/**
 * Phase 3 — Typora-style inline reveal decorations.
 *
 * Walks the lezer-markdown syntax tree once per state and produces three kinds
 * of decorations:
 *
 * - `mark`  → class applied to the full inline span so it picks up DocLang CSS
 *             tokens (`cm-em`, `cm-strong`, `cm-inline-code`, `cm-link`).
 * - `hide`  → `Decoration.replace` over syntax markers (`*`, `_`, `` ` ``, `[`,
 *             `]`, `(url)`, leading `#`). Emitted only when the caret sits
 *             outside the enclosing syntax node.
 * - `line`  → `Decoration.line` adding `cm-heading cm-heading-N` to the line
 *             containing an ATX heading so the editor's font sizing mirrors
 *             the view-mode `h1..h6` visual treatment.
 *
 * Block widgets (fenced code, tables, Mermaid, images) are deferred to Phase 4.
 * Math blocks (`$$…$$`) intentionally stay raw in v1 — see §2.2 of the spec.
 */

type Kind = 'mark' | 'hide' | 'line';

function tagged(kind: Kind, cls: string): { __kind: Kind; class: string } {
  return { __kind: kind, class: cls };
}

function makeMark(from: number, to: number, cls: string): Range<Decoration> {
  if (from >= to) {
    throw new Error(`invalid mark range [${from}, ${to})`);
  }
  return Decoration.mark(tagged('mark', cls)).range(from, to);
}

function makeHide(from: number, to: number, cls: string): Range<Decoration> {
  if (from >= to) {
    throw new Error(`invalid hide range [${from}, ${to})`);
  }
  return Decoration.replace(tagged('hide', cls)).range(from, to);
}

function makeLine(lineFrom: number, cls: string): Range<Decoration> {
  return Decoration.line(tagged('line', cls)).range(lineFrom);
}

/** True when the caret (primary selection head) falls inside [node.from, node.to]. */
function caretInside(caret: number, nodeFrom: number, nodeTo: number): boolean {
  return caret >= nodeFrom && caret <= nodeTo;
}

/** Iterate direct children of a node without allocating an array. */
function forEachChild(parent: SyntaxNode, fn: (child: SyntaxNode) => void): void {
  for (let c = parent.firstChild; c; c = c.nextSibling) {
    fn(c);
  }
}

function heading(level: number): string {
  return `cm-heading cm-heading-${level}`;
}

function hashSwallowSpace(state: EditorState, markFrom: number, markTo: number): [number, number] {
  // Swallow one trailing space after '#' so the heading text aligns to the
  // line gutter instead of shifting right when the caret leaves the line.
  const next = markTo < state.doc.length ? state.doc.sliceString(markTo, markTo + 1) : '';
  return [markFrom, next === ' ' ? markTo + 1 : markTo];
}

function buildDecorations(state: EditorState): DecorationSet {
  const caret = state.selection.main.head;
  const ranges: Range<Decoration>[] = [];
  const tree = syntaxTree(state);

  tree.iterate({
    enter: (ref: SyntaxNodeRef) => {
      const name = ref.name;
      const from = ref.from;
      const to = ref.to;

      switch (name) {
        case 'Emphasis': {
          if (to > from) ranges.push(makeMark(from, to, 'cm-em'));
          if (!caretInside(caret, from, to)) {
            forEachChild(ref.node, (child) => {
              if (child.name === 'EmphasisMark') {
                ranges.push(makeHide(child.from, child.to, 'cm-hide-marker'));
              }
            });
          }
          return;
        }

        case 'StrongEmphasis': {
          if (to > from) ranges.push(makeMark(from, to, 'cm-strong'));
          if (!caretInside(caret, from, to)) {
            forEachChild(ref.node, (child) => {
              if (child.name === 'EmphasisMark') {
                ranges.push(makeHide(child.from, child.to, 'cm-hide-marker'));
              }
            });
          }
          return;
        }

        case 'InlineCode': {
          if (to > from) ranges.push(makeMark(from, to, 'cm-inline-code'));
          if (!caretInside(caret, from, to)) {
            forEachChild(ref.node, (child) => {
              if (child.name === 'CodeMark') {
                ranges.push(makeHide(child.from, child.to, 'cm-hide-marker'));
              }
            });
          }
          return;
        }

        case 'Link': {
          // Link children: LinkMark('['), <label text>, LinkMark(']'), LinkMark('('), URL, LinkMark(')')
          // (For reference-style links the tail differs but the opening ']' still delimits the label.)
          // Lezer re-materialises SyntaxNode objects on each traversal, so we
          // identify the opening vs closing bracket by position order, not by
          // reference equality.
          let openBracket: SyntaxNode | null = null;
          let closeBracket: SyntaxNode | null = null;
          forEachChild(ref.node, (child) => {
            if (child.name !== 'LinkMark') return;
            if (!openBracket) {
              openBracket = child;
            } else if (!closeBracket) {
              closeBracket = child;
            }
          });
          if (!openBracket || !closeBracket) return;
          const ob: SyntaxNode = openBracket;
          const cb: SyntaxNode = closeBracket;

          const labelStart = ob.to;
          const labelEnd = cb.from;
          if (labelEnd > labelStart) {
            ranges.push(makeMark(labelStart, labelEnd, 'cm-link'));
          }
          if (!caretInside(caret, from, to)) {
            // Hide '[' (openBracket) and everything from ']' onwards.
            if (ob.to > ob.from) {
              ranges.push(makeHide(ob.from, ob.to, 'cm-hide-marker'));
            }
            if (to > cb.from) {
              ranges.push(makeHide(cb.from, to, 'cm-hide-marker'));
            }
          }
          return;
        }

        case 'ATXHeading1':
        case 'ATXHeading2':
        case 'ATXHeading3':
        case 'ATXHeading4':
        case 'ATXHeading5':
        case 'ATXHeading6': {
          const level = Number(name.slice(-1));
          const line = state.doc.lineAt(from);
          ranges.push(makeLine(line.from, heading(level)));
          if (!caretInside(caret, line.from, line.to)) {
            forEachChild(ref.node, (child) => {
              if (child.name === 'HeaderMark') {
                const [hFrom, hTo] = hashSwallowSpace(state, child.from, child.to);
                if (hTo > hFrom) {
                  ranges.push(makeHide(hFrom, hTo, 'cm-hide-marker'));
                }
              }
            });
          }
          return;
        }

        default:
          return;
      }
    },
  });

  // `Decoration.set(ranges, sort)` sorts by `from` and then by side, which is
  // exactly the invariant CM6's RangeSet requires. We collect unsorted here
  // because the tree-walk visits strong/em in outer-then-inner order that
  // doesn't always match position order (link marks come after link text).
  return Decoration.set(ranges, true);
}

/**
 * StateField exposing the decoration set so extensions (and tests) can read it.
 * Rebuilds on doc changes and selection changes, which is exactly the Typora
 * reveal trigger: move the caret into a span → markers appear.
 */
export const hybridMarkdownDecorations = StateField.define<DecorationSet>({
  create: (state) => buildDecorations(state),
  update: (deco, tr) => {
    if (tr.docChanged || tr.selection) {
      return buildDecorations(tr.state);
    }
    return deco;
  },
  provide: (field) => [
    EditorView.decorations.from(field),
    // Make hidden markers atomic so arrow keys step over them instead of into
    // the gap, matching Obsidian Live Preview's behaviour.
    EditorView.atomicRanges.of((view) => view.state.field(field)),
  ],
});

/** Factory so callers can write `hybridMarkdown()` for symmetry with other CM6 extensions. */
export function hybridMarkdown(): Extension {
  return [hybridMarkdownDecorations];
}

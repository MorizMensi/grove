import { EditorState } from '@codemirror/state';
import { Decoration, EditorView } from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';
import { hybridMarkdown, hybridMarkdownDecorations } from './hybrid-markdown';

/**
 * Snapshot-style helper: given a doc and a cursor position, build a state with
 * the hybrid-markdown field installed and return a normalised list of decoration
 * spans. Replace ranges (hidden syntax) surface as kind='hide'; mark ranges
 * (styling) as kind='mark'; line decorations as kind='line'.
 */
type Span = {
  from: number;
  to: number;
  kind: 'hide' | 'mark' | 'line';
  cls: string;
  text: string;
};

function snapshot(doc: string, cursor: number): Span[] {
  const state = EditorState.create({
    doc,
    selection: { anchor: cursor },
    extensions: [markdown(), hybridMarkdown()],
  });
  const decos = state.field(hybridMarkdownDecorations);
  const out: Span[] = [];
  decos.between(0, doc.length, (from, to, deco) => {
    const spec = deco.spec as { class?: string; __kind?: 'mark' | 'hide' | 'line' };
    // Distinguish hide vs mark: Decoration.replace produces `point === false` and
    // its internal type is 'replace'. We tag via `__kind` in the spec when we
    // build each decoration so tests can assert without reaching into CM internals.
    const kind = spec.__kind ?? 'mark';
    out.push({
      from,
      to,
      kind,
      cls: spec.class ?? '',
      text: doc.slice(from, to),
    });
  });
  return out;
}

function hiddenRanges(doc: string, cursor: number): Array<[number, number, string]> {
  return snapshot(doc, cursor)
    .filter((s) => s.kind === 'hide')
    .map((s) => [s.from, s.to, s.text] as [number, number, string]);
}

function markClasses(doc: string, cursor: number): string[] {
  return snapshot(doc, cursor)
    .filter((s) => s.kind === 'mark')
    .map((s) => s.cls)
    .sort();
}

function lineClasses(doc: string, cursor: number): string[] {
  return snapshot(doc, cursor)
    .filter((s) => s.kind === 'line')
    .map((s) => s.cls)
    .sort();
}

describe('hybridMarkdown state field', () => {
  describe('emphasis (italic)', () => {
    const doc = 'a *em* b';
    // positions:    0 1 2 3 4 5 6 7
    // the Emphasis node covers [2, 6); two EmphasisMark nodes at [2,3) and [5,6).

    it('marks the emphasis span with cm-em', () => {
      expect(markClasses(doc, 0)).toContain('cm-em');
    });

    it('hides both * markers when the caret is outside', () => {
      const hidden = hiddenRanges(doc, 0);
      expect(hidden).toEqual([
        [2, 3, '*'],
        [5, 6, '*'],
      ]);
    });

    it('reveals the markers when the caret is inside the emphasis', () => {
      // caret between e and m (position 4)
      expect(hiddenRanges(doc, 4)).toEqual([]);
    });

    it('reveals the markers when the caret touches the edge (inclusive)', () => {
      // caret at position 3, directly after the opening *
      expect(hiddenRanges(doc, 3)).toEqual([]);
    });
  });

  describe('strong', () => {
    const doc = 'a **bold** b';
    // positions:      2 3 4 5 6 7 8 9
    // StrongEmphasis covers [2, 10); EmphasisMark at [2,4) and [8,10).

    it('marks the strong span with cm-strong', () => {
      expect(markClasses(doc, 0)).toContain('cm-strong');
    });

    it('hides both ** markers when the caret is outside', () => {
      expect(hiddenRanges(doc, 0)).toEqual([
        [2, 4, '**'],
        [8, 10, '**'],
      ]);
    });

    it('reveals the markers when the caret is inside', () => {
      expect(hiddenRanges(doc, 6)).toEqual([]);
    });
  });

  describe('inline code', () => {
    const doc = 'see `x + 1` here';
    // InlineCode covers [4, 11); CodeMark at [4,5) and [10,11).

    it('marks the code span with cm-inline-code', () => {
      expect(markClasses(doc, 0)).toContain('cm-inline-code');
    });

    it('hides both backticks when the caret is outside', () => {
      expect(hiddenRanges(doc, 0)).toEqual([
        [4, 5, '`'],
        [10, 11, '`'],
      ]);
    });

    it('reveals the backticks when the caret is inside', () => {
      expect(hiddenRanges(doc, 7)).toEqual([]);
    });
  });

  describe('links', () => {
    const doc = 'see [docs](https://example.com) for more';
    // Link covers [4, 31). '[' at 4, label 'docs' [5, 9), ']' at 9, '(' at 10, URL [10, 30), ')' at 30.

    it('marks the link label with cm-link', () => {
      const cls = markClasses(doc, 0);
      expect(cls).toContain('cm-link');
    });

    it('hides [, ], and the entire ](url) section when the caret is outside', () => {
      const hidden = hiddenRanges(doc, 0);
      expect(hidden.length).toBe(2);
      expect(hidden[0]).toEqual([4, 5, '[']);
      expect(hidden[1]).toEqual([9, 31, '](https://example.com)']);
    });

    it('reveals the link syntax when the caret is inside', () => {
      // caret on 'd' of docs (position 6)
      expect(hiddenRanges(doc, 6)).toEqual([]);
    });
  });

  describe('ATX headings', () => {
    it('applies cm-heading-1 line class to a H1 line', () => {
      const doc = '# Title\n\nbody';
      // caret on the body line
      expect(lineClasses(doc, 10)).toContain('cm-heading cm-heading-1');
    });

    it('applies cm-heading-3 line class to a H3 line', () => {
      const doc = '### Three\n';
      expect(lineClasses(doc, 0)).toContain('cm-heading cm-heading-3');
    });

    it('hides the leading # marks when the caret is not on the heading line', () => {
      const doc = '## Two\nbody';
      // cursor on the body line (position 8)
      const hidden = hiddenRanges(doc, 8);
      // '##' marker is [0,2), and we also swallow the following space → hide is [0,3).
      expect(hidden).toEqual([[0, 3, '## ']]);
    });

    it('reveals the # marks when the caret is on the heading line', () => {
      const doc = '## Two\nbody';
      expect(hiddenRanges(doc, 3)).toEqual([]);
    });

    it('handles all six heading levels', () => {
      for (let level = 1; level <= 6; level += 1) {
        const hashes = '#'.repeat(level);
        const doc = `${hashes} h${level}\nbody`;
        const body = doc.length - 2;
        expect(lineClasses(doc, body))
          .withContext(`level ${level}`)
          .toContain(`cm-heading cm-heading-${level}`);
      }
    });
  });

  describe('nested and multi-decoration documents', () => {
    it('emits decorations for all inline kinds in one pass', () => {
      const doc = '## Title with *em*, **bold**, and `code`\n\nbody';
      const snap = snapshot(doc, doc.length - 1);
      const classes = new Set(snap.filter((s) => s.kind === 'mark').map((s) => s.cls));
      expect(classes.has('cm-em')).toBe(true);
      expect(classes.has('cm-strong')).toBe(true);
      expect(classes.has('cm-inline-code')).toBe(true);
    });

    it('the field survives document edits (reports decorations after a change)', () => {
      const state = EditorState.create({
        doc: 'plain',
        extensions: [markdown(), hybridMarkdown()],
      });
      const next = state.update({
        changes: { from: 0, to: 5, insert: 'a **bold** z' },
        // Pin the cursor outside the StrongEmphasis range so the markers
        // are expected to be hidden after the update.
        selection: { anchor: 0 },
      }).state;
      const decos = next.field(hybridMarkdownDecorations);
      let hideCount = 0;
      decos.between(0, next.doc.length, (_f, _t, d) => {
        if ((d.spec as { __kind?: string }).__kind === 'hide') hideCount += 1;
      });
      expect(hideCount).toBe(2);
    });
  });

  describe('EditorView integration', () => {
    it('mounts as an extension and produces a DecorationSet for the view', () => {
      const host = document.createElement('div');
      document.body.appendChild(host);
      try {
        const view = new EditorView({
          state: EditorState.create({
            doc: '# H\n\n*em*',
            extensions: [markdown(), hybridMarkdown()],
          }),
          parent: host,
        });
        try {
          // Sanity check: the CM content DOM exists and the field is in state.
          expect(view.dom.querySelector('.cm-content')).toBeTruthy();
          const field = view.state.field(hybridMarkdownDecorations);
          expect(field).toBeTruthy();
        } finally {
          view.destroy();
        }
      } finally {
        host.remove();
      }
    });
  });

  /**
   * Only `hide` (replace) decorations should contribute to EditorView.atomicRanges —
   * mark decorations (styling) covering the whole inline span must NOT be atomic,
   * or the caret cannot be placed inside bold/italic/code/link text and Backspace
   * would delete the entire span instead of one character.
   */
  describe('atomic ranges (caret placement inside formatted spans)', () => {
    function atomicRangesFor(doc: string, cursor: number): Array<[number, number]> {
      const host = document.createElement('div');
      document.body.appendChild(host);
      try {
        const view = new EditorView({
          state: EditorState.create({
            doc,
            selection: { anchor: cursor },
            extensions: [markdown(), hybridMarkdown()],
          }),
          parent: host,
        });
        try {
          const builders = view.state.facet(EditorView.atomicRanges);
          const ranges: Array<[number, number]> = [];
          for (const build of builders) {
            const set = build(view);
            set.between(0, doc.length, (from, to) => {
              ranges.push([from, to]);
            });
          }
          return ranges.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
        } finally {
          view.destroy();
        }
      } finally {
        host.remove();
      }
    }

    it('strong: only the ** markers are atomic, not the whole span', () => {
      // Caret outside → ** markers are hidden. Only those two ranges must be atomic.
      // The StrongEmphasis mark range [2,10) must NOT be in the set, otherwise
      // clicking inside "bold" snaps to the edge and Backspace deletes everything.
      expect(atomicRangesFor('a **bold** b', 0)).toEqual([
        [2, 4],
        [8, 10],
      ]);
    });

    it('emphasis: only the * markers are atomic', () => {
      expect(atomicRangesFor('a *em* b', 0)).toEqual([
        [2, 3],
        [5, 6],
      ]);
    });

    it('inline code: only the backticks are atomic', () => {
      expect(atomicRangesFor('see `x + 1` here', 0)).toEqual([
        [4, 5],
        [10, 11],
      ]);
    });

    it('link: only [ and ](url) are atomic, not the label or whole span', () => {
      expect(atomicRangesFor('see [docs](https://example.com) for more', 0)).toEqual([
        [4, 5],
        [9, 31],
      ]);
    });

    it('caret inside the span: no atomic ranges exist (mark decorations are not atomic)', () => {
      // With caret at 6 (inside **bold**), hide decorations are not emitted.
      // Mark decorations must not leak into atomicRanges, so the facet must be empty.
      expect(atomicRangesFor('a **bold** b', 6)).toEqual([]);
    });

    it('heading line class does not contribute to atomic ranges', () => {
      // '## Two\nbody' with caret on body line: only the '## ' hide range is atomic.
      // The cm-heading line decoration must not be atomic.
      expect(atomicRangesFor('## Two\nbody', 8)).toEqual([[0, 3]]);
    });
  });
});

// Ensure Decoration symbol is referenced so the test file type-checks even if
// the import gets tree-shaken by the compiler in some environments.
void Decoration;

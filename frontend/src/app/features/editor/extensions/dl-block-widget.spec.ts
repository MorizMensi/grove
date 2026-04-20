import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { DlBlockWidget } from './dl-block-widget';
import type { BlockRenderService } from '../services/block-render.service';

/**
 * Lightweight fake used to decouple the widget tests from Angular DI. The
 * widget only needs the `mount`/`unmount` surface of `BlockRenderService`.
 */
class FakeBlockRender {
  readonly mounted: Array<{ host: HTMLElement; source: string }> = [];
  readonly unmounted: HTMLElement[] = [];

  async mount(host: HTMLElement, source: string): Promise<void> {
    this.mounted.push({ host, source });
  }

  unmount(host: HTMLElement): void {
    this.unmounted.push(host);
  }
}

function asService(f: FakeBlockRender): BlockRenderService {
  return f as unknown as BlockRenderService;
}

describe('DlBlockWidget', () => {
  let fake: FakeBlockRender;

  beforeEach(() => {
    fake = new FakeBlockRender();
  });

  it('eq() returns true for widgets with the same source (ignores position)', () => {
    const a = new DlBlockWidget('```ts\nx\n```', asService(fake));
    const b = new DlBlockWidget('```ts\nx\n```', asService(fake));
    expect(a.eq(b)).toBeTrue();
  });

  it('eq() returns false for widgets with different sources', () => {
    const a = new DlBlockWidget('```ts\nx\n```', asService(fake));
    const b = new DlBlockWidget('```ts\ny\n```', asService(fake));
    expect(a.eq(b)).toBeFalse();
  });

  it('toDOM returns an HTMLElement and delegates rendering to mount', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    try {
      const view = new EditorView({
        state: EditorState.create({ doc: 'plain' }),
        parent: host,
      });
      try {
        const widget = new DlBlockWidget('src-string', asService(fake));
        const dom = widget.toDOM(view);
        expect(dom).toBeInstanceOf(HTMLElement);
        expect(fake.mounted.length).toBe(1);
        expect(fake.mounted[0].source).toBe('src-string');
      } finally {
        view.destroy();
      }
    } finally {
      host.remove();
    }
  });

  it('destroy() delegates cleanup to BlockRenderService.unmount', () => {
    const widget = new DlBlockWidget('x', asService(fake));
    const dom = document.createElement('div');
    widget.destroy(dom);
    expect(fake.unmounted).toEqual([dom]);
  });

  it('mousedown preventDefaults and dispatches cursor to the widget position', () => {
    const parent = document.createElement('div');
    document.body.appendChild(parent);
    try {
      const view = new EditorView({
        state: EditorState.create({ doc: '```ts\ncode\n```\n' }),
        parent,
      });
      try {
        const widget = new DlBlockWidget('```ts\ncode\n```', asService(fake));
        const dom = widget.toDOM(view);

        const dispatched: unknown[] = [];
        spyOn(view, 'dispatch').and.callFake((spec: unknown) => { dispatched.push(spec); });
        spyOn(view, 'posAtDOM').and.returnValue(3);

        const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
        const prev = spyOn(event, 'preventDefault').and.callThrough();
        dom.dispatchEvent(event);

        expect(prev).toHaveBeenCalled();
        expect(dispatched.length).toBe(1);
        // `EditorSelection.cursor(pos)` produces a SelectionRange whose
        // `head` and `anchor` both equal `pos`. CM6 accepts a bare range as
        // the `selection` value on a transaction spec.
        const spec = dispatched[0] as { selection?: { head: number } };
        expect(spec.selection?.head).toBe(3);
      } finally {
        view.destroy();
      }
    } finally {
      parent.remove();
    }
  });

  it('estimatedHeight exposes a non-zero layout estimate', () => {
    const widget = new DlBlockWidget('x', asService(fake));
    expect(widget.estimatedHeight).toBeGreaterThan(0);
  });
});

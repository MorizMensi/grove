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

  /**
   * mousedown handler contract: the widget replaces a multi-line source range
   * with a short rendered DOM. Clicks in the top half of the host reveal the
   * widget (caret at source start); clicks in the bottom half hop past the
   * widget entirely so the user can keep typing on the first post-widget line.
   * This matches CM6's own `posAtCoords` top/bottom shortcut for non-Text
   * blocks (`view/dist/index.js:3787-3788`).
   */
  function fakeRect(top: number, height: number): DOMRect {
    return {
      top, left: 0, right: 100, bottom: top + height,
      width: 100, height, x: 0, y: top,
      toJSON() { return {}; },
    } as DOMRect;
  }

  it('mousedown in the top half places the caret at the widget source start', () => {
    const parent = document.createElement('div');
    document.body.appendChild(parent);
    try {
      const view = new EditorView({
        state: EditorState.create({ doc: '```ts\ncode\n```\nafter' }),
        parent,
      });
      try {
        const widget = new DlBlockWidget('```ts\ncode\n```', asService(fake));
        const dom = widget.toDOM(view);

        const dispatched: unknown[] = [];
        spyOn(view, 'dispatch').and.callFake((spec: unknown) => { dispatched.push(spec); });
        // widget.from for offset 0
        spyOn(view, 'posAtDOM').and.returnValue(0);
        spyOn(dom, 'getBoundingClientRect').and.returnValue(fakeRect(100, 100));

        const event = new MouseEvent('mousedown', {
          bubbles: true, cancelable: true, clientY: 120, // top half
        });
        const prev = spyOn(event, 'preventDefault').and.callThrough();
        dom.dispatchEvent(event);

        expect(prev).toHaveBeenCalled();
        expect(dispatched.length).toBe(1);
        const spec = dispatched[0] as { selection?: { head: number } };
        expect(spec.selection?.head).toBe(0);
      } finally {
        view.destroy();
      }
    } finally {
      parent.remove();
    }
  });

  it('mousedown in the bottom half places the caret past the widget end', () => {
    const parent = document.createElement('div');
    document.body.appendChild(parent);
    try {
      // doc: "```ts\ncode\n```\nafter" — widget source is positions 0..14
      // (14 chars). `posAtDOM(host, 1)` is widget.to = 14 (the \n after ```).
      // Bottom-half click should land the caret at 15 (first char of "after").
      const view = new EditorView({
        state: EditorState.create({ doc: '```ts\ncode\n```\nafter' }),
        parent,
      });
      try {
        const widget = new DlBlockWidget('```ts\ncode\n```', asService(fake));
        const dom = widget.toDOM(view);

        const dispatched: unknown[] = [];
        spyOn(view, 'dispatch').and.callFake((spec: unknown) => { dispatched.push(spec); });
        // widget.to for offset 1
        spyOn(view, 'posAtDOM').and.returnValue(14);
        spyOn(dom, 'getBoundingClientRect').and.returnValue(fakeRect(100, 100));

        const event = new MouseEvent('mousedown', {
          bubbles: true, cancelable: true, clientY: 180, // bottom half
        });
        dom.dispatchEvent(event);

        expect(dispatched.length).toBe(1);
        const spec = dispatched[0] as { selection?: { head: number } };
        expect(spec.selection?.head).toBe(15);
      } finally {
        view.destroy();
      }
    } finally {
      parent.remove();
    }
  });

  it('bottom-half mousedown clamps to doc.length when the widget is the tail of the document', () => {
    const parent = document.createElement('div');
    document.body.appendChild(parent);
    try {
      // No trailing content: widget.to == doc.length; must not dispatch past EOF.
      const view = new EditorView({
        state: EditorState.create({ doc: '```ts\ncode\n```' }),
        parent,
      });
      try {
        const widget = new DlBlockWidget('```ts\ncode\n```', asService(fake));
        const dom = widget.toDOM(view);

        const dispatched: unknown[] = [];
        spyOn(view, 'dispatch').and.callFake((spec: unknown) => { dispatched.push(spec); });
        const docLen = view.state.doc.length;
        spyOn(view, 'posAtDOM').and.returnValue(docLen); // widget.to == doc.length
        spyOn(dom, 'getBoundingClientRect').and.returnValue(fakeRect(0, 40));

        dom.dispatchEvent(new MouseEvent('mousedown', {
          bubbles: true, cancelable: true, clientY: 35,
        }));

        const spec = dispatched[0] as { selection?: { head: number } };
        expect(spec.selection?.head).toBe(docLen);
      } finally {
        view.destroy();
      }
    } finally {
      parent.remove();
    }
  });

  it('installs a ResizeObserver that requests a CM6 measurement on host resize', () => {
    // CM6 itself uses ResizeObserver internally, so we can't count instances —
    // we find *our* observer by the DOM element it watches.
    const instances: TestResizeObserver[] = [];
    class TestResizeObserver {
      callback: ResizeObserverCallback;
      observed: Element[] = [];
      disconnected = false;
      constructor(cb: ResizeObserverCallback) {
        this.callback = cb;
        instances.push(this);
      }
      observe(el: Element) { this.observed.push(el); }
      disconnect() { this.disconnected = true; }
      unobserve() {}
    }
    const originalRO = window.ResizeObserver;
    (window as unknown as { ResizeObserver: unknown }).ResizeObserver = TestResizeObserver;
    try {
      const parent = document.createElement('div');
      document.body.appendChild(parent);
      try {
        const view = new EditorView({
          state: EditorState.create({ doc: '```ts\nx\n```' }),
          parent,
        });
        try {
          const widget = new DlBlockWidget('```ts\nx\n```', asService(fake));
          const dom = widget.toDOM(view);
          const requestMeasure = spyOn(view, 'requestMeasure').and.callThrough();

          // Find the observer attached to our widget's host DOM (as opposed
          // to CM6's own internal ResizeObserver on the scroller element).
          const widgetRo = instances.find((ro) => ro.observed.includes(dom));
          expect(widgetRo).withContext('widget should install its own ResizeObserver').toBeTruthy();

          // Simulate the widget DOM resizing (e.g., Mermaid async render
          // swapping the placeholder for an SVG).
          widgetRo!.callback([], widgetRo as unknown as ResizeObserver);
          expect(requestMeasure).toHaveBeenCalled();

          // Destroying the widget disconnects its observer so it doesn't leak.
          widget.destroy(dom);
          expect(widgetRo!.disconnected).toBeTrue();
        } finally {
          view.destroy();
        }
      } finally {
        parent.remove();
      }
    } finally {
      (window as unknown as { ResizeObserver: unknown }).ResizeObserver = originalRO;
    }
  });

  it('estimatedHeight exposes a non-zero layout estimate', () => {
    const widget = new DlBlockWidget('x', asService(fake));
    expect(widget.estimatedHeight).toBeGreaterThan(0);
  });
});

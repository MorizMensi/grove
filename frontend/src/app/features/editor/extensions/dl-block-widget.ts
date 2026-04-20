import { EditorSelection } from '@codemirror/state';
import { EditorView, WidgetType } from '@codemirror/view';
import { BlockRenderService } from '../services/block-render.service';

/**
 * Phase 4 — block widget that replaces a block-level source range (fenced
 * code, table, block image) with its DocLang rendering.
 *
 * Design notes (from plan review):
 * - `eq()` compares `source` only, not any captured position. A keystroke
 *   before this widget shifts its `from`, but its DOM doesn't need to
 *   rebuild — CM6 reuses the existing DOM when `eq` returns true.
 * - Click-to-caret reads the live position via `view.posAtDOM(host)` instead
 *   of carrying a stale `from` inside the widget.
 * - `destroy(dom)` hands cleanup to `BlockRenderService.unmount` which aborts
 *   any in-flight async render, detaches the view, and destroys the
 *   ComponentRef. Safe if `mount` never completed.
 */
export class DlBlockWidget extends WidgetType {
  constructor(
    readonly source: string,
    private readonly blockRender: BlockRenderService,
  ) {
    super();
  }

  override eq(other: WidgetType): boolean {
    return other instanceof DlBlockWidget && other.source === this.source;
  }

  toDOM(view: EditorView): HTMLElement {
    const host = document.createElement('div');
    host.addEventListener('mousedown', (event) => {
      // Prevent CM6's default mousedown handler from placing the selection
      // inside the hidden range (atomicRanges would then bounce it unpredictably).
      event.preventDefault();
      const pos = view.posAtDOM(host);
      view.dispatch({ selection: EditorSelection.cursor(pos) });
      view.focus();
    });
    // Async: kick off render but don't await — toDOM must return synchronously.
    void this.blockRender.mount(host, this.source);
    return host;
  }

  override destroy(dom: HTMLElement): void {
    this.blockRender.unmount(dom);
  }

  override ignoreEvent(): boolean {
    // Let events propagate normally; our mousedown handler already
    // preventDefaults what matters.
    return false;
  }

  override get estimatedHeight(): number {
    // Conservative estimate so scroll math is stable while the async render
    // settles. Overridden once the real DOM measures.
    return 48;
  }
}

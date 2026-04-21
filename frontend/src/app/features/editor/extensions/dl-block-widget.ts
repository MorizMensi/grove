import { EditorSelection } from '@codemirror/state';
import { EditorView, WidgetType } from '@codemirror/view';
import { BlockRenderService } from '../services/block-render.service';

/**
 * Block widget that replaces a block-level source range (fenced code,
 * table, block image) with its DocLang rendering.
 *
 * Design notes (from plan review):
 * - `eq()` compares `source` only, not any captured position. A keystroke
 *   before this widget shifts its `from`, but its DOM doesn't need to
 *   rebuild — CM6 reuses the existing DOM when `eq` returns true.
 * - Click-to-caret reads the live position via `view.posAtDOM(host, offset)`.
 *   Top-half clicks reveal the hidden source (caret at widget start).
 *   Bottom-half clicks hop *past* the widget so the user can keep typing on
 *   the first post-widget line — matching CM6's own top/bottom-half
 *   convention for non-Text blocks in `posAtCoords`.
 * - A `ResizeObserver` calls `view.requestMeasure()` whenever the host's box
 *   changes (e.g. Mermaid async render swaps the placeholder for an SVG),
 *   keeping CM6's heightmap in sync with the actual DOM so clicks below the
 *   widget resolve to the right document position.
 * - `destroy(dom)` disconnects the observer and hands the rest of cleanup to
 *   `BlockRenderService.unmount`, which aborts any in-flight render.
 */

const HOST_RO_KEY = '__dlRo';
type HostWithRo = HTMLElement & { [HOST_RO_KEY]?: ResizeObserver };

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
    const host = document.createElement('div') as HostWithRo;
    host.addEventListener('mousedown', (event) => {
      // Prevent CM6's default mousedown from placing the selection inside
      // the atomic replace range (it would snap back unpredictably).
      event.preventDefault();
      const rect = host.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const inBottomHalf = rect.height > 0 && event.clientY > midY;
      const pos = inBottomHalf
        ? Math.min(view.posAtDOM(host, 1) + 1, view.state.doc.length)
        : view.posAtDOM(host, 0);
      view.dispatch({ selection: EditorSelection.cursor(pos) });
      view.focus();
    });

    // Watch for async DOM changes (Mermaid settles, image loads, etc.) and
    // ask CM6 to re-measure so its heightmap matches the real layout. Without
    // this, a stale estimate widens the zone where `posAtCoords` returns the
    // widget block's `from`/`to` shortcut instead of the line below.
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => { view.requestMeasure(); });
      ro.observe(host);
      host[HOST_RO_KEY] = ro;
    }

    // Async: kick off render but don't await — toDOM must return synchronously.
    void this.blockRender.mount(host, this.source);
    return host;
  }

  override destroy(dom: HTMLElement): void {
    const ro = (dom as HostWithRo)[HOST_RO_KEY];
    if (ro) {
      ro.disconnect();
      delete (dom as HostWithRo)[HOST_RO_KEY];
    }
    this.blockRender.unmount(dom);
  }

  override ignoreEvent(): boolean {
    // Let events propagate normally; our mousedown handler already
    // preventDefaults what matters.
    return false;
  }

  override get estimatedHeight(): number {
    // Fallback used only before CM6's first layout measurement; the real
    // height comes from the browser's layout of the widget DOM, and the
    // ResizeObserver above makes sure CM6 re-measures when that changes.
    return 48;
  }
}

import {
  ApplicationRef,
  ComponentRef,
  EnvironmentInjector,
  Injectable,
  Injector,
  createComponent,
  inject,
} from '@angular/core';
import { DlNode } from '../../../shared/doclang/dl-node.model';
import { DlNodeComponent } from '../../../shared/doclang/dl-node.component';
import { simplify, toDocLang } from '../../../shared/doclang/md-to-doclang';

/**
 * Manages the lifecycle of DlNodeComponent instances mounted inside
 * CodeMirror block widgets. The service is scoped to EditorComponent (not
 * providedIn root) so the hierarchical `Injector` it captures carries the
 * routed ActivatedRoute used by DlNodeComponent for relative-URL resolution.
 */

interface MountState {
  aborted: boolean;
  ref: ComponentRef<DlNodeComponent> | null;
}

export const BLOCK_WIDGET_CLASS = 'cm-dl-widget';
export const BLOCK_PLACEHOLDER_CLASS = 'cm-dl-placeholder';

@Injectable()
export class BlockRenderService {
  private readonly appRef = inject(ApplicationRef);
  private readonly envInjector = inject(EnvironmentInjector);
  private readonly injector = inject(Injector);

  private readonly mounts = new WeakMap<HTMLElement, MountState>();

  /**
   * Render `source` into `host`. Successive calls on the same host replace the
   * previous mount. Returns after the async DocLang conversion settles so tests
   * can await completion; production callers can fire-and-forget.
   */
  async mount(host: HTMLElement, source: string): Promise<void> {
    // Previous mount on this host is torn down first so the WeakMap slot is
    // clean before the new state lands.
    this.unmount(host);

    const state: MountState = { aborted: false, ref: null };
    this.mounts.set(host, state);

    host.classList.add(BLOCK_WIDGET_CLASS);
    host.innerHTML = '';
    const placeholder = document.createElement('div');
    placeholder.className = BLOCK_PLACEHOLDER_CLASS;
    placeholder.setAttribute('aria-hidden', 'true');
    host.appendChild(placeholder);

    let node: DlNode;
    try {
      node = simplify(await toDocLang(source));
    } catch {
      // Leave the placeholder visible on parse failure — the underlying doc
      // still carries the raw source, which appears when the caret enters.
      return;
    }

    if (state.aborted) { return; }

    host.innerHTML = '';
    const ref = createComponent(DlNodeComponent, {
      environmentInjector: this.envInjector,
      elementInjector: this.injector,
      hostElement: host,
    });
    ref.setInput('node', node);
    this.appRef.attachView(ref.hostView);
    ref.changeDetectorRef.detectChanges();
    state.ref = ref;
  }

  /** Tear down the mount associated with `host`. Idempotent. */
  unmount(host: HTMLElement): void {
    const state = this.mounts.get(host);
    if (!state) { return; }
    state.aborted = true;
    if (state.ref) {
      this.appRef.detachView(state.ref.hostView);
      state.ref.destroy();
      state.ref = null;
    }
    // Clear any residual DOM (placeholder if the async resolve never ran,
    // or Angular's own leftover nodes if destroy() is partial) so the host
    // is a clean slate for a subsequent mount or test reuse.
    host.innerHTML = '';
    host.classList.remove(BLOCK_WIDGET_CLASS);
    this.mounts.delete(host);
  }
}

import {
  ApplicationRef,
  EnvironmentInjector,
  Injectable,
  createComponent,
  inject,
} from '@angular/core';
import { ConfirmDialogComponent, type DialogAction } from './confirm-dialog.component';

export interface ConfirmOptions {
  title: string;
  body: string;
  actions: DialogAction[];
}

@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly appRef = inject(ApplicationRef);
  private readonly envInjector = inject(EnvironmentInjector);
  private openRef: { destroy: () => void } | null = null;

  confirm(opts: ConfirmOptions): Promise<string> {
    // Only one dialog at a time — closing first keeps focus restoration sane.
    this.openRef?.destroy();

    return new Promise<string>((resolve) => {
      const host = document.createElement('div');
      host.className = 'app-dialog-host';
      document.body.appendChild(host);

      const invoker = document.activeElement as HTMLElement | null;

      const ref = createComponent(ConfirmDialogComponent, {
        environmentInjector: this.envInjector,
        hostElement: host,
      });
      ref.setInput('title', opts.title);
      ref.setInput('body', opts.body);
      ref.setInput('actions', opts.actions);

      this.appRef.attachView(ref.hostView);

      let resolved = false;
      const close = (id: string): void => {
        if (resolved) { return; }
        resolved = true;
        this.appRef.detachView(ref.hostView);
        ref.destroy();
        host.remove();
        this.openRef = null;
        if (invoker && typeof invoker.focus === 'function' && document.body.contains(invoker)) {
          invoker.focus();
        }
        resolve(id);
      };

      const sub = ref.instance.choice.subscribe((id: string) => close(id));

      this.openRef = {
        destroy: () => {
          sub.unsubscribe();
          close('cancel');
        },
      };
    });
  }
}

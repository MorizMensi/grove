import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
  computed,
  input,
  output,
} from '@angular/core';

export interface DialogAction {
  id: string;
  label: string;
  primary?: boolean;
}

let uid = 0;

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="backdrop" (click)="onBackdrop()">
      <div
        #dialog
        class="dialog"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="titleId"
        [attr.aria-describedby]="bodyId"
        (click)="$event.stopPropagation()"
      >
        <h2 [id]="titleId" class="title">{{ title() }}</h2>
        <p [id]="bodyId" class="body">{{ body() }}</p>
        <div class="actions">
          @for (action of actions(); track action.id) {
            <button
              type="button"
              class="action"
              [class.primary]="action.primary"
              (click)="emit(action.id)"
            >{{ action.label }}</button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      .dialog {
        background: var(--surface, #fff);
        color: var(--text, #111);
        border-radius: 6px;
        padding: 1rem 1.25rem;
        min-width: 20rem;
        max-width: 32rem;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .title { margin: 0; font-size: 1.1rem; }
      .body { margin: 0; }
      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
      }
      .action {
        padding: 0.4rem 0.8rem;
        border-radius: 4px;
        border: 1px solid var(--border, #ccc);
        background: transparent;
        color: inherit;
        cursor: pointer;
      }
      .action.primary {
        background: var(--accent, #2563eb);
        color: var(--accent-text, #fff);
        border-color: var(--accent, #2563eb);
      }
      .action:focus-visible {
        outline: 2px solid var(--focus, #2563eb);
        outline-offset: 2px;
      }
    `,
  ],
})
export class ConfirmDialogComponent implements AfterViewInit, OnDestroy {
  readonly title = input.required<string>();
  readonly body = input.required<string>();
  readonly actions = input.required<DialogAction[]>();
  readonly choice = output<string>();

  readonly titleId = `dlg-title-${++uid}`;
  readonly bodyId = `dlg-body-${uid}`;

  private readonly primary = computed(() => this.actions().find((a) => a.primary));

  @ViewChild('dialog', { static: true }) dialogRef!: ElementRef<HTMLElement>;

  private resolved = false;

  ngAfterViewInit(): void {
    queueMicrotask(() => this.focusPrimaryOrFirst());
  }

  ngOnDestroy(): void {
    // Mark resolved so stray events don't emit after teardown.
    this.resolved = true;
  }

  emit(id: string): void {
    if (this.resolved) { return; }
    this.resolved = true;
    this.choice.emit(id);
  }

  onBackdrop(): void {
    this.emit('cancel');
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEsc(event: KeyboardEvent): void {
    event.preventDefault();
    this.emit('cancel');
  }

  @HostListener('document:keydown.enter', ['$event'])
  onEnter(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    // If a button has focus, let its click fire naturally.
    if (target && target.tagName === 'BUTTON' && this.dialogRef.nativeElement.contains(target)) {
      return;
    }
    const primary = this.primary();
    if (!primary) { return; }
    event.preventDefault();
    this.emit(primary.id);
  }

  @HostListener('document:keydown.tab', ['$event'])
  onTab(event: KeyboardEvent): void {
    const focusables = this.focusables();
    if (focusables.length === 0) { return; }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    } else if (active && !this.dialogRef.nativeElement.contains(active)) {
      event.preventDefault();
      first.focus();
    }
  }

  private focusPrimaryOrFirst(): void {
    const focusables = this.focusables();
    if (focusables.length === 0) { return; }
    const primary = this.primary();
    const preferred = primary
      ? focusables.find((el) => el.textContent?.trim() === primary.label)
      : undefined;
    (preferred ?? focusables[0]).focus();
  }

  private focusables(): HTMLElement[] {
    return Array.from(
      this.dialogRef.nativeElement.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    );
  }
}

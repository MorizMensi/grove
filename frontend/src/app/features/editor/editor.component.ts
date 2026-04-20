import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  input,
  output,
} from '@angular/core';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { searchKeymap } from '@codemirror/search';
import { markdown } from '@codemirror/lang-markdown';
import { hybridMarkdown } from './extensions/hybrid-markdown';

/**
 * Grove's CodeMirror 6 host. Phase 3 adds Typora-style inline reveal decorations
 * for emphasis, strong, inline code, links, and ATX headings via the
 * `hybridMarkdown` StateField. Block widgets (fenced code, tables, Mermaid,
 * images) land in Phase 4.
 */
@Component({
  selector: 'grove-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<div class="cm-host" #host></div>',
  styleUrl: './editor.component.scss',
})
export class EditorComponent implements AfterViewInit, OnDestroy {
  readonly content = input.required<string>();
  readonly path = input.required<string>();

  readonly contentChange = output<string>();
  readonly dirtyChange = output<boolean>();
  readonly saveRequested = output<{ content: string }>();
  readonly exitRequested = output<void>();

  @ViewChild('host', { static: true }) hostRef!: ElementRef<HTMLDivElement>;

  private view: EditorView | null = null;
  private baseline = '';

  ngAfterViewInit(): void {
    this.baseline = this.content();
    const state = EditorState.create({
      doc: this.baseline,
      extensions: this.buildExtensions(),
    });
    this.view = new EditorView({ state, parent: this.hostRef.nativeElement });
    // Focus the editor so typing is immediate.
    queueMicrotask(() => this.view?.focus());
  }

  ngOnDestroy(): void {
    this.view?.destroy();
    this.view = null;
  }

  /** Call after a successful save to reset the dirty baseline. */
  markSaved(content: string): void {
    this.baseline = content;
    this.dirtyChange.emit(false);
  }

  /** Replace the buffer (e.g. Reload after 409). */
  replaceBuffer(content: string): void {
    this.baseline = content;
    const v = this.view;
    if (!v) { return; }
    v.dispatch({
      changes: { from: 0, to: v.state.doc.length, insert: content },
    });
    this.dirtyChange.emit(false);
  }

  private buildExtensions() {
    return [
      history(),
      keymap.of([
        {
          key: 'Mod-s',
          preventDefault: true,
          run: (view) => {
            this.saveRequested.emit({ content: view.state.doc.toString() });
            return true;
          },
        },
        {
          key: 'Escape',
          run: () => {
            this.exitRequested.emit();
            return true;
          },
        },
        ...defaultKeymap,
        ...historyKeymap,
        ...searchKeymap,
      ]),
      markdown(),
      hybridMarkdown(),
      EditorView.lineWrapping,
      EditorView.updateListener.of((u) => {
        if (!u.docChanged) { return; }
        const doc = u.state.doc.toString();
        this.contentChange.emit(doc);
        this.dirtyChange.emit(doc !== this.baseline);
      }),
    ];
  }
}

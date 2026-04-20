import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { EditorComponent } from './editor.component';

describe('EditorComponent', () => {
  let fixture: ComponentFixture<EditorComponent>;
  let component: EditorComponent;

  const contentChanges: string[] = [];
  const dirtyChanges: boolean[] = [];
  const saveRequests: { content: string }[] = [];
  const exits: number[] = [];

  beforeEach(() => {
    contentChanges.length = 0;
    dirtyChanges.length = 0;
    saveRequests.length = 0;
    exits.length = 0;

    TestBed.configureTestingModule({
      imports: [EditorComponent],
      // The editor's BlockRenderService mounts DlNodeComponent for block widgets,
      // which injects ActivatedRoute. Tests without a router outlet need a stub.
      providers: [{ provide: ActivatedRoute, useValue: { snapshot: { url: [] } } }],
    });
    fixture = TestBed.createComponent(EditorComponent);
    fixture.componentRef.setInput('content', '# hello');
    fixture.componentRef.setInput('path', 'notes/hello.md');
    component = fixture.componentInstance;
    component.contentChange.subscribe((c) => contentChanges.push(c));
    component.dirtyChange.subscribe((d) => dirtyChanges.push(d));
    component.saveRequested.subscribe((e) => saveRequests.push(e));
    component.exitRequested.subscribe(() => exits.push(1));
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('mounts a CodeMirror view into the host element', () => {
    const host = fixture.nativeElement.querySelector('.cm-host') as HTMLElement;
    expect(host.querySelector('.cm-editor')).toBeTruthy();
    expect(host.querySelector('.cm-content')).toBeTruthy();
  });

  it('seeds the view with the initial content', () => {
    const content = fixture.nativeElement.querySelector('.cm-content') as HTMLElement;
    expect(content.textContent?.includes('# hello')).toBeTrue();
  });

  it('emits contentChange and dirtyChange when the buffer changes', () => {
    // Reach the view via the component and dispatch a change transaction.
    const view = (component as unknown as { view: { dispatch: (t: unknown) => void; state: { doc: { length: number } } } }).view;
    view.dispatch({ changes: { from: view.state.doc.length, insert: ' world' } });
    expect(contentChanges.at(-1)).toBe('# hello world');
    expect(dirtyChanges.at(-1)).toBeTrue();
  });

  it('Mod-s emits saveRequested with the current doc', () => {
    const view = (component as unknown as { view: { dispatch: (t: unknown) => void; state: { doc: { length: number } }; contentDOM: HTMLElement } }).view;
    view.dispatch({ changes: { from: view.state.doc.length, insert: ' x' } });

    const evt = new KeyboardEvent('keydown', {
      key: 's',
      code: 'KeyS',
      metaKey: true,
      ctrlKey: !navigator.platform.includes('Mac'),
      bubbles: true,
      cancelable: true,
    });
    view.contentDOM.dispatchEvent(evt);

    expect(saveRequests.length).toBe(1);
    expect(saveRequests[0].content).toBe('# hello x');
  });

  it('Escape emits exitRequested', () => {
    const view = (component as unknown as { contentDOM?: HTMLElement; view: { contentDOM: HTMLElement } }).view;
    const evt = new KeyboardEvent('keydown', {
      key: 'Escape',
      code: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    view.contentDOM.dispatchEvent(evt);
    expect(exits.length).toBe(1);
  });

  it('markSaved resets the dirty baseline', () => {
    const view = (component as unknown as { view: { dispatch: (t: unknown) => void; state: { doc: { length: number; toString: () => string } } } }).view;
    view.dispatch({ changes: { from: view.state.doc.length, insert: ' y' } });
    expect(dirtyChanges.at(-1)).toBeTrue();

    component.markSaved(view.state.doc.toString());
    expect(dirtyChanges.at(-1)).toBeFalse();
  });

  it('replaceBuffer overwrites the buffer and reports clean', () => {
    component.replaceBuffer('fresh content');
    const content = fixture.nativeElement.querySelector('.cm-content') as HTMLElement;
    expect(content.textContent?.includes('fresh content')).toBeTrue();
    expect(dirtyChanges.at(-1)).toBeFalse();
  });

  it('mounts a .cm-dl-widget for a fenced code block (Phase 4 wiring)', async () => {
    // Build a fresh fixture with content that contains a block-level construct,
    // so the block-widgets ViewPlugin emits a decoration synchronously.
    fixture.destroy();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [EditorComponent],
      providers: [{ provide: ActivatedRoute, useValue: { snapshot: { url: [] } } }],
    });
    const f = TestBed.createComponent(EditorComponent);
    f.componentRef.setInput('content', 'intro\n\n```\nhello\n```\n\nafter\n');
    f.componentRef.setInput('path', 'notes/x.md');
    f.detectChanges();

    const host = f.nativeElement.querySelector('.cm-host') as HTMLElement;
    const widget = host.querySelector('.cm-dl-widget');
    expect(widget).toBeTruthy();
    f.destroy();
  });
});

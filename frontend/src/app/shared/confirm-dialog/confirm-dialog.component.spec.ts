import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent, type DialogAction } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let fixture: ComponentFixture<ConfirmDialogComponent>;

  const actions: DialogAction[] = [
    { id: 'save', label: 'Save', primary: true },
    { id: 'discard', label: 'Discard' },
    { id: 'cancel', label: 'Cancel' },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ConfirmDialogComponent] });
    fixture = TestBed.createComponent(ConfirmDialogComponent);
    fixture.componentRef.setInput('title', 'Unsaved changes');
    fixture.componentRef.setInput('body', 'Save, discard, or cancel?');
    fixture.componentRef.setInput('actions', actions);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('renders a role=dialog with aria-modal and wired aria-labelledby/describedby', () => {
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    const labelledBy = dialog.getAttribute('aria-labelledby');
    const describedBy = dialog.getAttribute('aria-describedby');
    expect(labelledBy).toBeTruthy();
    expect(describedBy).toBeTruthy();
    expect(fixture.nativeElement.querySelector(`#${labelledBy}`)?.textContent)
      .toContain('Unsaved changes');
    expect(fixture.nativeElement.querySelector(`#${describedBy}`)?.textContent)
      .toContain('Save, discard, or cancel?');
  });

  it('renders one button per action', () => {
    const btns = Array.from(
      fixture.nativeElement.querySelectorAll('button.action'),
    ) as HTMLButtonElement[];
    expect(btns.map((b) => b.textContent?.trim())).toEqual(['Save', 'Discard', 'Cancel']);
    const primary = btns.find((b) => b.classList.contains('primary'));
    expect(primary?.textContent?.trim()).toBe('Save');
  });

  it('emits the button id when clicked', () => {
    const events: string[] = [];
    fixture.componentInstance.choice.subscribe((id) => events.push(id));
    const btns = Array.from(
      fixture.nativeElement.querySelectorAll('button.action'),
    ) as HTMLButtonElement[];
    btns.find((b) => b.textContent?.trim() === 'Discard')!.click();
    expect(events).toEqual(['discard']);
  });

  it('emits cancel on Escape', () => {
    const events: string[] = [];
    fixture.componentInstance.choice.subscribe((id) => events.push(id));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(events).toEqual(['cancel']);
  });

  it('emits the primary action id on Enter when focus is not on a button', () => {
    const events: string[] = [];
    fixture.componentInstance.choice.subscribe((id) => events.push(id));
    // Move focus off the primary button so Enter routes through the host listener.
    (document.activeElement as HTMLElement | null)?.blur();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(events).toEqual(['save']);
  });

  it('only emits once — repeated clicks are ignored', () => {
    const events: string[] = [];
    fixture.componentInstance.choice.subscribe((id) => events.push(id));
    const btn = fixture.nativeElement.querySelector('button.action') as HTMLButtonElement;
    btn.click();
    btn.click();
    expect(events).toEqual(['save']);
  });
});

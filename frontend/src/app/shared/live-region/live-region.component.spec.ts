import { TestBed, ComponentFixture } from '@angular/core/testing';
import { LiveRegionComponent } from './live-region.component';
import { LiveRegionService } from './live-region.service';

describe('LiveRegionComponent', () => {
  let fixture: ComponentFixture<LiveRegionComponent>;
  let service: LiveRegionService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [LiveRegionComponent] });
    fixture = TestBed.createComponent(LiveRegionComponent);
    service = TestBed.inject(LiveRegionService);
    fixture.detectChanges();
  });

  it('renders a polite aria-live region with status role', () => {
    const el = fixture.nativeElement.querySelector('[role="status"]') as HTMLElement;
    expect(el).toBeTruthy();
    expect(el.getAttribute('aria-live')).toBe('polite');
    expect(el.getAttribute('aria-atomic')).toBe('true');
  });

  it('reflects announce() into the region text', async () => {
    service.announce('Saved');
    // queueMicrotask tick
    await Promise.resolve();
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('[role="status"]') as HTMLElement;
    expect(el.textContent?.trim()).toBe('Saved');
  });

  it('re-announces identical messages by clearing first', async () => {
    service.announce('Saved');
    await Promise.resolve();
    fixture.detectChanges();
    service.announce('Saved');
    // Right after the second call the message signal is reset to '' before the microtask runs.
    expect(service.message()).toBe('');
    await Promise.resolve();
    fixture.detectChanges();
    expect(service.message()).toBe('Saved');
  });
});

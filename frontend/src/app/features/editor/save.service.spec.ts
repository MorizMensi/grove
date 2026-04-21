import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { SaveService } from './save.service';
import { LiveRegionService } from '../../shared/live-region/live-region.service';

describe('SaveService', () => {
  let service: SaveService;
  let httpMock: HttpTestingController;
  let live: LiveRegionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SaveService);
    httpMock = TestBed.inject(HttpTestingController);
    live = TestBed.inject(LiveRegionService);
  });

  afterEach(() => httpMock.verify());

  /** Wait for announce() microtasks to drain so live.message() reflects the last call. */
  const flushMicrotasks = () => Promise.resolve().then(() => Promise.resolve());

  it('starts clean with null mtime and no conflict', () => {
    expect(service.saving()).toBeFalse();
    expect(service.dirty()).toBeFalse();
    expect(service.lastMtime()).toBeNull();
    expect(service.staleConflict()).toBeNull();
  });

  it('reset seeds mtime and clears dirty + conflict', () => {
    service.markDirty(true);
    service.reset(1_700_000_000_000);
    expect(service.lastMtime()).toBe(1_700_000_000_000);
    expect(service.dirty()).toBeFalse();
    expect(service.staleConflict()).toBeNull();
  });

  it('save on 200 updates lastMtime, clears dirty, and announces Saved', async () => {
    service.reset(1_700_000_000_000);
    service.markDirty(true);

    const pending = service.save('notes/a.md', 'hello');
    const req = httpMock.expectOne((r) => r.method === 'PUT' && r.url === '/api/documents');
    expect(service.saving()).toBeTrue();
    req.flush({ mtime: 1_700_000_001_000 });

    const outcome = await pending;
    await flushMicrotasks();

    expect(outcome).toBe('ok');
    expect(service.lastMtime()).toBe(1_700_000_001_000);
    expect(service.dirty()).toBeFalse();
    expect(service.saving()).toBeFalse();
    expect(live.message()).toBe('Saved');
  });

  it('save on 409 sets staleConflict, keeps dirty true, announces File changed on disk', async () => {
    service.reset(1_700_000_000_000);
    service.markDirty(true);

    const pending = service.save('notes/a.md', 'hello');
    const req = httpMock.expectOne((r) => r.method === 'PUT' && r.url === '/api/documents');
    req.flush(
      { error: 'stale', mtime: 1_700_000_999_000 },
      { status: 409, statusText: 'Conflict' },
    );

    const outcome = await pending;
    await flushMicrotasks();

    expect(outcome).toBe('stale');
    expect(service.staleConflict()).toEqual({ diskMtime: 1_700_000_999_000 });
    expect(service.dirty()).toBeTrue();
    expect(service.saving()).toBeFalse();
    expect(live.message()).toBe('File changed on disk');
  });

  it('save on 500 keeps dirty and announces Save failed', async () => {
    service.reset(1);
    service.markDirty(true);

    const pending = service.save('notes/a.md', 'x');
    const req = httpMock.expectOne((r) => r.method === 'PUT' && r.url === '/api/documents');
    req.flush({ error: 'oops' }, { status: 500, statusText: 'Server Error' });

    expect(await pending).toBe('error');
    await flushMicrotasks();
    expect(service.dirty()).toBeTrue();
    expect(service.saving()).toBeFalse();
    expect(live.message()).toBe('Save failed');
  });

  it('save without a prior reset() announces failure and does no HTTP', async () => {
    const outcome = await service.save('notes/a.md', 'x');
    await flushMicrotasks();
    expect(outcome).toBe('error');
    expect(live.message()).toBe('Save failed');
    httpMock.expectNone((r) => r.method === 'PUT');
  });

  it('overwrite re-saves using the disk mtime after a conflict', async () => {
    service.reset(1_700_000_000_000);
    service.markDirty(true);

    // First save conflicts.
    const firstPending = service.save('notes/a.md', 'mine');
    const firstReq = httpMock.expectOne((r) => r.method === 'PUT' && r.url === '/api/documents');
    firstReq.flush(
      { error: 'stale', mtime: 1_700_000_999_000 },
      { status: 409, statusText: 'Conflict' },
    );
    await firstPending;
    await flushMicrotasks();
    expect(service.staleConflict()).toEqual({ diskMtime: 1_700_000_999_000 });

    // Overwrite re-issues PUT with If-Unmodified-Since = disk mtime.
    const pending = service.overwrite('notes/a.md', 'mine');
    const req = httpMock.expectOne((r) => r.method === 'PUT' && r.url === '/api/documents');
    expect(req.request.headers.get('If-Unmodified-Since')).toBe('1700000999000');
    req.flush({ mtime: 1_700_001_000_000 });

    const outcome = await pending;
    await flushMicrotasks();

    expect(outcome).toBe('ok');
    expect(service.staleConflict()).toBeNull();
    expect(service.lastMtime()).toBe(1_700_001_000_000);
    expect(service.dirty()).toBeFalse();
    expect(live.message()).toBe('Saved');
  });

  it('overwrite without an active conflict falls back to save', async () => {
    service.reset(1_700_000_000_000);
    const pending = service.overwrite('notes/a.md', 'x');
    const req = httpMock.expectOne((r) => r.method === 'PUT' && r.url === '/api/documents');
    expect(req.request.headers.get('If-Unmodified-Since')).toBe('1700000000000');
    req.flush({ mtime: 1_700_000_001_000 });
    expect(await pending).toBe('ok');
  });

  it('clearConflict wipes the stale banner', () => {
    service.reset(1);
    // simulate a stale state
    (service as unknown as { _stale: { set: (v: unknown) => void } })._stale.set({
      diskMtime: 2,
    });
    service.clearConflict();
    expect(service.staleConflict()).toBeNull();
  });
});

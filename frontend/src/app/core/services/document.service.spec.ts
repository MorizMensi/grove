import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { DocumentService } from './document.service';

describe('DocumentService — edit endpoints', () => {
  let service: DocumentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DocumentService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DocumentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getRawFile GETs /api/documents/raw with path param and returns RawDocumentResponse', () => {
    let received: unknown;
    service.getRawFile('notes/hello.md').subscribe((r) => (received = r));
    const req = httpMock.expectOne((r) => r.url === '/api/documents/raw');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('path')).toBe('notes/hello.md');
    req.flush({ content: '# hi', mtime: 1_700_000_000_000 });
    expect(received).toEqual({ content: '# hi', mtime: 1_700_000_000_000 });
  });

  it('saveFile PUTs /api/documents with body, path param, and If-Unmodified-Since header', () => {
    let received: unknown;
    service
      .saveFile('notes/hello.md', '# edited', 1_700_000_000_000)
      .subscribe((r) => (received = r));
    const req = httpMock.expectOne((r) => r.url === '/api/documents' && r.method === 'PUT');
    expect(req.request.params.get('path')).toBe('notes/hello.md');
    expect(req.request.headers.get('If-Unmodified-Since')).toBe('1700000000000');
    expect(req.request.body).toEqual({ content: '# edited' });
    req.flush({ mtime: 1_700_000_001_000 });
    expect(received).toEqual({ mtime: 1_700_000_001_000 });
  });

  it('createFile POSTs /api/documents with kind=file and returns mtime', () => {
    let received: unknown;
    service.createFile('notes/new.md').subscribe((r) => (received = r));
    const req = httpMock.expectOne((r) => r.url === '/api/documents' && r.method === 'POST');
    expect(req.request.params.get('path')).toBe('notes/new.md');
    expect(req.request.params.get('kind')).toBe('file');
    expect(req.request.body).toBeNull();
    req.flush({ mtime: 1_700_000_000_000 }, { status: 201, statusText: 'Created' });
    expect(received).toEqual({ mtime: 1_700_000_000_000 });
  });

  it('createDirectory POSTs /api/documents with kind=dir', () => {
    service.createDirectory('notes/sub').subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/documents' && r.method === 'POST');
    expect(req.request.params.get('path')).toBe('notes/sub');
    expect(req.request.params.get('kind')).toBe('dir');
    req.flush({}, { status: 201, statusText: 'Created' });
  });

  it('createFile surfaces 409 parent-missing', (done) => {
    service.createFile('a/b/c.md').subscribe({
      next: () => done.fail('expected error'),
      error: (err) => {
        expect(err.status).toBe(409);
        expect(err.error?.error).toBe('parent-missing');
        done();
      },
    });
    const req = httpMock.expectOne((r) => r.url === '/api/documents' && r.method === 'POST');
    req.flush({ error: 'parent-missing' }, { status: 409, statusText: 'Conflict' });
  });

  it('deleteEntry DELETEs /api/documents with path param', () => {
    service.deleteEntry('notes/old.md').subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/documents' && r.method === 'DELETE');
    expect(req.request.params.get('path')).toBe('notes/old.md');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('deleteEntry surfaces 409 not-empty', (done) => {
    service.deleteEntry('notes/dir').subscribe({
      next: () => done.fail('expected error'),
      error: (err) => {
        expect(err.status).toBe(409);
        expect(err.error?.error).toBe('not-empty');
        done();
      },
    });
    const req = httpMock.expectOne((r) => r.url === '/api/documents' && r.method === 'DELETE');
    req.flush({ error: 'not-empty' }, { status: 409, statusText: 'Conflict' });
  });

  it('saveFile surfaces 409 as an HttpErrorResponse with stale body', (done) => {
    service.saveFile('notes/hello.md', 'x', 1).subscribe({
      next: () => done.fail('expected error'),
      error: (err) => {
        expect(err.status).toBe(409);
        expect(err.error?.error).toBe('stale');
        expect(err.error?.mtime).toBe(1_700_000_999_000);
        done();
      },
    });
    const req = httpMock.expectOne((r) => r.url === '/api/documents' && r.method === 'PUT');
    req.flush(
      { error: 'stale', mtime: 1_700_000_999_000 },
      { status: 409, statusText: 'Conflict' },
    );
  });
});

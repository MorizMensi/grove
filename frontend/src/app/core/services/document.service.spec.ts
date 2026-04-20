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

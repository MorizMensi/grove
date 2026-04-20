import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { CapabilitiesService, type Capabilities } from './capabilities.service';

describe('CapabilitiesService', () => {
  let service: CapabilitiesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CapabilitiesService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(CapabilitiesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('has a default capabilities shape with terminal, claude, edits, gitCommit', () => {
    const caps = service.capabilities();
    const keys = Object.keys(caps.supports).sort();
    expect(keys).toEqual(['claude', 'edits', 'gitCommit', 'terminal']);
    // Post-Zed-removal regression: the `zed` key must not exist.
    expect('zed' in caps.supports).toBeFalse();
    // Defaults hide edit affordances until the server confirms the flag.
    expect(caps.supports.edits).toBeFalse();
    expect(caps.supports.gitCommit).toBeFalse();
    // The service fires a GET on construction; consume it so verify() passes.
    httpMock.expectOne('/api/capabilities').flush(caps);
  });

  it('updates the signal with the server response', () => {
    const response: Capabilities = {
      platform: 'darwin',
      supports: { terminal: true, claude: true, edits: true, gitCommit: false },
    };
    const req = httpMock.expectOne('/api/capabilities');
    expect(req.request.method).toBe('GET');
    req.flush(response);

    const caps = service.capabilities();
    expect(caps.platform).toBe('darwin');
    expect(caps.supports.terminal).toBeTrue();
    expect(caps.supports.claude).toBeTrue();
    expect(caps.supports.edits).toBeTrue();
    expect(caps.supports.gitCommit).toBeFalse();
  });
});

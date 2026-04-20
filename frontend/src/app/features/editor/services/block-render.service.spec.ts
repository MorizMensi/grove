import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import {
  BLOCK_PLACEHOLDER_CLASS,
  BLOCK_WIDGET_CLASS,
  BlockRenderService,
} from './block-render.service';

/**
 * Service-level tests for the mount/unmount lifecycle. The async path exercises
 * the real `toDocLang` pipeline (dynamic imports of unified/remark), which is
 * fine under Karma — `md-node` view mode relies on the same path. The component
 * mount requires ActivatedRoute, so we supply a minimal stub.
 */

describe('BlockRenderService', () => {
  let service: BlockRenderService;
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BlockRenderService,
        { provide: ActivatedRoute, useValue: { snapshot: { url: [] } } },
      ],
    });
    service = TestBed.inject(BlockRenderService);
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    service.unmount(host);
    host.remove();
  });

  it('renders a placeholder synchronously and tags the host', () => {
    void service.mount(host, '```\ncode\n```');
    expect(host.classList.contains(BLOCK_WIDGET_CLASS)).toBeTrue();
    expect(host.querySelector(`.${BLOCK_PLACEHOLDER_CLASS}`)).toBeTruthy();
  });

  it('replaces the placeholder with rendered content after the async resolve', async () => {
    await service.mount(host, '```\ncode\n```');
    expect(host.querySelector(`.${BLOCK_PLACEHOLDER_CLASS}`)).toBeFalsy();
    expect(host.children.length).toBeGreaterThan(0);
  });

  it('unmount is a no-op on an unknown host', () => {
    const other = document.createElement('div');
    expect(() => service.unmount(other)).not.toThrow();
  });

  it('unmount is idempotent', async () => {
    await service.mount(host, '```\ncode\n```');
    service.unmount(host);
    expect(() => service.unmount(host)).not.toThrow();
  });

  it('aborting before the async resolve skips the component attach', async () => {
    const promise = service.mount(host, '```\ncode\n```');
    service.unmount(host);
    await promise;
    // After abort + resolve, neither placeholder nor a mounted component
    // should remain — the host is bare, awaiting removal by its CM widget.
    expect(host.querySelector(`.${BLOCK_PLACEHOLDER_CLASS}`)).toBeFalsy();
  });

  it('successive mount calls replace the previous rendering', async () => {
    await service.mount(host, '```\nfirst\n```');
    await service.mount(host, '```\nsecond\n```');
    const text = host.textContent ?? '';
    expect(text).toContain('second');
    expect(text).not.toContain('first');
  });
});

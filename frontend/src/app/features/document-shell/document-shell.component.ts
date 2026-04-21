import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  ViewChild,
  computed,
  effect,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { HttpErrorResponse } from "@angular/common/http";
import { DomSanitizer, SafeResourceUrl, Title } from "@angular/platform-browser";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { GroveMarkComponent } from "../../shared/grove-mark/grove-mark.component";
import { ThemeSwitcherComponent } from "../../shared/theme-switcher/theme-switcher.component";
import { WikiFooterComponent } from "../../shared/wiki-footer/wiki-footer.component";
import {
  DocumentService,
  DocumentEntry,
} from "../../core/services/document.service";
import { CapabilitiesService } from "../../core/services/capabilities.service";
import {
  FILETYPE_ICONS,
  previewKindFor,
  hasDualViewFor,
} from "../../core/constants/file-types";
import { FilePreviewComponent, ViewerMode } from "../../shared/file-preview/file-preview.component";
import { titleFromSegment } from "../../core/utils/title-from-segment";
import { CONTENT_URL_PREFIX } from "@shared/content-url";
import { environment } from "../../../environments/environment";
import { EditorComponent } from "../editor/editor.component";
import { SaveService } from "../editor/save.service";
import { DialogService } from "../../shared/confirm-dialog/dialog.service";
import { LiveRegionService } from "../../shared/live-region/live-region.service";

type ShellMode = "loading" | "directory" | "file" | "file-edit" | "not-found";

@Component({
  selector: "app-document-shell",
  standalone: true,
  imports: [
    FilePreviewComponent,
    RouterLink,
    GroveMarkComponent,
    ThemeSwitcherComponent,
    WikiFooterComponent,
    EditorComponent,
  ],
  templateUrl: "./document-shell.component.html",
  styles: [":host { display: block; height: 100%; }"],
  styleUrl: "./document-shell.component.scss",
})
export class DocumentShellComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly destroyRef = inject(DestroyRef);
  private readonly documentService = inject(DocumentService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly capabilitiesService = inject(CapabilitiesService);
  private readonly titleService = inject(Title);
  private readonly saveService = inject(SaveService);
  private readonly dialog = inject(DialogService);
  private readonly live = inject(LiveRegionService);

  readonly capabilities = this.capabilitiesService.capabilities;
  readonly siteName = this.documentService.siteName;
  readonly isWikiMode = environment.mode === "wiki";
  readonly save = this.saveService;

  mode: ShellMode = "loading";
  fileType: "text" | "image" | "video" | "audio" | "pdf" | "svg" | "html" = "text";
  mediaUrl = "";
  safeMediaUrl: SafeResourceUrl = "";
  entries: DocumentEntry[] = [];
  breadcrumbs: { label: string; path: string }[] = [];
  title = "";
  readonly pageTitle = signal("");
  markdown: string | null = null;
  readonly currentPath = signal<string>("");
  sidebarEntries: DocumentEntry[] = [];
  sidebarOpen = this.isDesktopViewport();
  parentPath = "";
  readonly extension = signal<string>("");
  readonly viewerMode = signal<ViewerMode>("preview");
  readonly hasDualView = computed(() => hasDualViewFor(this.extension()));
  sourceText: string | null = null;

  readonly editBuffer = signal<string>("");
  /**
   * Whether the pencil/edit affordance applies to the current view.
   *
   * Intentionally a plain method, not `computed()`: it reads `this.mode`
   * which is a plain field (not a signal), so a `computed` would
   * memoize against only the tracked signals (`extension`) and stay
   * stale when `mode` transitions from `"loading"` → `"file"` without
   * any signal dependency changing. CheckAlways re-invokes this on
   * each cycle, which is cheap (two string compares).
   */
  isEditableFile(): boolean {
    if (this.mode !== "file" && this.mode !== "file-edit") { return false; }
    const ext = this.extension();
    return ext === "" || ext === "md";
  }

  @ViewChild(EditorComponent) editorRef?: EditorComponent;
  @ViewChild("createInput") createInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild("contextMenuEl") contextMenuEl?: ElementRef<HTMLElement>;

  /**
   * Sidebar context menu state. When non-null, a floating menu is rendered
   * at the given viewport coordinates. `entry` is the target row (null
   * when the menu was opened on blank space or the header — only the
   * "New file" / "New folder" items are shown in that case).
   */
  readonly contextMenu = signal<
    { x: number; y: number; entry: DocumentEntry | null; invoker: HTMLElement | null } | null
  >(null);
  /** Roving-tabindex index inside the open context menu. */
  readonly contextMenuActive = signal(0);

  /**
   * Inline create state. When set, an `<input>` is rendered inside the
   * sidebar and submits to `createFile` / `createDirectory` on Enter.
   */
  readonly creating = signal<{ kind: "file" | "dir"; parentPath: string; value: string; error: string | null } | null>(
    null,
  );

  constructor() {
    effect(() => {
      const site = this.siteName();
      const page = this.pageTitle();
      this.titleService.setTitle(page ? `${page} · ${site}` : site);
    });
    // Move focus to the active menu item whenever the open menu or its
    // active index changes, so Arrow navigation feels native and
    // screen-readers announce the new item per WAI-ARIA menu pattern.
    effect(() => {
      const menu = this.contextMenu();
      const i = this.contextMenuActive();
      if (!menu) { return; }
      queueMicrotask(() => {
        const root = this.contextMenuEl?.nativeElement;
        const items = root?.querySelectorAll<HTMLElement>("[role='menuitem']");
        items?.[i]?.focus();
      });
    });
  }

  ngOnInit(): void {
    this.route.url
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((segments) => {
        const filePath = segments.map((s) => s.path).join("/");
        this.extension.set(
          this.route.snapshot.queryParamMap.get("extension") ?? "",
        );
        this.currentPath.set(filePath);
        this.mode = "loading";
        this.markdown = null;
        this.fileType = "text";
        this.mediaUrl = "";
        this.safeMediaUrl = "";
        this.entries = [];
        this.sidebarEntries = [];
        this.pageTitle.set("");
        this.viewerMode.set("preview");
        this.sourceText = null;
        this.saveService.markDirty(false);
        this.saveService.clearConflict();
        this.buildBreadcrumbs(filePath);

        const ext = this.extension();
        if (ext && ext !== "md") {
          this.loadFileWithExtension(filePath, ext);
        } else {
          const requestPath = filePath;
          this.documentService
            .listDirectory(filePath)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (listing) => {
                if (this.currentPath() !== requestPath) return;
                this.entries = listing.entries;
                this.title = filePath
                  ? titleFromSegment(filePath.split("/").pop()!)
                  : "Documents";
                this.pageTitle.set(filePath ? this.title : "");
                this.mode = "directory";
              },
              error: () => {
                this.loadFileWithExtension(filePath, "md");
              },
            });
        }
      });
  }

  private loadFileWithExtension(filePath: string, extension: string): void {
    const requestPath = filePath;
    const filename = filePath.split("/").pop() ?? "";
    this.title = titleFromSegment(filename);
    this.pageTitle.set(this.title);
    const ext = extension.toLowerCase();
    const kind = previewKindFor(ext);

    if (kind && kind !== "svg" && kind !== "html") {
      this.fileType = kind;
      this.mediaUrl = `${CONTENT_URL_PREFIX}/${filePath}.${extension}`;
      if (kind === "pdf") {
        this.safeMediaUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
          this.mediaUrl,
        );
      }
      this.mode = "file";
      this.loadSidebarEntries(filePath);
      return;
    }

    if (kind === "svg") {
      this.fileType = "svg";
      this.mediaUrl = `${CONTENT_URL_PREFIX}/${filePath}.${extension}`;
    } else if (kind === "html") {
      this.fileType = "html";
      this.mediaUrl = `${CONTENT_URL_PREFIX}/${filePath}.${extension}`;
      this.safeMediaUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        this.mediaUrl,
      );
    }

    this.documentService
      .getFileContent(filePath, extension)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (content) => {
          if (this.currentPath() !== requestPath) return;
          if (kind === "html" || kind === "svg") {
            this.sourceText = content;
          } else if (extension === "md") {
            this.markdown = content;
          } else {
            this.markdown = "```" + extension + "\n" + content + "\n```";
          }
          this.mode = "file";
          this.loadSidebarEntries(filePath);
          const fragment = this.route.snapshot.fragment;
          if (fragment) this.scrollToFragment(fragment);
        },
        error: () => {
          this.mode = "not-found";
        },
      });
  }

  private scrollToFragment(fragment: string): void {
    const deadline = performance.now() + 2000;
    const tryScroll = () => {
      const el = document.getElementById(fragment);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      if (performance.now() < deadline) {
        requestAnimationFrame(tryScroll);
      }
    };
    requestAnimationFrame(tryScroll);
  }

  private loadSidebarEntries(filePath: string): void {
    const segments = filePath.split("/").filter(Boolean);
    segments.pop();
    this.parentPath = segments.join("/");

    this.documentService
      .listDirectory(this.parentPath)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (listing) => {
          if (this.currentPath() !== filePath) return;
          this.sidebarEntries = listing.entries;
        },
        error: () => {
          this.sidebarEntries = [];
        },
      });
  }

  private buildBreadcrumbs(filePath: string): void {
    const parts = filePath.split("/").filter(Boolean);
    this.breadcrumbs = [{ label: "Documents", path: "/" }];
    let accumulated = "";
    for (const part of parts) {
      accumulated += "/" + part;
      this.breadcrumbs.push({
        label: titleFromSegment(part),
        path: accumulated,
      });
    }
  }

  formatName(name: string): string {
    return titleFromSegment(name);
  }

  entryLink(entry: DocumentEntry): string {
    const base = this.currentPath() ? `/${this.currentPath()}` : "";
    return `${base}/${entry.name}`;
  }

  entryQueryParams(entry: DocumentEntry): Record<string, string> | null {
    if (
      entry.type === "directory" ||
      !entry.extension ||
      entry.extension === "md"
    ) {
      return null;
    }
    return { extension: entry.extension };
  }

  sidebarEntryLink(entry: DocumentEntry): string {
    const base = this.parentPath ? `/${this.parentPath}` : "";
    return `${base}/${entry.name}`;
  }

  isCurrentFile(entry: DocumentEntry): boolean {
    const currentName = this.currentPath().split("/").pop() ?? "";
    return entry.name === currentName;
  }

  get actionPath(): string {
    return this.mode === "directory" ? this.currentPath() : this.parentPath;
  }

  openExternal(action: "terminal" | "claude"): void {
    this.documentService.openExternal(action, this.actionPath).subscribe();
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebarOnMobile(): void {
    if (!this.isDesktopViewport()) {
      this.sidebarOpen = false;
    }
  }

  private isDesktopViewport(): boolean {
    if (typeof window === "undefined" || !window.matchMedia) { return true; }
    return window.matchMedia("(min-width: 768px)").matches;
  }

  setViewerMode(mode: ViewerMode): void {
    this.viewerMode.set(mode);
  }

  readonly assetBase = computed<readonly string[]>(() =>
    this.currentPath().split("/").filter(Boolean).slice(0, -1),
  );

  iconClass(entry: DocumentEntry): string {
    if (entry.type === "directory") return "bi-folder-fill";
    if (entry.extension && FILETYPE_ICONS.has(entry.extension)) {
      return `bi-filetype-${entry.extension}`;
    }
    return "bi-file-earmark";
  }

  // ---------- Editor integration ----------

  /**
   * Disk path including the real file extension. The URL for a markdown
   * file is the stem (`/how-it-works`), so `currentPath()` returns
   * `"how-it-works"` and the `extension` query param is empty. The
   * `/api/documents/raw` and `/api/documents` PUT endpoints need the
   * actual filename (`how-it-works.md`); fall back to `md` when the
   * route did not carry an extension.
   */
  private effectivePath(): string {
    const ext = this.extension() || "md";
    return `${this.currentPath()}.${ext}`;
  }

  togglePencil(): void {
    if (this.mode === "file") {
      void this.enterEditMode();
    } else if (this.mode === "file-edit") {
      void this.exitEditMode();
    }
  }

  private enterEditMode(): void {
    const path = this.effectivePath();
    const guardPath = this.currentPath();
    this.documentService
      .getRawFile(path)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (raw) => {
          if (this.currentPath() !== guardPath) { return; }
          this.editBuffer.set(raw.content);
          this.saveService.reset(raw.mtime);
          this.mode = "file-edit";
        },
        error: () => {
          this.live.announce("Could not load file for editing");
        },
      });
  }

  async exitEditMode(): Promise<void> {
    const resolved = await this.resolveDirtyState();
    if (resolved) {
      this.mode = "file";
    }
  }

  onEditorContentChange(content: string): void {
    this.editBuffer.set(content);
  }

  onEditorDirtyChange(isDirty: boolean): void {
    this.saveService.markDirty(isDirty);
  }

  async onSaveRequested(event: { content: string }): Promise<void> {
    const outcome = await this.saveService.save(this.effectivePath(), event.content);
    if (outcome === "ok") {
      this.editorRef?.markSaved(event.content);
      // Keep the preview in sync so exiting edit mode shows the saved bytes.
      this.markdown = event.content;
    }
  }

  reloadAfterConflict(): void {
    const path = this.effectivePath();
    const guardPath = this.currentPath();
    this.documentService
      .getRawFile(path)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (raw) => {
          if (this.currentPath() !== guardPath) { return; }
          this.editorRef?.replaceBuffer(raw.content);
          this.editBuffer.set(raw.content);
          this.saveService.reset(raw.mtime);
          this.live.announce("Reloaded from disk");
        },
      });
  }

  dismissConflict(): void {
    this.saveService.clearConflict();
  }

  async overwriteAfterConflict(): Promise<void> {
    const outcome = await this.saveService.overwrite(
      this.effectivePath(),
      this.editBuffer(),
    );
    if (outcome === 'ok') {
      this.editorRef?.markSaved(this.editBuffer());
      this.markdown = this.editBuffer();
    }
  }

  // ---------- Sidebar context menu + create/delete ----------

  /** Open the context menu for a specific sidebar entry. */
  openEntryContextMenu(event: MouseEvent | KeyboardEvent, entry: DocumentEntry): void {
    if (!this.capabilities().supports.edits) { return; }
    event.preventDefault();
    const invoker = event.currentTarget as HTMLElement | null;
    const { x, y } = this.menuAnchor(event, invoker);
    this.contextMenu.set({ x, y, entry, invoker });
    this.contextMenuActive.set(0);
  }

  /** Open the context menu anchored to the sidebar header (no row context). */
  openSidebarContextMenu(event: MouseEvent | KeyboardEvent): void {
    if (!this.capabilities().supports.edits) { return; }
    event.preventDefault();
    const invoker = event.currentTarget as HTMLElement | null;
    const { x, y } = this.menuAnchor(event, invoker);
    this.contextMenu.set({ x, y, entry: null, invoker });
    this.contextMenuActive.set(0);
  }

  private menuAnchor(event: MouseEvent | KeyboardEvent, invoker: HTMLElement | null): { x: number; y: number } {
    if (event instanceof MouseEvent) {
      return { x: event.clientX, y: event.clientY };
    }
    if (invoker) {
      const rect = invoker.getBoundingClientRect();
      return { x: rect.left + 8, y: rect.bottom };
    }
    return { x: 16, y: 16 };
  }

  closeContextMenu(returnFocus = true): void {
    const menu = this.contextMenu();
    this.contextMenu.set(null);
    if (returnFocus && menu?.invoker && document.body.contains(menu.invoker)) {
      menu.invoker.focus();
    }
  }

  /** Items shown in the currently-open context menu. */
  readonly contextMenuItems = computed<{ id: "new-file" | "new-folder" | "delete"; label: string }[]>(() => {
    const menu = this.contextMenu();
    if (!menu) { return []; }
    const items: { id: "new-file" | "new-folder" | "delete"; label: string }[] = [];
    const onDir = menu.entry?.type === "directory";
    const onBlank = menu.entry === null;
    if (onDir || onBlank) {
      items.push({ id: "new-file", label: "New file" });
      items.push({ id: "new-folder", label: "New folder" });
    }
    if (menu.entry) {
      items.push({ id: "delete", label: "Delete" });
    }
    return items;
  });

  onContextMenuKeydown(event: KeyboardEvent): void {
    const items = this.contextMenuItems();
    if (items.length === 0) { return; }
    const i = this.contextMenuActive();
    if (event.key === "ArrowDown") {
      event.preventDefault();
      this.contextMenuActive.set((i + 1) % items.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      this.contextMenuActive.set((i - 1 + items.length) % items.length);
    } else if (event.key === "Home") {
      event.preventDefault();
      this.contextMenuActive.set(0);
    } else if (event.key === "End") {
      event.preventDefault();
      this.contextMenuActive.set(items.length - 1);
    } else if (event.key === "Escape") {
      event.preventDefault();
      this.closeContextMenu();
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.activateContextMenuItem(items[i].id);
    }
  }

  activateContextMenuItem(id: "new-file" | "new-folder" | "delete"): void {
    const menu = this.contextMenu();
    if (!menu) { return; }
    if (id === "delete" && menu.entry) {
      const entry = menu.entry;
      this.closeContextMenu(false);
      void this.confirmDelete(entry);
      return;
    }
    const kind: "file" | "dir" = id === "new-file" ? "file" : "dir";
    const parent = menu.entry?.type === "directory"
      ? (this.parentPath ? `${this.parentPath}/${menu.entry.name}` : menu.entry.name)
      : this.parentPath;
    this.closeContextMenu(false);
    this.beginCreate(kind, parent);
  }

  onRowContextMenu(event: MouseEvent, entry: DocumentEntry): void {
    this.openEntryContextMenu(event, entry);
  }

  onRowKeydown(event: KeyboardEvent, entry: DocumentEntry): void {
    // Shift+F10 mirrors the platform contextmenu event.
    if (event.shiftKey && event.key === "F10") {
      this.openEntryContextMenu(event, entry);
    } else if (event.key === "Delete" && this.capabilities().supports.edits) {
      event.preventDefault();
      void this.confirmDelete(entry);
    } else if (event.key === "F2") {
      // Rename is out of scope for v1; announce rather than silently ignore
      // so F2 has a discoverable response and keyboard users understand
      // the missing capability. Tracked for v1.1.
      event.preventDefault();
      this.live.announce("Rename is not available yet");
    }
  }

  /**
   * Alt+N creates a new file in the current folder (or the active row's
   * folder when the sidebar has focus). Cmd+N is reserved by the browser
   * for "new window" and cannot be reliably intercepted, so Alt+N is the
   * documented shortcut for v1.
   */
  @HostListener("document:keydown", ["$event"])
  onGlobalKeydown(event: KeyboardEvent): void {
    if (!this.capabilities().supports.edits) { return; }
    if (!event.altKey || event.metaKey || event.ctrlKey) { return; }
    if (event.key !== "n" && event.key !== "N") { return; }
    if (this.mode !== "file" && this.mode !== "directory") { return; }
    event.preventDefault();
    const parent = this.mode === "directory" ? this.currentPath() : this.parentPath;
    this.beginCreate("file", parent);
  }

  beginCreate(kind: "file" | "dir", parentPath: string): void {
    this.creating.set({ kind, parentPath, value: "", error: null });
    // Focus the input after it renders.
    queueMicrotask(() => this.createInputRef?.nativeElement.focus());
  }

  cancelCreate(): void {
    this.creating.set(null);
  }

  onCreateInput(value: string): void {
    const prev = this.creating();
    if (!prev) { return; }
    this.creating.set({ ...prev, value, error: null });
  }

  submitCreate(): void {
    const c = this.creating();
    if (!c) { return; }
    const trimmed = c.value.trim();
    if (!trimmed) {
      this.creating.set({ ...c, error: "Name required" });
      return;
    }
    const name = c.kind === "file" && !trimmed.includes(".") ? `${trimmed}.md` : trimmed;
    if (name.includes("/") || name.startsWith(".")) {
      this.creating.set({ ...c, error: "Invalid name" });
      return;
    }
    const fullPath = c.parentPath ? `${c.parentPath}/${name}` : name;
    const obs = c.kind === "file"
      ? this.documentService.createFile(fullPath)
      : this.documentService.createDirectory(fullPath);
    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.creating.set(null);
        if (c.kind === "file") {
          this.live.announce(`Created ${name}`);
          void this.router.navigateByUrl(`/${fullPath}`);
        } else {
          this.live.announce(`Created folder ${name}`);
          this.loadSidebarEntries(this.currentPath());
        }
      },
      error: (err: HttpErrorResponse) => {
        const code = err.error?.error as string | undefined;
        const msg = code === "parent-missing"
          ? "Create the folder first."
          : code === "exists"
          ? "Already exists."
          : code === "bad-name"
          ? "Invalid name."
          : "Could not create.";
        this.creating.set({ ...c, error: msg });
      },
    });
  }

  private async confirmDelete(entry: DocumentEntry): Promise<void> {
    const label = entry.type === "directory" ? "folder" : "file";
    const choice = await this.dialog.confirm({
      title: `Delete ${label}?`,
      body: `Delete ${label} "${entry.name}"? This cannot be undone.`,
      actions: [
        { id: "delete", label: "Delete", primary: true },
        { id: "cancel", label: "Cancel" },
      ],
    });
    if (choice !== "delete") { return; }

    // Listing entries carry the stem in `name` and the extension separately
    // (e.g. `{ name: "how-it-works", extension: "md" }`). The DELETE endpoint
    // needs the real filename on disk, so rejoin them for files. Directories
    // have no extension.
    const leafName = entry.type === "file" && entry.extension
      ? `${entry.name}.${entry.extension}`
      : entry.name;
    const fullPath = this.parentPath ? `${this.parentPath}/${leafName}` : leafName;
    const isOpenFile = this.mode !== "directory" && this.isCurrentFile(entry);
    this.documentService
      .deleteEntry(fullPath)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.live.announce(`Deleted ${entry.name}`);
          if (isOpenFile) {
            this.saveService.markDirty(false);
            void this.router.navigateByUrl(this.parentPath ? `/${this.parentPath}` : "/");
          } else {
            this.loadSidebarEntries(this.currentPath());
          }
        },
        error: (err: HttpErrorResponse) => {
          const code = err.error?.error as string | undefined;
          const msg = code === "not-empty"
            ? "Folder is not empty."
            : code === "not-found"
            ? "Already gone."
            : "Could not delete.";
          this.live.announce(msg);
        },
      });
  }

  /** Closes the context menu on outside click. */
  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent): void {
    const menu = this.contextMenu();
    if (!menu) { return; }
    const target = event.target as HTMLElement | null;
    if (target && target.closest(".context-menu")) { return; }
    this.closeContextMenu(false);
  }

  @HostListener("window:beforeunload", ["$event"])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.saveService.dirty()) {
      event.preventDefault();
      event.returnValue = "";
    }
  }

  /** Route guard hook: called by `canDeactivate` in app.routes. */
  async canDeactivate(): Promise<boolean> {
    if (this.mode !== "file-edit" || !this.saveService.dirty()) { return true; }
    return this.resolveDirtyState();
  }

  /** Returns true if it is safe to exit edit mode, false to stay. */
  private async resolveDirtyState(): Promise<boolean> {
    if (!this.saveService.dirty()) {
      this.saveService.clearConflict();
      return true;
    }
    const choice = await this.dialog.confirm({
      title: "Unsaved changes",
      body: "You have unsaved changes. Save, discard, or cancel?",
      actions: [
        { id: "save", label: "Save", primary: true },
        { id: "discard", label: "Discard" },
        { id: "cancel", label: "Cancel" },
      ],
    });
    if (choice === "save") {
      const outcome = await this.saveService.save(
        this.currentPath(),
        this.editBuffer(),
      );
      if (outcome === "ok") {
        this.editorRef?.markSaved(this.editBuffer());
        this.markdown = this.editBuffer();
        return true;
      }
      return false;
    }
    if (choice === "discard") {
      this.saveService.markDirty(false);
      this.saveService.clearConflict();
      return true;
    }
    return false;
  }
}

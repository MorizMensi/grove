import { Component, DestroyRef, computed, effect, inject, OnInit, signal } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
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

@Component({
  selector: "app-document-shell",
  standalone: true,
  imports: [
    FilePreviewComponent,
    RouterLink,
    GroveMarkComponent,
    ThemeSwitcherComponent,
    WikiFooterComponent,
  ],
  templateUrl: "./document-shell.component.html",
  styles: [":host { display: block; height: 100%; }"],
  styleUrl: "./document-shell.component.scss",
})
export class DocumentShellComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);

  private readonly destroyRef = inject(DestroyRef);
  private readonly documentService = inject(DocumentService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly capabilitiesService = inject(CapabilitiesService);
  private readonly titleService = inject(Title);

  readonly capabilities = this.capabilitiesService.capabilities;
  readonly siteName = this.documentService.siteName;
  readonly isWikiMode = environment.mode === "wiki";

  mode: "loading" | "directory" | "file" | "not-found" = "loading";
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
  sidebarOpen = true;
  parentPath = "";
  readonly extension = signal<string>("");
  readonly viewerMode = signal<ViewerMode>("preview");
  readonly hasDualView = computed(() => hasDualViewFor(this.extension()));
  sourceText: string | null = null;

  constructor() {
    effect(() => {
      const site = this.siteName();
      const page = this.pageTitle();
      this.titleService.setTitle(page ? `${page} · ${site}` : site);
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
}

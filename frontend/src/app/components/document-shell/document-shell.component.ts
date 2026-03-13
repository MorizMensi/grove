import { Component, DestroyRef, inject, OnInit } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MdNodeComponent } from "../../dl-node/md-node.component";
import {
  DocumentService,
  DocumentEntry,
} from "../../services/document.service";

function titleFromSegment(segment: string): string {
  return segment
    .replace(/[_\-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "bmp",
  "heic",
  "tiff",
  "raw",
  "webp",
]);
const VIDEO_EXTENSIONS = new Set(["mp4", "mov", "webm"]);
const AUDIO_EXTENSIONS = new Set(["mp3", "aac", "wav", "m4p", "ogg"]);
const PDF_EXTENSIONS = new Set(["pdf"]);

const FILETYPE_ICONS = new Set([
  "aac",
  "ai",
  "bmp",
  "cs",
  "css",
  "csv",
  "doc",
  "docx",
  "exe",
  "gif",
  "heic",
  "html",
  "java",
  "jpg",
  "js",
  "json",
  "jsx",
  "key",
  "md",
  "mdx",
  "m4p",
  "mov",
  "mp3",
  "mp4",
  "otf",
  "pdf",
  "php",
  "png",
  "ppt",
  "pptx",
  "psd",
  "py",
  "raw",
  "rb",
  "sass",
  "scss",
  "sh",
  "sql",
  "svg",
  "tiff",
  "tsx",
  "ttf",
  "txt",
  "wav",
  "woff",
  "xls",
  "xlsx",
  "xml",
  "yml",
]);

@Component({
  selector: "app-document-shell",
  standalone: true,
  imports: [MdNodeComponent, RouterLink],
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

  mode: "loading" | "directory" | "file" | "not-found" = "loading";
  fileType: "text" | "image" | "video" | "audio" | "pdf" | "svg" = "text";
  mediaUrl = "";
  safeMediaUrl: SafeResourceUrl = "";
  entries: DocumentEntry[] = [];
  breadcrumbs: { label: string; path: string }[] = [];
  title = "";
  markdown: string | null = null;
  currentPath = "";
  sidebarEntries: DocumentEntry[] = [];
  sidebarOpen = true;
  parentPath = "";
  extension = "";

  ngOnInit(): void {
    this.route.url
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((segments) => {
        const filePath = segments.map((s) => s.path).join("/");
        this.extension =
          this.route.snapshot.queryParamMap.get("extension") ?? "";
        this.currentPath = filePath;
        this.mode = "loading";
        this.markdown = null;
        this.fileType = "text";
        this.mediaUrl = "";
        this.safeMediaUrl = "";
        this.entries = [];
        this.sidebarEntries = [];
        this.buildBreadcrumbs(filePath);

        if (this.extension && this.extension !== "md") {
          this.loadFileWithExtension(filePath, this.extension);
        } else {
          this.documentService
            .listDirectory(filePath)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (listing) => {
                this.entries = listing.entries;
                this.title = filePath
                  ? titleFromSegment(filePath.split("/").pop()!)
                  : "Documents";
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
    const filename = filePath.split("/").pop() ?? "";
    this.title = titleFromSegment(filename);
    const ext = extension.toLowerCase();

    if (
      IMAGE_EXTENSIONS.has(ext) ||
      VIDEO_EXTENSIONS.has(ext) ||
      AUDIO_EXTENSIONS.has(ext) ||
      PDF_EXTENSIONS.has(ext)
    ) {
      this.fileType = IMAGE_EXTENSIONS.has(ext)
        ? "image"
        : VIDEO_EXTENSIONS.has(ext)
          ? "video"
          : AUDIO_EXTENSIONS.has(ext)
            ? "audio"
            : "pdf";
      this.mediaUrl = `/documents/${filePath}.${extension}`;
      if (this.fileType === "pdf") {
        this.safeMediaUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
          this.mediaUrl,
        );
      }
      this.mode = "file";
      this.loadSidebarEntries(filePath);
      return;
    }

    if (ext === "svg") {
      this.fileType = "svg";
      this.mediaUrl = `/documents/${filePath}.${extension}`;
    }

    this.documentService
      .getFileContent(filePath, extension)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (content) => {
          if (this.mode !== "loading") return;
          if (extension === "md") {
            this.markdown = content;
          } else {
            this.markdown = "```" + extension + "\n" + content + "\n```";
          }
          this.mode = "file";
          this.loadSidebarEntries(filePath);
        },
        error: () => {
          this.mode = "not-found";
        },
      });
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
          this.sidebarEntries = listing.entries;
        },
        error: () => {
          this.sidebarEntries = [];
        },
      });
  }

  private buildBreadcrumbs(filePath: string): void {
    const parts = filePath.split("/").filter(Boolean);
    this.breadcrumbs = [{ label: "Documents", path: "/documents" }];
    let accumulated = "/documents";
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
    const base = this.currentPath
      ? `/documents/${this.currentPath}`
      : "/documents";
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
    const base = this.parentPath
      ? `/documents/${this.parentPath}`
      : "/documents";
    return `${base}/${entry.name}`;
  }

  isCurrentFile(entry: DocumentEntry): boolean {
    const currentName = this.currentPath.split("/").pop() ?? "";
    return entry.name === currentName;
  }

  onContentClick(event: MouseEvent): void {
    const anchor = (event.target as HTMLElement).closest("a");
    if (!anchor) return;

    const href = anchor.getAttribute("href");
    if (!href) return;

    // External links or absolute paths — let browser handle
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(href) || href.startsWith("/")) return;

    // Fragment-only links — scroll to element
    if (href.startsWith("#")) {
      event.preventDefault();
      const id = href.slice(1);
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    event.preventDefault();

    // Resolve relative path against current document's directory
    const dirSegments = this.currentPath.split("/").filter(Boolean);
    dirSegments.pop(); // remove filename
    const combined = [...dirSegments, ...href.split("/")];

    // Normalize . and .. segments
    const normalized: string[] = [];
    for (const seg of combined) {
      if (seg === ".") continue;
      if (seg === "..") {
        normalized.pop();
      } else {
        normalized.push(seg);
      }
    }

    const resolved = normalized.join("/");

    // Determine navigation target
    const dotIndex = resolved.lastIndexOf(".");
    const lastSlash = resolved.lastIndexOf("/");
    if (dotIndex > lastSlash) {
      const ext = resolved.slice(dotIndex + 1).toLowerCase();
      const pathWithoutExt = resolved.slice(0, dotIndex);
      if (ext === "md") {
        this.router.navigate(["/documents", ...pathWithoutExt.split("/")]);
      } else {
        this.router.navigate(["/documents", ...pathWithoutExt.split("/")], {
          queryParams: { extension: ext },
        });
      }
    } else {
      this.router.navigate(["/documents", ...resolved.split("/")]);
    }
  }

  get actionPath(): string {
    return this.mode === "directory" ? this.currentPath : this.parentPath;
  }

  openExternal(action: "terminal" | "zed" | "claude" | "file"): void {
    if (action === "file") {
      this.documentService
        .openExternal(
          "zed",
          this.currentPath + "." + (this.extension ? this.extension : "md"),
        )
        .subscribe();
    } else {
      this.documentService
        .openExternal(action, this.actionPath)
        .subscribe(() => {
          if (action === "zed" && this.mode === "file") {
            this.documentService
              .openExternal(
                "zed",
                this.currentPath +
                  "." +
                  (this.extension ? this.extension : "md"),
              )
              .subscribe();
          }
        });
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  iconClass(entry: DocumentEntry): string {
    if (entry.type === "directory") return "bi-folder-fill";
    if (entry.extension && FILETYPE_ICONS.has(entry.extension)) {
      return `bi-filetype-${entry.extension}`;
    }
    return "bi-file-earmark";
  }
}

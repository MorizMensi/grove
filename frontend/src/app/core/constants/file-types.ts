/**
 * File-type classification used by the document shell to decide which
 * preview widget to render (markdown, image, video, audio, pdf, svg) and
 * which Bootstrap-icons class to show for a directory entry.
 */

export const IMAGE_EXTENSIONS = new Set([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'bmp',
  'heic',
  'tiff',
  'raw',
  'webp',
]);

export const VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'webm']);
export const AUDIO_EXTENSIONS = new Set(['mp3', 'aac', 'wav', 'm4p', 'ogg']);
export const PDF_EXTENSIONS = new Set(['pdf']);
export const HTML_EXTENSIONS = new Set(['html', 'htm']);

/**
 * Extensions for which Bootstrap-icons ships a dedicated `bi-filetype-*`
 * icon. Everything else falls back to `bi-file-earmark`.
 */
export const FILETYPE_ICONS = new Set([
  'aac',
  'ai',
  'bmp',
  'cs',
  'css',
  'csv',
  'doc',
  'docx',
  'exe',
  'gif',
  'heic',
  'html',
  'java',
  'jpg',
  'js',
  'json',
  'jsx',
  'key',
  'md',
  'mdx',
  'm4p',
  'mov',
  'mp3',
  'mp4',
  'otf',
  'pdf',
  'php',
  'png',
  'ppt',
  'pptx',
  'psd',
  'py',
  'raw',
  'rb',
  'sass',
  'scss',
  'sh',
  'sql',
  'svg',
  'tiff',
  'tsx',
  'ttf',
  'txt',
  'wav',
  'woff',
  'xls',
  'xlsx',
  'xml',
  'yml',
]);

export type PreviewKind = 'text' | 'image' | 'video' | 'audio' | 'pdf' | 'svg' | 'html';

export function previewKindFor(extension: string): PreviewKind | null {
  const ext = extension.toLowerCase();
  if (IMAGE_EXTENSIONS.has(ext)) return 'image';
  if (VIDEO_EXTENSIONS.has(ext)) return 'video';
  if (AUDIO_EXTENSIONS.has(ext)) return 'audio';
  if (PDF_EXTENSIONS.has(ext)) return 'pdf';
  if (HTML_EXTENSIONS.has(ext)) return 'html';
  if (ext === 'svg') return 'svg';
  return null;
}

export const DUAL_VIEW_KINDS: ReadonlySet<PreviewKind> = new Set<PreviewKind>(['html', 'svg']);

export function hasDualViewFor(extension: string): boolean {
  const kind = previewKindFor(extension);
  return kind !== null && DUAL_VIEW_KINDS.has(kind);
}

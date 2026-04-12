/**
 * Turn a URL path segment like `getting-started` or `my_file` into a
 * display title `Getting Started` / `My File`. Used for breadcrumbs and
 * headings derived from filenames.
 */
export function titleFromSegment(segment: string): string {
  return segment
    .replace(/[_\-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

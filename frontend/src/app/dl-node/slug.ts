import { DlNode } from './dl-node.model';

export function extractText(node: DlNode): string {
  const parts: string[] = [];
  if (node.text) parts.push(node.text);
  if (node.children) {
    for (const child of node.children) {
      parts.push(extractText(child));
    }
  }
  return parts.join('');
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function headingSlug(node: DlNode): string {
  return slugify(extractText(node));
}

export class SlugTracker {
  private readonly seen = new Map<string, number>();

  track(node: DlNode): string | null {
    const slug = headingSlug(node);
    if (!slug) return null;

    const count = this.seen.get(slug) ?? 0;
    this.seen.set(slug, count + 1);

    return count === 0 ? slug : `${slug}-${count}`;
  }
}

export function assignHeadingIds(root: DlNode): void {
  const tracker = new SlugTracker();
  walkAndAssign(root, tracker);
}

function walkAndAssign(node: DlNode, tracker: SlugTracker): void {
  if (node.type === 'h') {
    const id = tracker.track(node);
    if (id) node.id = id;
  }
  if (node.children) {
    for (const child of node.children) {
      walkAndAssign(child, tracker);
    }
  }
}

/**
 * Markdown to DocLang Converter (TypeScript)
 *
 * Converts Markdown (CommonMark + GFM) to canonical DocLang JSON.
 * Lossless for all native Markdown features with a DocLang equivalent.
 * HTML nodes are stripped; link/image titles are dropped.
 *
 * See md-to-dl.md for the full specification.
 */

import { DlNode } from './dl-node.model';
import { isSafeUrl } from '../../core/utils/url-safety';

// ─── Mdast types (inline — no @types dependency) ────────────

interface MdastNode {
  type: string;
  children?: MdastNode[];
  value?: string;
  depth?: number;
  ordered?: boolean | null;
  lang?: string | null;
  url?: string;
  alt?: string | null;
  title?: string | null;
  align?: (string | null)[];
  checked?: boolean | null;
  spread?: boolean;
}

interface MdastRoot extends MdastNode {
  type: 'root';
  children: MdastNode[];
}

// ─── Core conversion ─────────────────────────────────────────

/**
 * Convert a pre-parsed mdast tree to a canonical DocLang node.
 * This function is sync and has zero dependencies — bring your own parser.
 */
export function convertMdast(root: MdastRoot): DlNode {
  const node = convertNode(root);
  return node ?? { children: [] };
}

/**
 * Parse a Markdown string and convert it to canonical DocLang.
 * Dynamically imports remark so the module loads even without it installed.
 */
export async function toDocLang(markdown: string): Promise<DlNode> {
  const { unified } = await import('unified');
  const { default: remarkParse } = await import('remark-parse');
  const { default: remarkGfm } = await import('remark-gfm');
  const { default: remarkMath } = await import('remark-math');

  const tree = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .parse(markdown) as MdastRoot;

  return convertMdast(tree);
}

// ─── Node dispatch ───────────────────────────────────────────

function convertNode(node: MdastNode): DlNode | null {
  switch (node.type) {
    // Block nodes
    case 'root':
      return { children: convertChildren(node.children ?? []) };

    case 'heading':
      return {
        type: 'h',
        level: node.depth ?? 1,
        children: convertChildren(node.children ?? []),
      };

    case 'paragraph':
      return {
        type: 'p',
        children: convertChildren(node.children ?? []),
      };

    case 'blockquote':
      return {
        type: 'quote',
        children: convertChildren(node.children ?? []),
      };

    case 'code':
      return codeBlock(node);

    case 'list':
      return listNode(node);

    case 'listItem':
      return listItemNode(node);

    case 'table':
      return tableNode(node);

    case 'tableRow':
      return {
        type: 'tr',
        children: convertChildren(node.children ?? []),
      };

    case 'tableCell':
      return tableCellNode(node);

    case 'thematicBreak':
      return { type: 'hr' };

    case 'image':
      return imageNode(node);

    // Inline nodes
    case 'text':
      return { text: node.value ?? '' };

    case 'emphasis':
      return {
        italic: true,
        children: convertChildren(node.children ?? []),
      };

    case 'strong':
      return {
        bold: true,
        children: convertChildren(node.children ?? []),
      };

    case 'delete':
      return {
        strikethrough: true,
        children: convertChildren(node.children ?? []),
      };

    case 'inlineCode':
      return { text: node.value ?? '', code: true };

    case 'link':
      return linkNode(node);

    case 'break':
      return { text: '\n' };

    // Soft break → space (CommonMark default)
    case 'softBreak':
      return { text: ' ' };

    // Math
    case 'math':
      return { type: 'math', text: node.value ?? '', displayMode: true };

    case 'inlineMath':
      return { type: 'math', text: node.value ?? '', displayMode: false };

    // HTML — stripped
    case 'html':
      return null;

    default:
      return null;
  }
}

// ─── Block helpers ───────────────────────────────────────────

function codeBlock(node: MdastNode): DlNode {
  const result: DlNode = {
    type: 'pre',
    children: [{ text: node.value ?? '' }],
  };
  if (node.lang) result.language = node.lang;
  return result;
}

function listNode(node: MdastNode): DlNode {
  const result: DlNode = {
    type: 'list',
    children: convertChildren(node.children ?? []),
  };
  if (node.ordered) result.ordered = true;
  return result;
}

function listItemNode(node: MdastNode): DlNode {
  const children = convertChildren(node.children ?? []);
  // Tight list: unwrap single paragraph
  if (children.length === 1 && children[0].type === 'p') {
    return { type: 'li', children: children[0].children ?? [] };
  }
  return { type: 'li', children };
}

function tableNode(node: MdastNode): DlNode {
  const alignments = node.align ?? [];
  const rows = (node.children ?? []).map((row, rowIndex) => {
    const cells = (row.children ?? []).map((cell, colIndex) => {
      return convertTableCell(cell, rowIndex === 0, alignments[colIndex]);
    });
    return { type: 'tr' as const, children: cells };
  });
  return { type: 'table', children: rows };
}

function convertTableCell(
  cell: MdastNode,
  isHeader: boolean,
  alignment: string | null | undefined,
): DlNode {
  const result: DlNode = {
    type: 'td',
    children: convertChildren(cell.children ?? []),
  };
  if (isHeader) result.header = true;
  if (alignment && alignment !== 'left') {
    result.align = alignment as DlNode['align'];
  }
  return result;
}

function tableCellNode(node: MdastNode): DlNode {
  // Standalone tableCell without parent context — no header/align info
  return {
    type: 'td',
    children: convertChildren(node.children ?? []),
  };
}

function imageNode(node: MdastNode): DlNode | null {
  const src = node.url ?? '';
  if (!isSafeUrl(src)) return null;
  const result: DlNode = { type: 'img', src };
  if (node.alt) result.alt = node.alt;
  return result;
}

function linkNode(node: MdastNode): DlNode | null {
  const url = node.url ?? '';
  if (!isSafeUrl(url)) {
    // Unsafe link — emit children as plain inline content
    const children = convertChildren(node.children ?? []);
    return children.length === 1 ? children[0] : { children };
  }
  const children = convertChildren(node.children ?? []);
  // Simple text-only link: flatten to single node
  if (children.length === 1 && children[0].text !== undefined && !hasFormatting(children[0])) {
    return { text: children[0].text, link: url };
  }
  return { link: url, children };
}

// ─── Inline helpers ──────────────────────────────────────────

function hasFormatting(node: DlNode): boolean {
  return !!(node.bold || node.italic || node.strikethrough || node.code || node.children);
}

function convertChildren(nodes: MdastNode[]): DlNode[] {
  const result: DlNode[] = [];
  for (const child of nodes) {
    const converted = convertNode(child);
    if (converted !== null) result.push(converted);
  }
  return result;
}

// ─── Post-processing simplification ─────────────────────────

/**
 * Simplify a DocLang tree by merging adjacent text nodes,
 * unwrapping single-child wrappers, and removing empty nodes.
 * Applied in-place and returned.
 */
export function simplify(node: DlNode): DlNode {
  if (node.children) {
    node.children = node.children
      .map(simplify)
      .filter(isNonEmpty);
    node.children = mergeAdjacentText(node.children);

    // Flatten formatting wrapper with single text child:
    // { bold: true, children: [{ text: "x" }] } → { text: "x", bold: true }
    if (
      node.children.length === 1
      && !node.type && !node.text && !node.link
      && isFormattingOnly(node)
      && node.children[0].text !== undefined
      && !node.children[0].children
    ) {
      const child = node.children[0];
      const merged: DlNode = { text: child.text };
      if (node.bold) merged.bold = true;
      if (node.italic) merged.italic = true;
      if (node.strikethrough) merged.strikethrough = true;
      if (node.code) merged.code = true;
      if (child.bold) merged.bold = true;
      if (child.italic) merged.italic = true;
      if (child.strikethrough) merged.strikethrough = true;
      if (child.code) merged.code = true;
      if (child.link) merged.link = child.link;
      return merged;
    }

    // Unwrap paragraph with single block-type child (e.g., <p><img></p>)
    if (
      node.type === 'p'
      && node.children.length === 1
      && node.children[0].type
    ) {
      return node.children[0];
    }

    // Unwrap single-child wrapper (only if node has no own properties)
    if (
      node.children.length === 1
      && !node.type && !node.text
      && !node.bold && !node.italic && !node.strikethrough && !node.code
      && !node.link
    ) {
      return node.children[0];
    }
  }
  return node;
}

function isFormattingOnly(node: DlNode): boolean {
  return !!(node.bold || node.italic || node.strikethrough || node.code);
}

function isNonEmpty(node: DlNode): boolean {
  if (node.text !== undefined) return true;
  if (node.type) return true;
  if (node.children && node.children.length > 0) return true;
  return false;
}

function mergeAdjacentText(children: DlNode[]): DlNode[] {
  const result: DlNode[] = [];
  for (const node of children) {
    const prev = result[result.length - 1];
    if (
      prev
      && prev.text !== undefined && node.text !== undefined
      && !prev.type && !node.type
      && !prev.children && !node.children
      && sameStyle(prev, node)
    ) {
      prev.text += node.text;
    } else {
      result.push(node);
    }
  }
  return result;
}

function sameStyle(a: DlNode, b: DlNode): boolean {
  return (
    !!a.bold === !!b.bold
    && !!a.italic === !!b.italic
    && !!a.strikethrough === !!b.strikethrough
    && !!a.code === !!b.code
    && (a.link ?? '') === (b.link ?? '')
  );
}

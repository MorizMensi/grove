export type BlockType =
  | 'p' | 'h' | 'quote' | 'pre' | 'list' | 'li'
  | 'table' | 'tr' | 'td' | 'hr' | 'img' | 'bi' | 'math';

export type FontSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
export type FontFamily = 'sans' | 'serif' | 'mono';
export type Alignment = 'left' | 'center' | 'right' | 'justify';

export interface DlNode {
  text?: string;
  children?: DlNode[];
  type?: BlockType;
  id?: string;

  // Inline formatting
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  superscript?: boolean;
  subscript?: boolean;

  // Text styling
  color?: string;
  background?: string;
  fontSize?: FontSize;
  fontFamily?: FontFamily;
  align?: Alignment;

  // Links
  link?: string;

  // Block-specific
  level?: number;
  ordered?: boolean;
  header?: boolean;
  language?: string;
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  icon?: string;
  displayMode?: boolean;
}

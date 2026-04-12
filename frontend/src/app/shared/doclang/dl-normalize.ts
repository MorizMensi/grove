/**
 * DocLang Normalizer (TypeScript)
 *
 * Converts an Extended DocLang value (string, array, or object with
 * shorthand children) into canonical DocLang form.
 *
 * See doc-lang-extension.md for the full specification.
 */

import { DlNode } from './dl-node.model';

/**
 * An extended DocLang node: the `children` array may contain strings
 * or nested arrays in addition to full node objects.
 */
export interface DlNodeExtended extends Omit<DlNode, 'children'> {
  children?: DlExtendedValue[];
}

/**
 * Any value that can appear where a DocLang node is expected in
 * extended form: a bare string, a bare array, or a full/partial node object.
 */
export type DlExtendedValue = string | DlExtendedValue[] | DlNodeExtended;

/**
 * Normalize an Extended DocLang value into canonical form.
 *
 * - String → `{ text: <string> }`
 * - Array  → `{ children: [normalize(each element)] }`
 * - Object → shallow copy with `children` recursively normalized
 *
 * The result is always a `DlNode` (an object). The function is
 * idempotent: normalizing an already-canonical document returns
 * an identical structure.
 *
 * @param value - Extended DocLang value (string, array, or node object)
 * @returns Canonical DocLang node
 * @throws Error if value is not a string, array, or non-null object
 */
export function normalize(value: DlExtendedValue): DlNode {
  if (typeof value === 'string') {
    return { text: value };
  }

  if (Array.isArray(value)) {
    return { children: value.map(normalize) };
  }

  if (typeof value === 'object' && value !== null) {
    const { children, ...rest } = value as DlNodeExtended;
    const result: DlNode = { ...rest };
    if (Array.isArray(children)) {
      result.children = children.map(normalize);
    }
    return result;
  }

  throw new Error(
    `Invalid DocLang value: expected string, array, or object, got ${typeof value}`
  );
}

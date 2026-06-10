// =============================================================================
// Quality Performance Dashboard — Guidance Highlighting
// Maps an associate's failed quality attributes to relevant defect avoidance
// guidance entries.
// =============================================================================

import type { DefectAvoidanceEntry } from '../models/audit-types';

/**
 * Maps quality attribute labels to the guidance categories they relate to.
 * Used to match an associate's error pattern against DefectAvoidanceEntry categories.
 */
export const ATTRIBUTE_TO_CATEGORIES: Record<string, string[]> = {
  'ADM': ['Decision Making', 'Associate Decision'],
  'RA': ['Right Action', 'SW Adherence', 'SOP'],
  'RRC': ['Reason Code', 'Right Reason Code'],
  'ACC': ['Communication', 'Information Sharing'],
  'RV': ['Validation', 'Necessary Checks', 'Required Validation'],
};

/**
 * Returns the subset of guidance entries that are relevant to the associate's
 * failed quality attributes.
 *
 * Matching strategy:
 * 1. For each failed attribute, look up mapped categories via ATTRIBUTE_TO_CATEGORIES.
 *    If the guidance entry's category matches (case-insensitive) any mapped category,
 *    the entry is included.
 * 2. If no explicit mapping exists for an attribute, fall back to simple string
 *    matching — include the entry if its category or any of its reasons contain
 *    the attribute name (case-insensitive).
 */
export function highlightGuidance(
  failedAttributes: string[],
  guidance: DefectAvoidanceEntry[],
): DefectAvoidanceEntry[] {
  if (failedAttributes.length === 0 || guidance.length === 0) {
    return [];
  }

  const matchedIndices = new Set<number>();

  for (const attr of failedAttributes) {
    const upperAttr = attr.toUpperCase();
    const mappedCategories = ATTRIBUTE_TO_CATEGORIES[upperAttr];

    for (let i = 0; i < guidance.length; i++) {
      if (matchedIndices.has(i)) continue;

      const entry = guidance[i];
      const categoryLower = entry.category.toLowerCase();

      if (mappedCategories) {
        // Strategy 1: check if the entry's category matches any mapped category
        const matched = mappedCategories.some(
          (cat) => categoryLower.includes(cat.toLowerCase()),
        );
        if (matched) {
          matchedIndices.add(i);
        }
      } else {
        // Strategy 2: fallback — simple string matching on category or reasons
        const attrLower = attr.toLowerCase();
        if (categoryLower.includes(attrLower)) {
          matchedIndices.add(i);
        } else {
          const reasonMatch = entry.reasons.some((reason) =>
            reason.toLowerCase().includes(attrLower),
          );
          if (reasonMatch) {
            matchedIndices.add(i);
          }
        }
      }
    }
  }

  // Preserve original order of guidance entries
  return guidance.filter((_, i) => matchedIndices.has(i));
}

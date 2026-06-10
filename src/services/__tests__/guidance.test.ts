import { describe, it, expect } from 'vitest';
import { highlightGuidance, ATTRIBUTE_TO_CATEGORIES } from '../guidance';
import type { DefectAvoidanceEntry } from '../../models/audit-types';

describe('highlightGuidance', () => {
  const sampleGuidance: DefectAvoidanceEntry[] = [
    {
      category: 'Decision Making',
      reasons: ['Incorrect decision on order hold'],
      avoidancePointer: 'Review SOP before making hold decisions',
    },
    {
      category: 'Right Reason Code',
      reasons: ['Wrong reason code selected for cancellation'],
      avoidancePointer: 'Cross-check reason code list before submission',
    },
    {
      category: 'Communication',
      reasons: ['Missing info in customer email'],
      avoidancePointer: 'Use the communication checklist template',
    },
    {
      category: 'SW Adherence',
      reasons: ['Did not follow standard work steps'],
      avoidancePointer: 'Follow the step-by-step SOP guide',
    },
    {
      category: 'Validation',
      reasons: ['Skipped required address validation'],
      avoidancePointer: 'Always run address validation before confirming',
    },
  ];

  it('returns entries matching a single mapped attribute (ADM)', () => {
    const result = highlightGuidance(['ADM'], sampleGuidance);
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe('Decision Making');
  });

  it('returns entries matching RRC attribute', () => {
    const result = highlightGuidance(['RRC'], sampleGuidance);
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe('Right Reason Code');
  });

  it('returns entries matching RA attribute (multiple mapped categories)', () => {
    const result = highlightGuidance(['RA'], sampleGuidance);
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe('SW Adherence');
  });

  it('returns entries matching ACC attribute', () => {
    const result = highlightGuidance(['ACC'], sampleGuidance);
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe('Communication');
  });

  it('returns entries matching RV attribute', () => {
    const result = highlightGuidance(['RV'], sampleGuidance);
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe('Validation');
  });

  it('returns multiple entries for multiple failed attributes', () => {
    const result = highlightGuidance(['ADM', 'RRC', 'RV'], sampleGuidance);
    expect(result).toHaveLength(3);
    const categories = result.map((e) => e.category);
    expect(categories).toContain('Decision Making');
    expect(categories).toContain('Right Reason Code');
    expect(categories).toContain('Validation');
  });

  it('returns empty array when no attributes are provided', () => {
    const result = highlightGuidance([], sampleGuidance);
    expect(result).toEqual([]);
  });

  it('returns empty array when guidance list is empty', () => {
    const result = highlightGuidance(['ADM'], []);
    expect(result).toEqual([]);
  });

  it('handles case-insensitive attribute matching', () => {
    const result = highlightGuidance(['adm'], sampleGuidance);
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe('Decision Making');
  });

  it('uses fallback string matching for unmapped attributes', () => {
    const customGuidance: DefectAvoidanceEntry[] = [
      {
        category: 'Timeliness',
        reasons: ['Response sent after SLA deadline'],
        avoidancePointer: 'Monitor SLA timers',
      },
      {
        category: 'Other Category',
        reasons: ['Some timeliness issue noted'],
        avoidancePointer: 'Check timers',
      },
    ];
    // 'Timeliness' is not in ATTRIBUTE_TO_CATEGORIES, so fallback matching applies
    const result = highlightGuidance(['Timeliness'], customGuidance);
    expect(result).toHaveLength(2);
  });

  it('fallback matches on reasons when category does not match', () => {
    const customGuidance: DefectAvoidanceEntry[] = [
      {
        category: 'General Errors',
        reasons: ['Missed accuracy check on order'],
        avoidancePointer: 'Double-check order details',
      },
    ];
    const result = highlightGuidance(['accuracy'], customGuidance);
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe('General Errors');
  });

  it('does not duplicate entries when multiple attributes match the same entry', () => {
    // Both ADM and RA could potentially match 'Associate Decision' category
    const guidance: DefectAvoidanceEntry[] = [
      {
        category: 'Associate Decision Making and SW Adherence',
        reasons: ['Combined error'],
        avoidancePointer: 'Review both decision and SOP',
      },
    ];
    const result = highlightGuidance(['ADM', 'RA'], guidance);
    // Should only appear once even though both attributes could match
    expect(result).toHaveLength(1);
  });

  it('preserves original order of guidance entries', () => {
    const result = highlightGuidance(['RV', 'ADM'], sampleGuidance);
    expect(result).toHaveLength(2);
    // Decision Making comes before Validation in the original array
    expect(result[0].category).toBe('Decision Making');
    expect(result[1].category).toBe('Validation');
  });
});

describe('ATTRIBUTE_TO_CATEGORIES', () => {
  it('has mappings for all five quality attributes', () => {
    expect(Object.keys(ATTRIBUTE_TO_CATEGORIES)).toEqual(
      expect.arrayContaining(['ADM', 'RA', 'RRC', 'ACC', 'RV']),
    );
  });

  it('each attribute maps to at least one category', () => {
    for (const [attr, categories] of Object.entries(ATTRIBUTE_TO_CATEGORIES)) {
      expect(categories.length).toBeGreaterThan(0);
    }
  });
});

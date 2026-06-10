'use client';

import React from 'react';
import type { DefectAvoidanceEntry } from '../../../models/audit-types';

export interface BestPracticesPanelProps {
  guidance: DefectAvoidanceEntry[];
}

const sectionStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: 8,
  padding: 20,
  border: '1px solid #e2e8f0',
};

const highlightStyle: React.CSSProperties = {
  backgroundColor: '#fffbeb',
  border: '1px solid #fde68a',
  borderRadius: 6,
  padding: 12,
  marginBottom: 12,
};

export function BestPracticesPanel({ guidance }: BestPracticesPanelProps) {
  if (guidance.length === 0) {
    return (
      <section style={sectionStyle} aria-label="Best practices">
        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>
          Best Practices &amp; Defect Avoidance
        </h3>
        <p style={{ color: '#94a3b8', fontSize: 13 }}>No errors recorded — no guidance needed.</p>
      </section>
    );
  }

  return (
    <section style={sectionStyle} aria-label="Best practices and defect avoidance guidance">
      <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>
        Best Practices &amp; Defect Avoidance
      </h3>

      {guidance.map((entry, idx) => (
        <div key={`${entry.category}-${idx}`} style={highlightStyle}>
          <h4 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 600, color: '#92400e' }}>
            {entry.category}
          </h4>
          {entry.reasons.length > 0 && (
            <ul style={{ margin: '0 0 8px', paddingLeft: 20, listStyle: 'disc' }}>
              {entry.reasons.map((reason, ri) => (
                <li key={ri} style={{ fontSize: 12, color: '#78350f', marginBottom: 2 }}>
                  {reason}
                </li>
              ))}
            </ul>
          )}
          <p style={{ margin: 0, fontSize: 13, color: '#1e293b', fontWeight: 500 }}>
            💡 {entry.avoidancePointer}
          </p>
        </div>
      ))}
    </section>
  );
}

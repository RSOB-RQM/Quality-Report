'use client';

import React from 'react';
import type { DisruptionBreakdown } from '../../../models/audit-types';

export interface DisruptionBreakdownTableProps {
  breakdowns: DisruptionBreakdown[];
}

const sectionStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: 8,
  padding: 20,
  border: '1px solid #e2e8f0',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  fontSize: 12,
  fontWeight: 600,
  color: '#ffffff',
  backgroundColor: '#1e40af',
};

const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
  fontSize: 13,
  borderBottom: '1px solid #f1f5f9',
};

export function DisruptionBreakdownTable({ breakdowns }: DisruptionBreakdownTableProps) {
  return (
    <section style={sectionStyle} aria-label="Disruption type breakdown">
      <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>
        Disruption Type Breakdown
      </h3>

      {breakdowns.length === 0 ? (
        <p style={{ color: '#94a3b8', fontSize: 13 }}>No defects recorded by disruption type.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }} aria-label="Defect counts by disruption type">
          <thead>
            <tr>
              <th style={thStyle}>Disruption Type</th>
              <th style={thStyle}>Sub-Disruption</th>
              <th style={thStyle}>Defects</th>
              <th style={thStyle}>Errors</th>
            </tr>
          </thead>
          <tbody>
            {breakdowns.map((b, idx) => (
              <tr key={`${b.disruptionType}-${b.subDisruptionType}-${idx}`}>
                <td style={tdStyle}>{b.disruptionType}</td>
                <td style={tdStyle}>{b.subDisruptionType}</td>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{b.defectCount}</td>
                <td style={tdStyle}>{b.errorCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

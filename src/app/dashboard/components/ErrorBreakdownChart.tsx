'use client';

import React from 'react';
import type { ErrorCategoryBreakdown } from '../../../models/audit-types';
import { CsvDownloadButton } from './CsvDownload';

export interface ErrorBreakdownChartProps {
  breakdown: ErrorCategoryBreakdown;
}

const ATTR_TOOLTIPS: Record<string, string> = {
  ADM: 'Associate Decision Making — Was SW followed for add/cancel/deny decision?',
  RA: 'SW Adherence - Right Action — Was the right action taken per SW outcome?',
  RRC: 'Right Reason Code — Was the right reason code used?',
  ACC: 'Accurate & Complete Communication — Was required info shared with site?',
  RV: 'Required Validation — Did associate do all necessary checks?',
};

const ATTR_COLORS: Record<string, string> = {
  ADM: '#7c3aed',
  RA: '#2563eb',
  RRC: '#dc2626',
  ACC: '#d97706',
  RV: '#059669',
};

const ATTR_GRADIENT: Record<string, string> = {
  ADM: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
  RA: 'linear-gradient(90deg, #2563eb, #60a5fa)',
  RRC: 'linear-gradient(90deg, #dc2626, #f87171)',
  ACC: 'linear-gradient(90deg, #d97706, #fbbf24)',
  RV: 'linear-gradient(90deg, #059669, #34d399)',
};

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

export function ErrorBreakdownChart({ breakdown }: ErrorBreakdownChartProps) {
  const { attributeErrors } = breakdown;
  const totalErrors = attributeErrors.reduce((s, a) => s + a.count, 0);
  const maxCount = attributeErrors.length > 0 ? attributeErrors[0].count : 0;

  const csvHeaders = ['Attribute', 'Count', 'Percentage'];
  const csvRows = attributeErrors.map((entry) => {
    const pct = totalErrors > 0 ? Math.round((entry.count / totalErrors) * 10000) / 100 : 0;
    return [entry.attribute, entry.count, `${pct}%`];
  });

  return (
    <section style={sectionStyle} aria-label="Error attribute breakdown">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
          Error Attribute Breakdown
        </h3>
        <CsvDownloadButton filename="error-breakdown.csv" headers={csvHeaders} rows={csvRows} />
      </div>

      {attributeErrors.length === 0 ? (
        <p style={{ color: '#94a3b8', fontSize: 13 }}>No errors recorded.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', borderRadius: 6, overflow: 'hidden' }} aria-label="Error frequency by attribute">
          <thead>
            <tr>
              <th style={{ ...thStyle, borderRadius: '6px 0 0 0' }}>Attribute</th>
              <th style={thStyle}>Count</th>
              <th style={thStyle}>%</th>
              <th style={{ ...thStyle, width: '40%', borderRadius: '0 6px 0 0' }}>Frequency</th>
            </tr>
          </thead>
          <tbody>
            {attributeErrors.map((entry, idx) => {
              const pct = totalErrors > 0 ? Math.round((entry.count / totalErrors) * 10000) / 100 : 0;
              const barWidth = maxCount > 0 ? (entry.count / maxCount) * 100 : 0;
              const color = ATTR_COLORS[entry.attribute] ?? '#3b82f6';
              const gradient = ATTR_GRADIENT[entry.attribute] ?? `linear-gradient(90deg, ${color}, ${color})`;
              return (
                <tr key={entry.attribute} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                  <td style={tdStyle} title={ATTR_TOOLTIPS[entry.attribute] ?? entry.attribute}>
                    <span style={{ fontWeight: 600, color }}>{entry.attribute}</span>
                  </td>
                  <td style={tdStyle}>{entry.count}</td>
                  <td style={tdStyle}>{pct}%</td>
                  <td style={tdStyle}>
                    <div
                      style={{
                        height: 18,
                        width: `${barWidth}%`,
                        background: gradient,
                        borderRadius: 4,
                        minWidth: entry.count > 0 ? 4 : 0,
                      }}
                      role="img"
                      aria-label={`${entry.attribute}: ${entry.count} errors (${pct}%)`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}

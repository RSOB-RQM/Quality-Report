'use client';

import React from 'react';
import type { WeekSummaryTableRow } from '../../../models/dashboard-types';
import { CsvDownloadButton } from './CsvDownload';

export interface WeekSummaryTableProps {
  rows: WeekSummaryTableRow[];
}

const sectionStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: 8,
  padding: 20,
  border: '1px solid #e2e8f0',
};

const thStyle: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: 12,
  fontWeight: 600,
  color: '#ffffff',
  backgroundColor: '#1e40af',
  textAlign: 'center',
};

const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
  fontSize: 13,
  borderBottom: '1px solid #f1f5f9',
  textAlign: 'center',
};

const metricTdStyle: React.CSSProperties = {
  ...tdStyle,
  textAlign: 'left',
  fontWeight: 600,
  color: '#1e293b',
};

function rateColor(rateStr: string): string {
  const num = parseFloat(rateStr);
  if (isNaN(num)) return '#1e293b';
  if (num <= 5) return '#059669';
  if (num <= 10) return '#d97706';
  return '#dc2626';
}

function rateBg(rateStr: string): string {
  const num = parseFloat(rateStr);
  if (isNaN(num)) return 'transparent';
  if (num <= 5) return '#ecfdf5';
  if (num <= 10) return '#fffbeb';
  return '#fef2f2';
}

export function WeekSummaryTable({ rows }: WeekSummaryTableProps) {
  if (rows.length === 0 || rows[0].values.length === 0) {
    return (
      <section style={sectionStyle} aria-label="Week summary table">
        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>Week-wise Summary</h3>
        <p style={{ color: '#94a3b8', fontSize: 13 }}>No weekly data available.</p>
      </section>
    );
  }

  const weeks = rows[0].values.map((v) => v.week);

  const csvHeaders = ['Metric', ...weeks.map((w) => `WK ${w}`)];
  const csvRows = rows.map((row) => [row.metric, ...row.values.map((v) => v.value)]);

  return (
    <section style={sectionStyle} aria-label="Week summary table">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Week-wise Summary</h3>
        <CsvDownloadButton filename="week-summary.csv" headers={csvHeaders} rows={csvRows} />
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }} aria-label="Metrics across weeks">
          <thead>
            <tr>
              <th style={{ ...thStyle, textAlign: 'left', borderRadius: '6px 0 0 0' }}>Metric</th>
              {weeks.map((w, i) => (
                <th key={w} style={{ ...thStyle, ...(i === weeks.length - 1 ? { borderRadius: '0 6px 0 0' } : {}) }}>WK {w}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => {
              const isRate = row.metric.toLowerCase().includes('rate');
              return (
                <tr key={row.metric} style={{ backgroundColor: rowIdx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                  <td style={metricTdStyle}>{row.metric}</td>
                  {row.values.map((v) => {
                    const valStr = String(v.value);
                    return (
                      <td
                        key={v.week}
                        style={{
                          ...tdStyle,
                          fontWeight: isRate ? 600 : 400,
                          color: isRate ? rateColor(valStr) : '#1e293b',
                          backgroundColor: isRate ? rateBg(valStr) : 'transparent',
                        }}
                      >
                        {valStr}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

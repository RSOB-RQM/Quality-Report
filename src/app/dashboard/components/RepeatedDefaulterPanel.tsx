'use client';

import React from 'react';
import type { RepeatedDefaulter } from '../../../models/dashboard-types';
import { CsvDownloadButton } from './CsvDownload';

export interface RepeatedDefaulterPanelProps {
  defaulters: RepeatedDefaulter[];
}

const sectionStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: 8,
  padding: 20,
  border: '1px solid #fecaca',
  borderLeft: '4px solid #dc2626',
};

const thStyle: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: 12,
  fontWeight: 600,
  color: '#ffffff',
  backgroundColor: '#dc2626',
  textAlign: 'center',
};

const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
  fontSize: 13,
  borderBottom: '1px solid #f1f5f9',
  textAlign: 'center',
};

export function RepeatedDefaulterPanel({ defaulters }: RepeatedDefaulterPanelProps) {
  if (defaulters.length === 0) {
    return (
      <section style={sectionStyle} aria-label="Repeated defaulters">
        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600, color: '#dc2626' }}>Repeated Defaulters</h3>
        <p style={{ color: '#94a3b8', fontSize: 13 }}>No repeated defaulters found — great team performance!</p>
      </section>
    );
  }

  // Collect all weeks across all defaulters
  const allWeeks = [...new Set(defaulters.flatMap((d) => d.weeklyDefects.map((w) => w.week)))].sort((a, b) => a - b);

  const csvHeaders = ['Associate', 'Weeks with Defects', ...allWeeks.map((w) => `WK ${w}`)];
  const csvRows = defaulters.map((d) => {
    const weekMap = new Map(d.weeklyDefects.map((w) => [w.week, w.defectCount]));
    return [
      d.associateLogin,
      d.totalWeeksWithDefects,
      ...allWeeks.map((w) => weekMap.get(w) ?? 0),
    ];
  });

  return (
    <section style={sectionStyle} aria-label="Repeated defaulters">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#dc2626' }}>Repeated Defaulters</h3>
        <CsvDownloadButton filename="repeated-defaulters.csv" headers={csvHeaders} rows={csvRows} />
      </div>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
        Associates with defects in 3 or more of the last 5 weeks (rolling)
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', borderRadius: 6, overflow: 'hidden' }} aria-label="Repeated defaulter details">
          <thead>
            <tr>
              <th style={{ ...thStyle, textAlign: 'left', borderRadius: '6px 0 0 0' }}>Associate</th>
              <th style={thStyle}>Weeks</th>
              {allWeeks.map((w, i) => (
                <th key={w} style={{ ...thStyle, ...(i === allWeeks.length - 1 ? { borderRadius: '0 6px 0 0' } : {}) }}>WK {w}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {defaulters.map((d) => {
              const weekMap = new Map(d.weeklyDefects.map((w) => [w.week, w.defectCount]));
              return (
                <tr key={d.associateLogin} style={{ backgroundColor: '#fef2f2' }}>
                  <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 600 }}>{d.associateLogin}</td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: '#dc2626' }}>{d.totalWeeksWithDefects}</td>
                  {allWeeks.map((w) => {
                    const count = weekMap.get(w) ?? 0;
                    return (
                      <td
                        key={w}
                        style={{
                          ...tdStyle,
                          fontWeight: count > 0 ? 600 : 400,
                          color: count > 0 ? '#dc2626' : '#94a3b8',
                        }}
                      >
                        {count > 0 ? count : '—'}
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

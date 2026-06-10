'use client';

import React, { useState, useMemo } from 'react';
import type { ErrorDetailRecord } from '../../../models/dashboard-types';
import { CsvDownloadButton } from './CsvDownload';

export interface ErrorDetailTableProps {
  records: ErrorDetailRecord[];
}

const QUALITY_ATTRIBUTES = ['All', 'ADM', 'RA', 'RRC', 'ACC', 'RV'] as const;

const ATTR_FULL_NAMES: Record<string, string> = {
  ADM: 'Associate Decision Making',
  RA: 'SW Adherence - Right Action',
  RRC: 'Right Reason Code',
  ACC: 'Accurate & Complete Communication',
  RV: 'Required Validation',
};

const ATTR_QUESTIONS: Record<string, string> = {
  ADM: 'Was SW followed for add/cancel/deny decision?',
  RA: 'Was the right action taken per SW outcome?',
  RRC: 'Was the right reason code used?',
  ACC: 'Was required info shared with site?',
  RV: 'Did associate do all necessary checks?',
};

const ATTR_COLORS: Record<string, string> = {
  ADM: '#7c3aed',
  RA: '#2563eb',
  RRC: '#dc2626',
  ACC: '#d97706',
  RV: '#059669',
};

const ATTR_BG: Record<string, string> = {
  ADM: '#f5f3ff',
  RA: '#eff6ff',
  RRC: '#fef2f2',
  ACC: '#fffbeb',
  RV: '#ecfdf5',
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
  verticalAlign: 'top',
};

const selectStyle: React.CSSProperties = {
  padding: '6px 10px',
  border: '1px solid #e2e8f0',
  borderRadius: 6,
  fontSize: 13,
  backgroundColor: '#fff',
};

const inputStyle: React.CSSProperties = {
  padding: '6px 10px',
  border: '1px solid #e2e8f0',
  borderRadius: 6,
  fontSize: 13,
  width: 70,
};

export function ErrorDetailTable({ records }: ErrorDetailTableProps) {
  const [attrFilter, setAttrFilter] = useState<string>('All');
  const [weekStart, setWeekStart] = useState<string>('');
  const [weekEnd, setWeekEnd] = useState<string>('');

  const filtered = useMemo(() => {
    let result = records;
    if (attrFilter !== 'All') {
      result = result.filter((r) => r.failedAttributes.includes(attrFilter));
    }
    const start = weekStart ? parseInt(weekStart, 10) : NaN;
    const end = weekEnd ? parseInt(weekEnd, 10) : NaN;
    if (!isNaN(start)) {
      result = result.filter((r) => r.transactionWeek >= start);
    }
    if (!isNaN(end)) {
      result = result.filter((r) => r.transactionWeek <= end);
    }
    return result;
  }, [records, attrFilter, weekStart, weekEnd]);

  // Breakdown counts
  const breakdownCounts: Record<string, number> = {};
  for (const r of filtered) {
    for (const attr of r.failedAttributes) {
      breakdownCounts[attr] = (breakdownCounts[attr] ?? 0) + 1;
    }
  }

  const csvErrorHeaders = ['Week', 'Date', 'Disruption Type', 'Failed Attributes', 'Findings'];
  const csvErrorRows = filtered.map((r) => [
    r.transactionWeek,
    r.transactionDate,
    r.disruptionType,
    r.failedAttributes.join(', '),
    r.findings.map((f) => `${f.attribute}: ${f.finding}`).join('; '),
  ]);

  return (
    <section style={sectionStyle} aria-label="Error detail log">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Error Detail Log</h3>
        <CsvDownloadButton filename="error-detail.csv" headers={csvErrorHeaders} rows={csvErrorRows} />
      </div>

      {/* Summary */}
      <div style={{ marginBottom: 12, fontSize: 13, color: '#475569' }}>
        <strong>{filtered.length}</strong> error record{filtered.length !== 1 ? 's' : ''}
        {Object.keys(breakdownCounts).length > 0 && (
          <span>
            {' — '}
            {Object.entries(breakdownCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([attr, count]) => `${attr}: ${count}`)
              .join(', ')}
          </span>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
        <label style={{ fontSize: 13, color: '#64748b' }}>
          Attribute:{' '}
          <select
            style={selectStyle}
            value={attrFilter}
            onChange={(e) => setAttrFilter(e.target.value)}
            aria-label="Filter by quality attribute"
          >
            {QUALITY_ATTRIBUTES.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </label>
        <label style={{ fontSize: 13, color: '#64748b' }}>
          Week from:{' '}
          <input
            type="number"
            style={inputStyle}
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            placeholder="1"
            min={1}
            max={52}
            aria-label="Start week filter"
          />
        </label>
        <label style={{ fontSize: 13, color: '#64748b' }}>
          to:{' '}
          <input
            type="number"
            style={inputStyle}
            value={weekEnd}
            onChange={(e) => setWeekEnd(e.target.value)}
            placeholder="52"
            min={1}
            max={52}
            aria-label="End week filter"
          />
        </label>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <p style={{ color: '#94a3b8', fontSize: 13 }}>No errors match the selected filters.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }} aria-label="Error detail records">
            <thead>
              <tr>
                <th style={thStyle}>Week</th>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Disruption Type</th>
                <th style={thStyle}>Failed Attributes</th>
                <th style={thStyle}>Auditor Findings</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, idx) => (
                <tr key={`${r.transactionWeek}-${r.transactionDate}-${idx}`}>
                  <td style={tdStyle}>{r.transactionWeek}</td>
                  <td style={tdStyle}>{r.transactionDate}</td>
                  <td style={tdStyle}>{r.disruptionType}</td>
                  <td style={tdStyle}>
                    {r.failedAttributes.map((attr) => (
                      <span
                        key={attr}
                        title={`${ATTR_FULL_NAMES[attr] ?? attr} — ${ATTR_QUESTIONS[attr] ?? ''}`}
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          marginRight: 4,
                          marginBottom: 2,
                          borderRadius: 4,
                          backgroundColor: ATTR_BG[attr] ?? '#fef2f2',
                          color: ATTR_COLORS[attr] ?? '#dc2626',
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {attr}
                      </span>
                    ))}
                  </td>
                  <td style={tdStyle}>
                    {r.findings.length === 0 ? (
                      <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>
                    ) : (
                      <ul style={{ margin: 0, paddingLeft: 16, listStyle: 'disc' }}>
                        {r.findings.map((f, fi) => (
                          <li key={fi} style={{ fontSize: 12, marginBottom: 2 }}>
                            <strong>{f.attribute}:</strong> {f.finding}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

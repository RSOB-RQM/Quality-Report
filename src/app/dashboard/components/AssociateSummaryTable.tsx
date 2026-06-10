'use client';

import React, { useState, useMemo } from 'react';
import type { AssociateSummaryRow, RepeatedDefaulter } from '../../../models/dashboard-types';
import { CsvDownloadButton } from './CsvDownload';

export interface AssociateSummaryTableProps {
  summaries: AssociateSummaryRow[];
  repeatedDefaulters: RepeatedDefaulter[];
}

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
  cursor: 'pointer',
  userSelect: 'none',
};

const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
  fontSize: 13,
  borderBottom: '1px solid #f1f5f9',
};

function rateColor(rate: number): string {
  if (rate <= 5) return '#059669';
  if (rate <= 10) return '#d97706';
  return '#dc2626';
}

function rateBg(rate: number): string {
  if (rate <= 5) return '#ecfdf5';
  if (rate <= 10) return '#fffbeb';
  return '#fef2f2';
}

const trendIcons: Record<string, { icon: string; color: string }> = {
  improving: { icon: '↓', color: '#059669' },
  regressing: { icon: '↑', color: '#dc2626' },
  stable: { icon: '—', color: '#64748b' },
};

type SortKey = 'associateLogin' | 'totalAudits' | 'totalDefects' | 'defectRate';

export function AssociateSummaryTable({ summaries, repeatedDefaulters }: AssociateSummaryTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('defectRate');
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const defaulterLogins = useMemo(
    () => new Set(repeatedDefaulters.map((d) => d.associateLogin)),
    [repeatedDefaulters],
  );

  const sorted = useMemo(() => {
    const arr = [...summaries];
    arr.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return arr;
  }, [summaries, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return '';
    return sortAsc ? ' ▲' : ' ▼';
  };

  const toggleExpand = (login: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(login)) next.delete(login);
      else next.add(login);
      return next;
    });
  };

  const csvHeaders = ['Associate', 'Total Audits', 'Defects', 'Defect Rate', 'Top Errors', 'Trend'];
  const csvRows = sorted.map((row) => [
    row.associateLogin,
    row.totalAudits,
    row.totalDefects,
    `${row.defectRate}%`,
    row.errorAttributes.slice(0, 3).map((a) => `${a.attribute}(${a.count})`).join(', '),
    row.trend,
  ]);

  return (
    <section style={sectionStyle} aria-label="Associate performance summary">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1e293b' }}>Associate-wise Summary</h3>
        <CsvDownloadButton filename="associate-summary.csv" headers={csvHeaders} rows={csvRows} />
      </div>
      <p style={{ margin: '0 0 12px', fontSize: 13, color: '#64748b' }}>
        {summaries.length} associates · {summaries.reduce((s, r) => s + r.totalAudits, 0)} total audits
      </p>
      {summaries.length === 0 ? (
        <p style={{ color: '#94a3b8', fontSize: 13 }}>No associate data available.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }} aria-label="Associate performance table">
            <thead>
              <tr>
                <th style={{ ...thStyle, borderRadius: '6px 0 0 0' }} onClick={() => handleSort('associateLogin')}>
                  Associate{sortIndicator('associateLogin')}
                </th>
                <th style={thStyle} onClick={() => handleSort('totalAudits')}>
                  Total Audits{sortIndicator('totalAudits')}
                </th>
                <th style={thStyle} onClick={() => handleSort('totalDefects')}>
                  Defects{sortIndicator('totalDefects')}
                </th>
                <th style={thStyle} onClick={() => handleSort('defectRate')}>
                  Defect Rate{sortIndicator('defectRate')}
                </th>
                <th style={{ ...thStyle, cursor: 'default' }}>Top Errors</th>
                <th style={{ ...thStyle, cursor: 'default' }}>Trend</th>
                <th style={{ ...thStyle, cursor: 'default', borderRadius: '0 6px 0 0' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, idx) => {
                const isDefaulter = defaulterLogins.has(row.associateLogin);
                const isExpanded = expandedRows.has(row.associateLogin);
                const t = trendIcons[row.trend];
                const rowBg = isDefaulter
                  ? '#fef2f2'
                  : idx % 2 === 0
                    ? '#ffffff'
                    : '#f8fafc';
                return (
                  <React.Fragment key={row.associateLogin}>
                    <tr style={{ backgroundColor: rowBg }}>
                      <td style={tdStyle}>
                        {row.associateLogin}
                        {isDefaulter && (
                          <span
                            title="Repeated defaulter (defects in 3+ weeks)"
                            style={{
                              marginLeft: 6,
                              display: 'inline-block',
                              padding: '1px 6px',
                              borderRadius: 4,
                              backgroundColor: '#dc2626',
                              color: '#fff',
                              fontSize: 10,
                              fontWeight: 700,
                            }}
                          >
                            REPEAT
                          </span>
                        )}
                      </td>
                      <td style={tdStyle}>{row.totalAudits}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{row.totalDefects}</td>
                      <td
                        style={{
                          ...tdStyle,
                          fontWeight: 600,
                          color: rateColor(row.defectRate),
                          backgroundColor: rateBg(row.defectRate),
                        }}
                      >
                        {row.defectRate}%
                      </td>
                      <td style={tdStyle}>
                        {row.errorAttributes.slice(0, 3).map((a) => (
                          <span
                            key={a.attribute}
                            style={{
                              display: 'inline-block',
                              padding: '2px 6px',
                              marginRight: 4,
                              borderRadius: 4,
                              backgroundColor: ATTR_BG[a.attribute] ?? '#fef2f2',
                              color: ATTR_COLORS[a.attribute] ?? '#dc2626',
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            {a.attribute}({a.count})
                          </span>
                        ))}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 600, color: t.color }}>
                        {t.icon}
                      </td>
                      <td style={tdStyle}>
                        {row.topFindings.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => toggleExpand(row.associateLogin)}
                            style={{
                              padding: '3px 10px',
                              fontSize: 11,
                              fontWeight: 600,
                              border: '1px solid #dbeafe',
                              borderRadius: 4,
                              backgroundColor: isExpanded ? '#1e40af' : '#eff6ff',
                              color: isExpanded ? '#fff' : '#1e40af',
                              cursor: 'pointer',
                            }}
                            aria-expanded={isExpanded}
                            aria-label={`${isExpanded ? 'Hide' : 'Show'} findings for ${row.associateLogin}`}
                          >
                            {isExpanded ? 'Hide' : 'Show'} Findings
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: 11 }}>—</span>
                        )}
                      </td>
                    </tr>
                    {isExpanded && row.topFindings.length > 0 && (
                      <tr style={{ backgroundColor: '#f8fafc' }}>
                        <td colSpan={7} style={{ padding: '12px 20px', borderBottom: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 8 }}>
                            Top Auditor Findings for {row.associateLogin}:
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {row.topFindings.map((f, fi) => (
                              <div
                                key={fi}
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: 8,
                                  padding: '6px 10px',
                                  borderRadius: 6,
                                  backgroundColor: '#fff',
                                  border: '1px solid #e2e8f0',
                                }}
                              >
                                <span
                                  style={{
                                    display: 'inline-block',
                                    padding: '2px 8px',
                                    borderRadius: 4,
                                    backgroundColor: ATTR_BG[f.attribute] ?? '#f1f5f9',
                                    color: ATTR_COLORS[f.attribute] ?? '#475569',
                                    fontSize: 11,
                                    fontWeight: 700,
                                    flexShrink: 0,
                                  }}
                                >
                                  {f.attribute}
                                </span>
                                <span style={{ fontSize: 12, color: '#334155', flex: 1 }}>
                                  {f.finding}
                                </span>
                                <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>
                                  {f.count}×
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

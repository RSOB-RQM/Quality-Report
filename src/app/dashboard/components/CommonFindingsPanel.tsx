'use client';

import React from 'react';
import type { CommonFindingsResult } from '../../../models/dashboard-types';
import { CsvDownloadButton } from './CsvDownload';

export interface CommonFindingsPanelProps {
  findings: CommonFindingsResult;
}

const ATTR_FULL_NAMES: Record<string, string> = {
  ADM: 'Associate Decision Making',
  RA: 'SW Adherence - Right Action',
  RRC: 'Right Reason Code',
  ACC: 'Accurate & Complete Communication',
  RV: 'Required Validation',
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

export function CommonFindingsPanel({ findings }: CommonFindingsPanelProps) {
  if (findings.groups.length === 0) {
    return (
      <section style={sectionStyle} aria-label="Common findings">
        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>Common Findings</h3>
        <p style={{ color: '#94a3b8', fontSize: 13 }}>No errors recorded — great work!</p>
      </section>
    );
  }

  const csvFindingsHeaders = ['Attribute', 'Finding', 'Count'];
  const csvFindingsRows: (string | number)[][] = [];
  for (const group of findings.groups) {
    for (const f of group.findings) {
      csvFindingsRows.push([group.attribute, f.finding, f.count]);
    }
  }

  return (
    <section style={sectionStyle} aria-label="Common findings">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Common Findings</h3>
        <CsvDownloadButton filename="common-findings.csv" headers={csvFindingsHeaders} rows={csvFindingsRows} />
      </div>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
        {findings.totalDistinctFindings} distinct finding{findings.totalDistinctFindings !== 1 ? 's' : ''} across all attributes
      </p>

      {findings.groups.map((group) => {
        const color = ATTR_COLORS[group.attribute] ?? '#475569';
        const bg = ATTR_BG[group.attribute] ?? '#f1f5f9';
        return (
          <div key={group.attribute} style={{ marginBottom: 16 }}>
            <h4
              style={{
                margin: '0 0 8px',
                fontSize: 14,
                fontWeight: 600,
                color: '#1e293b',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
              title={ATTR_FULL_NAMES[group.attribute] ?? group.attribute}
            >
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 10px',
                  borderRadius: 4,
                  backgroundColor: bg,
                  color,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {group.attribute}
              </span>
              <span style={{ color: '#64748b', fontWeight: 400, fontSize: 13 }}>
                {ATTR_FULL_NAMES[group.attribute] ?? group.attribute}
              </span>
            </h4>
            <ul style={{ margin: 0, paddingLeft: 20, listStyle: 'disc' }}>
              {group.findings.map((f) => (
                <li key={f.finding} style={{ fontSize: 13, marginBottom: 4, color: '#334155' }}>
                  {f.finding}{' '}
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>({f.count}×)</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}

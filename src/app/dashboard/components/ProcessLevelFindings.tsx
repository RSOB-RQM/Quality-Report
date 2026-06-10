'use client';

import React from 'react';
import type { CommonFindingsResult } from '../../../models/dashboard-types';

export interface ProcessLevelFindingsProps {
  processFindings: CommonFindingsResult;
  individualFindings: CommonFindingsResult;
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

const colStyle: React.CSSProperties = {
  flex: '1 1 300px',
  minWidth: 280,
};

export function ProcessLevelFindings({ processFindings, individualFindings }: ProcessLevelFindingsProps) {
  return (
    <section style={sectionStyle} aria-label="Process vs individual findings comparison">
      <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>
        Common Defects: Process vs. Your Patterns
      </h3>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {/* Process-level */}
        <div style={colStyle}>
          <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#1e40af' }}>
            🏢 Process-Level (All Associates)
          </h4>
          {processFindings.groups.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: 13 }}>No process-level findings.</p>
          ) : (
            processFindings.groups.map((group) => (
              <div key={group.attribute} style={{ marginBottom: 12 }}>
                <h5 style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    display: 'inline-block', padding: '1px 8px', borderRadius: 4,
                    backgroundColor: ATTR_BG[group.attribute] ?? '#f1f5f9',
                    color: ATTR_COLORS[group.attribute] ?? '#475569',
                    fontSize: 11, fontWeight: 700,
                  }}>
                    {group.attribute}
                  </span>
                  {ATTR_FULL_NAMES[group.attribute] ?? group.attribute}
                </h5>
                <ul style={{ margin: 0, paddingLeft: 20, listStyle: 'disc' }}>
                  {group.findings.slice(0, 5).map((f) => (
                    <li key={f.finding} style={{ fontSize: 12, marginBottom: 2, color: '#475569' }}>
                      {f.finding} <span style={{ color: '#94a3b8' }}>({f.count}×)</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>

        {/* Individual-level */}
        <div style={colStyle}>
          <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#059669' }}>
            👤 Your Patterns
          </h4>
          {individualFindings.groups.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: 13 }}>No errors recorded — great work!</p>
          ) : (
            individualFindings.groups.map((group) => (
              <div key={group.attribute} style={{ marginBottom: 12 }}>
                <h5 style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    display: 'inline-block', padding: '1px 8px', borderRadius: 4,
                    backgroundColor: ATTR_BG[group.attribute] ?? '#f1f5f9',
                    color: ATTR_COLORS[group.attribute] ?? '#475569',
                    fontSize: 11, fontWeight: 700,
                  }}>
                    {group.attribute}
                  </span>
                  {ATTR_FULL_NAMES[group.attribute] ?? group.attribute}
                </h5>
                <ul style={{ margin: 0, paddingLeft: 20, listStyle: 'disc' }}>
                  {group.findings.map((f) => (
                    <li key={f.finding} style={{ fontSize: 12, marginBottom: 2, color: '#475569' }}>
                      {f.finding} <span style={{ color: '#94a3b8' }}>({f.count}×)</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

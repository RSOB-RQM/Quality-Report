'use client';

import React from 'react';
import type { AppealSummary } from '../../../models/audit-types';

export interface AppealSummaryCardProps {
  summary: AppealSummary;
}

const sectionStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: 8,
  padding: 20,
  border: '1px solid #e2e8f0',
};

const statBox: React.CSSProperties = {
  flex: '1 1 0',
  textAlign: 'center' as const,
  padding: 12,
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  minWidth: 100,
};

export function AppealSummaryCard({ summary }: AppealSummaryCardProps) {
  const { totalAppeals, accepted, notAccepted, pending, acceptanceRate, reAppeals } = summary;

  return (
    <section style={sectionStyle} aria-label="Appeal summary">
      <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Appeal Summary</h3>

      {totalAppeals === 0 ? (
        <p style={{ color: '#94a3b8', fontSize: 13 }}>
          No appeals filed — all counts are zero and acceptance rate is 0%.
        </p>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <div style={statBox}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Total Appeals</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{totalAppeals}</div>
            </div>
            <div style={statBox}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Accepted</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#16a34a' }}>{accepted}</div>
            </div>
            <div style={statBox}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Not Accepted</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#dc2626' }}>{notAccepted}</div>
            </div>
            <div style={statBox}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Pending</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#ca8a04' }}>{pending}</div>
            </div>
            <div style={statBox}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Acceptance Rate</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{acceptanceRate}%</div>
            </div>
          </div>

          {reAppeals.length > 0 && (
            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600 }}>Re-Appeals</h4>
              <ul style={{ margin: 0, paddingLeft: 20, listStyle: 'disc' }}>
                {reAppeals.map((ra, idx) => (
                  <li key={idx} style={{ fontSize: 12, marginBottom: 4 }}>
                    <strong>{ra.appealLeadLogin}</strong>: {ra.decision}
                    {ra.comment && ` — ${ra.comment}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}

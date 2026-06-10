'use client';

import React, { useState } from 'react';
import type { WeekAnalysis } from '../../../models/audit-types';
import type { MonthlySummary } from '../../../models/dashboard-types';

export interface PerformanceSummaryProps {
  weeklySummary: WeekAnalysis[];
  monthlySummary: MonthlySummary[];
}

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const toggleBtnBase: React.CSSProperties = {
  padding: '6px 16px',
  border: '1px solid #e2e8f0',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 500,
  backgroundColor: '#fff',
  color: '#64748b',
};

function rateColor(rate: number): string {
  if (rate <= 5) return '#059669';
  if (rate <= 10) return '#d97706';
  return '#dc2626';
}

function computeRate(defects: number, audited: number): number {
  if (audited === 0) return 0;
  return Math.round((defects / audited) * 10000) / 100;
}

const CARD_CONFIGS = [
  { key: 'audited', label: 'Total Audited', borderColor: '#1e40af' },
  { key: 'defects', label: 'Total Defects', borderColor: '#dc2626' },
  { key: 'errors', label: 'Total Errors', borderColor: '#d97706' },
  { key: 'rate', label: 'Defect Rate', borderColor: '#059669' },
];

export function PerformanceSummary({ weeklySummary, monthlySummary }: PerformanceSummaryProps) {
  const [view, setView] = useState<'weekly' | 'monthly'>('weekly');

  const items =
    view === 'weekly'
      ? weeklySummary.map((w) => ({
          label: `Week ${w.week}`,
          audited: w.totalAudited,
          defects: w.totalDefects,
          errors: w.totalErrors,
          rate: computeRate(w.totalDefects, w.totalAudited),
        }))
      : monthlySummary.map((m) => ({
          label: `${MONTH_NAMES[m.month]} ${m.year}`,
          audited: m.totalAudited,
          defects: m.totalDefects,
          errors: m.totalErrors,
          rate: m.defectRate,
        }));

  const totalAudited = items.reduce((s, i) => s + i.audited, 0);
  const totalDefects = items.reduce((s, i) => s + i.defects, 0);
  const totalErrors = items.reduce((s, i) => s + i.errors, 0);
  const overallRate = computeRate(totalDefects, totalAudited);

  const summaryValues = [totalAudited, totalDefects, totalErrors, overallRate];

  return (
    <section aria-label="Performance summary">
      {/* Toggle */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16 }} role="tablist" aria-label="View toggle">
        <button
          role="tab"
          aria-selected={view === 'weekly'}
          style={{
            ...toggleBtnBase,
            borderRadius: '6px 0 0 6px',
            ...(view === 'weekly' ? { backgroundColor: '#1e40af', color: '#fff', borderColor: '#1e40af' } : {}),
          }}
          onClick={() => setView('weekly')}
        >
          Weekly
        </button>
        <button
          role="tab"
          aria-selected={view === 'monthly'}
          style={{
            ...toggleBtnBase,
            borderRadius: '0 6px 6px 0',
            ...(view === 'monthly' ? { backgroundColor: '#1e40af', color: '#fff', borderColor: '#1e40af' } : {}),
          }}
          onClick={() => setView('monthly')}
        >
          Monthly
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        {CARD_CONFIGS.map((cfg, i) => (
          <div
            key={cfg.key}
            style={{
              backgroundColor: '#fff',
              borderRadius: 8,
              padding: 16,
              border: '1px solid #e2e8f0',
              borderTop: `3px solid ${cfg.borderColor}`,
              flex: '1 1 0',
              minWidth: 140,
            }}
          >
            <div style={{ fontSize: 12, color: '#64748b' }}>{cfg.label}</div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: cfg.key === 'rate' ? rateColor(overallRate) : '#1e293b',
              }}
            >
              {cfg.key === 'rate' ? `${summaryValues[i]}%` : summaryValues[i]}
            </div>
          </div>
        ))}
      </div>

      {/* Per-period cards */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {items.map((item) => (
          <div
            key={item.label}
            style={{
              backgroundColor: '#fff',
              borderRadius: 8,
              padding: 16,
              border: '1px solid #e2e8f0',
              borderLeft: `3px solid ${rateColor(item.rate) === '#059669' ? '#1e40af' : rateColor(item.rate)}`,
              flex: '1 1 0',
              minWidth: 160,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{item.label}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              Audited: {item.audited} · Defects: {item.defects}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: rateColor(item.rate), marginTop: 4 }}>
              {item.rate}%
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

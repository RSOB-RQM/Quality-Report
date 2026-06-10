'use client';

import React from 'react';
import type { WeekAnalysis } from '../../../models/audit-types';
import type { MonthlySummary } from '../../../models/dashboard-types';
import { CsvDownloadButton } from './CsvDownload';

export interface TrendChartProps {
  weeklySummary: WeekAnalysis[];
  monthlySummary: MonthlySummary[];
}

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function computeRate(defects: number, audited: number): number {
  if (audited === 0) return 0;
  return Math.round((defects / audited) * 10000) / 100;
}

function rateColor(rate: number): string {
  if (rate <= 5) return '#059669';
  if (rate <= 10) return '#d97706';
  return '#dc2626';
}

function trendIndicator(prev: number, curr: number): string {
  if (curr < prev) return '↓';
  if (curr > prev) return '↑';
  return '—';
}

function trendColor(prev: number, curr: number): string {
  if (curr < prev) return '#059669';
  if (curr > prev) return '#dc2626';
  return '#64748b';
}

const sectionStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: 8,
  padding: 20,
  border: '1px solid #e2e8f0',
  borderLeft: '4px solid #1e40af',
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

export function TrendChart({ weeklySummary, monthlySummary }: TrendChartProps) {
  const weeklyRates = weeklySummary.map((w) => ({
    label: `Wk ${w.week}`,
    rate: computeRate(w.totalDefects, w.totalAudited),
  }));

  const monthlyRates = monthlySummary.map((m) => ({
    label: `${MONTH_NAMES[m.month]} ${m.year}`,
    rate: m.defectRate,
  }));

  const weeklyHasMultiple = weeklyRates.length >= 2;
  const weeklyCsvHeaders = weeklyHasMultiple ? ['Period', 'Defect Rate', 'Trend'] : ['Period', 'Defect Rate'];
  const weeklyCsvRows = weeklyRates.map((item, idx) => {
    const prev = idx > 0 ? weeklyRates[idx - 1].rate : null;
    const trend = prev !== null ? trendIndicator(prev, item.rate) : '—';
    const row: (string | number)[] = [item.label, `${item.rate}%`];
    if (weeklyHasMultiple) row.push(trend);
    return row;
  });

  const monthlyHasMultiple = monthlyRates.length >= 2;
  const monthlyCsvHeaders = monthlyHasMultiple ? ['Period', 'Defect Rate', 'Trend'] : ['Period', 'Defect Rate'];
  const monthlyCsvRows = monthlyRates.map((item, idx) => {
    const prev = idx > 0 ? monthlyRates[idx - 1].rate : null;
    const trend = prev !== null ? trendIndicator(prev, item.rate) : '—';
    const row: (string | number)[] = [item.label, `${item.rate}%`];
    if (monthlyHasMultiple) row.push(trend);
    return row;
  });

  return (
    <section style={sectionStyle} aria-label="Defect rate trends">
      <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Defect Rate Trends</h3>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {/* Weekly trend */}
        <div style={{ flex: '1 1 300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1e40af' }}>Week-over-Week</h4>
            {weeklyRates.length > 0 && (
              <CsvDownloadButton filename="trend-weekly.csv" headers={weeklyCsvHeaders} rows={weeklyCsvRows} />
            )}
          </div>
          {weeklyRates.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: 13 }}>No weekly data available.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', borderRadius: 6, overflow: 'hidden' }} aria-label="Weekly defect rate trend">
              <thead>
                <tr>
                  <th style={thStyle}>Period</th>
                  <th style={thStyle}>Defect Rate</th>
                  {weeklyRates.length >= 2 && <th style={thStyle}>Trend</th>}
                </tr>
              </thead>
              <tbody>
                {weeklyRates.map((item, idx) => {
                  const prev = idx > 0 ? weeklyRates[idx - 1].rate : null;
                  return (
                    <tr key={item.label} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                      <td style={tdStyle}>{item.label}</td>
                      <td style={{ ...tdStyle, fontWeight: 600, color: rateColor(item.rate) }}>
                        {item.rate}%
                      </td>
                      {weeklyRates.length >= 2 && (
                        <td
                          style={{
                            ...tdStyle,
                            fontWeight: 600,
                            color: prev !== null ? trendColor(prev, item.rate) : '#64748b',
                          }}
                        >
                          {prev !== null ? trendIndicator(prev, item.rate) : '—'}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Monthly trend */}
        <div style={{ flex: '1 1 300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1e40af' }}>Month-over-Month</h4>
            {monthlyRates.length > 0 && (
              <CsvDownloadButton filename="trend-monthly.csv" headers={monthlyCsvHeaders} rows={monthlyCsvRows} />
            )}
          </div>
          {monthlyRates.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: 13 }}>No monthly data available.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', borderRadius: 6, overflow: 'hidden' }} aria-label="Monthly defect rate trend">
              <thead>
                <tr>
                  <th style={thStyle}>Period</th>
                  <th style={thStyle}>Defect Rate</th>
                  {monthlyRates.length >= 2 && <th style={thStyle}>Trend</th>}
                </tr>
              </thead>
              <tbody>
                {monthlyRates.map((item, idx) => {
                  const prev = idx > 0 ? monthlyRates[idx - 1].rate : null;
                  return (
                    <tr key={item.label} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                      <td style={tdStyle}>{item.label}</td>
                      <td style={{ ...tdStyle, fontWeight: 600, color: rateColor(item.rate) }}>
                        {item.rate}%
                      </td>
                      {monthlyRates.length >= 2 && (
                        <td
                          style={{
                            ...tdStyle,
                            fontWeight: 600,
                            color: prev !== null ? trendColor(prev, item.rate) : '#64748b',
                          }}
                        >
                          {prev !== null ? trendIndicator(prev, item.rate) : '—'}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}

'use client';

import React, { useState, useCallback } from 'react';
import type { WeekComparisonResult } from '../../../models/dashboard-types';

export interface WeekComparisonViewProps {
  availableWeeks: number[];
}

const sectionStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: 8,
  padding: 20,
  border: '1px solid #e2e8f0',
};

const selectStyle: React.CSSProperties = {
  padding: '6px 10px',
  border: '1px solid #e2e8f0',
  borderRadius: 6,
  fontSize: 13,
  backgroundColor: '#fff',
};

const btnStyle: React.CSSProperties = {
  padding: '6px 16px',
  backgroundColor: '#1e40af',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 500,
};

const colStyle: React.CSSProperties = {
  flex: '1 1 0',
  padding: 16,
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  minWidth: 200,
};

const statLabel: React.CSSProperties = { fontSize: 12, color: '#64748b', marginBottom: 2 };
const statValue: React.CSSProperties = { fontSize: 20, fontWeight: 700, marginBottom: 12 };

function computeRate(defects: number, audited: number): number {
  if (audited === 0) return 0;
  return Math.round((defects / audited) * 10000) / 100;
}

function rateColor(rate: number): string {
  if (rate <= 5) return '#16a34a';
  if (rate <= 7) return '#ca8a04';
  return '#dc2626';
}

export function WeekComparisonView({ availableWeeks }: WeekComparisonViewProps) {
  const [weekA, setWeekA] = useState<string>(availableWeeks.length > 0 ? String(availableWeeks[0]) : '');
  const [weekB, setWeekB] = useState<string>(availableWeeks.length > 1 ? String(availableWeeks[1]) : '');
  const [result, setResult] = useState<WeekComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compare = useCallback(async () => {
    if (!weekA || !weekB) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/compare?weekA=${weekA}&weekB=${weekB}`);
      if (!res.ok) throw new Error(`Comparison failed (${res.status})`);
      const json: WeekComparisonResult = await res.json();
      setResult(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Comparison failed.');
    } finally {
      setLoading(false);
    }
  }, [weekA, weekB]);

  const directionLabel = result
    ? result.direction === 'improvement'
      ? { text: `↓ ${Math.abs(result.defectRateDelta)}pp improvement`, color: '#16a34a' }
      : result.direction === 'regression'
        ? { text: `↑ ${Math.abs(result.defectRateDelta)}pp regression`, color: '#dc2626' }
        : { text: 'Unchanged', color: '#64748b' }
    : null;

  return (
    <section style={sectionStyle} aria-label="Week-over-week comparison">
      <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Week Comparison</h3>

      {/* Selectors */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
        <label style={{ fontSize: 13, color: '#64748b' }}>
          Week A:{' '}
          <select style={selectStyle} value={weekA} onChange={(e) => setWeekA(e.target.value)} aria-label="Select first week">
            {availableWeeks.map((w) => (
              <option key={w} value={w}>Week {w}</option>
            ))}
          </select>
        </label>
        <label style={{ fontSize: 13, color: '#64748b' }}>
          Week B:{' '}
          <select style={selectStyle} value={weekB} onChange={(e) => setWeekB(e.target.value)} aria-label="Select second week">
            {availableWeeks.map((w) => (
              <option key={w} value={w}>Week {w}</option>
            ))}
          </select>
        </label>
        <button type="button" style={btnStyle} onClick={compare} disabled={loading || !weekA || !weekB} aria-label="Compare selected weeks">
          {loading ? 'Comparing…' : 'Compare'}
        </button>
      </div>

      {error && <p style={{ color: '#ef4444', fontSize: 13 }}>{error}</p>}

      {result && (
        <>
          {/* Delta indicator */}
          {directionLabel && (
            <div
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                backgroundColor: directionLabel.color === '#16a34a' ? '#f0fdf4' : directionLabel.color === '#dc2626' ? '#fef2f2' : '#f8fafc',
                color: directionLabel.color,
                fontWeight: 600,
                fontSize: 14,
                marginBottom: 16,
                display: 'inline-block',
              }}
              aria-live="polite"
            >
              {directionLabel.text}
            </div>
          )}

          {/* Side-by-side */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[result.weekA, result.weekB].map((side) => {
              const rate = computeRate(side.summary.totalDefects, side.summary.totalAudited);
              return (
                <div key={side.week} style={colStyle}>
                  <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>Week {side.week}</h4>
                  <div style={statLabel}>Defect Rate</div>
                  <div style={{ ...statValue, color: rateColor(rate) }}>{rate}%</div>
                  <div style={statLabel}>Audited</div>
                  <div style={statValue}>{side.summary.totalAudited}</div>
                  <div style={statLabel}>Defects</div>
                  <div style={statValue}>{side.summary.totalDefects}</div>
                  <div style={statLabel}>Errors</div>
                  <div style={statValue}>{side.summary.totalErrors}</div>

                  {side.breakdown.attributeErrors.length > 0 && (
                    <>
                      <div style={{ ...statLabel, marginTop: 8 }}>Error Breakdown</div>
                      <ul style={{ margin: 0, paddingLeft: 16, listStyle: 'disc' }}>
                        {side.breakdown.attributeErrors.map((ae) => (
                          <li key={ae.attribute} style={{ fontSize: 12, marginBottom: 2 }}>
                            {ae.attribute}: {ae.count}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

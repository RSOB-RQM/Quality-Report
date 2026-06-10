'use client';

import React from 'react';
import type { WeekAnalysis } from '../../../models/audit-types';
import type { ErrorCategoryBreakdown } from '../../../models/audit-types';
import type { RepeatedDefaulter } from '../../../models/dashboard-types';

export interface InsightsPanelProps {
  weeklySummary: WeekAnalysis[];
  errorBreakdown: ErrorCategoryBreakdown;
  repeatedDefaulters: RepeatedDefaulter[];
  /** If true, show personalized language (for associate view) */
  personalized?: boolean;
}

const sectionStyle: React.CSSProperties = {
  backgroundColor: '#eff6ff',
  borderRadius: 8,
  padding: 16,
  border: '1px solid #93c5fd',
  borderLeft: '4px solid #1e40af',
};

const bulletStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#1e293b',
  marginBottom: 6,
  lineHeight: 1.5,
};

function computeRate(defects: number, audited: number): number {
  if (audited === 0) return 0;
  return Math.round((defects / audited) * 10000) / 100;
}

export function InsightsPanel({ weeklySummary, errorBreakdown, repeatedDefaulters, personalized }: InsightsPanelProps) {
  const insights: string[] = [];

  // 1. Defect rate trend over last 4 weeks (or all if fewer)
  if (weeklySummary.length >= 2) {
    const sorted = [...weeklySummary].sort((a, b) => a.week - b.week);
    const recent = sorted.slice(-4);
    const first = recent[0];
    const last = recent[recent.length - 1];
    const firstRate = computeRate(first.totalDefects, first.totalAudited);
    const lastRate = computeRate(last.totalDefects, last.totalAudited);
    if (lastRate < firstRate) {
      insights.push(`Defect rate trending ↓ from ${firstRate}% to ${lastRate}% over the last ${recent.length} weeks`);
    } else if (lastRate > firstRate) {
      insights.push(`Defect rate trending ↑ from ${firstRate}% to ${lastRate}% over the last ${recent.length} weeks`);
    } else {
      insights.push(`Defect rate stable at ${lastRate}% over the last ${recent.length} weeks`);
    }
  } else if (weeklySummary.length === 1) {
    const rate = computeRate(weeklySummary[0].totalDefects, weeklySummary[0].totalAudited);
    insights.push(`Current defect rate: ${rate}%`);
  }

  // 2. Top defect category
  const { attributeErrors } = errorBreakdown;
  if (attributeErrors.length > 0) {
    const totalErrors = attributeErrors.reduce((s, a) => s + a.count, 0);
    const top = attributeErrors[0];
    const pct = totalErrors > 0 ? Math.round((top.count / totalErrors) * 100) : 0;
    insights.push(`Top defect category: ${top.attribute} (${pct}% of all errors)`);
  }

  // 3. Repeated defaulters
  if (!personalized && repeatedDefaulters.length > 0) {
    insights.push(`${repeatedDefaulters.length} associate${repeatedDefaulters.length !== 1 ? 's' : ''} with repeated defects across 3+ weeks`);
  }

  // 4. Total audited / defects summary
  if (weeklySummary.length > 0) {
    const totalAudited = weeklySummary.reduce((s, w) => s + w.totalAudited, 0);
    const totalDefects = weeklySummary.reduce((s, w) => s + w.totalDefects, 0);
    const overallRate = computeRate(totalDefects, totalAudited);
    insights.push(`${totalAudited} total audits, ${totalDefects} defects (${overallRate}% overall rate)`);
  }

  if (insights.length === 0) return null;

  return (
    <section style={sectionStyle} aria-label="Key insights">
      <h3 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 600, color: '#1e40af' }}>
        💡 {personalized ? 'Your Insights' : 'Key Insights'}
      </h3>
      <ul style={{ margin: 0, paddingLeft: 20, listStyle: 'disc' }}>
        {insights.map((text, i) => (
          <li key={i} style={bulletStyle}>{text}</li>
        ))}
      </ul>
    </section>
  );
}

'use client';

import React from 'react';

export interface WeekMonthSelectorProps {
  availableWeeks: number[];
  availableMonths: number[];
  selectedWeeks: number[];
  selectedMonth: number | null;
  onWeeksChange: (weeks: number[]) => void;
  onMonthChange: (month: number | null) => void;
  /** Label for the current week preset, e.g. "Last 4 Weeks" */
  weekPreset: string;
  onWeekPresetChange: (preset: string) => void;
  selectedRegion: string;
  onRegionChange: (region: string) => void;
  availableRegions: string[];
}

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const containerStyle: React.CSSProperties = {
  display: 'flex',
  gap: 16,
  alignItems: 'center',
  flexWrap: 'wrap',
  padding: '12px 16px',
  backgroundColor: '#fff',
  borderRadius: 8,
  border: '1px solid #e2e8f0',
};

const selectStyle: React.CSSProperties = {
  padding: '7px 12px',
  border: '1px solid #dbeafe',
  borderRadius: 6,
  fontSize: 13,
  backgroundColor: '#fff',
  cursor: 'pointer',
  minWidth: 160,
  color: '#1e293b',
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#64748b',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

export function WeekMonthSelector({
  availableWeeks,
  availableMonths,
  selectedWeeks,
  selectedMonth,
  onWeeksChange,
  onMonthChange,
  weekPreset,
  onWeekPresetChange,
  selectedRegion,
  onRegionChange,
  availableRegions,
}: WeekMonthSelectorProps) {

  const handleWeekPreset = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onWeekPresetChange(val);
    onMonthChange(null);

    if (val === 'all') {
      onWeeksChange([]);
    } else if (val === 'last4') {
      const last4 = availableWeeks.slice(-4);
      onWeeksChange(last4);
    } else if (val === 'last8') {
      const last8 = availableWeeks.slice(-8);
      onWeeksChange(last8);
    } else if (val.startsWith('week-')) {
      const weekNum = parseInt(val.replace('week-', ''), 10);
      if (!isNaN(weekNum)) {
        if (selectedWeeks.includes(weekNum)) {
          const next = selectedWeeks.filter((w) => w !== weekNum);
          onWeeksChange(next);
        } else {
          onWeeksChange([...selectedWeeks, weekNum].sort((a, b) => a - b));
        }
      }
    }
  };

  const handleMonthSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '') {
      onMonthChange(null);
    } else {
      onMonthChange(parseInt(val, 10));
      onWeeksChange([]);
      onWeekPresetChange('all');
    }
  };

  return (
    <div style={containerStyle} aria-label="Week and month filter">
      <span style={{ fontSize: 13, fontWeight: 600, color: '#1e40af' }}>Filters:</span>

      {/* Region dropdown */}
      <label style={labelStyle}>
        Region:
        <select
          style={selectStyle}
          value={selectedRegion}
          onChange={(e) => onRegionChange(e.target.value)}
          aria-label="Select region"
        >
          <option value="">All Regions</option>
          {availableRegions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </label>

      {/* Week dropdown */}
      <label style={labelStyle}>
        Weeks:
        <select
          style={selectStyle}
          value={weekPreset}
          onChange={handleWeekPreset}
          aria-label="Select week range"
        >
          <option value="last4">Last 4 Weeks</option>
          <option value="last8">Last 8 Weeks</option>
          <option value="all">All Weeks</option>
          <optgroup label="Individual Weeks">
            {availableWeeks.map((w) => (
              <option key={w} value={`week-${w}`}>
                WK {w}{selectedWeeks.includes(w) ? ' ✓' : ''}
              </option>
            ))}
          </optgroup>
        </select>
      </label>

      {/* Month dropdown */}
      <label style={labelStyle}>
        Month:
        <select
          style={selectStyle}
          value={selectedMonth ?? ''}
          onChange={handleMonthSelect}
          aria-label="Select month"
        >
          <option value="">All Months</option>
          {availableMonths.map((m) => (
            <option key={m} value={m}>{MONTH_NAMES[m]}</option>
          ))}
        </select>
      </label>

      {/* Show active filter summary */}
      {(selectedWeeks.length > 0 || selectedMonth !== null) && (
        <span style={{ fontSize: 12, color: '#1e40af', fontStyle: 'italic', fontWeight: 500 }}>
          {selectedMonth !== null
            ? `Showing: ${MONTH_NAMES[selectedMonth]}`
            : selectedWeeks.length > 0
              ? `Showing: ${selectedWeeks.map(w => `WK ${w}`).join(', ')}`
              : ''}
        </span>
      )}
    </div>
  );
}

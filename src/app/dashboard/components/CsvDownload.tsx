'use client';

import React from 'react';

export interface CsvDownloadProps {
  filename: string;
  headers: string[];
  rows: (string | number)[][];
}

const btnStyle: React.CSSProperties = {
  padding: '5px 14px',
  fontSize: 12,
  fontWeight: 600,
  border: '1px solid #dbeafe',
  borderRadius: 6,
  backgroundColor: '#eff6ff',
  color: '#1e40af',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
};

function escapeCsvCell(val: string | number): string {
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map(row => row.map(escapeCsvCell).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function CsvDownloadButton({ filename, headers, rows }: CsvDownloadProps) {
  return (
    <button
      type="button"
      style={btnStyle}
      onClick={() => downloadCsv(filename, headers, rows)}
      aria-label={`Download ${filename}`}
    >
      📥 Download CSV
    </button>
  );
}

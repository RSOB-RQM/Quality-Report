'use client';

import React from 'react';

export interface EmptyStateProps {
  message?: string;
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '48px 16px',
  gap: 8,
};

export function EmptyState({
  message = 'No data available for the selected filters.',
}: EmptyStateProps) {
  return (
    <div style={containerStyle} role="status" aria-live="polite">
      <p style={{ margin: 0, color: '#94a3b8', fontSize: 14 }}>{message}</p>
    </div>
  );
}

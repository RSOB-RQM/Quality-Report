'use client';

import React from 'react';

export interface LoadingStateProps {
  message?: string;
}

const spinnerStyle: React.CSSProperties = {
  display: 'inline-block',
  width: 32,
  height: 32,
  border: '3px solid #e2e8f0',
  borderTopColor: '#1e40af',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
};

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '48px 16px',
  gap: 12,
};

export function LoadingState({ message = 'Loading data…' }: LoadingStateProps) {
  return (
    <div style={containerStyle} role="status" aria-live="polite">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={spinnerStyle} aria-hidden="true" />
      <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>{message}</p>
    </div>
  );
}

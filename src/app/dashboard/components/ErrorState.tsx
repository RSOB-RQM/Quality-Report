'use client';

import React from 'react';

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '48px 16px',
  gap: 12,
};

const buttonStyle: React.CSSProperties = {
  padding: '8px 20px',
  backgroundColor: '#3b82f6',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 500,
};

export function ErrorState({
  message = 'An error occurred while loading data.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div style={containerStyle} role="alert">
      <p style={{ margin: 0, color: '#ef4444', fontSize: 14, fontWeight: 500 }}>
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          style={buttonStyle}
          onClick={onRetry}
          aria-label="Retry loading data"
        >
          Retry
        </button>
      )}
    </div>
  );
}

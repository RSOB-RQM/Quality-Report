'use client';

import React, { useState, useRef } from 'react';
import type { UserRole } from '../../../models/dashboard-types';
import type { UploadResult } from '../../../models/dashboard-types';

export interface AdminUploadPanelProps {
  role: UserRole;
  onUploadComplete?: () => void;
}

const btnStyle: React.CSSProperties = {
  padding: '8px 20px',
  backgroundColor: '#1e40af',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 500,
};

const btnDisabled: React.CSSProperties = {
  ...btnStyle,
  backgroundColor: '#94a3b8',
  cursor: 'not-allowed',
};

export function AdminUploadPanel({ role, onUploadComplete }: AdminUploadPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Only visible to admin
  if (role !== 'admin') return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setResult(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const json: UploadResult = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? `Upload failed (${res.status})`);
      } else {
        setResult(json);
        onUploadComplete?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const sectionStyle: React.CSSProperties = {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    border: result ? '1px solid #86efac' : '1px solid #e2e8f0',
    borderLeft: result ? '4px solid #059669' : '1px solid #e2e8f0',
    transition: 'border-color 0.3s ease',
  };

  return (
    <section style={sectionStyle} aria-label="Admin data upload">
      <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Upload RQM Data</h3>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx"
          onChange={handleFileChange}
          aria-label="Select Excel file to upload"
          style={{ fontSize: 13 }}
        />
        <button
          type="button"
          style={!file || uploading ? btnDisabled : btnStyle}
          onClick={handleUpload}
          disabled={!file || uploading}
          aria-label="Upload selected file"
        >
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
      </div>

      {error && (
        <div role="alert" style={{ padding: 12, borderRadius: 6, backgroundColor: '#fef2f2', color: '#dc2626', fontSize: 13, marginBottom: 12, borderLeft: '3px solid #dc2626' }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{ padding: 12, borderRadius: 6, backgroundColor: '#ecfdf5', fontSize: 13, borderLeft: '3px solid #059669' }} aria-live="polite">
          <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#059669' }}>Upload successful</p>
          <p style={{ margin: '0 0 2px' }}>Parsed: {result.parsedCount} records</p>
          <p style={{ margin: '0 0 2px' }}>Skipped: {result.skippedCount} rows</p>
          <p style={{ margin: '0 0 2px' }}>
            Added: {result.mergeStats.added} · Replaced: {result.mergeStats.replaced}
          </p>
          {result.warnings.length > 0 && (
            <details style={{ marginTop: 8 }}>
              <summary style={{ cursor: 'pointer', fontWeight: 500 }}>
                {result.warnings.length} warning{result.warnings.length !== 1 ? 's' : ''}
              </summary>
              <ul style={{ margin: '4px 0 0', paddingLeft: 20, listStyle: 'disc' }}>
                {result.warnings.map((w, i) => (
                  <li key={i} style={{ fontSize: 12, marginBottom: 2 }}>
                    Row {w.rowNumber}: missing {w.missingFields.join(', ')}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </section>
  );
}

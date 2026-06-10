'use client';

import React, { useEffect, useState, useCallback } from 'react';
import type { AuditRecord } from '../../models/audit-types';
import type { UserRole } from '../../models/dashboard-types';
import { DashboardLayout } from '../dashboard/components/DashboardLayout';
import { CsvDownloadButton } from '../dashboard/components/CsvDownload';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RawDataResponse {
  records: AuditRecord[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  user: { login: string; role: UserRole };
  availableWeeks: number[];
  availableMonths: number[];
  availableRegions: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 50;

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const FINDING_ATTRS: { key: keyof AuditRecord; findingKey: keyof AuditRecord; label: string }[] = [
  { key: 'adm', findingKey: 'admFinding', label: 'ADM' },
  { key: 'ra', findingKey: 'raFinding', label: 'RA' },
  { key: 'rrc', findingKey: 'rrcFinding', label: 'RRC' },
  { key: 'acc', findingKey: 'accFinding', label: 'ACC' },
  { key: 'rv', findingKey: 'rvFinding', label: 'RV' },
];

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const filterBarStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  alignItems: 'center',
  flexWrap: 'wrap',
  padding: '12px 16px',
  backgroundColor: '#fff',
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  marginBottom: 16,
};

const selectStyle: React.CSSProperties = {
  padding: '7px 12px',
  border: '1px solid #dbeafe',
  borderRadius: 6,
  fontSize: 13,
  backgroundColor: '#fff',
  cursor: 'pointer',
  minWidth: 140,
  color: '#1e293b',
};

const searchInputStyle: React.CSSProperties = {
  padding: '7px 12px',
  border: '1px solid #dbeafe',
  borderRadius: 6,
  fontSize: 13,
  minWidth: 200,
  color: '#1e293b',
};

const tableContainerStyle: React.CSSProperties = {
  overflowX: 'auto',
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  backgroundColor: '#fff',
};

const thStyle: React.CSSProperties = {
  padding: '10px 8px',
  fontSize: 12,
  fontWeight: 700,
  color: '#ffffff',
  backgroundColor: '#1e40af',
  textAlign: 'left',
  whiteSpace: 'nowrap',
  borderBottom: '2px solid #1e3a8a',
  position: 'sticky',
  top: 0,
};

const tdStyle: React.CSSProperties = {
  padding: '8px 8px',
  fontSize: 12,
  color: '#1e293b',
  borderBottom: '1px solid #e2e8f0',
  whiteSpace: 'nowrap',
};

const paginationStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 16,
  padding: '16px 0',
};

const pageBtnStyle: React.CSSProperties = {
  padding: '6px 16px',
  fontSize: 13,
  border: '1px solid #dbeafe',
  borderRadius: 6,
  backgroundColor: '#fff',
  color: '#1e40af',
  cursor: 'pointer',
  fontWeight: 600,
};

const pageBtnDisabledStyle: React.CSSProperties = {
  ...pageBtnStyle,
  color: '#94a3b8',
  cursor: 'default',
  backgroundColor: '#f1f5f9',
};

// ---------------------------------------------------------------------------
// Helper: Yes/No cell
// ---------------------------------------------------------------------------

function YesNoCell({ value }: { value: string }) {
  const isYes = value === 'Yes';
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        color: '#fff',
        backgroundColor: isYes ? '#16a34a' : '#dc2626',
      }}
    >
      {isYes ? 'Yes' : 'No'}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Helper: Build findings string
// ---------------------------------------------------------------------------

function getFindings(record: AuditRecord): string {
  const parts: string[] = [];
  for (const attr of FINDING_ATTRS) {
    if (record[attr.key] === 'No') {
      const finding = record[attr.findingKey] as string;
      if (finding && finding.trim()) {
        parts.push(`${attr.label}: ${finding.trim()}`);
      }
    }
  }
  return parts.join('; ');
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function RawDataPage() {
  const [data, setData] = useState<RawDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(PAGE_SIZE));
      if (selectedRegion) params.set('region', selectedRegion);
      if (selectedWeek) params.set('weeks', selectedWeek);
      if (selectedMonth) params.set('month', selectedMonth);
      if (search) params.set('search', search);

      const res = await fetch(`/api/rawdata?${params.toString()}`);
      if (!res.ok) throw new Error(`Failed to load data (${res.status})`);
      const json: RawDataResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [page, selectedRegion, selectedWeek, selectedMonth, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset page when filters change
  const handleRegionChange = (val: string) => { setSelectedRegion(val); setPage(1); };
  const handleWeekChange = (val: string) => { setSelectedWeek(val); setPage(1); };
  const handleMonthChange = (val: string) => {
    setSelectedMonth(val);
    if (val) setSelectedWeek('');
    setPage(1);
  };
  const handleSearch = () => { setSearch(searchInput); setPage(1); };
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  // Loading / Error states
  if (loading && !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p style={{ fontSize: 16, color: '#64748b' }}>Loading raw data…</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontSize: 16, color: '#dc2626' }}>{error}</p>
        <button onClick={fetchData} style={pageBtnStyle}>Retry</button>
      </div>
    );
  }

  if (!data) return null;

  const { records, totalCount, totalPages, user, availableWeeks, availableMonths, availableRegions } = data;

  return (
    <DashboardLayout role={user.role} login={user.login}>
      {/* Back link */}
      <div style={{ marginBottom: 16 }}>
        <a
          href="/dashboard"
          style={{ fontSize: 13, color: '#1e40af', textDecoration: 'none', fontWeight: 600 }}
        >
          ← Back to Dashboard
        </a>
      </div>

      <h2 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 700, color: '#1e293b' }}>
        Raw Audit Data
        <span style={{ fontSize: 13, fontWeight: 400, color: '#64748b', marginLeft: 12 }}>
          {totalCount} record{totalCount !== 1 ? 's' : ''}
        </span>
      </h2>

      {/* CSV download for current page */}
      {records.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <CsvDownloadButton
            filename="raw-data.csv"
            headers={['Wk', 'Date', 'Region', 'Associate', 'Supervisor', 'Disruption Type', 'ADM', 'RA', 'RRC', 'ACC', 'RV', 'Defect', 'Findings']}
            rows={records.map((r) => [
              r.transactionWeek,
              r.transactionDate,
              r.region,
              r.associateLogin,
              r.supervisorLogin,
              r.disruptionType,
              r.adm,
              r.ra,
              r.rrc,
              r.acc,
              r.rv,
              r.defectFlag ? 'Yes' : 'No',
              getFindings(r),
            ])}
          />
        </div>
      )}

      {/* Filter bar */}
      <div style={filterBarStyle}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#1e40af' }}>Filters:</span>

        <label style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
          Region:
          <select style={selectStyle} value={selectedRegion} onChange={(e) => handleRegionChange(e.target.value)} aria-label="Filter by region">
            <option value="">All Regions</option>
            {availableRegions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>

        <label style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
          Week:
          <select style={selectStyle} value={selectedWeek} onChange={(e) => handleWeekChange(e.target.value)} aria-label="Filter by week">
            <option value="">All Weeks</option>
            {availableWeeks.map((w) => <option key={w} value={String(w)}>WK {w}</option>)}
          </select>
        </label>

        <label style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
          Month:
          <select style={selectStyle} value={selectedMonth} onChange={(e) => handleMonthChange(e.target.value)} aria-label="Filter by month">
            <option value="">All Months</option>
            {availableMonths.map((m) => <option key={m} value={String(m)}>{MONTH_NAMES[m]}</option>)}
          </select>
        </label>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="text"
            placeholder="Search associate login…"
            style={searchInputStyle}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            aria-label="Search by associate login"
          />
          <button onClick={handleSearch} style={{ ...pageBtnStyle, padding: '7px 14px' }}>Search</button>
        </div>
      </div>

      {/* Table */}
      <div style={tableContainerStyle}>
        {loading && (
          <div style={{ padding: 12, textAlign: 'center', fontSize: 13, color: '#64748b', backgroundColor: '#f0f9ff' }}>
            Updating…
          </div>
        )}
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1200 }}>
          <thead>
            <tr>
              <th style={thStyle}>Wk</th>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Region</th>
              <th style={thStyle}>Associate</th>
              <th style={thStyle}>Supervisor</th>
              <th style={thStyle}>Disruption Type</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>ADM</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>RA</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>RRC</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>ACC</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>RV</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Defect</th>
              <th style={{ ...thStyle, minWidth: 250 }}>Findings</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={13} style={{ ...tdStyle, textAlign: 'center', padding: 32, color: '#94a3b8' }}>
                  No records found for the selected filters.
                </td>
              </tr>
            ) : (
              records.map((r, idx) => {
                const isDefect = r.defectFlag === true;
                const rowBg = isDefect
                  ? '#fef2f2'
                  : idx % 2 === 0
                    ? '#ffffff'
                    : '#f8fafc';
                const findings = getFindings(r);

                return (
                  <tr key={idx} style={{ backgroundColor: rowBg }}>
                    <td style={tdStyle}>{r.transactionWeek}</td>
                    <td style={tdStyle}>{r.transactionDate}</td>
                    <td style={tdStyle}>{r.region}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{r.associateLogin}</td>
                    <td style={tdStyle}>{r.supervisorLogin}</td>
                    <td style={tdStyle}>{r.disruptionType}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}><YesNoCell value={r.adm} /></td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}><YesNoCell value={r.ra} /></td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}><YesNoCell value={r.rrc} /></td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}><YesNoCell value={r.acc} /></td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}><YesNoCell value={r.rv} /></td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#fff',
                          backgroundColor: isDefect ? '#dc2626' : '#16a34a',
                        }}
                      >
                        {isDefect ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: 'normal', maxWidth: 350, fontSize: 11, color: '#64748b' }}>
                      {findings || '—'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={paginationStyle}>
          <button
            style={page <= 1 ? pageBtnDisabledStyle : pageBtnStyle}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Previous
          </button>
          <span style={{ fontSize: 13, color: '#475569' }}>
            Page {data.page} of {totalPages}
          </span>
          <button
            style={page >= totalPages ? pageBtnDisabledStyle : pageBtnStyle}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next →
          </button>
        </div>
      )}
    </DashboardLayout>
  );
}

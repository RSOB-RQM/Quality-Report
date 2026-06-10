'use client';

import React from 'react';
import type { UserRole } from '../../../models/dashboard-types';

export interface DashboardLayoutProps {
  role: UserRole;
  login: string;
  children: React.ReactNode;
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  manager: 'Manager',
  associate: 'Associate',
};

const ROLE_COLORS: Record<UserRole, string> = {
  admin: '#7c3aed',
  manager: '#2563eb',
  associate: '#059669',
};

const shellStyle: React.CSSProperties = {
  minHeight: '100vh',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  backgroundColor: '#f8fafc',
  color: '#1e293b',
};

const navStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '14px 24px',
  backgroundColor: '#1e40af',
  borderBottom: 'none',
  boxShadow: '0 2px 8px rgba(30, 64, 175, 0.15)',
};

const mainStyle: React.CSSProperties = {
  maxWidth: 1200,
  margin: '0 auto',
  padding: '24px 16px',
};

export function DashboardLayout({ role, login, children }: DashboardLayoutProps) {
  return (
    <div style={shellStyle}>
      <nav style={navStyle} aria-label="Dashboard navigation">
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ fontWeight: 700, fontSize: 18, color: '#ffffff', letterSpacing: '-0.01em' }}>
            RSOB - Quality Performance Dashboard - NA &amp; EU
          </span>
          <span style={{ width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.3)' }} />
          <a
            href="/dashboard"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#dbeafe',
              textDecoration: 'none',
              padding: '4px 10px',
              borderRadius: 6,
              backgroundColor: 'rgba(255,255,255,0.1)',
            }}
          >
            Dashboard
          </a>
          <a
            href="/rawdata"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#dbeafe',
              textDecoration: 'none',
              padding: '4px 10px',
              borderRadius: 6,
              backgroundColor: 'rgba(255,255,255,0.1)',
            }}
          >
            Raw Data
          </a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              padding: '2px 10px',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 600,
              color: '#fff',
              backgroundColor: ROLE_COLORS[role],
              border: '1px solid rgba(255,255,255,0.3)',
            }}
            aria-label={`Role: ${ROLE_LABELS[role]}`}
          >
            {ROLE_LABELS[role]}
          </span>
          <span style={{ fontSize: 14, color: '#dbeafe' }} aria-label={`Logged in as ${login}`}>
            {login}
          </span>
          <button
            type="button"
            onClick={() => {
              document.cookie = 'user_login=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
              document.cookie = 'user_email=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
              window.location.href = '/login';
            }}
            style={{
              padding: '4px 12px',
              fontSize: 12,
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 6,
              backgroundColor: 'rgba(255,255,255,0.1)',
              color: '#ffffff',
              cursor: 'pointer',
            }}
            aria-label="Log out"
          >
            Logout
          </button>
        </div>
      </nav>
      <main style={mainStyle}>{children}</main>
    </div>
  );
}

'use client';

import React, { useState, FormEvent } from 'react';

export default function LoginPage() {
  const [loginId, setLoginId] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedLogin = loginId.trim();
    if (!trimmedLogin) {
      setError('Login ID is required.');
      return;
    }

    // Set cookies that the auth module reads (user_login and user_email)
    document.cookie = `user_login=${encodeURIComponent(trimmedLogin)}; path=/`;
    if (email.trim()) {
      document.cookie = `user_email=${encodeURIComponent(email.trim())}; path=/`;
    }

    // Redirect to dashboard
    window.location.href = '/dashboard';
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f5f5f5' }}>
      <form
        onSubmit={handleSubmit}
        style={{
          background: '#fff',
          padding: 32,
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          width: 360,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 20, textAlign: 'center' }}>RSOB - Quality Performance Dashboard</h1>

        {error && (
          <div role="alert" style={{ color: '#d32f2f', background: '#fdecea', padding: '8px 12px', borderRadius: 4, fontSize: 14 }}>
            {error}
          </div>
        )}

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14 }}>
          Login ID
          <input
            type="text"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            placeholder="Enter your login ID"
            autoFocus
            style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14 }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14 }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email (optional)"
            style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14 }}
          />
        </label>

        <button
          type="submit"
          style={{
            padding: '10px 16px',
            background: '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            fontSize: 14,
            cursor: 'pointer',
            marginTop: 8,
          }}
        >
          Sign In
        </button>
      </form>
    </div>
  );
}

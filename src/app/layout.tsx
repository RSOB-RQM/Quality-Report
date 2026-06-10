import React from 'react';

export const metadata = {
  title: 'RSOB - Quality Performance Dashboard - NA & EU',
  description: 'Self-service RQM quality performance dashboard for RSOB NA & EU',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}

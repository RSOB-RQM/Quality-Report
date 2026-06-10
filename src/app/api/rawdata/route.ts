// =============================================================================
// Raw Data API Route — GET /api/rawdata
// =============================================================================

import { createAuthModule } from '../../../auth/auth';
import { getFilter } from '../../../access-control/access-control';
import { createDataAccess } from '../../../data/data-access';
import type { AuditRecord } from '../../../models/audit-types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function filterByWeeks(records: AuditRecord[], weeks: number[]): AuditRecord[] {
  if (weeks.length === 0) return records;
  const set = new Set(weeks);
  return records.filter((r) => set.has(r.transactionWeek));
}

function filterByRegion(records: AuditRecord[], region: string): AuditRecord[] {
  if (!region) return records;
  return records.filter((r) => r.region === region);
}

function filterByMonth(records: AuditRecord[], month: number): AuditRecord[] {
  return records.filter((r) => {
    const parts = r.transactionDate.split('-');
    return parseInt(parts[1], 10) === month;
  });
}

function filterBySearch(records: AuditRecord[], search: string): AuditRecord[] {
  if (!search) return records;
  const lower = search.toLowerCase();
  return records.filter((r) => r.associateLogin.toLowerCase().includes(lower));
}

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(request: Request): Promise<Response> {
  try {
    // 1. Authenticate
    const auth = createAuthModule();
    const user = await auth.getUser(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Apply access control filter
    const filter = getFilter(user);

    // 3. Fetch scoped records
    const dataAccess = createDataAccess();
    const scopedRecords = await dataAccess.getRecords(filter);

    // 4. Parse query params
    const url = new URL(request.url);
    const weeksParam = url.searchParams.get('weeks');
    const monthParam = url.searchParams.get('month');
    const regionParam = url.searchParams.get('region') ?? '';
    const searchParam = url.searchParams.get('search') ?? '';
    const pageParam = parseInt(url.searchParams.get('page') ?? '1', 10);
    const pageSizeParam = parseInt(url.searchParams.get('pageSize') ?? '50', 10);

    const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
    const pageSize = isNaN(pageSizeParam) || pageSizeParam < 1 ? 50 : Math.min(pageSizeParam, 200);

    // 5. Apply filters
    let filtered = filterByRegion(scopedRecords, regionParam);
    if (weeksParam) {
      const weeks = weeksParam.split(',').map((w) => parseInt(w.trim(), 10)).filter((n) => !isNaN(n));
      filtered = filterByWeeks(filtered, weeks);
    }
    if (monthParam) {
      const month = parseInt(monthParam, 10);
      if (!isNaN(month)) filtered = filterByMonth(filtered, month);
    }
    filtered = filterBySearch(filtered, searchParam);

    // 6. Sort by week desc, then date desc
    filtered.sort((a, b) => {
      if (b.transactionWeek !== a.transactionWeek) return b.transactionWeek - a.transactionWeek;
      return b.transactionDate.localeCompare(a.transactionDate);
    });

    // 7. Compute available filter options from scoped (unfiltered) records
    const availableWeeks = [...new Set(scopedRecords.map((r) => r.transactionWeek))].sort((a, b) => a - b);
    const availableMonths = [...new Set(scopedRecords.map((r) => {
      const parts = r.transactionDate.split('-');
      return parseInt(parts[1], 10);
    }))].sort((a, b) => a - b);
    const availableRegions = [...new Set(scopedRecords.map((r) => r.region).filter(Boolean))].sort();

    // 8. Paginate
    const totalCount = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    const records = filtered.slice(start, start + pageSize);

    // 9. Return
    return new Response(
      JSON.stringify({
        records,
        totalCount,
        page: safePage,
        pageSize,
        totalPages,
        user: { login: user.login, role: user.role },
        availableWeeks,
        availableMonths,
        availableRegions,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('Raw Data API error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

// =============================================================================
// Week Comparison API Route — GET /api/dashboard/compare
// =============================================================================
// Requirements: 12.1, 12.2, 12.3

import { createAuthModule } from '../../../../auth/auth';
import { getFilter } from '../../../../access-control/access-control';
import { createDataAccess } from '../../../../data/data-access';
import { computeWeekComparison } from '../../../../services/aggregation';

export async function GET(request: Request): Promise<Response> {
  // 1. Authenticate
  const auth = createAuthModule();
  const user = await auth.getUser(request);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Parse query params
  const url = new URL(request.url);
  const weekAParam = url.searchParams.get('weekA');
  const weekBParam = url.searchParams.get('weekB');

  if (!weekAParam || !weekBParam) {
    return new Response(
      JSON.stringify({ error: 'Missing required query parameters: weekA and weekB' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const weekA = Number(weekAParam);
  const weekB = Number(weekBParam);

  if (isNaN(weekA) || isNaN(weekB)) {
    return new Response(
      JSON.stringify({ error: 'weekA and weekB must be valid numbers' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  // 3. Apply access control filter
  const filter = getFilter(user);

  // 4. Fetch scoped records
  const dataAccess = createDataAccess();
  const records = await dataAccess.getRecords(filter);

  // 5. Compute week comparison
  const comparison = computeWeekComparison(records, weekA, weekB);

  // 6. Return result
  return new Response(JSON.stringify(comparison), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
